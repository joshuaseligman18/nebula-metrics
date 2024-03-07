use std::fs;
use std::path::PathBuf;

use axum::Router;
use tower_http::services::{ServeDir, ServeFile};

const WEB_FILES_DIR: &str = "/var/nebula/web";
const TEST_WEB_FILES_DIR: &str = "assets/web";

/// Creates the router for the web routes
pub fn create_web_router() -> Router {
    let files_dir: PathBuf = fs::canonicalize(if cfg!(test) {
        TEST_WEB_FILES_DIR
    } else {
        WEB_FILES_DIR
    }).expect("Files should exist");


    Router::new()
        // This will implicitly call / to be index.html
        .nest_service("/", ServeDir::new(&files_dir))
        .nest_service(
            "/process",
            ServeFile::new(format!("{}/process.html", files_dir.to_str().unwrap())),
        )
        .nest_service(
            "/system",
            ServeFile::new(format!("{}/system.html", files_dir.to_str().unwrap())),
        )
}
