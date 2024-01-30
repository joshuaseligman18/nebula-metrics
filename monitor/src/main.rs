mod monitor;
use monitor::Monitor;

extern crate tokio;
use tokio::task;
use tokio::time::{interval, Duration};

extern crate tracing;
use tracing::{event, span, Level, Span};

extern crate tracing_subscriber;

use std::io;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_writer(io::stderr)
        .with_max_level(Level::TRACE)
        .init();

    let forever = task::spawn(async {
        let mut interval = interval(Duration::from_secs(10));

        let monitor: Monitor = Monitor::new().await;
        let init_res: Result<(), sqlx::Error> = monitor.setup_init_data().await;

        if init_res.is_err() {
            event!(
                Level::ERROR,
                "Failed to initialize the data: {:?}",
                init_res.unwrap_err()
            );
            panic!()
        }

        loop {
            interval.tick().await;
            let monitor_span: Span = span!(Level::TRACE, "monitor");
            let _guard = monitor_span.enter();
            let _ = monitor.update(monitor_span.id().unwrap()).await;
        }
    });

    let _ = forever.await;
}
