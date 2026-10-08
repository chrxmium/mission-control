FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY apps/server/package*.json ./apps/server/
COPY packages/rules ./packages/rules

WORKDIR /app/apps/server

RUN npm ci

COPY apps/server/ ./

RUN npm run build

ENV NODE_ENV=production
ENV DATABASE_URL=/data/mission-control.db

EXPOSE 3001

CMD ["npm", "run", "start"]