pub mod response;
use response::{CpuInfo, DiskInfo, ProcessInfo};

use axum::extract::Path;
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use models::tables::Memory;
use sqlx::SqlitePool;
use tracing::{event, Level};

/// Absolute path to the database file
const DB_FILE: &str = "sqlite:///var/nebula/db/nebulaMetrics.db?mode=ro";

/// Struct for storing the data for the api state
#[derive(Clone)]
struct AppState {
    /// Connection to the database
    conn: SqlitePool,
}

/// Creates the router for the api routes
pub async fn create_api_router(test_sql_conn: Option<SqlitePool>) -> Result<Router, sqlx::Error> {
    let router: Router = Router::new()
        .route("/memory", get(get_memory_data))
        .route("/allProcesses", get(get_all_processes))
        .route("/process/:pid", get(get_combined_process_info))
        .route("/disks", get(get_disk_info))
        .route("/cpu-info", get(get_cpu_info))
        .route("/cpu-info-current", get(get_latest_cpu_info))
        .route("/memory-current", get(get_latest_memory_data))
        .with_state(AppState {
            conn: match test_sql_conn {
                Some(test_pool) => test_pool,
                None => SqlitePool::connect(DB_FILE).await?,
            },
        });

    Ok(router)
}

/// Returns all data in Memory Table
async fn get_memory_data(
    State(state): State<AppState>,
) -> Result<Json<Vec<Memory>>, (StatusCode, String)> {
    let res: Result<Vec<Memory>, sqlx::Error> =
        sqlx::query_as::<_, Memory>("SELECT * FROM Memory;")
            .fetch_all(&state.conn)
            .await;

    match res {
        Ok(memory_vec) => Ok(Json(memory_vec)),
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Error fetching memory data".to_string(),
        )),
    }
}

/// Returns all data for all processes
async fn get_all_processes(
    State(state): State<AppState>,
) -> Result<Json<Vec<ProcessInfo>>, (StatusCode, String)> {
    let query = r#"
        SELECT
            p.pid,
            p.exec,
            p.start_time,
            p.is_alive,
            p.init_total_cpu,
            ps.timestamp,
            ps.total_cpu,
            ps.percent_cpu,
            ps.cpu_core,
            ps.virtual_memory,
            ps.resident_memory,
            ps.shared_memory
        FROM
            Process p
        LEFT JOIN (
            SELECT
                pid,
                MAX(timestamp) AS latest_timestamp
            FROM
                ProcStat
            GROUP BY
                pid
        ) AS latest_ps
        ON
            p.pid = latest_ps.pid
        LEFT JOIN
            ProcStat ps
        ON
            latest_ps.pid = ps.pid
            AND latest_ps.latest_timestamp = ps.timestamp
    "#;

    let res = sqlx::query_as::<_, ProcessInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(process_infos) => Ok(Json(process_infos)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Error fetching all processes: {}", e),
        )),
    }
}

/// Returns the information of the specified process
async fn get_combined_process_info(
    state: State<AppState>,
    Path(pid): Path<u32>,
) -> Result<Json<Vec<ProcessInfo>>, (StatusCode, String)> {
    // Execute the SQL query to fetch combined process info
    let query_result = sqlx::query_as::<_, ProcessInfo>(
        r#"
        SELECT *
        FROM
            PROCESS p
        JOIN
            PROCSTAT ps ON p.PID = ps.PID
        WHERE
            p.PID = ?
        ORDER BY timestamp DESC;
        "#,
    )
    .bind(pid)
    .fetch_all(&state.conn)
    .await;

    // Match the query result
    match query_result {
        Ok(combined_infos) => {
            if combined_infos.is_empty() {
                Err((
                    StatusCode::UNPROCESSABLE_ENTITY,
                    format!("Process {} not found", pid),
                ))
            } else {
                Ok(Json(combined_infos))
            }
        }
        Err(err) => {
            event!(
                Level::ERROR,
                "Error fetching combined process info for PID {}: {}",
                pid,
                err
            );
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!(
                    "Error fetching combined process info for PID {}: {}",
                    pid, err
                ),
            ))
        }
    }
}

/// Returns the latest disk information for each device
async fn get_disk_info(
    State(state): State<AppState>,
) -> Result<Json<Vec<DiskInfo>>, (StatusCode, String)> {
    let query = r#"
        SELECT
            d.device_name,
            d.mount,
            d.fs_type,
            ds.timestamp,
            ds.used,
            ds.available
        FROM
            Disk d
        INNER JOIN (
            SELECT
                device_name,
                MAX(timestamp) AS latest_timestamp
            FROM
                DiskStat
            GROUP BY
                device_name
        ) AS latest_ds
        ON
            d.device_name = latest_ds.device_name
        INNER JOIN
            DiskStat ds
        ON
            latest_ds.device_name = ds.device_name
            AND latest_ds.latest_timestamp = ds.timestamp
    "#;

    let res = sqlx::query_as::<_, DiskInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(disk_info) => Ok(Json(disk_info)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Error fetching latest disk information: {}", e),
        )),
    }
}

/// Returns all CPU information
async fn get_cpu_info(
    State(state): State<AppState>,
) -> Result<Json<Vec<CpuInfo>>, (StatusCode, String)> {
    let query = r#"
        SELECT
            c.cpu_core,
            c.mhz,
            c.total_cache,
            cs.timestamp,
            cs.usage
        FROM
            Cpu c
        INNER JOIN
            CpuStat cs
        ON
            c.cpu_core = cs.cpu_core
    "#;

    let res = sqlx::query_as::<_, CpuInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(cpu_info) => Ok(Json(cpu_info)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Error fetching CPU information: {}", e),
        )),
    }
}

/// Returns the latest CPU information for each core
async fn get_latest_cpu_info(
    State(state): State<AppState>,
) -> Result<Json<Vec<CpuInfo>>, (StatusCode, String)> {
    let query = r#"
        SELECT
            c.cpu_core,
            c.mhz,
            c.total_cache,
            cs.timestamp,
            cs.usage
        FROM
            Cpu c
        INNER JOIN (
            SELECT
                cpu_core,
                MAX(timestamp) AS latest_timestamp
            FROM
                CpuStat
            GROUP BY
                cpu_core
        ) AS latest_cs
        ON
            c.cpu_core = latest_cs.cpu_core
        INNER JOIN
            CpuStat cs
        ON
            latest_cs.cpu_core = cs.cpu_core
            AND latest_cs.latest_timestamp = cs.timestamp
    "#;

    let res = sqlx::query_as::<_, CpuInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(cpu_info) => Ok(Json(cpu_info)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Error fetching latest CPU information: {}", e),
        )),
    }
}

/// Returns the latest data from the Memory table
async fn get_latest_memory_data(
    State(state): State<AppState>,
) -> Result<Json<Vec<Memory>>, (StatusCode, String)> {
    let query = r#"
        SELECT
            m.*
        FROM
            Memory m
        INNER JOIN (
            SELECT
                MAX(timestamp) AS latest_timestamp
            FROM
                Memory
        ) AS latest_mem
        ON
            m.timestamp = latest_mem.latest_timestamp
    "#;

    let res = sqlx::query_as::<_, Memory>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(memory_vec) => Ok(Json(memory_vec)),
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Error fetching latest memory data".to_string(),
        )),
    }
}
