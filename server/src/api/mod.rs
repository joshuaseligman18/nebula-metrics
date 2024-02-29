use axum::extract::Path;
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use models::tables::{Memory, Process, ProcStat};
use sqlx::sqlite::{SqlitePool};
mod response;
use response::{CpuInfo, DiskInfo, ProcessInfo};


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
        .route("/memory", get(get_memory_data))
        .route("/allProcesses", get(get_all_processes))
        .route("/process/:pid", get(get_combined_process_info))
        .route("/disks", get(get_disk_info))
        .route("/cpu-info", get(get_cpu_info))
        .with_state(AppState {
            conn: SqlitePool::connect(DB_FILE).await?,
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
        Err(_) => Err((StatusCode::INTERNAL_SERVER_ERROR, "Error fetching memory data".to_string())),
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
        LEFT JOIN
            ProcStat ps
        ON
            p.pid = ps.pid
    "#;

    let res = sqlx::query_as::<_, ProcessInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(process_infos) => Ok(Json(process_infos)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Error fetching all processes: {}", e))),
    }
}

async fn get_combined_process_info(
    state: State<AppState>,
    Path(pid): Path<u32>,
) -> Result<Json<ProcessInfo>, (StatusCode, String)> {
    println!("PID before SQL query: {}", pid); // Print PID before SQL query
    match sqlx::query_as::<_, ProcessInfo>(
        r#"
        SELECT *
        FROM
            PROCESS p
        JOIN
            PROCSTAT ps ON p.PID = ps.PID
        WHERE
            p.PID = ?
        ORDER BY timestamp DESC;
        "#
    )
    .bind(pid)
    .fetch_optional(&state.conn)
    .await
    {
        Ok(Some(combined_info)) => {
            //let x = combined_info.columns().iter().map(|col| format!("{:?}", col)).collect();
            Ok(Json(combined_info))
        },
        Ok(None) => {
            let pid_str = pid.to_string(); // Convert Path<u32> to a string
            Err((StatusCode::NOT_FOUND, format!("Process {} not found", pid_str)))
        }
        Err(err) => {
            let pid_str = pid.to_string(); // Convert Path<u32> to a string
            eprintln!("Error fetching combined process info for PID {}: {:?}", pid_str, err); // Print error to stderr
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Error fetching combined process info for PID {}: {:?}", pid_str, err)))
        },
    }
}

/// Returns all disk information
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
        INNER JOIN
            DiskStat ds
        ON
            d.device_name = ds.device_name
    "#;

    let res = sqlx::query_as::<_, DiskInfo>(query)
        .fetch_all(&state.conn)
        .await;

    match res {
        Ok(disk_info) => Ok(Json(disk_info)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Error fetching disk information: {}", e))),
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
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Error fetching CPU information: {}", e))),
    }
}
