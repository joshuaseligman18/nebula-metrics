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
    use crate::api::response::{CpuInfo, DiskInfo, ProcessInfo};
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
    async fn test_404_html(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/web/hello-world")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        let res_bytes: Vec<u8> = response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes()
            .to_vec();
        let assets_web_path: PathBuf =
            fs::canonicalize("../assets/web/").expect("Assets web should exist");
        let file_bytes = fs::read(assets_web_path.join("404.html")).unwrap();
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
            .oneshot(
                Request::builder()
                    .uri("/api/memory")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

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
            .oneshot(
                Request::builder()
                    .uri("/api/allProcesses")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

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

        let res_vec: Vec<ProcessInfo> = serde_json::from_str(&res_string)
            .expect("Should be able to convert to a process info vec");

        // Check if at least one item (ProcessInfo) is returned
        assert!(
            !res_vec.is_empty(),
            "Expected at least one item in the response"
        );

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_existing_process(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/api/process/1")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

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

        let res_vec: Vec<ProcessInfo> = serde_json::from_str(&res_string)
            .expect("Should be able to convert to a process info vec");
        assert_eq!(res_vec.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_nonexistent_process(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/api/process/7")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);

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
        assert_eq!(res_string, "Process 7 not found");

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_disks(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/api/disks")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

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

        let res_vec: Vec<DiskInfo> = serde_json::from_str(&res_string)
            .expect("Should be able to convert to a disk info vec");

        // Check if at least one item (DiskInfo) is returned
        assert!(
            !res_vec.is_empty(),
            "Expected at least one item in the response"
        );

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_cpus(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/api/cpu-info")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

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

        let res_vec: Vec<CpuInfo> =
            serde_json::from_str(&res_string).expect("Should be able to convert to a cpu info vec");
        assert_eq!(res_vec.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_cpu_info_current(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/api/cpu-info-current")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

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

        let res_vec: Vec<CpuInfo> =
            serde_json::from_str(&res_string).expect("Should be able to convert to a CPU info vec");

        // Check if at least one item (CpuInfo) is returned
        assert!(
            !res_vec.is_empty(),
            "Expected at least one item in the response"
        );

        Ok(())
    }

    #[sqlx::test(fixtures("apiTest"))]
    async fn test_api_memory_current(pool: SqlitePool) -> Result<(), sqlx::Error> {
        let _ = tracing_subscriber::fmt()
            .with_writer(io::stderr)
            .with_max_level(Level::TRACE)
            .try_init();

        let app: Router = create_app(Some(pool)).await?;

        let response: Response = app
            .oneshot(
                Request::builder()
                    .uri("/api/memory-current")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

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

        // Check if at least one item (Memory) is returned
        assert!(
            !res_vec.is_empty(),
            "Expected at least one item in the response"
        );

        Ok(())
    }
}
