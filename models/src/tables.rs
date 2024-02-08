use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct Process {
    pid: u32,
    exec: String,
    start_time: i64,
    is_alive: bool,
}
