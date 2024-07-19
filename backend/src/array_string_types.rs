//! Newtypes wrapping ArrayString which implement various [sqlx] traits.

use core::fmt;
use core::str::FromStr;

use arrayvec::ArrayString;
use sqlx::encode::IsNull;
use sqlx::postgres::any::{AnyTypeInfo, AnyTypeInfoKind, AnyValueKind};
use sqlx::{Any, Decode, Encode, Type};

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
            fn decode(
                value: <Any as sqlx::database::HasValueRef<'r>>::ValueRef,
            ) -> Result<Self, sqlx::error::BoxDynError> {
                let s: &'r str = Decode::<'r, Any>::decode(value)?;
                Ok($array_string_type(ArrayString::from_str(s)?))
            }
        }

        impl<'r> Encode<'r, Any> for &'r $array_string_type {
            fn encode(
                self,
                buf: &mut <Any as sqlx::database::HasArguments<'r>>::ArgumentBuffer,
            ) -> sqlx::encode::IsNull {
                buf.0.push(AnyValueKind::Text(self.0.as_str().into()));
                IsNull::No
            }

            fn encode_by_ref(
                &self,
                buf: &mut <Any as sqlx::database::HasArguments<'r>>::ArgumentBuffer,
            ) -> sqlx::encode::IsNull {
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
                self.0.fmt(f)
            }
        }
    };
}

#[derive(Clone, Copy)]
pub struct UuidString(pub ArrayString<36>);
array_string_newtype_impls!(UuidString);

#[derive(Clone, Copy, serde::Deserialize)]
pub struct UsernameString(pub ArrayString<30>);
array_string_newtype_impls!(UsernameString);

#[derive(Clone, Copy)]
pub struct PasswordKeyString(pub ArrayString<44>); // base64 encoded length of a 32-byte key
array_string_newtype_impls!(PasswordKeyString);

#[derive(Clone, Copy)]
pub struct SaltString(pub ArrayString<16>); // base64 encoded length of a 12-byte key
array_string_newtype_impls!(SaltString);
