use procfs::process::{self, Process, Stat};
use procfs::WithCurrentSystemInfo;
use sqlx::sqlite::SqliteRow;
use sqlx::{QueryBuilder, Row, Sqlite, SqlitePool};
use std::cmp::Ordering;
use tracing::{event, instrument, Level};

use super::error::NebulaError;

/// Struct that represents the PROCESS table
#[derive(Debug)]
struct ProcInfo {
    /// PID of the process
    pid: u32,
    /// Executable name
    exec: String,
    /// Start time as a Unix epoch timestamp
    start_time: i64,
    /// Whether or not the process is alive
    is_alive: bool,
    /// Total CPU time the first time we encountered the process
    init_total_cpu: f32,
}

impl From<Process> for ProcInfo {
    /// Converts from a procfs process for easier use
    fn from(value: Process) -> Self {
        let stat: Stat = value.stat().unwrap();
        ProcInfo {
            pid: value.pid() as u32,
            exec: value.exe().unwrap().to_str().unwrap().to_string(),
            start_time: stat.starttime().get().unwrap().timestamp(),
            is_alive: value.is_alive(),
            // User time + system time are in Jiffies, so have to convert to seconds
            init_total_cpu: (stat.utime + stat.stime) as f32 / procfs::ticks_per_second() as f32,
        }
    }
}

/// Sets up the database with the updated process data
#[instrument(skip(conn))]
pub async fn init_process_data(conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to initialize process data");

    let cur_processes: Vec<ProcInfo> = get_all_processes()?;
    let db_processes: Vec<ProcInfo> = get_processes_in_db(conn).await?;

    let mut cur_index: usize = 0;
    let mut db_index: usize = 0;

    while cur_index < cur_processes.len() && db_index < db_processes.len() {
        let cur_proc: &ProcInfo = &cur_processes[cur_index];
        let db_proc: &ProcInfo = &db_processes[db_index];

        match cur_proc.pid.cmp(&db_proc.pid) {
            Ordering::Equal => {
                // There was likely a system restart, so have to clean out
                // the old process' data before inserting the new process
                if cur_proc.start_time != db_proc.start_time {
                    event!(
                        Level::DEBUG,
                        "Found old process in database to replace with PID {:?}",
                        db_proc.pid
                    );
                    sqlx::query("DELETE FROM PROCSTAT WHERE PID = ?;")
                        .bind(db_proc.pid)
                        .execute(conn)
                        .await?;

                    // This will delete the old process and write the new one
                    // with only 1 query
                    sqlx::query("INSERT OR REPLACE INTO PROCESS VALUES (?, ?, ?, ?, ?)")
                        .bind(cur_proc.pid)
                        .bind(&cur_proc.exec)
                        .bind(cur_proc.start_time)
                        .bind(cur_proc.is_alive)
                        .bind(cur_proc.init_total_cpu)
                        .execute(conn)
                        .await?;
                } else {
                    event!(
                        Level::DEBUG,
                        "Found existing process that is still running with PID {:?}",
                        cur_proc.pid
                    );
                }

                cur_index += 1;
                db_index += 1;
            }
            Ordering::Less => {
                event!(
                    Level::DEBUG,
                    "Found process to insert with PID {:?}",
                    cur_proc.pid
                );
                // The new process has not been recorded yet, so insert its init data
                sqlx::query("INSERT INTO PROCESS VALUES (?, ?, ?, ?, ?)")
                    .bind(cur_proc.pid)
                    .bind(&cur_proc.exec)
                    .bind(cur_proc.start_time)
                    .bind(cur_proc.is_alive)
                    .bind(cur_proc.init_total_cpu)
                    .execute(conn)
                    .await?;

                cur_index += 1;
            }
            Ordering::Greater => {
                event!(
                    Level::DEBUG,
                    "Found dead process in database with PID {:?}",
                    db_proc.pid
                );
                // The old process has died since startup, so just mark it as not alive
                sqlx::query("UPDATE PROCESS SET ISALIVE = FALSE WHERE PID = ?")
                    .bind(db_proc.pid)
                    .execute(conn)
                    .await?;
                db_index += 1;
            }
        }
    }

    if cur_index < cur_processes.len() {
        let mut remaning_proc_inserts: QueryBuilder<Sqlite> = QueryBuilder::new("INSERT INTO PROCESS ");

        remaning_proc_inserts.push_values(cur_processes[cur_index..].iter(), |mut builder, new_proc| {
            event!(
                Level::DEBUG,
                "Found process to insert with PID {:?}",
                new_proc.pid
                );
            // The new process has not been recorded yet, so insert its init data
            builder
                .push_bind(new_proc.pid)
                .push_bind(&new_proc.exec)
                .push_bind(new_proc.start_time)
                .push_bind(new_proc.is_alive)
                .push_bind(new_proc.init_total_cpu);
        });
        remaning_proc_inserts.push(";");
        remaning_proc_inserts.build().execute(conn).await?;
    }

    // We have more processes to update for being dead
    if db_index < db_processes.len() {
        event!(
            Level::DEBUG,
            "Setting all remaining unknown processes to be dead"
        );
        let mut update_dead_processes: QueryBuilder<Sqlite> =
            QueryBuilder::new("UPDATE PROCESS SET ISALIVE = FALSE WHERE PID IN (");
        let mut update_dead_separated = update_dead_processes.separated(", ");
        for db_proc in db_processes[db_index..].iter() {
            update_dead_separated.push_bind(db_proc.pid);
        }
        update_dead_separated.push_unseparated(");");
        update_dead_processes.build().execute(conn).await?;
    }

    event!(Level::INFO, "Finished initializing process data");
    Ok(())
}

/// Gets all of the current processes from procfs
#[instrument]
pub fn get_all_processes() -> Result<Vec<ProcInfo>, NebulaError> {
    event!(Level::DEBUG, "Getting all processes from procfs");
    let proc_vec: Vec<ProcInfo> = process::all_processes()?
        // Only keep processes that we can fully access
        .filter_map(|proc_res| proc_res.ok())
        .filter(|proc| proc.exe().is_ok())
        .filter(|proc| proc.stat().is_ok())
        // Convert to a ProcInfo struct
        .map(ProcInfo::from)
        .collect();
    event!(Level::DEBUG, "Done getting all processes from procfs");
    Ok(proc_vec)
}

/// Gets all of the process info from the database
#[instrument(skip(conn))]
pub async fn get_processes_in_db(conn: &SqlitePool) -> Result<Vec<ProcInfo>, NebulaError> {
    event!(Level::DEBUG, "Getting all processes from the db");
    let row_vec: Vec<SqliteRow> = sqlx::query("SELECT * FROM PROCESS ORDER BY PID ASC;")
        .fetch_all(conn)
        .await?;
    let mut proc_vec: Vec<ProcInfo> = Vec::with_capacity(row_vec.len());

    // Map each row to a ProcInfo struct
    for row in row_vec.iter() {
        proc_vec.push(ProcInfo {
            pid: row.get("PID"),
            exec: row.get("EXEC"),
            start_time: row.get("STARTTIME"),
            is_alive: row.get("ISALIVE"),
            init_total_cpu: row.get("INITTOTALCPU"),
        });
    }

    event!(Level::DEBUG, "Done getting all processes from the db");
    Ok(proc_vec)
}
