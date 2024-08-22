use std::error::Error;

pub fn is_unique_constraint_violation(err: &(dyn Error + 'static)) -> bool {
    if let Some(sql_err) = err.downcast_ref::<Box<dyn sqlx::error::DatabaseError>>() {
        sql_err.is_unique_violation()
    } else {
        false
    }
}
