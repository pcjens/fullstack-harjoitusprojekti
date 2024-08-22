use std::sync::Arc;

use axum::extract::{Path, State};
use axum::routing::{get, post, put};
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::data::user::Session;
use crate::data::work::Work;
use crate::routes::SharedState;
use crate::services;
use crate::util::is_unique_constraint_violation;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new()
        .route("/", get(all))
        .route("/:slug", get(by_slug))
        .route("/:slug", post(create))
        .route("/:slug", put(edit))
}

async fn all(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
) -> Result<Json<Vec<Work>>, ApiError> {
    let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
    let works = services::work::get_works(&mut *conn, user_id).await.map_err(|err| {
        tracing::error!("Getting all works for the logged in user failed: {err:?}");
        ApiError::DbError
    })?;
    Ok(Json(works))
}

async fn by_slug(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
) -> Result<Json<Work>, ApiError> {
    let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
    let work = services::work::get_work(&mut *conn, &slug, user_id)
        .await
        .map_err(|err| {
            tracing::error!("Getting work by slug failed: {err:?}");
            ApiError::DbError
        })?
        .ok_or(ApiError::NoSuchSlug)?;
    Ok(Json(work))
}

async fn create(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
    Json(arg): Json<Work>,
) -> Result<Json<Work>, ApiError> {
    let mut conn = state.db_pool.begin().await.map_err(|_| ApiError::DbTransactionBegin)?;

    let work =
        services::work::create_work(&mut *conn, &slug, user_id, arg).await.map_err(|err| {
            tracing::error!("Creating a new work failed: {err:?}");
            if is_unique_constraint_violation(err.root_cause()) {
                return ApiError::SlugTaken;
            }
            ApiError::DbError
        })?;

    conn.commit().await.map_err(|_| ApiError::DbTransactionCommit)?;

    Ok(Json(work))
}

async fn edit(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
    Json(arg): Json<Work>,
) -> Result<Json<Work>, ApiError> {
    let mut conn = state.db_pool.begin().await.map_err(|_| ApiError::DbTransactionBegin)?;

    let work =
        services::work::update_work(&mut *conn, &slug, user_id, arg).await.map_err(|err| {
            tracing::error!("Updating the {slug} work failed: {err:?}");
            if is_unique_constraint_violation(err.root_cause()) {
                return ApiError::SlugTaken;
            }
            ApiError::DbError
        })?;

    conn.commit().await.map_err(|_| ApiError::DbTransactionCommit)?;

    Ok(Json(work))
}
