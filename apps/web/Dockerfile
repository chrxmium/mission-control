FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY apps/web/package*.json ./apps/web/
COPY packages/rules ./packages/rules

WORKDIR /app/apps/web

RUN npm ci

COPY apps/web/ ./

RUN npm run build


FROM nginx:stable-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80