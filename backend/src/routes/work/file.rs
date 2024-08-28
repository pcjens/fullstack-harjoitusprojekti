use core::convert::Infallible;
use core::time::Duration;
use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{Method, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use http_body::Frame;
use http_body_util::StreamBody;
use tokio_stream::wrappers::ReceiverStream;
use tracing::{Instrument, Span};

use crate::api_errors::ApiError;
use crate::array_string_types::UuidString;
use crate::data::user::Session;
use crate::request_state::SharedState;
use crate::services;

pub fn create_router() -> Router<Arc<SharedState>> {
    Router::new().route("/", post(add_file_part)).route("/:uuid", get(get_stream_by_uuid))
}

type Data = Result<Frame<Bytes>, Infallible>;
type ResponseBody = StreamBody<ReceiverStream<Data>>;

async fn get_stream_by_uuid(
    State(state): State<Arc<SharedState>>,
    session: Option<Session>,
    method: Method,
    Path(uuid): Path<String>,
) -> Result<Response<ResponseBody>, ApiError> {
    let user_id = session.map(|Session { user_id, .. }| user_id);
    let file_part = services::work::big_files::get_file_part(&state.db_pool, &uuid, user_id)
        .await
        .map_err(|err| {
            tracing::error!("Getting file by uuid failed: {err:?}");
            ApiError::DbError
        })?
        .ok_or(ApiError::NoSuchFile)?;

    let (sender, receiver) = tokio::sync::mpsc::channel::<Data>(1);
    let send_timeout = Duration::from_secs(10); // expose as a config?
    tracing::trace!("Sending the first file part: {}", file_part.uuid.0);
    sender.send_timeout(Ok(Frame::data(Bytes::from(file_part.bytes))), send_timeout).await.unwrap();

    let mut next_uuid = file_part.next_uuid;
    if next_uuid.is_some() && method == Method::GET {
        // Spawn a separate task that gets file parts from the db and sends them to the channel
        let logging_span = Span::current();
        tokio::spawn(
            async move {
                while let Some(uuid) = next_uuid {
                    let file_part =
                        services::work::big_files::get_file_part(&state.db_pool, &uuid.0, user_id);
                    // Unwrap, since returning an error mid-stream is hard. Shouldn't really happen anyway.
                    let file_part = file_part.await.unwrap().unwrap();
                    next_uuid = file_part.next_uuid;
                    let bytes = Bytes::from(file_part.bytes);

                    sender.send_timeout(Ok(Frame::data(bytes)), send_timeout).await.unwrap();
                }
            }
            .instrument(logging_span),
        );
        tracing::debug!("File stream started, the rest are sent as they're loaded from the db.");
    }

    let filename_ascii = file_part
        .filename
        .chars()
        .map(|c| if c.is_ascii_graphic() { c } else { '_' })
        .collect::<String>();
    let receiver = tokio_stream::wrappers::ReceiverStream::new(receiver);
    Ok(Response::builder()
        .header("Content-Disposition", format!("attachment; filename=\"{filename_ascii}\""))
        .body(StreamBody::new(receiver))
        .unwrap())
}

#[derive(serde::Deserialize)]
struct CreateFileParams {
    work_attachment_id: i32,
    previous_uuid: Option<UuidString>,
    part_bytes_base64: String,
}
#[derive(serde::Serialize)]
struct CreatedFilePart {
    uuid: UuidString,
}
async fn add_file_part(
    State(state): State<Arc<SharedState>>,
    Session { user_id, .. }: Session,
    Json(params): Json<CreateFileParams>,
) -> Result<Json<CreatedFilePart>, ApiError> {
    let mut conn = state.db_pool.begin().await.map_err(|_| ApiError::DbTransactionBegin)?;

    let uuid = services::work::big_files::create_file_part(
        &mut *conn,
        params.previous_uuid,
        params.work_attachment_id,
        params.part_bytes_base64,
        user_id,
    )
    .await
    .map_err(|err| {
        tracing::error!("Creating a new file part failed: {err:?}");
        ApiError::DbError
    })?;

    conn.commit().await.map_err(|_| ApiError::DbTransactionCommit)?;

    Ok(Json(CreatedFilePart { uuid }))
}
