mod api;
mod web;

use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Level; // Import AllowOrigin

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_max_level(Level::TRACE)
        .init();

    let app: Router = Router::new()
        .nest("/web", web::create_web_router())
        .nest("/api", api::create_api_router().await?)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::new().allow_origin(AllowOrigin::any())); // Use AllowOrigin::any()
    let listener: TcpListener = tokio::net::TcpListener::bind("0.0.0.0:4242").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
