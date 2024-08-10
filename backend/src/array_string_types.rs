//! Newtypes wrapping ArrayString which implement various [sqlx] traits.

use core::fmt;
use core::str::FromStr;

use arrayvec::ArrayString;
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::postgres::any::{AnyTypeInfo, AnyTypeInfoKind, AnyValueKind};
use sqlx::{Any, Database, Decode, Encode, Type};
use uuid::Uuid;

/// Implements [Display], [Debug], [sqlx::Type], [sqlx::Encode], and [sqlx::Decode] for the given type,
/// assuming it's `ArrayStringType(ArrayString<N>)` shaped.
macro_rules! array_string_newtype_impls {
    ($array_string_type:ident) => {
        impl Type<Any> for $array_string_type {
            fn type_info() -> AnyTypeInfo {
                AnyTypeInfo { kind: AnyTypeInfoKind::Text }
            }
        }

        impl<'r> Decode<'r, Any> for $array_string_type {
            fn decode(value: <Any as Database>::ValueRef<'r>) -> Result<Self, BoxDynError> {
                let s: &'r str = Decode::<'r, Any>::decode(value)?;
                Ok($array_string_type(ArrayString::from_str(s)?))
            }
        }

        impl<'r> Encode<'r, Any> for &'r $array_string_type {
            fn encode(
                self,
                buf: &mut <Any as Database>::ArgumentBuffer<'r>,
            ) -> Result<IsNull, BoxDynError> {
                buf.0.push(AnyValueKind::Text(self.0.as_str().into()));
                Ok(IsNull::No)
            }

            fn encode_by_ref(
                &self,
                buf: &mut <Any as Database>::ArgumentBuffer<'r>,
            ) -> Result<IsNull, BoxDynError> {
                let s: &&'r str = &self.0.as_str();
                Encode::<'r, Any>::encode(s, buf)
            }
        }

        impl fmt::Debug for $array_string_type {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                write!(f, "{:?}", self.0)
            }
        }

        impl fmt::Display for $array_string_type {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                write!(f, "{}", self.0)
            }
        }
    };
}

#[derive(Clone, Copy, serde::Serialize, serde::Deserialize)]
pub struct UuidString(pub ArrayString<36>);
array_string_newtype_impls!(UuidString);
impl From<Uuid> for UuidString {
    fn from(uuid: Uuid) -> Self {
        use core::fmt::Write;
        let mut str = ArrayString::new();
        write!(&mut str, "{}", uuid.hyphenated()).unwrap();
        UuidString(str)
    }
}
impl UuidString {
    pub fn generate() -> UuidString {
        UuidString::from(Uuid::new_v4())
    }
}

#[derive(Clone, Copy, serde::Deserialize)]
pub struct UsernameString(pub ArrayString<30>);
array_string_newtype_impls!(UsernameString);

#[derive(Clone, Copy)]
pub struct PasswordKeyString(pub ArrayString<44>); // base64 encoded length of a 32-byte key
array_string_newtype_impls!(PasswordKeyString);

#[derive(Clone, Copy)]
pub struct SaltString(pub ArrayString<16>); // base64 encoded length of a 12-byte key
array_string_newtype_impls!(SaltString);

#[derive(Clone, Copy, serde::Serialize)]
pub struct AttachmentKind(pub ArrayString<16>);
array_string_newtype_impls!(AttachmentKind);

#[derive(Clone, Copy, serde::Serialize)]
pub struct ContentType(pub ArrayString<64>);
array_string_newtype_impls!(ContentType);
