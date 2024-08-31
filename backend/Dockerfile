# Build the image using the rust:alpine image for the musl toolchain
FROM rust:alpine AS build
WORKDIR /usr/src/backend
COPY . .
RUN apk add build-base
RUN cargo build --release

# Copy over the binary and run. Since it's built on the musl toolchain (which
# statically links everything), the binary doesn't depend on anything
# distro-specific, so we can use "scratch" as the base image.
FROM scratch
COPY --from=build /usr/src/backend/target/release/backend /backend
ENTRYPOINT ["/backend"]
