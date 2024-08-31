# Frontend

This is the frontend component of the fullstack project described in the main
[README](../README.md). It's a Vite/React application, using react-bootstrap for
layout and styles, and i18next for internationalization.

The code organization follows the same principles as taught on the course, which
is why there's no elaborate code overview here like with the backend.

## Build-time environment variables

- VITE_API_BASE_URL: The URL of the backend API, where the API endpoints like
  `/work` will be appended after.
- VITE_API_SLOW_RESPONSE_THRESHOLD_MILLIS: For requests against the backend,
  requests that take this long will be assumed to be "slow" and for it to be
  appropriate to show some text explaining that something's wrong.
- VITE_API_CACHE_IDENTICAL_REQUESTS_FOR_MILLIS: For requests against the
  backend, this is the minimum interval between two identical requests where the
  request will actually be sent, instead of using the previous one as a cached
  response.
