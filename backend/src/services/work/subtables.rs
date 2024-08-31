use anyhow::Context;
use sqlx::{Any, Executor};

use crate::data::work::{Work, WorkAttachment, WorkLink, WorkRow, WorkTag};

pub async fn fetch_work_details<E>(conn: &E, row: WorkRow) -> Result<Work, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let query = sqlx::query_as(
        "SELECT id, work_id, attachment_kind, content_type, filename, title, bytes_base64, big_file_uuid FROM work_attachments \
        WHERE work_id = $1",
    );
    let attachments =
        query.bind(row.id).fetch_all(conn).await.context("get work attachments failed")?;

    let links = sqlx::query_as("SELECT * FROM work_links WHERE work_id = $1")
        .bind(row.id)
        .fetch_all(conn)
        .await
        .context("get work links failed")?;

    let tags =
        sqlx::query_as("SELECT * FROM work_tags WHERE work_id = $1 ORDER BY order_number ASC")
            .bind(row.id)
            .fetch_all(conn)
            .await
            .context("get work tags failed")?;

    Ok(Work { row, attachments, links, tags })
}

pub async fn update_work_details<E>(
    conn: &mut E,
    row: WorkRow,
    new_attachments: &[WorkAttachment],
    new_links: &[WorkLink],
    new_tags: &[WorkTag],
) -> Result<Work, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    // First, get the old attachments (to delete later)...
    let old_attachments: Vec<(i32,)> =
        sqlx::query_as("SELECT id FROM work_attachments WHERE work_id = $1")
            .bind(row.id)
            .fetch_all(&mut *conn)
            .await
            .context("get old work attachments failed")?;

    // ...add in new attachments...
    let mut attachments: Vec<WorkAttachment> = Vec::with_capacity(new_attachments.len());
    for input in new_attachments {
        let query = sqlx::query_as(
            "INSERT INTO work_attachments (work_id, attachment_kind, content_type, filename, title, bytes_base64, big_file_uuid) \
            VALUES ($1, $2, $3, $4, $5, $6, $7) \
            RETURNING id, work_id, attachment_kind, content_type, filename, title, bytes_base64, big_file_uuid",
        );
        let new_attachment = query
            .bind(row.id)
            .bind(&input.attachment_kind)
            .bind(&input.content_type)
            .bind(&input.filename)
            .bind(&input.title)
            .bind(&input.bytes_base64)
            .bind(input.big_file_uuid.as_ref())
            .fetch_one(&mut *conn)
            .await
            .context("insert into work attachments failed")?;
        attachments.push(new_attachment);
    }

    // ...update any relevant big_file_parts to point to the new attachments...
    for inserted_attachment in &attachments {
        if let Some(uuid) = inserted_attachment.big_file_uuid.as_ref() {
            let query = sqlx::query(
                "UPDATE big_file_parts SET work_attachment_id = $1 \
                WHERE work_attachment_id = (SELECT work_attachment_id FROM big_file_parts WHERE uuid = $2)"
            );
            query
                .bind(inserted_attachment.id)
                .bind(uuid)
                .execute(&mut *conn)
                .await
                .context("failed to update big file parts with new work attachment ids")?;
        }
    }

    // ...and finally, delete the old attachments.
    for (old_id,) in old_attachments {
        sqlx::query("DELETE FROM work_attachments WHERE id = $1")
            .bind(old_id)
            .execute(&mut *conn)
            .await
            .context("delete old work attachments failed")?;
    }

    // Delete the old links, add in new ones
    sqlx::query("DELETE FROM work_links WHERE work_id = $1")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete work links before insert failed")?;
    let mut links: Vec<WorkLink> = Vec::with_capacity(new_links.len());
    for input in new_links {
        let query = sqlx::query_as(
            "INSERT INTO work_links (work_id, title, href) \
            VALUES ($1, $2, $3) RETURNING *",
        );
        let new_link = query
            .bind(row.id)
            .bind(&input.title)
            .bind(&input.href)
            .fetch_one(&mut *conn)
            .await
            .context("insert into work links failed")?;
        links.push(new_link);
    }

    // Delete the old tags, add in new ones
    sqlx::query("DELETE FROM work_tags WHERE work_id = $1")
        .bind(row.id)
        .execute(&mut *conn)
        .await
        .context("delete work tags before insert failed")?;
    let mut tags: Vec<WorkTag> = Vec::with_capacity(new_tags.len());
    for (i, input) in new_tags.iter().enumerate() {
        let query = sqlx::query_as(
            "INSERT INTO work_tags (work_id, tag, order_number) \
            VALUES ($1, $2, $3) RETURNING *",
        );
        let new_tag = query
            .bind(row.id)
            .bind(&input.tag)
            .bind(i as i32)
            .fetch_one(&mut *conn)
            .await
            .context("insert into work tags failed")?;
        tags.push(new_tag);
    }

    Ok(Work { row, attachments, links, tags })
}
