use procfs::process;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use std::cmp::Ordering;
use tracing::{event, instrument, Level};

use models::{error::NebulaError, tables::Process};

/// Sets up the database with the updated process data
#[instrument(skip(conn))]
pub async fn init_process_data(conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to initialize process data");

    let cur_processes: Vec<Process> = get_all_processes()?
        .into_iter()
        .map(Process::from)
        .collect();
    let db_processes: Vec<Process> = get_processes_in_db(conn).await?;

    let mut cur_index: usize = 0;
    let mut db_index: usize = 0;

    while cur_index < cur_processes.len() && db_index < db_processes.len() {
        let cur_proc: &Process = &cur_processes[cur_index];
        let db_proc: &Process = &db_processes[db_index];

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
                sqlx::query("UPDATE PROCESS SET IS_ALIVE = FALSE WHERE PID = ?")
                    .bind(db_proc.pid)
                    .execute(conn)
                    .await?;
                db_index += 1;
            }
        }
    }

    if cur_index < cur_processes.len() {
        let mut remaning_proc_inserts: QueryBuilder<Sqlite> =
            QueryBuilder::new("INSERT INTO PROCESS ");

        remaning_proc_inserts.push_values(
            cur_processes[cur_index..].iter(),
            |mut builder, new_proc| {
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
            },
        );
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
            QueryBuilder::new("UPDATE PROCESS SET IS_ALIVE = FALSE WHERE PID IN (");
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

/// Adds updated process information to the database, while cleaning up any old
/// data it finds along the way
#[instrument(skip(conn))]
pub async fn update_process_data(cur_time: u64, conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to update process data");
    let cur_processes: Vec<process::Process> = get_all_processes()?;
    let db_processes: Vec<Process> = get_processes_in_db(conn).await?;

    for proc in cur_processes.iter() {
        let proc_metadata: Process = Process::from(proc);
        let old_process_vec: Vec<Process> = db_processes
            .clone()
            .into_iter()
            .filter(|old_proc| {
                old_proc.pid == proc_metadata.pid && old_proc.start_time != proc_metadata.start_time
            })
            .collect();

        let db_process_pids: Vec<u32> = db_processes.iter().map(|db_proc| db_proc.pid).collect();

        // We have some really old data that has to be cleaned up first
        // This case is very rare and a batch process should not be needed
        if !old_process_vec.is_empty() {
            event!(
                Level::DEBUG,
                "Replacing old process in database with PID {:?}",
                old_process_vec[0].pid
            );
            sqlx::query("DELETE FROM PROCSTAT WHERE PID = ?;")
                .bind(old_process_vec[0].pid)
                .execute(conn)
                .await?;

            // This will delete the old process and write the new one
            // with only 1 query
            sqlx::query("INSERT OR REPLACE INTO PROCESS VALUES (?, ?, ?, ?, ?);")
                .bind(proc_metadata.pid)
                .bind(&proc_metadata.exec)
                .bind(proc_metadata.start_time)
                .bind(proc_metadata.is_alive)
                .bind(proc_metadata.init_total_cpu)
                .execute(conn)
                .await?;
        } else if !db_process_pids.contains(&proc_metadata.pid) {
            event!(
                Level::DEBUG,
                "Found new process to insert with PID {:?}",
                proc_metadata.pid
            );
            // Our process does not exist in the db yet, so have to insert it
            sqlx::query("INSERT OR REPLACE INTO PROCESS VALUES (?, ?, ?, ?, ?);")
                .bind(proc_metadata.pid)
                .bind(&proc_metadata.exec)
                .bind(proc_metadata.start_time)
                .bind(proc_metadata.is_alive)
                .bind(proc_metadata.init_total_cpu)
                .execute(conn)
                .await?;
        }
    }

    // Insert the current process metrics
    event!(Level::DEBUG, "Starting to insert process metrics data");
    let mut proc_stat_insert: QueryBuilder<Sqlite> = QueryBuilder::new("INSERT INTO PROCSTAT ");
    proc_stat_insert.push_values(cur_processes.iter(), |mut builder, proc| {
        let proc_metadata: Process = Process::from(proc);
        let proc_stat = proc.stat().expect("Should be able to access the stats");
        let proc_statm = proc.statm().expect("Should be able to access memory stats");
        builder
            .push_bind(proc_metadata.pid)
            .push_bind(cur_time as i64)
            // This is just the current cpu time
            .push_bind(proc_metadata.init_total_cpu)
            .push_bind(proc_stat.processor)
            // Store all memory data in KB
            // Statm stores data in pages, and page_size returns bytes,
            // so have to divide by 1000 to get KB
            .push_bind((proc_statm.size * procfs::page_size() / 1000) as u32)
            .push_bind((proc_statm.resident * procfs::page_size() / 1000) as u32)
            .push_bind((proc_statm.shared * procfs::page_size() / 1000) as u32);
    });
    proc_stat_insert.push(";");
    proc_stat_insert.build().execute(conn).await?;
    event!(Level::DEBUG, "Finished inserting process metrics data");

    // Update the process table in case any processes died since the last update
    event!(
        Level::DEBUG,
        "Starting to update the status of dead processes"
    );
    let mut update_dead_processes: QueryBuilder<Sqlite> =
        QueryBuilder::new("UPDATE PROCESS SET IS_ALIVE = FALSE WHERE PID NOT IN (");
    let mut update_dead_separated = update_dead_processes.separated(", ");
    for proc in cur_processes.iter() {
        update_dead_separated.push_bind(proc.pid);
    }
    update_dead_separated.push_unseparated(");");
    update_dead_processes.build().execute(conn).await?;
    event!(
        Level::DEBUG,
        "Finished updating the status of dead processes"
    );

    Ok(())
}

/// Gets all of the current processes from procfs
#[instrument]
fn get_all_processes() -> Result<Vec<process::Process>, NebulaError> {
    event!(Level::DEBUG, "Getting all processes from procfs");
    let proc_vec: Vec<process::Process> = process::all_processes()?
        // Only keep processes that we can fully access
        .filter_map(|proc_res| proc_res.ok())
        .filter(|proc| proc.exe().is_ok())
        .filter(|proc| proc.stat().is_ok())
        .filter(|proc| proc.statm().is_ok())
        .collect();
    event!(Level::DEBUG, "Done getting all processes from procfs");
    Ok(proc_vec)
}

/// Gets all of the process info from the database
#[instrument(skip(conn))]
async fn get_processes_in_db(conn: &SqlitePool) -> Result<Vec<Process>, NebulaError> {
    event!(Level::DEBUG, "Getting all processes from the db");
    let proc_vec: Vec<Process> =
        sqlx::query_as::<_, Process>("SELECT * FROM PROCESS ORDER BY PID ASC;")
            .fetch_all(conn)
            .await?;

    event!(Level::DEBUG, "Done getting all processes from the db");
    Ok(proc_vec)
}

#[cfg(test)]
mod tests {
    use super::*;
    use models::tables::ProcStat;
    use std::io;
    use crate::monitor::cpu;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn test_get_all_processes() -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        assert!(get_all_processes().is_ok());
        Ok(())
    }

    #[sqlx::test(fixtures("processTest"))]
    async fn test_get_db_processes(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        // We should get 1 result back
        let proc_vec: Vec<Process> = get_processes_in_db(&pool).await?;
        assert_eq!(proc_vec.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("processTest"))]
    async fn test_init_process_data_simple(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let cur_process: Process = procfs::process::Process::myself()?.into();
        sqlx::query("INSERT INTO PROCESS VALUES (?, ?, ?, ?, ?);")
            .bind(cur_process.pid)
            .bind(cur_process.exec)
            .bind(123456789)
            .bind(true)
            .bind(10)
            .execute(&pool)
            .await?;

        init_process_data(&pool).await?;

        let my_proc_row: Process =
            sqlx::query_as::<_, Process>("SELECT * FROM PROCESS WHERE PID = ?")
                .bind(cur_process.pid)
                .fetch_one(&pool)
                .await?;
        // Make sure the old process is overwritten and its old stats are gone
        assert_ne!(my_proc_row.start_time, 123456789);

        let my_proc_stats: Vec<ProcStat> =
            sqlx::query_as::<_, ProcStat>("SELECT * FROM PROCSTAT WHERE PID = ?;")
                .bind(cur_process.pid)
                .fetch_all(&pool)
                .await?;
        assert_eq!(my_proc_stats.len(), 0);

        // Make sure the not found process is marked as not being alive anymore
        let old_process: Process =
            sqlx::query_as::<_, Process>("SELECT * FROM PROCESS WHERE PID = 9999999;")
                .fetch_one(&pool)
                .await?;
        assert_eq!(old_process.is_alive, false);

        Ok(())
    }

    #[sqlx::test(fixtures("processTestEmpty"))]
    async fn test_init_process_data_additional_checks(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        // This will be an existing process that is already running
        let cur_process: Process = procfs::process::Process::myself()?.into();
        sqlx::query("INSERT INTO PROCESS VALUES (?, ?, ?, ?, ?);")
            .bind(cur_process.pid)
            .bind(cur_process.exec)
            .bind(cur_process.start_time)
            .bind(cur_process.is_alive)
            .bind(cur_process.init_total_cpu)
            .execute(&pool)
            .await?;

        sqlx::query("INSERT INTO PROCSTAT VALUES(?, ?, ?, ?, ?, ?, ?);")
            .bind(cur_process.pid)
            .bind(123456789)
            .bind(999)
            .bind(0)
            .bind(42)
            .bind(42)
            .bind(0)
            .execute(&pool)
            .await?;

        // This is an old process that should be marked as dead
        sqlx::query("INSERT INTO PROCESS VALUES(42, \"test-exe\", 123456790, 1, 2048);")
            .execute(&pool)
            .await?;
        sqlx::query("INSERT INTO PROCSTAT VALUES(42, 987654321, 5000, 0, 42, 42, 0);")
            .execute(&pool)
            .await?;

        init_process_data(&pool).await?;

        let my_proc_row: Process =
            sqlx::query_as::<_, Process>("SELECT * FROM PROCESS WHERE PID = ?")
                .bind(cur_process.pid)
                .fetch_one(&pool)
                .await?;
        // This process still exists, so make sure that nothing has changed
        assert_eq!(my_proc_row.start_time, cur_process.start_time);
        let my_proc_stats: Vec<ProcStat> =
            sqlx::query_as::<_, ProcStat>("SELECT * FROM PROCSTAT WHERE PID = ?;")
                .bind(cur_process.pid)
                .fetch_all(&pool)
                .await?;
        assert_eq!(my_proc_stats.len(), 1);

        // Make sure the not found process is marked as not being alive anymore
        let old_process: Process =
            sqlx::query_as::<_, Process>("SELECT * FROM PROCESS WHERE PID = ?;")
                .bind(42)
                .fetch_one(&pool)
                .await?;
        assert_eq!(old_process.is_alive, false);

        Ok(())
    }

    #[sqlx::test(fixtures("processTestEmpty"))]
    async fn test_init_process_data_empty_db(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let processes: Vec<process::Process> = get_all_processes()?;

        init_process_data(&pool).await?;

        let rows: Vec<Process> = sqlx::query_as::<_, Process>("SELECT * FROM PROCESS;")
            .fetch_all(&pool)
            .await?;
        // All processes should have just been inserted without question
        assert_eq!(rows.len(), processes.len());

        Ok(())
    }
    
    #[sqlx::test(fixtures("processTest"))]
    async fn test_update_process_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        // Init the cpu data to make sure there are no foreign key issues
        cpu::init_cpu_data(&pool).await?;

        // Insert some junk data
        let my_pid: i32 = process::Process::myself()?.pid;
        sqlx::query("INSERT INTO PROCESS VALUES (?, ?, ?, ?, ?);")
            .bind(my_pid)
            .bind("the-exe")
            .bind(123456789)
            .bind(0)
            .bind(4242)
            .execute(&pool)
            .await?;
        sqlx::query("INSERT INTO PROCSTAT VALUES (?, ?, ?, ?, ?, ?, ?);")
            .bind(my_pid)
            .bind(987654321)
            .bind(424242)
            .bind(0)
            .bind(99)
            .bind(89)
            .bind(20)
            .execute(&pool)
            .await?;

        let processes: Vec<process::Process> = get_all_processes()?;

        let cur_time: u64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        update_process_data(cur_time, &pool).await?;

        // Make sure the garbage process is overwritten
        let my_pid_res: Process = sqlx::query_as::<_, Process>("SELECT * FROM PROCESS WHERE PID = ?;")
            .bind(my_pid)
            .fetch_one(&pool)
            .await?;
        assert_ne!(my_pid_res.start_time, 123456789);
        let my_pid_stats: Vec<ProcStat> = sqlx::query_as::<_, ProcStat>("SELECT * FROM PROCSTAT WHERE PID = ? AND TIMESTAMP = ?;")
            .bind(my_pid)
            .bind(987654321)
            .fetch_all(&pool)
            .await?;
        assert_eq!(my_pid_stats.len(), 0);

        // Check for the dead process
        let dead_proc: Process = sqlx::query_as::<_, Process>("SELECT * FROM PROCESS WHERE PID = ?;")
            .bind(9999999)
            .fetch_one(&pool)
            .await?;
        assert_eq!(dead_proc.is_alive, false);
        let dead_proc_stats: Vec<ProcStat> = sqlx::query_as::<_, ProcStat>("SELECT * FROM PROCSTAT WHERE PID = ?;")
            .bind(9999999)
            .fetch_all(&pool)
            .await?;
        assert_eq!(dead_proc_stats.len(), 1);

        // Check to make sure all processes have been inserted
        let all_processes: Vec<Process> = sqlx::query_as::<_, Process>("SELECT * FROM PROCESS;")
            .fetch_all(&pool)
            .await?;
        // + 1 because of the dead process
        assert_eq!(all_processes.len(), processes.len() + 1);
        let all_process_stats: Vec<ProcStat> = sqlx::query_as::<_, ProcStat>("SELECT * FROM PROCSTAT;")
            .fetch_all(&pool)
            .await?;
        // + 1 because of the dead process
        assert_eq!(all_process_stats.len(), processes.len() + 1);

        Ok(())
    }
}
