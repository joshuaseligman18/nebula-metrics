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
