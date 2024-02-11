mod cpu;
mod disk;
mod memory;
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

    /// Initializes the database and verifies/cleans the pre-existing data
    #[instrument(skip(self))]
    pub async fn setup_init_data(&self) -> Result<(), NebulaError> {
        event!(Level::INFO, "Setting up initial data");

        cpu::init_cpu_data(&self.conn).await?;
        disk::init_disk_data(&self.conn).await?;
        process::init_process_data(&self.conn).await?;

        event!(Level::INFO, "Successfully set up initial data");
        Ok(())
    }

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

        event!(Level::INFO, "Exiting monitor update function");
    }
}
