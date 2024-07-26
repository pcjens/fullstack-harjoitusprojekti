use std::sync::Arc;

use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::data::portfolios::Portfolio;
use crate::data::user::Session;
use crate::routes::SharedState;
use crate::services;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new().route("/", get(all)).route("/:slug", get(by_slug))
}

async fn all(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
) -> Result<Json<Vec<Portfolio>>, ApiError> {
    let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
    let portfolios =
        services::portfolio::get_portfolios(&mut *conn, user_id).await.map_err(|err| {
            tracing::error!("Getting all portfolios for the logged in user failed: {err:?}");
            ApiError::DbError
        })?;
    Ok(Json(portfolios))
}

async fn by_slug(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
) -> Result<Json<Portfolio>, ApiError> {
    let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
    let portfolio = services::portfolio::get_portfolio(&mut *conn, &slug, user_id)
        .await
        .map_err(|err| {
            tracing::error!("Getting portfolio by slug failed: {err:?}");
            ApiError::DbError
        })?
        .ok_or(ApiError::NoSuchSlug)?;
    Ok(Json(portfolio))
}
