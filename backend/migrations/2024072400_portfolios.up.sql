CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY NOT NULL,
    created_at BIGINT NOT NULL, -- seconds since the unix epoch
    published_at BIGINT, -- seconds since the unix epoch
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    author TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_slug_index ON portfolios ( slug );

CREATE TABLE IF NOT EXISTS portfolio_rights (
    portfolio_id INTEGER NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (portfolio_id, user_id)
);
