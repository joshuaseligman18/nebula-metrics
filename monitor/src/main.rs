mod monitor;
use monitor::Monitor;

extern crate tokio;
use tokio::task;
use tokio::time::{interval, Duration};

extern crate tracing;
use tracing::{span, Level, Span};

extern crate tracing_subscriber;

use std::io;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_writer(io::stderr)
        .with_max_level(Level::TRACE)
        .init();

    let forever = task::spawn(async {
        let mut interval = interval(Duration::from_secs(4));

        let monitor: Monitor = Monitor::new().await.expect("Monitor should be created");
        monitor
            .setup_init_data()
            .await
            .expect("Data should be initialized");

        loop {
            interval.tick().await;
            let monitor_span: Span = span!(Level::TRACE, "monitor");
            let _guard = monitor_span.enter();
            let _ = monitor.update(monitor_span.id().unwrap()).await;
        }
    });

    let _ = forever.await;
}
