use axum::Router;
use tower_http::services::{ServeDir, ServeFile};

const WEB_FILES_DIR: &str = "/var/nebula/web";

/// Creates the router for the web routes
pub fn create_web_router() -> Router {
    Router::new()
        // This will implicitly call / to be index.html
        .nest_service("/", ServeDir::new(WEB_FILES_DIR))
        .nest_service(
            "/process",
            ServeFile::new(format!("{}/process.html", WEB_FILES_DIR)),
        )
        .nest_service(
            "/system",
            ServeFile::new(format!("{}/system.html", WEB_FILES_DIR)),
        )
}
