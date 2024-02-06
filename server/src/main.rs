use axum::Router;
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tower_http::services::ServeDir;
use tracing::Level;

const WEB_FILES_DIR: &str = "/var/nebula/web";

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_max_level(Level::TRACE)
        .init();

    let web_service: ServeDir = ServeDir::new(WEB_FILES_DIR);

    let app: Router = Router::new()
        .nest_service("/web", web_service)
        .layer(TraceLayer::new_for_http());

    let listener: TcpListener = tokio::net::TcpListener::bind("0.0.0.0:4242").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
