use procfs::ProcError;

/// Enum for representing the different errors within the monitor
#[derive(Debug)]
pub enum NebulaError {
    /// Error from the procfs crate
    Procfs(ProcError),
    /// Error from the sqlx crate
    Sql(sqlx::Error),
}

impl From<ProcError> for NebulaError {
    /// Converts from ProcError to NebulaError::Procfs
    fn from(item: ProcError) -> Self {
        NebulaError::Procfs(item)
    }
}

impl From<sqlx::Error> for NebulaError {
    /// Converts from sqlx::Error to NebulaError::Sql
    fn from(item: sqlx::Error) -> Self {
        NebulaError::Sql(item)
    }
}
