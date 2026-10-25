FROM node:22-bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/rules/package.json ./packages/rules/

RUN npm ci --workspace=@mission-control/server --workspace=@mission-control/web --workspace=@mission-control/rules --include-workspace-root

COPY apps/web/ ./apps/web/
COPY apps/server/src/ ./apps/server/src/
COPY packages/rules/ ./packages/rules/
COPY tsconfig.json ./

RUN npm run build --workspace=@mission-control/rules \
    && npm run build --workspace=@mission-control/web

FROM nginx:stable-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
