use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use models::tables::Process;
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
pub async fn create_api_router() -> Result<Router, sqlx::Error> {
    let router: Router = Router::new()
        .route("/processes", get(get_processes))
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
