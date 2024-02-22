use serde::Serialize;
use sqlx::FromRow;

/// Struct For Process Info Response
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct ProcessInfo {
    /// The PID of the process
    pub pid: u32,
    /// The name of the executable
    pub exec: String,
    /// Unix epoch timestamp at which the entry was recorded
    pub timestamp: i64,
    /// Total CPU time for the process in seconds
    pub total_cpu: f32,
    /// Percent of CPU time since the last metric check
    pub percent_cpu: Option<f32>,
    /// CPU core the process is running on
    pub cpu_core: Option<u32>,
    /// Amount of virtual memory for the process in KB
    pub virtual_memory: u32,
    /// Amount of space the process actively has in memory in KB
    pub resident_memory: u32,
    /// Amount of memoryt the process is sharing with other processes in KB
    pub shared_memory: u32,
    /// Elapsed time since start in seconds
    pub start_time: i64,
    /// Whether or not the process is alive
    pub is_alive: bool,
}

/// Struct For disk Info Response
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct DiskInfo {
    /// Name of the device
    pub device_name: String,
    /// Folder the device is mounted to
    pub mount: String,
    /// Type of file system used by the disk
    pub fs_type: String,
    /// Unix epoch timestamp at which the entry was recorded
    pub timestamp: i64,
    /// Amount of disk space used in MB
    pub used: u32,
    /// Amount of disk space available in MB
    pub available: u32,
}

/// Struct For disk Info Response
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct CpuInfo {
    /// The core number for the CPU
    pub cpu_core: u32,
    /// The speed of the processor in MHz
    pub mhz: f32,
    /// Amount of cache in MB
    pub total_cache: u32,
    /// Unix epoch timestamp at which the entry was recorded
    pub timestamp: i64,
    /// Percentage of time the CPU was in-use
    pub usage: f32,
}
