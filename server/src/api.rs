use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use models::tables::Process;
use sqlx::SqlitePool;
use tracing::{event, Level};
use models::tables::Memory;
use axum::extract::Path;
mod response;
use response::ProcessInfo;

/// Absolute path to the database file
const DB_FILE: &str = "sqlite:///var/nebula/db/nebulaMetrics.db?mode=ro";

/// Struct for storing the data for the api state
#[derive(Clone)]
struct AppState {
    /// Connection to the database
    conn: SqlitePool,
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
async fn get_processes(State(state): State<AppState>) -> Result<Json<Vec<Process>>, StatusCode> {
    let res: Result<Vec<Process>, sqlx::Error> =
        sqlx::query_as::<_, Process>("SELECT * FROM PROCESS;")
            .fetch_all(&state.conn)
            .await;

    event!(Level::TRACE, "{:?}", res);

    if let Ok(proc_vec) = res {
        Ok(Json::from(proc_vec))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

/// Returns all data in Memory Table ( my first attempt )
async fn get_memory_data(State(state): State<AppState>) -> Result<Json<Vec<Memory>>, StatusCode> {
    let res: Result<Vec<Memory>, sqlx::Error> =
        sqlx::query_as::<_, Memory>("SELECT * FROM Memory;")
            .fetch_all(&state.conn)
            .await;

    event!(Level::TRACE, "{:?}", res);

    if let Ok(memory_vec) = res {
        Ok(Json::from(memory_vec))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

/// Returns all data for all processes (for table)
async fn get_all_processes(State(state): State<AppState>) -> Result<Json<Vec<ProcessInfo>>, StatusCode> {
    let res = sqlx::query_as::<_, ProcessInfo>("SELECT pid, exec AS name, init_total_cpu AS cpu_usage, (strftime('%s','now') - start_time) AS elapsed_time FROM process;")
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(process_infos) => Ok(Json(process_infos)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}


/// Returns all data for a specific process
async fn get_specific_process(State(state): State<AppState>, pid: Path<u32>) -> Result<Json<ProcessInfo>, StatusCode> {
    let res = sqlx::query_as::<_, ProcessInfo>("SELECT pid, exec AS name, init_total_cpu AS cpu_usage, (strftime('%s','now') - start_time) AS elapsed_time FROM process WHERE pid = ?;")
        .bind(*pid) // Directly use `*pid` instead of `pid.param()`
        .fetch_one(&state.conn)
        .await;

    match res {
        Ok(process_info) => Ok(Json(process_info)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

