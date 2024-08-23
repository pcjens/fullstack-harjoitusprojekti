use crate::array_string_types::{PasswordKeyString, SaltString, UsernameString, UuidString};

#[derive(Debug, sqlx::FromRow)]
pub struct User {
    pub id: i32,
    #[allow(dead_code)]
    pub username: UsernameString,
    #[sqlx(default)]
    pub password_key_base64: Option<PasswordKeyString>,
    pub pbkdf2_iterations: i32,
    pub salt_base64: SaltString,
}

#[derive(Debug, sqlx::FromRow)]
pub struct Session {
    pub uuid: UuidString,
    pub user_id: i32,
    /// The creation time of this session, in seconds since the unix epoch.
    pub created_at: i64,
}
