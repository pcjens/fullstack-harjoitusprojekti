use anyhow::Context;
use sqlx::{Any, Executor};

use crate::data::work::{BigFilePart, BigFilePartDecoded};

pub async fn get_file_part<E>(
    conn: &E,
    file_uuid: &str,
    user_id: Option<i32>,
) -> Result<Option<BigFilePartDecoded>, anyhow::Error>
where
    for<'e> &'e E: Executor<'e, Database = Any>,
{
    let query = sqlx::query_as(
        "SELECT big_file_parts.*, work_attachments.filename FROM big_file_parts \
            JOIN work_attachments ON (work_attachments.id = big_file_parts.work_attachment_id) \
            JOIN works ON (works.id = work_attachments.work_id) \
            JOIN works_in_categories ON (works_in_categories.work_id = works.id) \
            JOIN categories ON (categories.id = works_in_categories.category_id) \
            JOIN portfolios ON (portfolios.id = categories.portfolio_id) \
            JOIN portfolio_rights ON (portfolio_rights.portfolio_id = categories.portfolio_id) \
            JOIN work_rights ON (work_rights.work_id = works.id) \
        WHERE big_file_parts.uuid = ? \
            AND (work_rights.user_id = ? OR portfolio_rights.user_id = ? OR portfolios.published_at IS NOT NULL)",
    );
    let part: Option<BigFilePart> = query
        .bind(file_uuid)
        .bind(user_id)
        .bind(user_id)
        .fetch_optional(conn)
        .await
        .context("get big file part failed")?;

    if let Some(BigFilePart { uuid, next_uuid, whole_file_length, filename, bytes_base64 }) = part {
        let bytes = data_encoding::BASE64
            .decode(bytes_base64.0.as_bytes())
            .expect("bytes_base64 from db should be valid base64");
        Ok(Some(BigFilePartDecoded { uuid, next_uuid, whole_file_length, filename, bytes }))
    } else {
        Ok(None)
    }
}
