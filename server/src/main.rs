mod api;
mod web;

use axum::Router;
use sqlx::SqlitePool;
use tokio::net::TcpListener;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Level;

/// Creates the router for the application
async fn create_app(test_sql_conn: Option<SqlitePool>) -> Result<Router, sqlx::Error> {
    let router: Router = Router::new()
        .nest("/web", web::create_web_router())
        .nest("/api", api::create_api_router(test_sql_conn).await?)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::new().allow_origin(AllowOrigin::any()));

    Ok(router)
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_max_level(Level::TRACE)
        .init();

    // This is an executable, so we want to connect to the actual database
    let app: Router = create_app(None).await?;
    let listener: TcpListener = tokio::net::TcpListener::bind("0.0.0.0:4242").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::io;
    use std::path::PathBuf;

    use super::*;
    use crate::api::response::ProcessInfo;
    use axum::body::Body;
    use axum::extract::Request;
    use axum::http::StatusCode;
    use axum::response::Response;
    use http_body_util::BodyExt;
    use models::tables::Memory;
    use tower::util::ServiceExt;

    #[sqlx::test]
    async fn test_index_html(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(Request::builder().uri("/web").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let res_bytes: Vec<u8> = response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes()
            .to_vec();
        let assets_web_path: PathBuf =
            fs::canonicalize("../assets/web/").expect("Assets web should exist");
        let file_bytes = fs::read(assets_web_path.join("index.html")).unwrap();
        assert_eq!(res_bytes, file_bytes);

        Ok(())
    }

    #[sqlx::test]
    async fn test_system_html(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/web/system")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let res_bytes: Vec<u8> = response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes()
            .to_vec();
        let assets_web_path: PathBuf =
            fs::canonicalize("../assets/web/").expect("Assets web should exist");
        let file_bytes = fs::read(assets_web_path.join("system.html")).unwrap();
        assert_eq!(res_bytes, file_bytes);

        Ok(())
    }

    #[sqlx::test]
    async fn test_process_html(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/web/process")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let res_bytes: Vec<u8> = response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes()
            .to_vec();
        let assets_web_path: PathBuf =
            fs::canonicalize("../assets/web/").expect("Assets web should exist");
        let file_bytes = fs::read(assets_web_path.join("process.html")).unwrap();
        assert_eq!(res_bytes, file_bytes);

        Ok(())
    }

    #[sqlx::test]
    async fn test_not_found(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_memory(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(Request::builder().uri("/api/memory").body(Body::empty()).unwrap())
            .await
            .unwrap();

        let res_string: String = String::from_utf8(
            response
                .into_body()
                .collect()
                .await
                .unwrap()
                .to_bytes()
                .to_vec(),
        )
        .expect("Should be able to convert to a string");

        let res_vec: Vec<Memory> =
            serde_json::from_str(&res_string).expect("Should be able to convert to a memory vec");
        assert_eq!(res_vec.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_processes(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(Request::builder().uri("/api/allProcesses").body(Body::empty()).unwrap())
            .await
            .unwrap();

        let res_string: String = String::from_utf8(
            response
                .into_body()
                .collect()
                .await
                .unwrap()
                .to_bytes()
                .to_vec(),
        )
        .expect("Should be able to convert to a string");

        let res_vec: Vec<ProcessInfo> =
            serde_json::from_str(&res_string).expect("Should be able to convert to a memory vec");
        assert_eq!(res_vec.len(), 3);
        assert_eq!(res_vec[0].timestamp, 987654322);

        Ok(())
    }
}
