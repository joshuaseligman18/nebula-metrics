use std::collections::HashMap;

use procfs::{CpuInfo, Current};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::{event, instrument, Level};

use super::error::NebulaError;

/// Initializes the database with the approprate CPU data
#[instrument(skip(conn))]
pub async fn init_cpu_data(conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to initialize CPU data");
    let cpu_info: CpuInfo = CpuInfo::current()?;

    event!(Level::DEBUG, "Inserting the current CPUs");
    // Update the CPU table by replacing the existing data with updated info
    let mut cpu_insert: QueryBuilder<Sqlite> = QueryBuilder::new("INSERT OR REPLACE INTO CPU ");

    cpu_insert.push_values(cpu_info.cpus.clone().into_iter(), |mut builder, cpu| {
        let core_number: i32 = cpu.get("processor").unwrap().parse::<i32>().unwrap();
        let core_info: HashMap<&str, &str> = cpu_info
            .get_info(core_number as usize)
            .expect("Should be able to get the core's specific info");
        event!(
            Level::DEBUG,
            "Adding CPU {:?} to the insert query",
            core_number
        );
        builder
            .push_bind(core_number)
            .push_bind(core_info.get("cpu MHz").unwrap().parse::<f32>().unwrap())
            .push_bind(
                core_info
                    .get("cache size")
                    .unwrap()
                    .split(' ')
                    .next()
                    .unwrap()
                    .parse::<i32>()
                    .unwrap(),
            );
    });
    cpu_insert.push(";");
    cpu_insert.build().execute(conn).await?;
    event!(Level::DEBUG, "Successfully inserted current CPU info");

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
