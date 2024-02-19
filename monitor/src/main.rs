mod monitor;
use monitor::Monitor;

extern crate tokio;
use tokio::sync::Mutex;
use tokio::task::JoinSet;
use tokio::time::{interval, Duration, MissedTickBehavior};

extern crate tracing;
use tracing::{event, span, Level, Span};

extern crate tracing_subscriber;

use std::io;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_writer(io::stderr)
        .with_max_level(Level::TRACE)
        .init();

    let monitor: Monitor = Monitor::new().await.expect("Monitor should be created");
    monitor
        .setup_init_data()
        .await
        .expect("Data should be initialized");

    let mut task_set = JoinSet::new();
    let shared_monitor: Arc<Mutex<Monitor>> = Arc::new(Mutex::new(monitor));

    let monitor_update_mutex: Arc<Mutex<Monitor>> = Arc::clone(&shared_monitor);
    task_set.spawn(async move {
        let mut interval = interval(Duration::from_secs(4));
        // In the event that a tick takes longer than the duration, then we
        // should reschedule future ticks to be based off this time
        interval.set_missed_tick_behavior(MissedTickBehavior::Delay);

        loop {
            interval.tick().await;
            let monitor_span: Span = span!(Level::TRACE, "monitor");
            let _guard = monitor_span.enter();
            let _ = monitor_update_mutex
                .lock()
                .await
                .update(monitor_span.id().unwrap())
                .await;
        }
    });

    let monitor_prune_mutex: Arc<Mutex<Monitor>> = Arc::clone(&shared_monitor);
    task_set.spawn(async move {
        // Pruning should happen eveny hour
        let mut interval = interval(Duration::from_secs(3600));

        loop {
            interval.tick().await;
            let prune_span: Span = span!(Level::TRACE, "prune");
            let _guard = prune_span.enter();
            let _ = monitor_prune_mutex
                .lock()
                .await
                .prune_db(prune_span.id().unwrap())
                .await;
        }
    });

    let _ = task_set.join_next().await;
    event!(Level::INFO, "Error in at least one task... shutting down");
    let _ = task_set.shutdown().await;
}
