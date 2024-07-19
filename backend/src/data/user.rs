use arrayvec::ArrayString;

pub struct User {}

pub type UsernameString = ArrayString<30>;
pub type PasswordString = ArrayString<100>;

#[derive(serde::Deserialize)]
pub struct Credentials {
    pub username: UsernameString,
    pub password: PasswordString,
}
