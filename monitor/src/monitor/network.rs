use models::error::NebulaError;
use models::tables::NetworkInterface;
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

    clean_up_old_interfaces(conn, &interfaces).await?;
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

#[instrument(skip(conn))]
pub async fn update_network_interface_data(
    cur_time: u64,
    conn: &SqlitePool,
) -> Result<(), NebulaError> {
    event!(Level::INFO, "Starting to update network data");

    let db_interfaces: Vec<NetworkInterface> =
        sqlx::query_as::<_, NetworkInterface>("SELECT * FROM NETWORKINTERFACE;")
            .fetch_all(conn)
            .await?;

    let cur_interfaces: Vec<DeviceStatus> = InterfaceDeviceStatus::current()?
        .0
        .values()
        .cloned()
        .collect();
    let cur_arp: Vec<ARPEntry> = net::arp()?;

    for cur_interface in cur_interfaces.iter() {
        let matching_db_interface: Vec<NetworkInterface> = db_interfaces
            .clone()
            .into_iter()
            .filter(|i| i.name == cur_interface.name)
            .collect();

        let arp_entry_vec: Vec<ARPEntry> = cur_arp
            .clone()
            .into_iter()
            .filter(|entry| entry.device == cur_interface.name)
            .collect();
        let device_ip: Option<String> = if arp_entry_vec.is_empty() {
            None
        } else {
            Some(arp_entry_vec[0].ip_address.to_string())
        };

        if matching_db_interface.is_empty() {
            event!(
                Level::DEBUG,
                "Found new network interface {:?}",
                cur_interface.name
            );
            sqlx::query("INSERT INTO NETWORKINTERFACE VALUES (?, ?);")
                .bind(&cur_interface.name)
                .bind(device_ip)
                .execute(conn)
                .await?;
        } else if matching_db_interface[0].ip_addr != device_ip {
            event!(
                Level::DEBUG,
                "New IP found for network interface {:?}",
                cur_interface.name
            );
            sqlx::query("UPDATE NETWORKINTERFACE SET IP_ADDR = ? WHERE NAME = ?;")
                .bind(device_ip)
                .bind(&cur_interface.name)
                .execute(conn)
                .await?;
        }
    }

    event!(Level::DEBUG, "Starting to insert network stat info");
    let mut network_stat_query: QueryBuilder<Sqlite> =
        QueryBuilder::new("INSERT INTO NETWORKSTAT ");
    network_stat_query.push_values(cur_interfaces.iter(), |mut builder, interface| {
        builder
            .push_bind(&interface.name)
            .push_bind(cur_time as i64)
            .push_bind((interface.recv_bytes / 1000) as i64)
            .push_bind((interface.sent_bytes / 1000) as i64)
            .push_bind(interface.recv_packets as i64)
            .push_bind(interface.sent_packets as i64)
            .push_bind(interface.recv_errs as i64)
            .push_bind(interface.sent_errs as i64);
    });
    network_stat_query.push(";").build().execute(conn).await?;
    event!(Level::DEBUG, "Finished inserting network stat info");

    clean_up_old_interfaces(conn, &cur_interfaces).await?;

    event!(Level::DEBUG, "Finished updating network data");
    Ok(())
}

#[cfg(test)]
mod tests {
    use models::tables::NetworkStat;

    use super::*;
    use std::time::{UNIX_EPOCH, SystemTime};
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

        assert!(sqlx::query("SELECT * FROM NETWORKINTERFACE;")
            .fetch_all(&pool)
            .await?
            .is_empty());
        assert!(sqlx::query("SELECT * FROM NETWORKSTAT;")
            .fetch_all(&pool)
            .await?
            .is_empty());

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

        assert_eq!(
            sqlx::query("SELECT * FROM NETWORKINTERFACE;")
                .fetch_all(&pool)
                .await?
                .len(),
            cur_interfaces.len()
        );
        assert!(sqlx::query("SELECT * FROM NETWORKSTAT;")
            .fetch_all(&pool)
            .await?
            .is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("networkTest"))]
    async fn test_update_network_data(pool: SqlitePool) -> Result<(), NebulaError> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let cur_interfaces: Vec<DeviceStatus> = InterfaceDeviceStatus::current()?
            .0
            .values()
            .cloned()
            .collect();
        
        let mut pre_insert_query: QueryBuilder<Sqlite> = QueryBuilder::new("INSERT INTO NETWORKINTERFACE ");
        pre_insert_query.push_values(cur_interfaces.iter(), |mut builder, interface| {
            builder.push_bind(&interface.name)
                .push_bind(Some("1.2.3.4"));
        });
        pre_insert_query.push(";").build().execute(&pool).await?;

        let cur_time: u64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        update_network_interface_data(cur_time, &pool).await?;

        let db_interfaces: Vec<NetworkInterface> = sqlx::query_as::<_, NetworkInterface>("SELECT * FROM NETWORKINTERFACE;").fetch_all(&pool).await?;
        assert_eq!(db_interfaces.len(), cur_interfaces.len());
        for interface in db_interfaces.iter() {
            assert_ne!(interface.ip_addr, Some("1.2.3.4".to_string()));
        }

        let db_stats: Vec<NetworkStat> = sqlx::query_as::<_, NetworkStat>("SELECT * FROM NETWORKSTAT;").fetch_all(&pool).await?;
        assert_eq!(db_stats.len(), cur_interfaces.len());

        Ok(())
    }
}
