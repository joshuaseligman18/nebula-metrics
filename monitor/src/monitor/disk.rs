use sqlx::{QueryBuilder, Sqlite, SqlitePool, Transaction};
use std::process::{Command, Output};
use tracing::{event, instrument, Level};

use models::{error::NebulaError, tables::Disk};

/// Struct to represent disk data
#[derive(Debug, Clone)]
pub struct DiskMetrics {
    /// Name of the disk device
    name: String,
    /// File system the disk is mounted to
    mount: String,
    /// Type of the file system
    file_system_type: String,
    /// Used space in MB
    used: u32,
    /// Available space in MB
    available: u32,
}

/// Initializes the database with up-to-date disk info at monitor start up
#[instrument(skip(conn))]
pub async fn init_disk_data(conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to initialize disk data");
    let disks: Vec<DiskMetrics> = get_all_disk_data();

    event!(Level::DEBUG, "Starting to insert updated disk information");
    let trans: Transaction<Sqlite> = conn.begin().await?;
    let mut disk_insert: QueryBuilder<Sqlite> = QueryBuilder::new("INSERT OR REPLACE INTO DISK ");

    disk_insert.push_values(disks.iter(), |mut builder, disk| {
        event!(
            Level::DEBUG,
            "Inserting disk information for device: {:?}",
            disk.name
        );
        builder
            .push_bind(&disk.name)
            .push_bind(&disk.mount)
            .push_bind(&disk.file_system_type);
    });

    disk_insert.push(";");
    disk_insert.build().execute(conn).await?;
    event!(Level::DEBUG, "Finished inserting updated disk information");

    clean_up_old_disk_data(conn, &disks).await?;

    trans.commit().await?;
    event!(Level::INFO, "Successfully initialized disk info");
    Ok(())
}

/// Updates the disk information in the database
#[instrument(skip(conn))]
pub async fn update_disk_data(cur_time: u64, conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to update disk information");
    // Get the current disk information and the db disks for comparisons
    let cur_disks: Vec<DiskMetrics> = get_all_disk_data();
    let db_disks: Vec<Disk> = sqlx::query_as::<_, Disk>("SELECT * FROM DISK;")
        .fetch_all(conn)
        .await?;

    let trans: Transaction<Sqlite> = conn.begin().await?;
    for disk in cur_disks.iter() {
        let matching_db_disk: Vec<Disk> = db_disks
            .clone()
            .into_iter()
            .filter(|db_disk| db_disk.device_name == disk.name)
            .collect();
        if matching_db_disk.is_empty() {
            // This is a new disk, so have to insert its information
            event!(Level::DEBUG, "Found new disk to insert: {:?}", disk.name);
            sqlx::query("INSERT INTO DISK VALUES (?, ?, ?);")
                .bind(&disk.name)
                .bind(&disk.mount)
                .bind(&disk.file_system_type)
                .execute(conn)
                .await?;
        }
    }

    let mut insert_disk_stats_query: QueryBuilder<Sqlite> =
        QueryBuilder::new("INSERT INTO DISKSTAT ");
    insert_disk_stats_query.push_values(cur_disks.iter(), |mut builder, disk| {
        builder
            .push_bind(&disk.name)
            .push_bind(cur_time as i64)
            .push_bind(disk.used)
            .push_bind(disk.available);
    });

    insert_disk_stats_query.push(";");
    insert_disk_stats_query.build().execute(conn).await?;

    // Any removed disks have to be removed from the db
    clean_up_old_disk_data(conn, &cur_disks).await?;

    trans.commit().await?;
    event!(Level::INFO, "Finished updating disk information");
    Ok(())
}

/// Removes all data of disks that no longer exist within the system
#[instrument(skip(conn))]
pub async fn clean_up_old_disk_data(
    conn: &SqlitePool,
    cur_disks: &Vec<DiskMetrics>,
) -> Result<(), NebulaError> {
    event!(Level::DEBUG, "Starting to clean up old disk data");

    // Start by clearing the DISKSTAT table
    let mut disk_stat_delete: QueryBuilder<Sqlite> =
        QueryBuilder::new("DELETE FROM DISKSTAT WHERE DEVICE_NAME NOT IN (");
    let mut disk_stat_separated = disk_stat_delete.separated(", ");
    for disk in cur_disks.iter() {
        disk_stat_separated.push_bind(&disk.name);
    }
    disk_stat_separated.push_unseparated(");");
    disk_stat_delete.build().execute(conn).await?;

    // Next clear out the DISK table now that the foreign keys are taken care of
    let mut disk_delete: QueryBuilder<Sqlite> =
        QueryBuilder::new("DELETE FROM DISK WHERE DEVICE_NAME NOT IN (");
    let mut disk_separated = disk_delete.separated(", ");
    for disk in cur_disks.iter() {
        disk_separated.push_bind(&disk.name);
    }
    disk_separated.push_unseparated(");");
    disk_delete.build().execute(conn).await?;

    event!(Level::DEBUG, "Finished cleaning up old disk data");
    Ok(())
}

/// Runs `df -hT -BM and collects the data
#[instrument]
pub fn get_all_disk_data() -> Vec<DiskMetrics> {
    event!(Level::DEBUG, "Starting to fetch disk data");

    // df gets information about the disk file systems
    // -h returns the data in a human-readable format
    // -T returns adds the type of file system to the output
    // -BM scales all measurements to MB for consistency
    let output: Output = Command::new("df")
        .args(["-h", "-T", "-BM"])
        .output()
        .expect("Should be able to run the df command");
    let output_string: String =
        String::from_utf8(output.stdout).expect("Should be valid utf8 bytes");

    let mut disk_vec: Vec<DiskMetrics> = Vec::new();
    for row in output_string.lines().skip(1) {
        // Split still returns empty strings from the split
        // So use filter to only work with real data
        let row_vec: Vec<&str> = row.split(' ').filter(|word| !word.is_empty()).collect();

        // If it doesn't start with /, it is a temp file system
        if !row_vec[0].starts_with('/') {
            continue;
        }

        // Order: Filesystem, Type, Size, Used, Avail, Use%, Mounted on
        let disk: DiskMetrics = DiskMetrics {
            name: row_vec[0].to_string(),
            mount: row_vec[6].to_string(),
            file_system_type: row_vec[1].to_string(),
            used: row_vec[3][0..row_vec[3].len() - 1].parse::<u32>().unwrap(),
            available: row_vec[4][0..row_vec[4].len() - 1].parse::<u32>().unwrap(),
        };
        event!(Level::DEBUG, "Found disk: {:?}", &disk);
        disk_vec.push(disk);
    }

    event!(Level::DEBUG, "Finished fetching disk data");
    disk_vec
}

#[cfg(test)]
mod tests {
    use super::*;
    use models::tables::{Disk, DiskStat};
    use std::io;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn test_get_disk_data() {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let output: Vec<DiskMetrics> = get_all_disk_data();

        assert!(!output.is_empty());
        for disk in output.iter() {
            assert_eq!(&disk.name[0..1], "/");
        }
    }

    #[sqlx::test(fixtures("diskTest"))]
    async fn test_clean_up_disks(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let cur_disks: Vec<DiskMetrics> = vec![DiskMetrics {
            name: "/test/disk".to_string(),
            file_system_type: "ext4".to_string(),
            mount: "/test/folder".to_string(),
            available: 42,
            used: 21,
        }];

        // The current disk is already in the db plus an old disk
        clean_up_old_disk_data(&pool, &cur_disks).await?;

        let disk_vec: Vec<Disk> = sqlx::query_as::<_, Disk>("SELECT * FROM DISK;")
            .fetch_all(&pool)
            .await?;
        // There should only be the current disk left
        assert_eq!(disk_vec.len(), 1);

        // The stats for the old disk should be removed, leaving nothing left
        let disk_stat_vec: Vec<DiskStat> = sqlx::query_as::<_, DiskStat>("SELECT * FROM DISKSTAT;")
            .fetch_all(&pool)
            .await?;
        assert_eq!(disk_stat_vec.len(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("diskTest"))]
    async fn test_init_disk_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        // Get the system's current disks for the example
        let cur_disks: Vec<DiskMetrics> = get_all_disk_data();

        // All of the disks in the db are test disks, which should be wiped
        // and replaced with the current disks
        init_disk_data(&pool).await?;

        let disk_vec: Vec<Disk> = sqlx::query_as::<_, Disk>("SELECT * FROM DISK;")
            .fetch_all(&pool)
            .await?;
        // There should only be the current disks left
        assert_eq!(disk_vec.len(), cur_disks.len());

        // The stats for the old disks should be removed, leaving nothing left
        let disk_stat_vec: Vec<DiskStat> = sqlx::query_as::<_, DiskStat>("SELECT * FROM DISKSTAT;")
            .fetch_all(&pool)
            .await?;
        assert_eq!(disk_stat_vec.len(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("diskTest"))]
    async fn test_update_disk_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        // Get the system's current disks for the example
        let cur_disks: Vec<DiskMetrics> = get_all_disk_data();

        let cur_time: u64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        update_disk_data(cur_time, &pool).await?;

        // All old data should be removed and replaced with the current disk data
        let disk_db: Vec<Disk> = sqlx::query_as::<_, Disk>("SELECT * FROM DISK;")
            .fetch_all(&pool)
            .await?;
        assert_eq!(disk_db.len(), cur_disks.len());

        let disk_stat_db: Vec<DiskStat> = sqlx::query_as::<_, DiskStat>("SELECT * FROM DISKSTAT;")
            .fetch_all(&pool)
            .await?;
        assert_eq!(disk_stat_db.len(), cur_disks.len());

        Ok(())
    }
}
