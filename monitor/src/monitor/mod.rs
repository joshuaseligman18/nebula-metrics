use procfs::{CpuInfo, Current, ProcError};
use sqlx::{
    sqlite::{SqliteQueryResult, SqliteRow},
    Row, SqlitePool,
};
use std::collections::HashMap;
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
    pub async fn setup_init_data(&self) -> Result<(), sqlx::Error> {
        event!(Level::INFO, "Setting up initial data");

        let cpu_info_res: Result<CpuInfo, ProcError> = CpuInfo::current();
        if let Ok(cpu_info) = cpu_info_res {
            event!(Level::DEBUG, "Starting to initialize CPU data");
            let count_row: SqliteRow = sqlx::query("SELECT COUNT(*) FROM CPU;")
                .fetch_one(&self.conn)
                .await?;

            let count: u32 = count_row.get::<u32, usize>(0);

            if count == 0 {
                // Insert the data because we do not have anything in the db
                for i in 0..cpu_info.num_cores() {
                    let the_cpu: HashMap<&str, &str> = cpu_info.get_info(i).unwrap();
                    event!(Level::DEBUG, "Inserting CPU {:?}", i);
                    let _cpu_query: SqliteQueryResult =
                        sqlx::query("INSERT INTO CPU VALUES (?, ?, ?)")
                            .bind(i as u32)
                            .bind(the_cpu.get("cpu MHz").unwrap())
                            .bind(the_cpu.get("cache size").unwrap().split(' ').next())
                            .execute(&self.conn)
                            .await?;
                    event!(Level::DEBUG, "Successfully inserted data for CPU {:?}", i);
                }
            }

            event!(Level::DEBUG, "Finished initializing CPU data");

            event!(Level::DEBUG, "Starting to initialize disk data");

            event!(Level::DEBUG, "Finished initializing disk data");
        } else {
            // We need to have the CPU info initialized for the processes to store properly
            // So crash the program here
            event!(
                Level::ERROR,
                "Failed to obtain existing info: {:?}",
                cpu_info_res.unwrap_err()
            );
            panic!();
        }

        event!(Level::INFO, "Successfully set up initial data");
        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn update(&self, id: Id) {
        event!(Level::INFO, "Entering monitor update function");

        event!(Level::INFO, "Exiting monitor update function");
    }
}
