use serde::Serialize;
use sqlx::FromRow;

/// Struct For Process Info Response
#[derive(Debug, Serialize, FromRow, Clone)]
#[serde(rename_all="camelCase")]
pub struct ProcessInfo {
    /// The PID of the process
    pub pid: u32,
    /// The name of the executable
    pub name: String,
    /// Initial total CPU usage
    pub cpu_usage: f32,
    /// Elapsed time since start in seconds
    pub elapsed_time: i64,
}
