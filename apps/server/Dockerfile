FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/rules/package.json ./packages/rules/

RUN npm ci

COPY apps/server/ ./apps/server/
COPY packages/rules/ ./packages/rules/
COPY tsconfig.json ./

RUN npm run build --workspace=@mission-control/rules \
    && npm run build --workspace=@mission-control/server

WORKDIR /app/apps/server

ENV NODE_ENV=production
ENV DATABASE_URL=/data/mission-control.db

EXPOSE 3001

CMD ["npm", "run", "start"]
