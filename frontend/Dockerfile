FROM node:alpine AS build
WORKDIR /usr/src/frontend
RUN npm install -g typescript
COPY . .
RUN npm install
ARG VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /usr/src/frontend/dist /usr/share/nginx/html
COPY --from=build /usr/src/frontend/nginx.conf /etc/nginx/nginx.conf
