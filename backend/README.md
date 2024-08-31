# Backend

This is the backend component of the fullstack project described in the main
[README](../README.md). This part is written in Rust, and uses the
[Axum](https://docs.rs/axum) crate as a HTTP server framework and
[sqlx](https://docs.rs/sqlx) crate for accessing PostgreSQL and SQLite.

## Command line arguments

This program does not recognize any command line arguments, runtime
configuration is done via environment variables.

## Environment variables

These are all loaded in [src/config.rs](src/config.rs).

The server program will read the following environment variables when ran:
- DATABASE_URL: The database connection string used to connect to an SQL
  database. See the following documentation pages for examples on what this
  value should look like:
  [PostgreSQL](https://docs.rs/sqlx/latest/sqlx/postgres/struct.PgConnectOptions.html),
  [SQLite](https://docs.rs/sqlx/latest/sqlx/sqlite/struct.SqliteConnectOptions.html).
  The string is standardized enough that e.g. fly.io's managed postgres database
  set up the DATABASE_URL properly without any manual tweaking from me.
- HTTP_BASE_PATH: A prefix to all paths served by this server. For example, if
  this was set to `/api`, the endpoint `/work` would be available under
  `/api/work` instead.
- HTTP_BIND_ADDRESS: The ip and port where the HTTP server will be bound,
  generally of the form `<ip>:<port>`.
- PBKDF2_ITERATIONS: How many pbkdf2 iterations should be used to mix up the
  password hashes. By default this is 600k, as suggested by the [owasp
  cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2).
  This affects how long it takes to compute the hash of the password for
  checking logins, and in turn, how long it would take for an attacker who has
  the database to crack the passwords.
- SESSION_EXPIRATION_SECONDS: How many seconds a single login lasts. By default
  this is 30 days. The actual session length will vary by around a minute, as
  sessions are only cleaned once every minute.

## Code overview

[migrations/](migrations/) contains the SQL migration scripts that get
automatically run when the server boots up. The [sqlx
cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) tool can be used
to manually run or revert the migrations. Note that some reverse-migrations
lose data, so revert with care.

[src/main.rs](src/main.rs) contains the entrypoint of the program. It creates
the HTTP routers, connects to the database, runs migrations, starts up the
session cleanup loop, creates the HTTP server's TCP socket, and starts listening
to it. It also sets up signal handling for SIGTERM and a cross-platform "Ctrl+C"
handler for clean shutdowns.

[src/config.rs](src/config.rs) contains wrapper functions for parsing the
environment variables described above. The default values are also defined here.

[src/api_errors.rs](src/api_errors.rs) contains the API-user-facing errors
returned by most endpoints.

[src/array_string_types.rs](src/array_string_types.rs) contains some specific
lightweight string types with restricted lengths meant for specific use cases,
like uuids, slugs, usernames, and so on. They could be regular strings, but this
way they're lighter and they enforce maximum lengths.

[src/request_state.rs](src/request_state.rs) defines the type which is passed to
requests as global state. It just contains the database connection pool. This
file also contains the
[extractor](https://docs.rs/axum/0.7.5/axum/extract/index.html#intro) trait
implementation for `Session`s, so that they are easily accessible in the actual
route handlers.

[src/routes/](src/routes/) contains route handlers for the HTTP endpoints this
server provides. The module name matches the endpoint it serves, i.e.
[src/routes/work.rs](src/routes/work.rs) serves `/work/*`,
[src/routes/portfolio.rs](src/routes/portfolio.rs) serves `/portfolio/*`, and
[src/routes/work/file.rs](src/routes/work/file.rs) serves `/work/file/*`. Each
module in this directory defines a `create_router` function, which are nested to
form the final router.

[src/services/](src/services/) contains functions that query the SQL database to
fetch, update, and remove data as requested by other parts of the program (mainly
route handlers). This directory is organized to mimic
[src/routes/](src/routes/), so that e.g. the database access functions called by
[src/routes/portfolio.rs](src/routes/portfolio.rs) are in
[src/services/portfolio.rs](src/services/portfolio.rs).

[src/data/](src/data/) contains data types used by similarly named modules under
[src/routes/](src/routes/) and [src/services/](src/services/). These mostly
match what's found in the database, but in some cases contain data from multiple
tables. This is abstracted away by the services, so that route handlers can
always deal in these types.
