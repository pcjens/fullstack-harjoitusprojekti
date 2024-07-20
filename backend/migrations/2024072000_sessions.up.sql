CREATE TABLE IF NOT EXISTS sessions (
    uuid VARCHAR(36) PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at BIGINT NOT NULL -- seconds since the unix epoch
);
