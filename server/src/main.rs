mod api;
mod web;

use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Level;

async fn create_app() -> Result<Router, sqlx::Error> {
    let router: Router = Router::new()
        .nest("/web", web::create_web_router())
        .nest("/api", api::create_api_router().await?)
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

    let app: Router = create_app().await?;
    let listener: TcpListener = tokio::net::TcpListener::bind("0.0.0.0:4242").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::PathBuf;

    use super::*;
    use axum::body::Body;
    use axum::extract::Request;
    use axum::response::Response;
    use axum::http::StatusCode;
    use http_body_util::BodyExt;
    use tower::util::ServiceExt;

    #[tokio::test]
    async fn test_index_html() -> Result<(), sqlx::Error> {
        let app: Router = create_app().await?;

        let response: Response = app
            .oneshot(Request::builder().uri("/web").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        
        let res_bytes: Vec<u8> = response.into_body().collect().await.unwrap().to_bytes().to_vec();
        let assets_web_path: PathBuf = fs::canonicalize("assets/web/").expect("Assets web should exist");
        let file_bytes = fs::read(assets_web_path.join("index.html")).unwrap();
        assert_eq!(res_bytes, file_bytes);

        Ok(())
    }

    #[tokio::test]
    async fn test_not_found() -> Result<(), sqlx::Error> {
        let app: Router = create_app().await?;

        let response: Response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        Ok(())
    }
}
