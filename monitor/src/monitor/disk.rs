use sqlx::{sqlite::SqliteQueryResult, SqlitePool};
use std::process::{Command, Output};
use tracing::{event, instrument, Level};

/// Struct to represent disk data
#[derive(Debug)]
pub struct Disk {
    /// Name of the disk device
    name: String,
    /// File system the disk is mounted to
    mount: String,
    /// Used space in MB
    used: u32,
    /// Available space in MB
    available: u32,
}

impl Disk {
    /// Runs `df -h -BM and collects the data
    #[instrument]
    pub fn get_all_disk_data() -> Vec<Disk> {
        event!(Level::DEBUG, "Starting to fetch disk data");

        // df gets information about the disk file systems
        // -h returns the data in a human-readable formate
        // -BM scales all measurements to MB for consistency
        let output: Output = Command::new("df")
            .args(["-h", "-BM"])
            .output()
            .expect("Should be able to run the command");
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

            // Order: Filesystem, Size, Used, Avail, Use%, Mounted on
            let disk: Disk = Disk {
                name: row_vec[0].to_string(),
                mount: row_vec[5].to_string(),
                used: row_vec[2][0..row_vec[2].len() - 1].parse::<u32>().unwrap(),
                available: row_vec[3][0..row_vec[3].len() - 1].parse::<u32>().unwrap(),
            };
            event!(Level::DEBUG, "Found disk: {:?}", &disk);
            disk_vec.push(disk);
        }

        event!(Level::DEBUG, "Finished fetching disk data");
        disk_vec
    }

    /// Writes disk information to the DISK table
    #[instrument]
    pub async fn insert_disk_info(disks: &Vec<Disk>, conn: &SqlitePool) -> Result<(), sqlx::Error> {
        for disk in disks {
            event!(Level::DEBUG, "Inserting disk {:?} into DISK", &disk.name);
            let _disk_res: SqliteQueryResult =
                sqlx::query("INSERT OR REPLACE INTO DISK VALUES (?, ?)")
                    .bind(&disk.name)
                    .bind(&disk.mount)
                    .execute(conn)
                    .await?;
            event!(
                Level::DEBUG,
                "Successfully inserted disk {:?} into DISK",
                &disk.name
            );
        }
        Ok(())
    }
}
