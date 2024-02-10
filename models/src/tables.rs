use procfs::process::{self, Stat};
use procfs::WithCurrentSystemInfo;
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

impl From<process::Process> for self::Process {
    /// Converts from a procfs process for easier use
    fn from(value: process::Process) -> Self {
        let stat: Stat = value.stat().unwrap();
        self::Process {
            pid: value.pid() as u32,
            exec: value.exe().unwrap().to_str().unwrap().to_string(),
            start_time: stat.starttime().get().unwrap().timestamp(),
            is_alive: value.is_alive(),
            // User time + system time are in Jiffies, so have to convert to seconds
            init_total_cpu: (stat.utime + stat.stime) as f32 / procfs::ticks_per_second() as f32,
        }
    }
}

impl From<&process::Process> for self::Process {
    /// Converts from a procfs process for easier use
    fn from(value: &process::Process) -> Self {
        let stat: Stat = value.stat().unwrap();
        self::Process {
            pid: value.pid() as u32,
            exec: value.exe().unwrap().to_str().unwrap().to_string(),
            start_time: stat.starttime().get().unwrap().timestamp(),
            is_alive: value.is_alive(),
            // User time + system time are in Jiffies, so have to convert to seconds
            init_total_cpu: (stat.utime + stat.stime) as f32 / procfs::ticks_per_second() as f32,
        }
    }
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
    /// Total amount of memory
    pub total: u32,
    /// Amount of memory that is free
    pub free: u32,
    /// Total amount of swap space
    pub swap_total: u32,
    /// Amount of swap space that is free
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
    /// Amount of disk space used
    pub used: u32,
    /// Amount of disk space available
    pub available: u32,
}
