mod cpu;
mod disk;
mod memory;
mod network;
mod process;

use models::error::NebulaError;

use sqlx::SqlitePool;
use tracing::{event, instrument, span::Id, Level};

use std::time::{SystemTime, UNIX_EPOCH};

/// Absolute path to the database file
const DB_FILE: &str = "sqlite:///var/nebula/db/nebulaMetrics.db";

/// Struct to encapsulate the core functionality of the monitor
#[derive(Debug)]
pub struct Monitor {
    /// Pool of SQLite connections to the database
    conn: SqlitePool,
}

impl Monitor {
    /// Constructor for the monitor and establishes a connection to the db
    #[instrument]
    pub async fn new() -> Result<Self, NebulaError> {
        event!(Level::INFO, "Creating monitor");
        let new_monitor: Monitor = Monitor {
            conn: SqlitePool::connect(DB_FILE).await?,
        };
        Ok(new_monitor)
    }

    /// Constructor for the monitor specifically for testing
    #[instrument(skip(pool))]
    fn new_with_db_pool(pool: SqlitePool) -> Self {
        Monitor { conn: pool }
    }

    /// Initializes the database and verifies/cleans the pre-existing data
    #[instrument(skip(self))]
    pub async fn setup_init_data(&self) -> Result<(), NebulaError> {
        event!(Level::INFO, "Setting up initial data");

        cpu::init_cpu_data(&self.conn).await?;
        disk::init_disk_data(&self.conn).await?;
        process::init_process_data(&self.conn).await?;
        network::init_network_data(&self.conn).await?;

        event!(Level::INFO, "Successfully set up initial data");
        Ok(())
    }

    /// Inserts new and updated informaiton in the database
    #[instrument(skip(self))]
    pub async fn update(&self, id: Id) {
        event!(Level::INFO, "Entering monitor update function");
        let cur_time: u64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        process::update_process_data(cur_time, &self.conn)
            .await
            .expect("Should update process data without error");
        cpu::update_cpu_data(cur_time, &self.conn)
            .await
            .expect("Should update cpu usage data without error");
        memory::update_memory_data(cur_time, &self.conn)
            .await
            .expect("Should update memory data without error");
        disk::update_disk_data(cur_time, &self.conn)
            .await
            .expect("Should update disk data without error");
        network::update_network_interface_data(cur_time, &self.conn)
            .await
            .expect("Should update network data without error");

        event!(Level::INFO, "Exiting monitor update function");
    }

    /// Prunes the database by removing all outdated information
    #[instrument(skip(self))]
    pub async fn prune_db(&self, id: Id) {
        event!(Level::INFO, "Entering database pruning");
        // Tables with timestamp data: PROCSTAT, CPUSTAT, MEMORY, DISKSTAT
        let cur_time: u64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        // Prune any data that is from 3 hours ago or earlier
        let three_hours_ago: u64 = cur_time - 60 * 60 * 3;

        sqlx::query("DELETE FROM PROCSTAT WHERE TIMESTAMP < ?;")
            .bind(three_hours_ago as i64)
            .execute(&self.conn)
            .await
            .expect("Should be able to prune from PROCSTAT");

        // Processes are just marked as dead, but can remove if dead for over
        // 3 hours
        sqlx::query("DELETE FROM PROCESS WHERE PID NOT IN (SELECT DISTINCT PID FROM PROCSTAT);")
            .execute(&self.conn)
            .await
            .expect("Should be able to clear old processes");

        sqlx::query("DELETE FROM CPUSTAT WHERE TIMESTAMP < ?;")
            .bind(three_hours_ago as i64)
            .execute(&self.conn)
            .await
            .expect("Should be able to prune from CPUSTAT");

        sqlx::query("DELETE FROM MEMORY WHERE TIMESTAMP < ?;")
            .bind(three_hours_ago as i64)
            .execute(&self.conn)
            .await
            .expect("Should be able to prune from MEMORY");

        sqlx::query("DELETE FROM DISKSTAT WHERE TIMESTAMP < ?;")
            .bind(three_hours_ago as i64)
            .execute(&self.conn)
            .await
            .expect("Should be able to prune from DISKSTAT");

        event!(Level::INFO, "Exiting database pruning");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io;
    use tracing::{span, Span};

    #[sqlx::test(fixtures("pruneTest"))]
    async fn test_update_disk_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let prune_span: Span = span!(Level::TRACE, "prune-test");
        let _guard = prune_span.enter();
        let monitor: Monitor = Monitor::new_with_db_pool(pool.clone());

        let _ = monitor.prune_db(prune_span.id().unwrap()).await;

        assert_eq!(
            sqlx::query("SELECT * FROM PROCESS;")
                .fetch_all(&pool)
                .await?
                .len(),
            1
        );

        assert_eq!(
            sqlx::query("SELECT * FROM PROCSTAT;")
                .fetch_all(&pool)
                .await?
                .len(),
            1
        );

        assert_eq!(
            sqlx::query("SELECT * FROM CPUSTAT;")
                .fetch_all(&pool)
                .await?
                .len(),
            1
        );

        assert_eq!(
            sqlx::query("SELECT * FROM MEMORY;")
                .fetch_all(&pool)
                .await?
                .len(),
            1
        );

        assert_eq!(
            sqlx::query("SELECT * FROM DISKSTAT;")
                .fetch_all(&pool)
                .await?
                .len(),
            1
        );

        Ok(())
    }
}
