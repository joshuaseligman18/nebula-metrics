use axum::Router;
use tower_http::services::ServeDir;

const WEB_FILES_DIR: &str = "/var/nebula/web";

/// Creates the router for the web routes
pub fn create_web_router() -> Router {
    let web_service: ServeDir = ServeDir::new(WEB_FILES_DIR);

    Router::new()
        .nest_service("/", web_service)
}
