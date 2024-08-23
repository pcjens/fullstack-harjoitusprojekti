use std::sync::Arc;

use axum::extract::{Path, State};
use axum::routing::{get, post, put};
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::data::portfolio::{Portfolio, PortfolioRow};
use crate::data::user::Session;
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
) -> Result<Json<Vec<PortfolioRow>>, ApiError> {
    let portfolios =
        services::portfolio::get_portfolios(&state.db_pool, user_id).await.map_err(|err| {
            tracing::error!("Getting all portfolios for the logged in user failed: {err:?}");
            ApiError::DbError
        })?;
    Ok(Json(portfolios))
}

async fn by_slug(
    State(state): State<Arc<SharedState>>,
    session: Option<Session>,
    Path(slug): Path<String>,
) -> Result<Json<Portfolio>, ApiError> {
    let portfolio = services::portfolio::get_portfolio(
        &state.db_pool,
        &slug,
        session.map(|Session { user_id, .. }| user_id),
    )
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
    pub publish: bool,
    pub portfolio: Portfolio,
}
async fn create(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
    Json(args): Json<CreatePortfolioArgs>,
) -> Result<Json<Portfolio>, ApiError> {
    let mut conn = state.db_pool.begin().await.map_err(|_| ApiError::DbTransactionBegin)?;

    let portfolio = services::portfolio::create_portfolio(
        &mut *conn,
        &slug,
        user_id,
        args.portfolio,
        args.publish,
    )
    .await
    .map_err(|err| {
        tracing::error!("Creating a new portfolio failed: {err:?}");
        if is_unique_constraint_violation(err.root_cause()) {
            return ApiError::SlugTaken;
        }
        ApiError::DbError
    })?;

    conn.commit().await.map_err(|_| ApiError::DbTransactionCommit)?;

    Ok(Json(portfolio))
}

#[derive(serde::Deserialize)]
struct EditPortfolioArgs {
    pub publish: bool,
    pub portfolio: Portfolio,
}
async fn edit(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Path(slug): Path<String>,
    Json(args): Json<EditPortfolioArgs>,
) -> Result<Json<Portfolio>, ApiError> {
    let mut conn = state.db_pool.begin().await.map_err(|_| ApiError::DbTransactionBegin)?;

    let portfolio = services::portfolio::update_portfolio(
        &mut *conn,
        &slug,
        user_id,
        args.portfolio,
        args.publish,
    )
    .await
    .map_err(|err| {
        tracing::error!("Updating the {slug} portfolio failed: {err:?}");
        if is_unique_constraint_violation(err.root_cause()) {
            return ApiError::SlugTaken;
        }
        ApiError::DbError
    })?;

    conn.commit().await.map_err(|_| ApiError::DbTransactionCommit)?;

    Ok(Json(portfolio))
}
