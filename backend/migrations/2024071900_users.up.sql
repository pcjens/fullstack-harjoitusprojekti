CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    password_key_base64 VARCHAR(44), -- The key is from SHA256, so 32 bytes, and base64 encoded => 44 characters.
    pbkdf2_iterations INTEGER NOT NULL,
    salt_base64 VARCHAR(16) NOT NULL -- 12 random bytes, base64 encoded => 16 characters.
);

CREATE UNIQUE INDEX IF NOT EXISTS username_index ON users ( username );
