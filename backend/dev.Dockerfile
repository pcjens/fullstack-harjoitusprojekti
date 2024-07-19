FROM rust:alpine

RUN apk add build-base

WORKDIR /usr/src/backend
ENTRYPOINT ["cargo", "run", "--target", "x86_64-unknown-linux-musl"]
