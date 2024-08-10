use std::time::SystemTime;

use anyhow::Context;
use sqlx::{Any, Executor};

use crate::data::portfolio::Portfolio;

pub async fn create_portfolio<E>(
    conn: &mut E,
    slug: &str,
    title: &str,
    subtitle: &str,
    author: &str,
    publish: bool,
    user_id: i32,
) -> Result<Portfolio, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let current_time =
        SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as i64;
    let query = sqlx::query_as(
        "INSERT INTO portfolios (created_at, published_at, slug, title, subtitle, author) VALUES (?, ?, ?, ?, ?, ?) \
        RETURNING *",
    );
    let portfolio: Portfolio = query
        .bind(current_time)
        .bind(if publish { Some(current_time) } else { None })
        .bind(slug)
        .bind(title)
        .bind(subtitle)
        .bind(author)
        .fetch_one(&mut *conn)
        .await
        .context("portfolios insert failed")?;

    let query = sqlx::query("INSERT INTO portfolio_rights (portfolio_id, user_id) VALUES (?, ?)");
    let result = query
        .bind(portfolio.id)
        .bind(user_id)
        .execute(conn)
        .await
        .context("portfolio_rights insert failed")?;
    assert_eq!(1, result.rows_affected());

    Ok(portfolio)
}

#[allow(clippy::too_many_arguments)]
pub async fn update_portfolio<E>(
    conn: &mut E,
    original_slug: &str,
    new_slug: &str,
    title: &str,
    subtitle: &str,
    author: &str,
    publish: bool,
    user_id: i32,
) -> Result<Portfolio, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let current_time =
        SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as i64;
    let query = sqlx::query_as(
        "UPDATE portfolios SET published_at = ?, slug = ?, title = ?, subtitle = ?, author = ? \
        WHERE slug = ? AND id IN ( select portfolio_id from portfolio_rights where user_id = ? ) \
        RETURNING *",
    );
    let portfolio: Portfolio = query
        .bind(if publish { Some(current_time) } else { None })
        .bind(new_slug)
        .bind(title)
        .bind(subtitle)
        .bind(author)
        .bind(original_slug)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await
        .context("portfolios update failed")?;

    Ok(portfolio)
}

pub async fn get_portfolios<E>(conn: &mut E, user_id: i32) -> Result<Vec<Portfolio>, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    sqlx::query_as(
        "SELECT * FROM portfolios JOIN portfolio_rights ON (id = portfolio_id) WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_all(conn)
    .await
    .context("get all portfolios failed")
}

pub async fn get_portfolio<E>(
    conn: &mut E,
    slug: &str,
    user_id: Option<i32>,
) -> Result<Option<Portfolio>, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    sqlx::query_as("SELECT * FROM portfolios JOIN portfolio_rights ON (id = portfolio_id) WHERE slug = ? and (user_id = ? or published_at is not null)")
        .bind(slug)
        .bind(user_id)
        .fetch_optional(conn)
        .await
        .context("get all portfolios failed")
}
