use crate::array_string_types::{AttachmentKind, ContentType};

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct WorkRow {
    #[serde(default)]
    pub id: i32,
    pub slug: String,
    pub title: String,
    pub short_description: String,
    pub long_description: String,
}

#[derive(Debug, serde::Serialize)]
pub struct Work {
    #[serde(default)]
    pub id: i32,
    pub slug: String,
    pub title: String,
    pub short_description: String,
    pub long_description: String,
    pub attachments: Vec<WorkAttachment>,
    pub links: Vec<WorkLink>,
    pub tags: Vec<WorkTag>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct WorkAttachment {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    pub work_id: i32,
    pub attachment_kind: AttachmentKind,
    pub content_type: ContentType,
    pub filename: String,
    pub title: Option<String>,
    pub bytes_base64: String,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct WorkLink {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    pub work_id: i32,
    pub title: String,
    pub href: String,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct WorkTag {
    #[serde(default)]
    pub id: i32,
    #[serde(default)]
    pub work_id: i32,
    pub tag: String,
}
