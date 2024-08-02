use std::sync::Arc;

use arrayvec::ArrayString;
use axum::extract::{Path, State};
use axum::routing::{get, post, put};
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::data::portfolios::Portfolio;
use crate::data::user::Session;
use crate::routes::SharedState;
use crate::services;

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

#[derive(serde::Deserialize)]
struct CreatePortfolioArgs {
    pub title: ArrayString<100>,
    pub subtitle: ArrayString<500>,
    pub author: ArrayString<100>,
}
async fn create(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
    Json(args): Json<CreatePortfolioArgs>,
) -> Result<Json<Portfolio>, ApiError> {
    let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
    let portfolio = services::portfolio::create_portfolio(
        &mut *conn,
        &slug,
        &args.title,
        &args.subtitle,
        &args.author,
        user_id,
    )
    .await
    .map_err(|err| {
        // TODO: Add a special case for handling unique slug errors
        tracing::error!("Creating a new portfolio failed: {err:?}");
        ApiError::DbError
    })?;

    Ok(Json(portfolio))
}

#[derive(serde::Deserialize)]
struct EditPortfolioArgs {
    pub slug: ArrayString<100>,
    pub title: ArrayString<100>,
    pub subtitle: ArrayString<500>,
    pub author: ArrayString<100>,
}
async fn edit(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
    Json(args): Json<EditPortfolioArgs>,
) -> Result<Json<Portfolio>, ApiError> {
    let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
    let portfolio = services::portfolio::update_portfolio(
        &mut *conn,
        &slug,
        &args.slug,
        &args.title,
        &args.subtitle,
        &args.author,
        user_id,
    )
    .await
    .map_err(|err| {
        // TODO: Add a special case for handling unique slug errors
        // TODO: Add a special case for handling missing rights to portfolio (i.e. no portfolio found to update)
        tracing::error!("Updating the {slug} portfolio failed: {err:?}");
        ApiError::DbError
    })?;

    Ok(Json(portfolio))
}
