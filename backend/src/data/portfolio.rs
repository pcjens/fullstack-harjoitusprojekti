use crate::array_string_types::SlugString;

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct PortfolioRow {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    /// The creation time of this portfolio, in seconds since the unix epoch.
    pub created_at: i64,
    #[serde(default)]
    /// The publication time of this portfolio, in seconds since the unix epoch.
    pub published_at: Option<i64>,
    pub slug: SlugString,
    pub title: String,
    pub subtitle: String,
    pub author: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Portfolio {
    #[serde(flatten)]
    pub row: PortfolioRow,
    pub categories: Vec<PortfolioCategory>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct PortfolioCategoryRow {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    pub portfolio_id: i32,
    pub title: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct PortfolioCategory {
    #[serde(flatten)]
    pub row: PortfolioCategoryRow,
    pub work_slugs: Vec<SlugString>,
}
