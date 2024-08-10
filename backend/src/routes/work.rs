use std::sync::Arc;

use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::data::user::Session;
use crate::data::work::Work;
use crate::routes::SharedState;
use crate::services;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new().route("/", get(all))
}

async fn all(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
) -> Result<Json<Vec<Work>>, ApiError> {
    let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
    let portfolios = services::work::get_works(&mut *conn, user_id).await.map_err(|err| {
        tracing::error!("Getting all works for the logged in user failed: {err:?}");
        ApiError::DbError
    })?;
    Ok(Json(portfolios))
}
