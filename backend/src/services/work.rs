//! Functions for working with the Works in the database.a
//!
//! NOTE: Sqlx doesn't support one-to-many relations very well, so we need many
//! queries per operation. Sqlx also doesn't allow many concurrent queries on
//! one executor, so the queries need to be done serially. Result: works are
//! slow to create/update/get! Much manual effort or an ORM would fix this.

use anyhow::Context;
use sqlx::{Any, Executor};

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
        .bind(&new_work.title)
        .bind(&new_work.short_description)
        .bind(&new_work.long_description)
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
        .bind(&new_version.slug)
        .bind(&new_version.title)
        .bind(&new_version.short_description)
        .bind(&new_version.long_description)
        .bind(original_slug)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await
        .context("work update failed")?;

    let work =
        update_work_details(&mut *conn, row, &new_version.attachments, &new_version.links, &new_version.tags)
            .await
            .context("updating work details failed")?;
    tracing::debug!("updated work: {work:#?}");

    Ok(work)
}

pub async fn get_works<E>(conn: &mut E, user_id: i32) -> Result<Vec<Work>, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let work_rows: Vec<WorkRow> =
        sqlx::query_as("SELECT * FROM works JOIN work_rights ON (id = work_id) WHERE user_id = ?")
            .bind(user_id)
            .fetch_all(&mut *conn)
            .await
            .context("get all works failed")?;

    let mut works: Vec<Work> = Vec::with_capacity(work_rows.len());
    for row in work_rows {
        works.push(fetch_work_details(&mut *conn, row).await?);
    }

    Ok(works)
}

pub async fn get_work<E>(
    conn: &mut E,
    work_slug: &str,
    user_id: i32,
) -> Result<Option<Work>, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let row: Option<WorkRow> = sqlx::query_as(
        "SELECT * FROM works JOIN work_rights ON (id = work_id) \
        WHERE user_id = ? AND slug = ?",
    )
    .bind(user_id)
    .bind(work_slug)
    .fetch_optional(&mut *conn)
    .await
    .context("get work failed")?;
    if let Some(row) = row {
        let work = fetch_work_details(conn, row).await?;
        Ok(Some(work))
    } else {
        Ok(None)
    }
}

async fn fetch_work_details<E>(conn: &mut E, row: WorkRow) -> Result<Work, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let attachments = sqlx::query_as("SELECT * FROM work_attachments WHERE work_id = ?")
        .bind(row.id)
        .fetch_all(&mut *conn)
        .await
        .context("get work attachments failed")?;
    let links = sqlx::query_as("SELECT * FROM work_links WHERE work_id = ?")
        .bind(row.id)
        .fetch_all(&mut *conn)
        .await
        .context("get work links failed")?;
    let tags = sqlx::query_as("SELECT * FROM work_tags WHERE work_id = ?")
        .bind(row.id)
        .fetch_all(&mut *conn)
        .await
        .context("get work tags failed")?;
    Ok(Work {
        id: row.id,
        slug: row.slug,
        title: row.title,
        short_description: row.short_description,
        long_description: row.long_description,
        attachments,
        links,
        tags,
    })
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
    let mut attachments = Vec::with_capacity(new_attachments.len());
    for attachment in new_attachments {
        let query = sqlx::query_as(
            "INSERT INTO work_attachments (work_id, attachment_kind, content_type, filename, title, bytes_base64) \
            VALUES (?, ?, ?, ? ,?, ?) RETURNING *",
        );
        let attachment = query
            .bind(row.id)
            .bind(&attachment.attachment_kind)
            .bind(&attachment.content_type)
            .bind(&attachment.filename)
            .bind(&attachment.title)
            .bind(&attachment.bytes_base64)
            .fetch_one(&mut *conn)
            .await
            .context("insert into work attachments failed")?;
        attachments.push(attachment);
    }

    sqlx::query("DELETE FROM work_links WHERE work_id = ?")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete work links before insert failed")?;
    let mut links = Vec::with_capacity(new_links.len());
    for link in new_links {
        let query = sqlx::query_as(
            "INSERT INTO work_links (work_id, title, href) VALUES (?, ?, ?) RETURNING *",
        );
        let link = query
            .bind(row.id)
            .bind(&link.title)
            .bind(&link.href)
            .fetch_one(&mut *conn)
            .await
            .context("insert into links attachments failed")?;
        links.push(link);
    }

    sqlx::query("DELETE FROM work_tags WHERE work_id = ?")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete work tags before insert failed")?;
    let mut tags = Vec::with_capacity(new_tags.len());
    for tag in new_tags {
        let query =
            sqlx::query_as("INSERT INTO work_tags (work_id, tag) VALUES (?, ?) RETURNING *");
        let tag = query
            .bind(row.id)
            .bind(&tag.tag)
            .fetch_one(&mut *conn)
            .await
            .context("insert into work tags failed")?;
        tags.push(tag);
    }

    Ok(Work {
        id: row.id,
        slug: row.slug,
        title: row.title,
        short_description: row.short_description,
        long_description: row.long_description,
        attachments,
        links,
        tags,
    })
}
