extern crate tokio;
use tokio::task;
use tokio::time::{interval, Duration};

extern crate tracing;
use tracing::{event, instrument, span, Level, Span};

extern crate tracing_subscriber;

use std::io;

#[instrument]
fn test_monitor_func(id: tracing::Id) {
    event!(Level::DEBUG, "hello world");
    sub_func(id.into_u64() % 42);
}

#[instrument]
fn sub_func(my_num: u64) {
    event!(Level::INFO, "Inside the sub_func");
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_writer(io::stderr)
        .with_max_level(Level::TRACE)
        .init();

    let forever = task::spawn(async {
        let mut interval = interval(Duration::from_secs(10));

        loop {
            interval.tick().await;
            let monitor_span: Span = span!(Level::TRACE, "monitor");
            let _guard = monitor_span.enter();
            test_monitor_func(monitor_span.id().unwrap());
        }
    });

    let _ = forever.await;
}
