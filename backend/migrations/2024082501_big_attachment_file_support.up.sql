CREATE TABLE IF NOT EXISTS big_file_parts (
    uuid VARCHAR(36) PRIMARY KEY NOT NULL,
    next_uuid VARCHAR(36) REFERENCES big_file_parts ( uuid ) ON DELETE SET NULL ON UPDATE CASCADE,
    work_attachment_id INTEGER NOT NULL REFERENCES work_attachments ( id ) ON DELETE CASCADE ON UPDATE CASCADE,
    whole_file_length INTEGER NOT NULL,
    bytes_base64 TEXT NOT NULL
);
