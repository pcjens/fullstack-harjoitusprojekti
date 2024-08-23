use core::fmt;

use crate::array_string_types::{AttachmentKind, ContentType, SlugString};

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct WorkRow {
    #[serde(default)]
    pub id: i32,
    pub slug: SlugString,
    pub title: String,
    pub short_description: String,
    pub long_description: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Work {
    #[serde(flatten)]
    pub row: WorkRow,
    pub attachments: Vec<WorkAttachment>,
    pub links: Vec<WorkLink>,
    pub tags: Vec<WorkTag>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct WorkAttachment {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    pub work_id: i32,
    pub attachment_kind: AttachmentKind,
    pub content_type: ContentType,
    pub filename: String,
    pub title: Option<String>,
    pub bytes_base64: BytesBase64,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct WorkLink {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    pub work_id: i32,
    pub title: String,
    pub href: String,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct WorkTag {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    pub work_id: i32,
    pub tag: String,
}

#[derive(sqlx::Type, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
#[sqlx(transparent)]
pub struct BytesBase64(pub String);

impl fmt::Debug for BytesBase64 {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let len = self.0.len() / 4 * 3;
        f.debug_tuple("BytesBase64").field(&format_args!("{} base64-encoded bytes", len)).finish()
    }
}
