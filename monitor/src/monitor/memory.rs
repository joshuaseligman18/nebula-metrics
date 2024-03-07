use models::error::NebulaError;
use procfs::{Current, Meminfo};
use sqlx::{Sqlite, SqlitePool, Transaction};
use tracing::{event, instrument, Level};

/// Inserts the current memory usage information into the db
#[instrument(skip(conn))]
pub async fn update_memory_data(cur_time: u64, conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to update memory information");

    let mem_info: Meminfo = Meminfo::current()?;

    let trans: Transaction<Sqlite> = conn.begin().await?;
    sqlx::query("INSERT INTO MEMORY VALUES (?, ?, ?, ?, ?);")
        .bind(cur_time as i64)
        // Meminfo stores everything in bytes, so convert to KB
        .bind((mem_info.mem_total / 1000) as u32)
        .bind(
            (mem_info
                .mem_available
                .expect("System should be newer than Linux 3.14")
                / 1000) as u32,
        )
        .bind((mem_info.swap_total / 1000) as u32)
        .bind((mem_info.swap_free / 1000) as u32)
        .execute(conn)
        .await?;

    trans.commit().await?;
    event!(Level::INFO, "Finished updating memory information");
    Ok(())
}

#[cfg(test)]
mod tests {
    use models::tables::Memory;

    use super::*;
    use std::io;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[sqlx::test(fixtures("memoryTest"))]
    async fn test_update_memory_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let cur_time: u64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        update_memory_data(cur_time, &pool).await?;

        let mem_data: Vec<Memory> = sqlx::query_as::<_, Memory>("SELECT * FROM MEMORY;")
            .fetch_all(&pool)
            .await?;
        assert_eq!(mem_data.len(), 1);

        Ok(())
    }
}
