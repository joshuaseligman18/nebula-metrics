use std::collections::HashMap;

use procfs::{CpuInfo, Current};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::{event, instrument, Level};

use models::error::NebulaError;

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
    sqlx::query("UPDATE PROCSTAT SET CPU_CORE = NULL WHERE CPU_CORE >= ?;")
        .bind(cpu_info.num_cores() as u32)
        .execute(conn)
        .await?;

    // Old CPU aggregated stats can be wiped
    sqlx::query("DELETE FROM CPUSTAT WHERE CPU_CORE >= ?;")
        .bind(cpu_info.num_cores() as u32)
        .execute(conn)
        .await?;

    // Delete extraneous rows from the cpu table
    sqlx::query("DELETE FROM CPU WHERE CPU_CORE >= ?;")
        .bind(cpu_info.num_cores() as u32)
        .execute(conn)
        .await?;
    event!(Level::DEBUG, "Finished cleaning up old CPU data");

    event!(Level::INFO, "Successfully initialized CPU data");
    Ok(())
}

#[cfg(test)]
mod tests {
    use models::tables::{Cpu, CpuStat, ProcStat};

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

        let cur_cpus: Vec<Cpu> = sqlx::query_as::<_, Cpu>("SELECT * FROM CPU;")
            .fetch_all(&pool)
            .await?;
        assert_eq!(cur_cpus.len(), real_cpu_data.num_cores());
        // Make sure our "old" cpu is no longer in the CPU table
        for cpu in cur_cpus.iter() {
            assert_ne!(cpu.cpu_core, 99);
        }

        let proc_stats: Vec<ProcStat> = sqlx::query_as::<_, ProcStat>("SELECT * FROM PROCSTAT;")
            .fetch_all(&pool)
            .await?;
        // The length should not have changed
        assert_eq!(proc_stats.len(), 2);
        for proc_stat in proc_stats.iter() {
            // If the core is still not null, make sure it is in the valid cpu range
            if let Some(core) = proc_stat.cpu_core {
                assert!(core < real_cpu_data.num_cores() as u32);
            }
        }

        let cpu_stats: Vec<CpuStat> = sqlx::query_as::<_, CpuStat>("SELECT * FROM CPUSTAT;")
            .fetch_all(&pool)
            .await?;
        // Make sure our "old" cpu is no longer in the CPUSTAT table
        assert_eq!(cpu_stats.len(), 1);
        for cpu_stat in cpu_stats.iter() {
            assert!(cpu_stat.cpu_core < real_cpu_data.num_cores() as u32);
        }

        Ok(())
    }
}
