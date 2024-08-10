use anyhow::Context;
use sqlx::{Any, Executor};

use crate::data::work::{Work,  WorkRow};

/// Gets all of the works the given user has access to.
///
/// NOTE: Sqlx doesn't support one-to-many relations very well, so we need many
/// queries. Sqlx also doesn't allow many concurrent queries on one executor, so
/// the queries need to be done serially. This is a slow function!
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
        works.push(Work {
            id: row.id,
            slug: row.slug,
            title: row.title,
            short_description: row.short_description,
            long_description: row.long_description,
            attachments,
            links,
            tags,
        });
    }

    Ok(works)
}
