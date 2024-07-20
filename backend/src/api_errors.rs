//! All errors returned by the API should one the enums in this module, so that
//! clients can easily translate every possible error message.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;

#[derive(serde::Serialize)]
struct ErrorResponse {
    error: ApiError,
}

#[derive(serde::Serialize)]
pub enum ApiError {
    // Internal server errors, which do not necessarily require translations
    #[allow(dead_code)]
    Todo(&'static str),
    DbConnAcquire,
    DbError,

    // User-facing errors which require translations client-side
    UsernameTooShort,
    PasswordTooShort,
    PasswordsDontMatch,
    InvalidCredentials,
    UsernameTaken,
    /// No or malformed session token.
    MissingSession,
    /// Very probably an expired session token, or just a spoofed one.
    InvalidSession,
    // NOTE: When changing these (not recommended) or adding new ones, remember
    // to update the localization strings on the frontend as well!
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = match self {
            ApiError::Todo(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::DbConnAcquire => StatusCode::SERVICE_UNAVAILABLE,
            ApiError::DbError => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::UsernameTooShort
            | ApiError::PasswordTooShort
            | ApiError::PasswordsDontMatch
            | ApiError::InvalidCredentials
            | ApiError::UsernameTaken => StatusCode::BAD_REQUEST,
            ApiError::MissingSession | ApiError::InvalidSession => StatusCode::FORBIDDEN,
        };
        (status, Json(ErrorResponse { error: self })).into_response()
    }
}
