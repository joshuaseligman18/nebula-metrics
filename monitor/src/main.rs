extern crate log;
use log::info;

extern crate tokio;
use tokio::time::{interval, Duration};
use tokio::task;

extern crate uuid;
use uuid::Uuid;

fn test_monitor_func(run_uuid: Uuid) {
    info!("{:?} - hello world", run_uuid); 
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let forever = task::spawn(async {
        let mut interval = interval(Duration::from_secs(10));

        loop {
            interval.tick().await;
            test_monitor_func(Uuid::new_v4());
        }
    });

    let _ = forever.await;
}
