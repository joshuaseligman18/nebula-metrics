use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use models::tables::{Memory, Process};
use sqlx::SqlitePool;
use axum::extract::Path;
mod response;
use response::{ProcessInfo, DiskInfo, CpuInfo};

use serde::Serialize;

/// Absolute path to the database file
const DB_FILE: &str = "sqlite:///var/nebula/db/nebulaMetrics.db?mode=ro";

/// Struct for storing the data for the api state
#[derive(Clone)]
struct AppState {
    /// Connection to the database
    conn: SqlitePool,
}

/// Response structure for API endpoints
#[derive(Debug, Serialize)]
struct ApiResponse<T> {
    data: Option<T>,
    error_message: Option<String>,
}

/// Creates the router for the api routes
pub async fn create_api_router() -> Result<Router, sqlx::Error> {
    let router: Router = Router::new()
        .route("/processes", get(get_processes))
        .route("/memory", get(get_memory_data))
        .route("/allProcesses", get(get_all_processes))
        .route("/process/:pid", get(get_specific_process))
        .route("/disks", get(get_disk_info))
        .route("/cpu-info", get(get_cpu_info))
        .with_state(AppState {
            conn: SqlitePool::connect(DB_FILE).await?,
        });
    Ok(router)
}

/// Returns all processes in the database
async fn get_processes(State(state): State<AppState>) -> Result<Json<ApiResponse<Vec<Process>>>, StatusCode> {
    let res: Result<Vec<Process>, sqlx::Error> =
        sqlx::query_as::<_, Process>("SELECT * FROM PROCESS;")
            .fetch_all(&state.conn)
            .await;

    match res {
        Ok(proc_vec) => Ok(Json(ApiResponse { data: Some(proc_vec), error_message: None })),
        Err(_) => Ok(Json(ApiResponse { data: None, error_message: Some("Error fetching processes".to_string()) })),
    }
}

/// Returns all data in Memory Table
async fn get_memory_data(State(state): State<AppState>) -> Result<Json<ApiResponse<Vec<Memory>>>, StatusCode> {
    let res: Result<Vec<Memory>, sqlx::Error> =
        sqlx::query_as::<_, Memory>("SELECT * FROM Memory;")
            .fetch_all(&state.conn)
            .await;

    match res {
        Ok(memory_vec) => Ok(Json(ApiResponse { data: Some(memory_vec), error_message: None })),
        Err(_) => Ok(Json(ApiResponse { data: None, error_message: Some("Error fetching memory data".to_string()) })),
    }
}

/// Returns all data for all processes
async fn get_all_processes(State(state): State<AppState>) -> Result<Json<ApiResponse<Vec<ProcessInfo>>>, StatusCode> {
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
        LEFT JOIN
            ProcStat ps
        ON
            p.pid = ps.pid
    "#;

    let res = sqlx::query_as::<_, ProcessInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(process_infos) => Ok(Json(ApiResponse { data: Some(process_infos), error_message: None })),
        Err(e) => {
            let error_message = format!("Error fetching all processes: {}", e);
            Ok(Json(ApiResponse { data: None, error_message: Some(error_message) }))
        }
    }
}

/// Returns data for a specific process
async fn get_specific_process(State(state): State<AppState>, pid: Path<u32>) -> Result<Json<ApiResponse<ProcessInfo>>, StatusCode> {
    let res = sqlx::query_as::<_, ProcessInfo>("SELECT pid, exec AS name, init_total_cpu AS cpu_usage, (strftime('%s','now') - start_time) AS elapsed_time FROM PROCESS WHERE pid = ?;")
        .bind(*pid)
        .fetch_one(&state.conn)
        .await;

    match res {
        Ok(process_info) => Ok(Json(ApiResponse { data: Some(process_info), error_message: None })),
        Err(_) => Ok(Json(ApiResponse { data: None, error_message: Some("Error fetching specific process".to_string()) })),
    }
}

/// Returns all disk information
async fn get_disk_info(State(state): State<AppState>) -> Result<Json<ApiResponse<Vec<DiskInfo>>>, StatusCode> {
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
        INNER JOIN
            DiskStat ds
        ON
            d.device_name = ds.device_name
    "#;

    let res = sqlx::query_as::<_, DiskInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(disk_info) => Ok(Json(ApiResponse { data: Some(disk_info), error_message: None })),
        Err(e) => {
            let error_message = format!("Error fetching disk information: {}", e);
            Ok(Json(ApiResponse { data: None, error_message: Some(error_message) }))
        }
    }
}

/// Returns all CPU information
async fn get_cpu_info(State(state): State<AppState>) -> Result<Json<ApiResponse<Vec<CpuInfo>>>, StatusCode> {
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
        Ok(cpu_info) => Ok(Json(ApiResponse { data: Some(cpu_info), error_message: None })),
        Err(e) => {
            let error_message = format!("Error fetching CPU information: {}", e);
            Ok(Json(ApiResponse { data: None, error_message: Some(error_message) }))
        }
    }
}

