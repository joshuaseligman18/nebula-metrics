use serde::Serialize;

/// Struct For Process Info Response
#[derive(Debug, Serialize)]
struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f32,
    elapsed_time: i64,
    memory_usage: u32,
}
