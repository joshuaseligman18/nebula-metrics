use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use models::tables::Process;
use sqlx::SqlitePool;
use models::tables::Memory;
use axum::extract::Path;
mod response;
use response::ProcessInfo;
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
        .route("/processes1", get(get_all_processes))
        .route("/process/:pid", get(get_specific_process))
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
    let res = sqlx::query_as::<_, ProcessInfo>("SELECT pid, exec AS name, init_total_cpu AS cpu_usage, (strftime('%s','now') - start_time) AS elapsed_time FROM process;")
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(process_infos) => Ok(Json(ApiResponse { data: Some(process_infos), error_message: None })),
        Err(_) => Ok(Json(ApiResponse { data: None, error_message: Some("Error fetching all processes".to_string()) })),
    }
}

/// Returns data for a specific process
async fn get_specific_process(State(state): State<AppState>, pid: Path<u32>) -> Result<Json<ApiResponse<ProcessInfo>>, StatusCode> {
    let res = sqlx::query_as::<_, ProcessInfo>("SELECT pid, exec AS name, init_total_cpu AS cpu_usage, (strftime('%s','now') - start_time) AS elapsed_time FROM process WHERE pid = ?;")
        .bind(*pid)
        .fetch_one(&state.conn)
        .await;

    match res {
        Ok(process_info) => Ok(Json(ApiResponse { data: Some(process_info), error_message: None })),
        Err(_) => Ok(Json(ApiResponse { data: None, error_message: Some("Error fetching specific process".to_string()) })),
    }
}
