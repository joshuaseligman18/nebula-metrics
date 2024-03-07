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
   use super::*;
   use axum::extract::Request;
   use axum::body::Body;
   use tower::util::ServiceExt;
   use http_body_util::BodyExt;
   use axum::http::StatusCode;

   #[tokio::test]
   async fn hello_world() -> Result<(), sqlx::Error> {
        let app: Router = create_app().await?;

        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        Ok(())
    }
}
