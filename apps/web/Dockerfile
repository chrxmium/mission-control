FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/rules/package.json ./packages/rules/

RUN npm ci --workspace=@mission-control/web --workspace=@mission-control/rules --include-workspace-root

COPY apps/web/ ./apps/web/
COPY packages/rules/ ./packages/rules/
COPY tsconfig.json ./

RUN npm run build --workspace=@mission-control/rules \
    && npm run build --workspace=@mission-control/web

FROM nginx:stable-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
