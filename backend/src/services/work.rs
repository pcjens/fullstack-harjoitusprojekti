use anyhow::Context;
use sqlx::{Any, Executor};

use crate::data::work::{Work, WorkRow};

pub mod big_files;
mod subtables;

pub async fn create_work<E>(
    conn: &mut E,
    slug: &str,
    user_id: i32,
    new_work: Work,
) -> Result<Work, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let query = sqlx::query_as(
        "INSERT INTO works (slug, title, short_description, long_description) VALUES (?, ?, ?, ?) RETURNING *",
    );
    let row: WorkRow = query
        .bind(slug)
        .bind(&new_work.row.title)
        .bind(&new_work.row.short_description)
        .bind(&new_work.row.long_description)
        .fetch_one(&mut *conn)
        .await
        .context("work insert failed")?;

    sqlx::query("INSERT INTO work_rights (user_id, work_id) VALUES (?, ?)")
        .bind(user_id)
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("work-user rights insert failed")?;

    let work = subtables::update_work_details(
        &mut *conn,
        row,
        &new_work.attachments,
        &new_work.links,
        &new_work.tags,
    )
    .await
    .context("inserting details for the new work failed")?;

    Ok(work)
}

pub async fn update_work<E>(
    conn: &mut E,
    original_slug: &str,
    user_id: i32,
    new_version: Work,
) -> Result<Work, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let query = sqlx::query_as(
        "UPDATE works SET slug = ?, title = ?, short_description = ?, long_description = ? \
        WHERE slug = ? AND id IN ( select work_id from work_rights where user_id = ? ) \
        RETURNING *",
    );
    let row: WorkRow = query
        .bind(&new_version.row.slug)
        .bind(&new_version.row.title)
        .bind(&new_version.row.short_description)
        .bind(&new_version.row.long_description)
        .bind(original_slug)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await
        .context("work update failed")?;

    let work = subtables::update_work_details(
        &mut *conn,
        row,
        &new_version.attachments,
        &new_version.links,
        &new_version.tags,
    )
    .await
    .context("updating work details failed")?;

    Ok(work)
}

pub async fn get_works<E>(conn: &E, user_id: i32) -> Result<Vec<WorkRow>, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let works: Vec<WorkRow> =
        sqlx::query_as("SELECT * FROM works JOIN work_rights ON (id = work_id) WHERE user_id = ?")
            .bind(user_id)
            .fetch_all(conn)
            .await
            .context("get all works failed")?;

    Ok(works)
}

pub async fn get_work<E>(
    conn: &E,
    work_slug: &str,
    user_id: Option<i32>,
) -> Result<Option<Work>, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let query = sqlx::query_as(
        "SELECT works.* FROM works \
        JOIN work_rights ON (works.id = work_rights.work_id) \
        LEFT JOIN works_in_categories ON (works_in_categories.work_id = works.id) \
        LEFT JOIN categories ON (categories.id = works_in_categories.category_id) \
        LEFT JOIN portfolios ON (portfolios.id = categories.portfolio_id) \
        LEFT JOIN portfolio_rights ON (portfolio_rights.portfolio_id = categories.portfolio_id) \
        WHERE works.slug = ? AND (work_rights.user_id = ? OR portfolio_rights.user_id = ? OR portfolios.published_at IS NOT NULL)",
    );
    let row: Option<WorkRow> = query
        .bind(work_slug)
        .bind(user_id)
        .bind(user_id)
        .fetch_optional(conn)
        .await
        .context("get work failed")?;
    if let Some(row) = row {
        let work = subtables::fetch_work_details(conn, row).await?;
        Ok(Some(work))
    } else {
        Ok(None)
    }
}
