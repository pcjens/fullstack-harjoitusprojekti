use std::env;
use std::sync::Arc;

use axum::Router;
use sqlx::AnyPool;
use tokio::net::TcpListener;
use tokio::signal;
use tower_http::compression::CompressionLayer;
use tower_http::decompression::DecompressionLayer;
use tower_http::trace::TraceLayer;

use crate::routes::SharedState;

mod routes;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    tracing::debug!("Starting up.");

    let base_path = env::var("HTTP_BASE_PATH");
    let base_path = base_path.as_deref().unwrap_or("/");
    let router = if base_path.is_empty() || base_path == "/" {
        routes::create_router()
    } else {
        Router::new().nest(base_path, routes::create_router())
    };
    tracing::debug!("Routes created.");

    let conn_str =
        env::var("DATABASE_URL").expect("The DATABASE_URL environment variable should be defined");
    sqlx::any::install_default_drivers();
    let db_pool = AnyPool::connect(&conn_str).await.expect("DATABASE_URL should be connectable");
    tracing::info!("Connected to the database.");

    let shared_state = Arc::new(SharedState { db_pool });

    let app = router
        .with_state(shared_state)
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(DecompressionLayer::new());
    tracing::debug!("Axum app configured.");

    let addr = env::var("HTTP_BIND_ADDRESS");
    let addr = addr.as_deref().unwrap_or("127.0.0.1:3000");
    let listener = TcpListener::bind(addr).await.unwrap();
    tracing::info!("Now serving the HTTP API at: http://{addr}{base_path}");

    axum::serve(listener, app).with_graceful_shutdown(shutdown_signal()).await.unwrap();

    tracing::info!("Bye!");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("Shutdown signal caught, stopping gracefully.");
}
