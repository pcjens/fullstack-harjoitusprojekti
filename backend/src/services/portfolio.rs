use std::time::SystemTime;

use anyhow::Context;
use sqlx::{Any, Executor};

use crate::data::portfolios::Portfolio;

pub async fn create_portfolio<E>(
    conn: &mut E,
    slug: &str,
    title: &str,
    subtitle: &str,
    author: &str,
) -> Result<(), anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let created_at =
        SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as i64;
    let query = sqlx::query(
        "insert into portfolios (created_at, slug, title, subtitle, author) values (?, ?, ?, ?, ?)",
    );
    let result = query
        .bind(created_at)
        .bind(slug)
        .bind(title)
        .bind(subtitle)
        .bind(author)
        .execute(conn)
        .await
        .context("portfolio insert failed")?;
    assert_eq!(1, result.rows_affected());

    Ok(())
}

pub async fn get_portfolios<E>(conn: &mut E, user_id: i32) -> Result<Vec<Portfolio>, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    sqlx::query_as("select * from portfolios join portfolio_rights on (id = portfolio_id) where user_id = ?")
        .bind(user_id)
        .fetch_all(conn)
        .await
        .context("get all portfolios failed")
}

pub async fn get_portfolio<E>(
    conn: &mut E,
    slug: &str,
    user_id: i32,
) -> Result<Option<Portfolio>, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    sqlx::query_as("select * from portfolios join portfolio_rights where slug = ? and user_id = ?")
        .bind(slug)
        .bind(user_id)
        .fetch_optional(conn)
        .await
        .context("get all portfolios failed")
}
