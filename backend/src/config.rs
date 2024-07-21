use core::num::NonZeroU32;
use std::env;

pub fn database_url() -> String {
    env::var("DATABASE_URL").expect("The DATABASE_URL environment variable should be defined")
}

pub fn http_base_path() -> String {
    env::var("HTTP_BASE_PATH").unwrap_or_else(|_| "/".into())
}

pub fn http_bind_address() -> String {
    env::var("HTTP_BIND_ADDRESS").unwrap_or_else(|_| "127.0.0.1:3000".into())
}

pub fn pbkdf2_iterations() -> NonZeroU32 {
    /// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
    const DEFAULT: u32 = 600_000;
    env::var("PBKDF2_ITERATIONS")
        .map(|n| {
            n.parse::<NonZeroU32>().expect("PBKDF2_ITERATIONS must be an integer greater than zero")
        })
        .unwrap_or_else(|_| NonZeroU32::new(DEFAULT).unwrap())
}

pub fn session_expiration_seconds() -> u64 {
    const DEFAULT: u64 = 60 * 60 * 24 * 30; // 30 days
    env::var("SESSION_EXPIRATION_SECONDS")
        .map(|n| {
            n.parse::<u64>().expect("SESSION_EXPIRATION_SECONDS must be a non-negative integer")
        })
        .unwrap_or(DEFAULT)
}
