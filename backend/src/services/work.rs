use anyhow::Context;
use sqlx::{Any, Executor, QueryBuilder};

use crate::data::work::{Work, WorkAttachment, WorkLink, WorkRow, WorkTag};

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

    let work = update_work_details(
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
    tracing::debug!("updating work with: {new_version:#?}");
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

    let work = update_work_details(
        &mut *conn,
        row,
        &new_version.attachments,
        &new_version.links,
        &new_version.tags,
    )
    .await
    .context("updating work details failed")?;
    tracing::debug!("updated work: {work:#?}");

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
    user_id: i32,
) -> Result<Option<Work>, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let row: Option<WorkRow> = sqlx::query_as(
        "SELECT * FROM works JOIN work_rights ON (id = work_id) \
        WHERE user_id = ? AND slug = ?",
    )
    .bind(user_id)
    .bind(work_slug)
    .fetch_optional(conn)
    .await
    .context("get work failed")?;
    if let Some(row) = row {
        let work = fetch_work_details(conn, row).await?;
        Ok(Some(work))
    } else {
        Ok(None)
    }
}

async fn fetch_work_details<E>(conn: &E, row: WorkRow) -> Result<Work, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let attachments = sqlx::query_as("SELECT * FROM work_attachments WHERE work_id = ?")
        .bind(row.id)
        .fetch_all(conn)
        .await
        .context("get work attachments failed")?;
    let links = sqlx::query_as("SELECT * FROM work_links WHERE work_id = ?")
        .bind(row.id)
        .fetch_all(conn)
        .await
        .context("get work links failed")?;
    let tags = sqlx::query_as("SELECT * FROM work_tags WHERE work_id = ?")
        .bind(row.id)
        .fetch_all(conn)
        .await
        .context("get work tags failed")?;
    Ok(Work { row, attachments, links, tags })
}

async fn update_work_details<E>(
    conn: &mut E,
    row: WorkRow,
    new_attachments: &[WorkAttachment],
    new_links: &[WorkLink],
    new_tags: &[WorkTag],
) -> Result<Work, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    sqlx::query("DELETE FROM work_attachments WHERE work_id = ?")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete work attachments before insert failed")?;
    let attachments: Vec<WorkAttachment> = if !new_attachments.is_empty() {
        let mut query = QueryBuilder::new(
            "INSERT INTO work_attachments (work_id, attachment_kind, content_type, filename, title, bytes_base64) ",
        );
        query.push_values(new_attachments, |mut query, inserted_values| {
            query
                .push_bind(row.id)
                .push_bind(&inserted_values.attachment_kind)
                .push_bind(&inserted_values.content_type)
                .push_bind(&inserted_values.filename)
                .push_bind(&inserted_values.title)
                .push_bind(&inserted_values.bytes_base64);
        });
        query.push(" RETURNING *");
        query
            .build_query_as()
            .fetch_all(&mut *conn)
            .await
            .context("insert into work attachments failed")?
    } else {
        vec![]
    };

    sqlx::query("DELETE FROM work_links WHERE work_id = ?")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete work links before insert failed")?;
    let links: Vec<WorkLink> = if !new_links.is_empty() {
        let mut query = QueryBuilder::new("INSERT INTO work_links (work_id, title, href) ");
        query.push_values(new_links, |mut query, inserted_values| {
            query
                .push_bind(row.id)
                .push_bind(&inserted_values.title)
                .push_bind(&inserted_values.href);
        });
        query.push(" RETURNING *");
        query
            .build_query_as()
            .fetch_all(&mut *conn)
            .await
            .context("insert into work links failed")?
    } else {
        vec![]
    };

    sqlx::query("DELETE FROM work_tags WHERE work_id = ?")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete work tags before insert failed")?;
    let tags: Vec<WorkTag> = if !new_tags.is_empty() {
        let mut query = QueryBuilder::new("INSERT INTO work_tags (work_id, tag) ");
        query.push_values(new_tags, |mut query, inserted_values| {
            query.push_bind(row.id).push_bind(&inserted_values.tag);
        });
        query.push(" RETURNING *");
        query
            .build_query_as()
            .fetch_all(&mut *conn)
            .await
            .context("insert into work tags failed")?
    } else {
        vec![]
    };

    Ok(Work { row, attachments, links, tags })
}
