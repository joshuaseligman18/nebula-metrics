use procfs::{CpuInfo, Current};
use sqlx::SqlitePool;
use std::collections::HashMap;
use tracing::{event, instrument, Level};

use super::error::NebulaError;

/// Initializes the database with the approprate CPU data
#[instrument(skip(conn))]
pub async fn init_cpu_data(conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to initialize CPU data");
    let cpu_info: CpuInfo = CpuInfo::current()?;

    // Update the CPU table by replacing the existing data with updated info
    for i in 0..cpu_info.num_cores() {
        let the_cpu: HashMap<&str, &str> = cpu_info.get_info(i).unwrap();
        event!(Level::DEBUG, "Inserting CPU {:?}", i);
        sqlx::query("INSERT OR REPLACE INTO CPU VALUES (?, ?, ?);")
            .bind(i as u32)
            .bind(the_cpu.get("cpu MHz").unwrap())
            .bind(the_cpu.get("cache size").unwrap().split(' ').next())
            .execute(conn)
            .await?;
        event!(Level::DEBUG, "Successfully inserted data for CPU {:?}", i);
    }

    event!(Level::DEBUG, "Cleaning up old CPU data");
    // Old process statistics should be set to NULL as the cpu core
    sqlx::query("UPDATE PROCSTAT SET CPUCORE = NULL WHERE CPUCORE >= ?;")
        .bind(cpu_info.num_cores() as u32)
        .execute(conn)
        .await?;

    // Old CPU aggregated stats can be wiped
    sqlx::query("DELETE FROM CPUSTAT WHERE CPUCORE >= ?;")
        .bind(cpu_info.num_cores() as u32)
        .execute(conn)
        .await?;

    // Delete extraneous rows from the cpu table
    sqlx::query("DELETE FROM CPU WHERE CPUCORE >= ?;")
        .bind(cpu_info.num_cores() as u32)
        .execute(conn)
        .await?;
    event!(Level::DEBUG, "Finished cleaning up old CPU data");

    event!(Level::INFO, "Successfully initialized CPU data");
    Ok(())
}

#[cfg(test)]
mod tests {
    use sqlx::sqlite::SqliteRow;
    use sqlx::Row;

    use super::*;
    use std::io;

    #[sqlx::test(fixtures("cpuTest"))]
    async fn test_init_cpu_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        init_cpu_data(&pool).await?;
        let real_cpu_data: CpuInfo = CpuInfo::current()?;

        let cur_cpus: Vec<SqliteRow> = sqlx::query("SELECT * FROM CPU;").fetch_all(&pool).await?;
        assert_eq!(cur_cpus.len(), real_cpu_data.num_cores());
        // Make sure our "old" cpu is no longer in the CPU table
        for cpu in cur_cpus.iter() {
            let core: u32 = cpu.get("CPUCORE");
            assert_ne!(core, 99);
        }

        let proc_stats: Vec<SqliteRow> = sqlx::query("SELECT * FROM PROCSTAT;")
            .fetch_all(&pool)
            .await?;
        // The length should not have changed
        assert_eq!(proc_stats.len(), 2);
        for proc_stat in proc_stats.iter() {
            let cpu: Option<u32> = proc_stat.get("CPUCORE");
            // If the core is still not null, make sure it is in the valid cpu range
            if cpu.is_some() {
                assert!(cpu.unwrap() < real_cpu_data.num_cores() as u32);
            }
        }

        let cpu_stats: Vec<SqliteRow> = sqlx::query("SELECT * FROM CPUSTAT;")
            .fetch_all(&pool)
            .await?;
        // Make sure our "old" cpu is no longer in the CPUSTAT table
        assert_eq!(cpu_stats.len(), 1);
        for cpu_stat in cpu_stats.iter() {
            let core: u32 = cpu_stat.get("CPUCORE");
            assert!(core < real_cpu_data.num_cores() as u32);
        }

        Ok(())
    }
}
