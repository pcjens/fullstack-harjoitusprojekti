use core::fmt;

use crate::array_string_types::{ContentType, SlugString, UuidString};

#[derive(Debug, sqlx::Type, serde::Serialize, serde::Deserialize)]
#[repr(i32)] // for integer representation in the db, serde will still convert to/from string
pub enum AttachmentKind {
    DownloadWindows = 1,
    DownloadLinux = 2,
    DownloadMac = 3,
    CoverImage = 4,
    Trailer = 5,
    Screenshot = 6,
}

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
    pub big_file_uuid: Option<UuidString>,
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

#[derive(Debug, sqlx::FromRow)]
pub struct BigFilePart {
    pub uuid: UuidString,
    pub next_uuid: Option<UuidString>,
    pub whole_file_length: i32,
    pub filename: String,
    pub bytes_base64: BytesBase64,
}

pub struct BigFilePartDecoded {
    pub uuid: UuidString,
    pub next_uuid: Option<UuidString>,
    pub whole_file_length: i32,
    pub filename: String,
    pub bytes: Vec<u8>,
}

#[derive(sqlx::Type, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
#[sqlx(transparent)]
pub struct BytesBase64(pub String);

impl fmt::Debug for BytesBase64 {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_tuple("BytesBase64")
            .field(&format_args!("{} characters encoded", self.0.len()))
            .finish()
    }
}
