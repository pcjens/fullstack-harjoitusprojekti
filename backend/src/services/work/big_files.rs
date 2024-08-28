use anyhow::Context;
use sqlx::{Any, Executor};

use crate::array_string_types::UuidString;
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

pub async fn create_file_part<E>(
    conn: &mut E,
    previous_uuid: Option<UuidString>,
    work_attachment_id: i32,
    bytes_base64: String,
    user_id: i32,
) -> Result<UuidString, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let query = sqlx::query(
        "SELECT work_attachments.id FROM work_attachments \
            JOIN works ON (works.id = work_attachments.work_id) \
            JOIN work_rights ON (work_rights.work_id = works.id) \
        WHERE work_attachments.id = ? AND work_rights.user_id = ?",
    );
    query
        .bind(work_attachment_id)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await
        .context("user id + work attachment pair not found")?;

    // Insert the new part
    let new_uuid = UuidString::generate();
    let query = sqlx::query(
        "INSERT INTO big_file_parts (uuid, work_attachment_id, whole_file_length, bytes_base64) \
        VALUES (?, ?, 0, ?)
        RETURNING uuid",
    );
    query
        .bind(&new_uuid)
        .bind(work_attachment_id)
        .bind(&bytes_base64)
        .execute(&mut *conn)
        .await
        .context("failed to insert new big file part")?;

    let mut whole_file_length = data_encoding::BASE64
        .decode(bytes_base64.as_bytes())
        .context("The bytes_base64 string should be base64 encoded")?
        .len();

    if let Some(previous_uuid) = previous_uuid {
        // Update the previous part's next_uuid and add the length so far to the whole
        let query = sqlx::query_as(
            "UPDATE big_file_parts SET next_uuid = ? \
            WHERE work_attachment_id = ? AND uuid = ?
            RETURNING whole_file_length",
        );
        let (prev_whole_file_length,): (i32,) = query
            .bind(&new_uuid)
            .bind(work_attachment_id)
            .bind(&previous_uuid)
            .fetch_one(&mut *conn)
            .await
            .context("work attachment's previous big file part not found")?;
        whole_file_length += prev_whole_file_length as usize;
    } else {
        // This is the first part, clear out any existing parts (since this would mean the file is being replaced)
        sqlx::query("DELETE FROM big_file_parts WHERE work_attachment_id = ? AND uuid <> ?")
            .bind(work_attachment_id)
            .bind(&new_uuid)
            .execute(&mut *conn)
            .await
            .context("could not clear out previous big file parts for this work attachment")?;
    }

    // Update file lengths for all parts of this file
    let query = sqlx::query(
        "UPDATE big_file_parts SET whole_file_length = ? \
        WHERE work_attachment_id = ?",
    );
    query
        .bind(whole_file_length as i32)
        .bind(work_attachment_id)
        .execute(&mut *conn)
        .await
        .context("failed to update file lengths for file parts")?;

    Ok(new_uuid)
}
