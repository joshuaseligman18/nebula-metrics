use std::collections::HashMap;

use procfs::{CpuInfo, Current};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::{event, instrument, Level};

use models::{
    error::NebulaError,
    tables::{CpuStat, ProcStat},
};

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

#[instrument(skip(conn))]
pub async fn update_cpu_data(cur_time: u64, conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to update CPU usage metrics");

    // Get the last CPU timestamp
    let last_cpu_stat_res: Result<CpuStat, sqlx::Error> =
        sqlx::query_as("SELECT * FROM CPUSTAT ORDER BY TIMESTAMP DESC;")
            .fetch_one(conn)
            .await;

    let last_cpu_time: i64 = if let Ok(last_cpu_stat) = last_cpu_stat_res {
        // Use the old time if we have it
        last_cpu_stat.timestamp
    } else {
        // Otherwise just use the current time, which would require 2 updates
        // to properly set CPU usage
        cur_time as i64
    };

    let num_cpus: usize = sqlx::query("SELECT * FROM CPU;")
        .fetch_all(conn)
        .await?
        .len();
    let mut cpu_usage: Vec<f32> = Vec::with_capacity(num_cpus);
    for _i in 0..num_cpus {
        cpu_usage.push(0.0);
    }

    let d_time: i64 = cur_time as i64 - last_cpu_time;

    // If this is true, we have old data to aggregate from
    if d_time > 0 {
        event!(Level::DEBUG, "Beginning to fetch existing process data");

        // Start with the current process stats
        let cur_proc_stats: Vec<ProcStat> =
            sqlx::query_as::<_, ProcStat>("SELECT * FROM PROCSTAT WHERE TIMESTAMP = ?;")
                .bind(cur_time as i64)
                .fetch_all(conn)
                .await?;

        // And get the matching stats from the old timestamp
        let mut last_proc_stats_query: QueryBuilder<Sqlite> =
            QueryBuilder::new("SELECT * FROM PROCSTAT WHERE TIMESTAMP = ");
        last_proc_stats_query.push_bind(last_cpu_time);
        last_proc_stats_query.push(" AND PID IN (");
        let mut last_proc_stats_query_separated = last_proc_stats_query.separated(", ");
        for proc in cur_proc_stats.iter() {
            last_proc_stats_query_separated.push_bind(proc.pid);
        }
        last_proc_stats_query_separated.push_unseparated(");");
        let last_proc_stats: Vec<ProcStat> = last_proc_stats_query
            .build_query_as::<ProcStat>()
            .fetch_all(conn)
            .await?;

        event!(Level::DEBUG, "Starting to aggregate CPU usage");
        for cur_stat in cur_proc_stats.iter() {
            // Try to get the matching old stat
            let matching_last_stat: Vec<ProcStat> = last_proc_stats
                .clone()
                .into_iter()
                .filter(|last_stat| last_stat.pid == cur_stat.pid)
                .collect();

            let proc_cpu_time = if !matching_last_stat.is_empty() {
                // Take the difference in total cpu since we have old data
                cur_stat.total_cpu - matching_last_stat[0].total_cpu
            } else {
                // Otherwise just use what we have because it is a newer process
                cur_stat.total_cpu
            };

            if let Some(core) = cur_stat.cpu_core {
                // Add the usage for the respective core
                cpu_usage[core as usize] += proc_cpu_time / d_time as f32;
            }
        }
        event!(Level::DEBUG, "Finished aggregating CPU usage");
    } else {
        event!(
            Level::WARN,
            "No CPU data to work from, so inserting all 0s for usage"
        );
    }

    event!(Level::DEBUG, "Inserting updated CPU usage");
    let mut cpu_stat_query: QueryBuilder<Sqlite> = QueryBuilder::new("INSERT INTO CPUSTAT ");
    cpu_stat_query.push_values(0..num_cpus, |mut builder, core_num| {
        builder
            .push_bind(core_num as u32)
            .push_bind(cur_time as i64)
            .push_bind(cpu_usage[core_num]);
    });
    cpu_stat_query.push(";").build().execute(conn).await?;

    event!(Level::INFO, "Finished updating CPU usage metrics");
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

    #[sqlx::test(fixtures("cpuUpdateTest"))]
    async fn test_update_cpu_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        update_cpu_data(123456790, &pool).await?;
        let output_stat: CpuStat =
            sqlx::query_as::<_, CpuStat>("SELECT * FROM CPUSTAT WHERE TIMESTAMP = 123456790;")
                .fetch_one(&pool)
                .await?;
        assert_eq!(output_stat.usage, 0.154);

        Ok(())
    }
}
