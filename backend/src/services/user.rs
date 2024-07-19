use core::num::NonZeroU32;

use anyhow::Context;
use arrayvec::ArrayVec;
use data_encoding::BASE64;
use ring::pbkdf2::{self, PBKDF2_HMAC_SHA256};
use ring::rand::{SecureRandom, SystemRandom};
use sqlx::{Any, Executor};

use crate::array_string_types::UsernameString;
use crate::config;
use crate::data::user::User;

const USERNAME_LEN: usize = 30;
const SALT_BYTES_LEN: usize = 12;

pub async fn create_user<E>(
    conn: &mut E,
    username: UsernameString,
    password: &str,
) -> Result<(), anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let random = SystemRandom::new();

    let mut db_salt_bytes = [0u8; SALT_BYTES_LEN];
    random.fill(&mut db_salt_bytes).expect("system random should be able to generate random bytes");
    let mut salt: ArrayVec<u8, { USERNAME_LEN + SALT_BYTES_LEN }> = ArrayVec::new();
    salt.try_extend_from_slice(username.0.as_bytes()).unwrap();
    salt.try_extend_from_slice(&db_salt_bytes).unwrap();

    let mut password_key_bytes = [0u8; 32];
    let pbkdf2_iterations = config::pbkdf2_iterations();
    pbkdf2::derive(
        PBKDF2_HMAC_SHA256,
        pbkdf2_iterations,
        &salt,
        password.as_bytes(),
        &mut password_key_bytes,
    );

    let username: &str = username.0.as_str();
    let password_key_base64: String = BASE64.encode(&password_key_bytes);
    let db_salt_base64: String = BASE64.encode(&db_salt_bytes);
    sqlx::query("insert into users (username, password_key_base64, pbkdf2_iterations, salt_base64) values (?, ?, ?, ?)")
        .bind(username)
        .bind(password_key_base64)
        .bind(pbkdf2_iterations.get() as i32)
        .bind(db_salt_base64)
        .execute(conn)
        .await
        .context("user insert failed")?;

    Ok(())
}

pub async fn login<E>(
    conn: &mut E,
    username: UsernameString,
    password: &str,
) -> Result<Option<()>, anyhow::Error>
where
    for<'e> &'e mut E: Executor<'e, Database = Any>,
{
    let user: Option<User> = sqlx::query_as("select * from users where username = ?")
        .bind(username.0.as_str())
        .fetch_optional(conn)
        .await
        .context("user fetch on login failed")?;

    let Some(user) = user else {
        return Ok(None);
    };
    let Some(password_key_base64) = user.password_key_base64 else {
        return Ok(None);
    };

    let mut db_salt_bytes = [0u8; 12];
    BASE64.decode_mut(user.salt_base64.0.as_bytes(), &mut db_salt_bytes).unwrap();
    let mut salt: ArrayVec<u8, { USERNAME_LEN + SALT_BYTES_LEN }> = ArrayVec::new();
    salt.try_extend_from_slice(username.0.as_bytes()).unwrap();
    salt.try_extend_from_slice(&db_salt_bytes).unwrap();

    let mut password_key_bytes = [0u8; 32 + 1]; // one extra byte of space for the decoding process
    let len = BASE64.decode_mut(password_key_base64.0.as_bytes(), &mut password_key_bytes).unwrap();
    let password_key_bytes = &password_key_bytes[0..len];

    let password_verification = pbkdf2::verify(
        PBKDF2_HMAC_SHA256,
        NonZeroU32::new(user.pbkdf2_iterations as u32).unwrap(),
        &salt,
        password.as_bytes(),
        password_key_bytes,
    );
    if password_verification.is_err() {
        return Ok(None);
    }

    Ok(Some(()))
}
