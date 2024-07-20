use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::array_string_types::{UsernameString, UuidString};
use crate::data::user::Session;
use crate::routes::SharedState;
use crate::services;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new()
        .route("/login", post(login))
        .route("/register", post(register))
        .route("/me", get(me))
}

#[derive(serde::Deserialize)]
pub struct Credentials {
    pub username: UsernameString,
    pub password: String,
}

#[derive(serde::Deserialize)]
struct AuthRequest {
    #[serde(flatten)]
    creds: Credentials,
}
#[derive(serde::Serialize)]
struct AuthResponse {
    session_id: UuidString,
}
async fn login(
    State(state): State<Arc<SharedState>>,
    Json(req): Json<AuthRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let AuthRequest { creds: Credentials { username, password } } = req;
    tracing::trace!("Attempting to log in user {username}.");
    let session = {
        let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
        services::user::login(&mut *conn, username, &password).await.map_err(|err| {
            tracing::error!("Login failed: {err:?}");
            ApiError::DbError
        })?
    };
    if let Some(session) = session {
        tracing::debug!("session: {:?}", session);
        Ok(Json(AuthResponse { session_id: session.uuid }))
    } else {
        Err(ApiError::InvalidCredentials)
    }
}

#[derive(serde::Deserialize)]
struct RegisterRequest {
    #[serde(flatten)]
    creds: Credentials,
    password2: String,
}
async fn register(
    State(state): State<Arc<SharedState>>,
    Json(req): Json<RegisterRequest>,
) -> Result<StatusCode, ApiError> {
    let RegisterRequest { creds: Credentials { username, password }, password2 } = req;
    if username.0.len() < 3 {
        return Err(ApiError::UsernameTooShort);
    }
    if password.len() < 10 {
        return Err(ApiError::PasswordTooShort);
    }
    if password != password2 {
        return Err(ApiError::PasswordsDontMatch);
    }

    tracing::trace!("Registering a new user {username}.");
    {
        let mut conn = state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;

        let username_taken =
            services::user::is_username_taken(&mut *conn, username).await.map_err(|err| {
                tracing::error!("Username availability check failed: {err:?}");
                ApiError::DbError
            })?;
        if username_taken {
            return Err(ApiError::UsernameTaken);
        }

        services::user::create_user(&mut *conn, username, &password).await.map_err(|err| {
            tracing::error!("User creation failed: {err:?}");
            ApiError::DbError
        })?;
    }

    Ok(StatusCode::CREATED)
}

#[derive(serde::Serialize)]
struct MyInfo {
    youare: &'static str,
    session_id: UuidString,
}
async fn me(session: Session) -> Json<MyInfo> {
    Json(MyInfo { youare: "logged in!", session_id: session.uuid })
}
