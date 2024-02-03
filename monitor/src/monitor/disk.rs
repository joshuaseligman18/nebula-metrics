use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use std::process::{Command, Output};
use tracing::{event, instrument, Level};

use super::error::NebulaError;

/// Struct to represent disk data
#[derive(Debug)]
pub struct Disk {
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
    let disks: Vec<Disk> = get_all_disk_data();

    for disk in disks.iter() {
        event!(Level::DEBUG, "Inserting disk {:?} into DISK", &disk.name);
        sqlx::query("INSERT OR REPLACE INTO DISK VALUES (?, ?, ?)")
            .bind(&disk.name)
            .bind(&disk.mount)
            .bind(&disk.file_system_type)
            .execute(conn)
            .await?;
        event!(
            Level::DEBUG,
            "Successfully inserted disk {:?} into DISK",
            &disk.name
        );
    }

    clean_up_old_disk_data(conn, &disks).await?;

    event!(Level::INFO, "Successfully initialized disk info");
    Ok(())
}

/// Removes all data of disks that no longer exist within the system
#[instrument(skip(conn))]
pub async fn clean_up_old_disk_data(
    conn: &SqlitePool,
    cur_disks: &Vec<Disk>,
) -> Result<(), NebulaError> {
    event!(Level::DEBUG, "Starting to clean up old disk data");

    // Start by clearing the DISKSTAT table
    let mut disk_stat_delete: QueryBuilder<Sqlite> =
        QueryBuilder::new("DELETE FROM DISKSTAT WHERE DEVICENAME NOT IN (");
    let mut disk_stat_separated = disk_stat_delete.separated(", ");
    for disk in cur_disks.iter() {
        disk_stat_separated.push_bind(&disk.name);
    }
    disk_stat_separated.push_unseparated(");");
    disk_stat_delete.build().execute(conn).await?;

    // Next clear out the DISK table now that the foreign keys are taken care of
    let mut disk_delete: QueryBuilder<Sqlite> =
        QueryBuilder::new("DELETE FROM DISK WHERE DEVICENAME NOT IN (");
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
pub fn get_all_disk_data() -> Vec<Disk> {
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

    let mut disk_vec: Vec<Disk> = Vec::new();
    for row in output_string.lines().skip(1) {
        // Split still returns empty strings from the split
        // So use filter to only work with real data
        let row_vec: Vec<&str> = row.split(' ').filter(|word| !word.is_empty()).collect();

        // If it doesn't start with /, it is a temp file system
        if !row_vec[0].starts_with('/') {
            continue;
        }

        // Order: Filesystem, Type, Size, Used, Avail, Use%, Mounted on
        let disk: Disk = Disk {
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
    use sqlx::sqlite::SqliteRow;

    #[test]
    fn test_get_disk_data() {
        let output: Vec<Disk> = get_all_disk_data();
        
        assert!(output.len() > 0);
        for disk in output.iter() {
            assert_eq!(&disk.name[0..1], "/");
        }
    }

    #[sqlx::test(fixtures("diskTest"))]
    async fn test_clean_up_disks(pool: SqlitePool) -> Result<(), NebulaError> {
        let cur_disks: Vec<Disk> = vec![
            Disk {
                name: "/test/disk".to_string(),
                file_system_type: "ext4".to_string(),
                mount: "/test/folder".to_string(),
                available: 42,
                used: 21
            }
        ];
         
        // The current disk is already in the db plus an old disk
        clean_up_old_disk_data(&pool, &cur_disks).await?;

        let disk_vec: Vec<SqliteRow> = sqlx::query("SELECT * FROM DISK;").fetch_all(&pool).await?;
        // There should only be the current disk left
        assert_eq!(disk_vec.len(), 1);

        // The stats for the old disk should be removed, leaving nothing left
        let disk_stat_vec: Vec<SqliteRow> = sqlx::query("SELECT * FROM DISKSTAT;").fetch_all(&pool).await?;
        assert_eq!(disk_stat_vec.len(), 0);

        Ok(())
    }
}
