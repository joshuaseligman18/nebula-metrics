use serde::Serialize;
use sqlx::FromRow;

/// Struct for the PROCESS table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct Process {
    /// The PID of the process
    pub pid: u32,
    /// The name of the executable
    pub exec: String,
    /// Process start time as a Unix epoch timestamp
    pub start_time: i64,
    /// Whether or not the process is alive
    pub is_alive: bool,
    /// Amount of CPU time in seconds the process has on the first encounter
    pub init_total_cpu: f32,
}

/// Struct for the CPU table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct Cpu {
    /// The core number for the CPU
    pub cpu_core: u32,
    /// The speed of the processor in MHz
    pub mhz: f32,
    /// Amount of cache in MB
    pub total_cache: u32,
}

/// Struct for the PROCSTAT table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct ProcStat {
    /// PID of the process
    pub pid: u32,
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
}

/// Struct for the CPUSTAT table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct CpuStat {
    /// Id of the CPU
    pub cpu_core: u32,
    /// Unix epoch timestamp at which the entry was recorded
    pub timestamp: i64,
    /// Percentage of time the CPU was in-use
    pub usage: f32,
}

/// Struct for the MEMORY table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct Memory {
    /// Unix epoch timestamp at which the entry was recorded
    pub timestamp: i64,
    /// Total amount of memory in KB
    pub total: u32,
    /// Amount of memory that is free in KB
    pub free: u32,
    /// Total amount of swap space in KB
    pub swap_total: u32,
    /// Amount of swap space that is free in KB
    pub swap_free: u32,
}

/// Struct for the DISK table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct Disk {
    /// Name of the device
    pub device_name: String,
    /// Folder the device is mounted to
    pub mount: String,
    /// Type of file system used by the disk
    pub fs_type: String,
}

/// Struct for the DISKSTAT table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct DiskStat {
    /// Name of the device
    pub device_name: String,
    /// Unix epoch timestamp at which the entry was recorded
    pub timestamp: i64,
    /// Amount of disk space used in MB
    pub used: u32,
    /// Amount of disk space available in MB
    pub available: u32,
}

/// Struct for the NETWORKINTERFACE table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct NetworkInterface {
    /// Logical name of the interface
    pub name: String,
    /// IP address of the interface
    pub ip_addr: Option<String>,
}

/// Struct for the NETWORKSTAT table
#[derive(Debug, Serialize, FromRow, Clone)]
#[sqlx(rename_all = "UPPERCASE")]
pub struct NetworkStat {
    /// Logical name of the interface
    pub name: String,
    /// Unix epoch timestamp at which the entry was recorded
    pub timestamp: i64,
    /// Change in total bytes received from the last record
    pub delta_bytes_recv: u32,
    /// Change in total bytes sent from the last record
    pub delta_bytes_sent: u32,
    /// Change in total packets received from the last record
    pub delta_packets_recv: u32,
    /// Change in total packets sent from the last record
    pub delta_packets_sent: u32,
    /// Change in total transmission errors received from the last record
    pub delta_err_recv: u32,
    /// Change in total transmission errors sent from the last record
    pub delta_err_sent: u32,
}
