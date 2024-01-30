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
    pub async fn new() -> Self {
        event!(Level::INFO, "Creating monitor");

        let pool_res: Result<SqlitePool, sqlx::Error> = SqlitePool::connect(DB_FILE).await;
        if let Ok(pool) = pool_res {
            event!(Level::INFO, "Successfully connected to database");
            Monitor { conn: pool }
        } else {
            // Log the error and crash because unable to connect to db
            // and monitor cannot function otherwise
            event!(
                Level::ERROR,
                "Failed to connect to database: {:?}",
                pool_res.unwrap_err()
            );
            panic!();
        }
    }

    #[instrument(skip(self))]
    pub async fn update(&self, id: Id) {
        event!(Level::INFO, "Entering monitor update function");

        event!(Level::INFO, "Exiting monitor update function");
    }
}
