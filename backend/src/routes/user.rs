use std::sync::Arc;

use axum::response::Redirect;
use axum::routing::post;
use axum::{Json, Router};

use crate::api_errors::ApiError;
use crate::data::user::{Credentials, PasswordString};
use crate::routes::SharedState;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new().route("/login", post(login)).route("/register", post(register))
}

#[derive(serde::Deserialize)]
struct AuthRequest {
    #[serde(flatten)]
    creds: Credentials,
}

async fn login(Json(req): Json<AuthRequest>) -> Result<Redirect, ApiError> {
    let AuthRequest { creds: Credentials { username, password } } = req;
    tracing::debug!("LOGIN ATTEMPTED with username '{username}' and password '{password}'");
    Err(ApiError::Todo("implement login"))
}

#[derive(serde::Deserialize)]
struct RegisterRequest {
    #[serde(flatten)]
    creds: Credentials,
    password2: PasswordString,
}

async fn register(Json(req): Json<RegisterRequest>) -> Result<Redirect, ApiError> {
    let RegisterRequest { creds: Credentials { username, password }, password2 } = req;
    if username.len() < 3 {
        return Err(ApiError::UsernameTooShort);
    }
    if password.len() < 10 {
        return Err(ApiError::PasswordTooShort);
    }
    if password != password2 {
        return Err(ApiError::PasswordsDontMatch);
    }
    tracing::debug!("REGISTER ATTEMPTED with username '{username}' and password '{password}'");
    Err(ApiError::Todo("implement registering"))
}
