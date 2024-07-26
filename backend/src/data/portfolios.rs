#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct Portfolio {
    pub id: i32,
    /// The creation time of this portfolio, in seconds since the unix epoch.
    pub created_at: i64,
    /// The publication time of this portfolio, in seconds since the unix epoch.
    pub published_at: Option<i64>,
    pub slug: String,
    pub title: String,
    pub subtitle: String,
    pub author: String,
}
