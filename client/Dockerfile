# syntax=docker/dockerfile:1
# CodeLoop frontend image. Targets:
#   dev  - Vite dev server with hot reload (docker-compose.yml)
#   prod - static build served by unprivileged Nginx (default)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

FROM deps AS build
COPY . .
# VITE_* values are compiled into the bundle; they are not secrets.
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME=codeLoop
ARG VITE_DEFAULT_AVATAR=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_DEFAULT_AVATAR=$VITE_DEFAULT_AVATAR
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS prod
# Where /api requests are proxied (the API service on the compose network).
ENV API_UPSTREAM=http://api:5000
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/proxy_params.inc /etc/nginx/conf.d/proxy_params.inc
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/nginx-health || exit 1
