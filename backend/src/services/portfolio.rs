use std::time::SystemTime;

use anyhow::Context;
use sqlx::{Any, Executor, QueryBuilder};

use crate::array_string_types::SlugString;
use crate::data::portfolio::{Portfolio, PortfolioCategory, PortfolioCategoryRow, PortfolioRow};

pub async fn create_portfolio<E>(
    conn: &mut E,
    slug: &str,
    user_id: i32,
    new_pf: Portfolio,
    publish: bool,
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
    let row: PortfolioRow = query
        .bind(current_time)
        .bind(if publish { Some(current_time) } else { None })
        .bind(slug)
        .bind(new_pf.row.title)
        .bind(new_pf.row.subtitle)
        .bind(new_pf.row.author)
        .fetch_one(&mut *conn)
        .await
        .context("portfolios insert failed")?;

    let query = sqlx::query("INSERT INTO portfolio_rights (portfolio_id, user_id) VALUES (?, ?)");
    let result = query
        .bind(row.id)
        .bind(user_id)
        .execute(&mut *conn)
        .await
        .context("portfolio_rights insert failed")?;
    assert_eq!(1, result.rows_affected());

    let portfolio = update_portfolio_details(&mut *conn, row, &new_pf.categories).await?;

    Ok(portfolio)
}

#[allow(clippy::too_many_arguments)]
pub async fn update_portfolio<E>(
    conn: &mut E,
    original_slug: &str,
    user_id: i32,
    updated_pf: Portfolio,
    publish: bool,
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
    let row: PortfolioRow = query
        .bind(if publish { Some(current_time) } else { None })
        .bind(&updated_pf.row.slug)
        .bind(updated_pf.row.title)
        .bind(updated_pf.row.subtitle)
        .bind(updated_pf.row.author)
        .bind(original_slug)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await
        .context("portfolios update failed")?;

    let portfolio = update_portfolio_details(&mut *conn, row, &updated_pf.categories).await?;

    Ok(portfolio)
}

pub async fn get_portfolios<E>(conn: &E, user_id: i32) -> Result<Vec<PortfolioRow>, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
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
    conn: &E,
    slug: &str,
    user_id: Option<i32>,
) -> Result<Option<Portfolio>, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let query = sqlx::query_as(
        "SELECT * FROM portfolios \
        JOIN portfolio_rights ON (id = portfolio_id) \
        WHERE slug = ? and (user_id = ? or published_at is not null)",
    );
    let row: Option<PortfolioRow> = query
        .bind(slug)
        .bind(user_id)
        .fetch_optional(conn)
        .await
        .context("get all portfolios failed")?;

    if let Some(row) = row {
        let portfolio = fetch_portfolio_details(conn, row).await?;
        Ok(Some(portfolio))
    } else {
        Ok(None)
    }
}

async fn fetch_portfolio_details<E>(conn: &E, row: PortfolioRow) -> Result<Portfolio, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let categories: Vec<PortfolioCategoryRow> =
        sqlx::query_as("SELECT * FROM categories WHERE portfolio_id = ?")
            .bind(row.id)
            .fetch_all(conn)
            .await
            .context("get categories to fill out portfolio details failed")?;

    let query = sqlx::query_as(
        "SELECT categories.id, works.slug FROM works \
        JOIN works_in_categories ON (works.id = works_in_categories.work_id) \
        JOIN categories ON (works_in_categories.category_id = categories.id) \
        WHERE categories.portfolio_id = ?",
    );
    let all_work_slugs: Vec<(i32, SlugString)> = query
        .bind(row.id)
        .fetch_all(conn)
        .await
        .context("get relevant works' slugs to fill out portfolio details failed")?;

    let categories: Vec<PortfolioCategory> = categories
        .into_iter()
        .map(|row| {
            let filter = |&(category_id, work_slug): &(i32, SlugString)| {
                if category_id == row.id {
                    Some(work_slug)
                } else {
                    None
                }
            };
            let work_slugs: Vec<SlugString> = all_work_slugs.iter().filter_map(filter).collect();
            PortfolioCategory { row, work_slugs }
        })
        .collect();

    Ok(Portfolio { row, categories })
}

async fn update_portfolio_details<E>(
    conn: &mut E,
    row: PortfolioRow,
    input_categories: &[PortfolioCategory],
) -> Result<Portfolio, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    sqlx::query("DELETE FROM categories WHERE portfolio_id = ?")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete portfolio categories before insert failed")?;

    // Insert the categories themselves
    let category_rows: Vec<PortfolioCategoryRow> = if !input_categories.is_empty() {
        let mut query = QueryBuilder::new("INSERT INTO categories (portfolio_id, title) ");
        query.push_values(input_categories, |mut query, inserted_values| {
            query.push_bind(row.id).push_bind(&inserted_values.row.title);
        });
        query.push(" RETURNING *");
        query
            .build_query_as()
            .fetch_all(&mut *conn)
            .await
            .context("insert into categories failed")?
    } else {
        vec![]
    };

    // Collect all the slugs referenced by the client and get their respective ids
    let all_slugs: Vec<&SlugString> =
        input_categories.iter().flat_map(|c| c.work_slugs.iter()).collect();
    let mut query = QueryBuilder::new("SELECT slug, id FROM works WHERE (slug) in ");
    query.push_tuples(&all_slugs, |mut query, slug| {
        query.push_bind(slug);
    });
    let slug_id_pairs: Vec<(SlugString, i32)> = query
        .build_query_as()
        .fetch_all(&mut *conn)
        .await
        .context("select slug+id pairs from works while updating works_in_categories failed")?;

    assert!(all_slugs
        .iter()
        .all(|slug| slug_id_pairs.iter().map(|(slug, _)| slug).any(|slug_| slug == &slug_)));
    // TODO: return a more user-facing error? or maybe not, this shouldn't be possible to cause with the frontend

    // Collect up the (category_id, work_id) pairs to insert, matching categories by title and then translating the slugs into work ids
    let mut category_work_pairs: Vec<(i32, i32)> = Vec::with_capacity(slug_id_pairs.len());
    for category in &category_rows {
        let input_category =
            input_categories.iter().find(|input| input.row.title == category.title).unwrap();
        for input_slug in &input_category.work_slugs {
            let &(_, work_id) = slug_id_pairs.iter().find(|(slug, _)| input_slug == slug).unwrap();
            category_work_pairs.push((category.id, work_id));
        }
    }

    // Insert the category work pairs
    let category_work_pairs: Vec<(i32, i32)> = if !category_work_pairs.is_empty() {
        let mut query =
            QueryBuilder::new("INSERT INTO works_in_categories (category_id, work_id) ");
        query.push_values(category_work_pairs, |mut query, (category_id, work_id)| {
            query.push_bind(category_id).push_bind(work_id);
        });
        query.push(" RETURNING category_id, work_id");
        query
            .build_query_as()
            .fetch_all(&mut *conn)
            .await
            .context("insert into works_in_categories failed")?
    } else {
        vec![]
    };

    // Finally, reconstruct the category array based on values we've gotten back from the db via `returning` clauses
    let categories: Vec<PortfolioCategory> = category_rows
        .into_iter()
        .map(|row| {
            let mut work_slugs = vec![];
            for &(category_id, work_id) in &category_work_pairs {
                if category_id != row.id {
                    continue;
                }
                let &(slug, _) = slug_id_pairs.iter().find(|&&(_, id)| work_id == id).unwrap();
                work_slugs.push(slug);
            }
            PortfolioCategory { row, work_slugs }
        })
        .collect();

    Ok(Portfolio { row, categories })
}
