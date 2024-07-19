use crate::array_string_types::{PasswordKeyString, SaltString, UsernameString};

#[derive(Debug, sqlx::FromRow)]
pub struct User {
    pub id: i32,
    pub username: UsernameString,
    #[sqlx(default)]
    pub password_key_base64: Option<PasswordKeyString>,
    pub pbkdf2_iterations: i32,
    pub salt_base64: SaltString,
}
