FROM rust:alpine

RUN apk add cargo-watch build-base

WORKDIR /usr/src/backend
ENTRYPOINT ["cargo", "watch", "--", "cargo", "run", "--target", "x86_64-unknown-linux-musl"]
