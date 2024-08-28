use anyhow::Context;
use sqlx::{Any, Executor, QueryBuilder};

use crate::data::work::{Work, WorkAttachment, WorkLink, WorkRow, WorkTag};

pub async fn fetch_work_details<E>(conn: &E, row: WorkRow) -> Result<Work, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let query = sqlx::query_as(
        "SELECT id, work_id, attachment_kind, content_type, filename, title, bytes_base64, big_file_uuid FROM work_attachments \
        WHERE work_id = ?",
    );
    let attachments =
        query.bind(row.id).fetch_all(conn).await.context("get work attachments failed")?;

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
    // Add in new attachments...
    let attachments: Vec<WorkAttachment> = if !new_attachments.is_empty() {
        let mut query = QueryBuilder::new(
            "INSERT INTO work_attachments (work_id, attachment_kind, content_type, filename, title, bytes_base64, big_file_uuid) ",
        );
        query.push_values(new_attachments, |mut query, inserted_values| {
            query
                .push_bind(row.id)
                .push_bind(&inserted_values.attachment_kind)
                .push_bind(&inserted_values.content_type)
                .push_bind(&inserted_values.filename)
                .push_bind(&inserted_values.title)
                .push_bind(&inserted_values.bytes_base64)
                .push_bind(inserted_values.big_file_uuid.as_ref());
        });
        query.push(
            " RETURNING id, work_id, attachment_kind, content_type, filename, title, bytes_base64, big_file_uuid",
        );
        query
            .build_query_as()
            .fetch_all(&mut *conn)
            .await
            .context("insert into work attachments failed")?
    } else {
        vec![]
    };

    // ...update any relevant big_file_parts to point to the new attachments...
    for inserted_attachment in &attachments {
        if let Some(uuid) = inserted_attachment.big_file_uuid.as_ref() {
            let query = sqlx::query(
                "UPDATE big_file_parts SET work_attachment_id = ? \
                WHERE work_attachment_id = (SELECT work_attachment_id FROM big_file_parts WHERE uuid = ?)"
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
    let new_ids = attachments.iter().map(|a| a.id).collect::<Vec<i32>>();
    let mut query = QueryBuilder::new("DELETE FROM work_attachments WHERE work_id = ");
    query.push_bind(row.id);
    query.push(" AND id NOT IN ");
    query.push_tuples(new_ids, |mut query, id| {
        query.push_bind(id);
    });
    query.build().execute(&mut *conn).await.context("delete old work attachments failed")?;

    // Delete the old links, add in new ones
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

    // Delete the old tags, add in new ones
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
