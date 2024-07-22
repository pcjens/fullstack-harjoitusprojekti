use core::str::FromStr;
use std::sync::Arc;

use arrayvec::ArrayString;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::{HeaderMap, HeaderValue};
use sqlx::AnyPool;

use crate::api_errors::ApiError;
use crate::array_string_types::UuidString;
use crate::data::user::Session;
use crate::services;

#[derive(Debug)]
pub struct SharedState {
    pub db_pool: AnyPool,
}

#[axum::async_trait]
impl FromRequestParts<Arc<SharedState>> for Session {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<SharedState>,
    ) -> Result<Self, Self::Rejection> {
        let headers = HeaderMap::from_request_parts(parts, state).await.unwrap();
        for auth in headers.get_all("authorization").into_iter().flat_map(HeaderValue::to_str) {
            // We're using "bearer tokens" even though this isn't an OAuth 2.0
            // setup, since the tokens we use (uuids) match the rfc at least
            // syntactically (hexadecimals and dashes are all b64tokens), and
            // there aren't any third parties who need to understand the token.
            let Some(session_id) = auth.strip_prefix("Bearer ") else {
                continue;
            };
            let Ok(session_id) = ArrayString::from_str(session_id) else {
                continue;
            };
            let session_id = UuidString(session_id);

            let session = {
                let mut conn =
                    state.db_pool.acquire().await.map_err(|_| ApiError::DbConnAcquire)?;
                services::user::get_session(&mut *conn, session_id).await.map_err(|err| {
                    tracing::error!("Fetching session failed: {err:?}");
                    ApiError::DbError
                })?
            };
            if let Some(session) = session {
                return Ok(session);
            } else {
                return Err(ApiError::InvalidSession);
            }
        }
        Err(ApiError::MissingSession)
    }
}
