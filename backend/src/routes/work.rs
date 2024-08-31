use std::sync::Arc;

use axum::extract::{Path, State};
use axum::routing::{get, post, put};
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::data::user::Session;
use crate::data::work::{Work, WorkRow};
use crate::routes::SharedState;
use crate::services;

mod file;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new()
        .route("/", get(all))
        .route("/:slug", get(by_slug))
        .route("/:slug", post(create))
        .route("/:slug", put(edit))
        .nest("/file", file::create_router())
}

async fn all(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
) -> Result<Json<Vec<WorkRow>>, ApiError> {
    let works = services::work::get_works(&state.db_pool, user_id).await.map_err(|err| {
        tracing::error!("Getting all works for the logged in user failed: {err:?}");
        ApiError::DbError
    })?;
    Ok(Json(works))
}

async fn by_slug(
    State(state): State<Arc<SharedState>>,
    session: Option<Session>,
    Path(slug): Path<String>,
) -> Result<Json<Work>, ApiError> {
    let work = services::work::get_work(
        &state.db_pool,
        &slug,
        session.map(|Session { user_id, .. }| user_id),
    )
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
            if services::is_unique_constraint_violation(err.root_cause()) {
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
            if services::is_unique_constraint_violation(err.root_cause()) {
                return ApiError::SlugTaken;
            }
            ApiError::DbError
        })?;

    conn.commit().await.map_err(|_| ApiError::DbTransactionCommit)?;

    Ok(Json(work))
}
