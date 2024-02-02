mod cpu;
mod disk;
mod process;

pub mod error;
use error::NebulaError;

use sqlx::SqlitePool;
use tracing::{event, instrument, span::Id, Level};

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

        event!(Level::INFO, "Exiting monitor update function");
    }
}
