use models::error::NebulaError;
use procfs::net::{self, ARPEntry, DeviceStatus, InterfaceDeviceStatus};
use procfs::Current;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::{event, instrument, Level};

/// Initializes the database with up-to-date disk info at monitor start up
#[instrument(skip(conn))]
pub async fn init_network_data(conn: &SqlitePool) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to initialize network data");
    let interfaces: Vec<DeviceStatus> = InterfaceDeviceStatus::current()?
        .0
        .values()
        .cloned()
        .collect();
    let arp_table: Vec<ARPEntry> = net::arp()?;

    event!(
        Level::DEBUG,
        "Starting to insert current network interfaces"
    );
    let mut insert_interface_query: QueryBuilder<Sqlite> =
        QueryBuilder::new("INSERT OR REPLACE INTO NETWORKINTERFACE ");
    insert_interface_query.push_values(interfaces.iter(), |mut builder, interface| {
        let arp_entry_vec: Vec<&ARPEntry> = arp_table
            .iter()
            .filter(|entry| entry.device == interface.name)
            .collect();
        let interface_ip: Option<String> = if arp_entry_vec.is_empty() {
            None
        } else {
            Some(arp_entry_vec[0].ip_address.to_string())
        };

        builder.push_bind(&interface.name).push_bind(interface_ip);
    });
    insert_interface_query.push(";");
    insert_interface_query.build().execute(conn).await?;
    event!(
        Level::DEBUG,
        "Finished inserting current network interfaces"
    );

    event!(Level::INFO, "Successfully initialized network info");
    Ok(())
}

/// Removes stas from interfaces that do not exist anymore
#[instrument(skip(conn))]
async fn clean_up_old_interfaces(
    conn: &SqlitePool,
    cur_interfaces: &Vec<DeviceStatus>,
) -> Result<(), NebulaError> {
    event!(
        Level::DEBUG,
        "Starting to clean up old network interface data"
    );

    // Start by clearing the NETWORKSTAT table
    let mut network_stat_delete: QueryBuilder<Sqlite> =
        QueryBuilder::new("DELETE FROM NETWORKSTAT WHERE NAME NOT IN (");
    let mut network_stat_separated = network_stat_delete.separated(", ");
    for interface in cur_interfaces.iter() {
        network_stat_separated.push_bind(&interface.name);
    }
    network_stat_separated.push_unseparated(");");
    network_stat_delete.build().execute(conn).await?;

    // Next clear out the NETWORKINTERFACE table now that the
    // foreign keys are taken care of
    let mut network_delete: QueryBuilder<Sqlite> =
        QueryBuilder::new("DELETE FROM NETWORKINTERFACE WHERE NAME NOT IN (");
    let mut network_separated = network_delete.separated(", ");
    for interface in cur_interfaces.iter() {
        network_separated.push_bind(&interface.name);
    }
    network_separated.push_unseparated(");");
    network_delete.build().execute(conn).await?;

    event!(
        Level::DEBUG,
        "Finished cleaning up old network interface data"
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io;

    #[sqlx::test(fixtures("networkTest"))]
    async fn test_clean_up_old_interface_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let cur_interfaces: Vec<DeviceStatus> = InterfaceDeviceStatus::current()?
            .0
            .values()
            .cloned()
            .collect();

        clean_up_old_interfaces(&pool, &cur_interfaces).await?;

        assert!(sqlx::query("SELECT * FROM NETWORKINTERFACE;").fetch_all(&pool).await?.is_empty());
        assert!(sqlx::query("SELECT * FROM NETWORKSTAT;").fetch_all(&pool).await?.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("networkTest"))]
    async fn test_init_interface_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let cur_interfaces: Vec<DeviceStatus> = InterfaceDeviceStatus::current()?
            .0
            .values()
            .cloned()
            .collect();

        init_network_data(&pool).await?;

        assert_eq!(sqlx::query("SELECT * FROM NETWORKINTERFACE;").fetch_all(&pool).await?.len(), cur_interfaces.len());
        assert!(sqlx::query("SELECT * FROM NETWORKSTAT;").fetch_all(&pool).await?.is_empty());

        Ok(())
    }
}
