use std::sync::Arc;

use axum::extract::Path;
use axum::routing::get;
use axum::Router;

use crate::data::user::Session;
use crate::routes::SharedState;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new().route("/", get(all)).route("/:slug", get(by_slug))
}

async fn all(Session { user_id, .. }: Session) -> &'static str {
    todo!("fetch portfolios for {user_id}")
}

async fn by_slug(Path(slug): Path<String>) -> &'static str {
    todo!("fetch portfolio {slug}")
}
