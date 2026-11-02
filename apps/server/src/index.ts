import "dotenv/config";

import { resolve } from "node:path";
import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { createSqliteDatabase } from "./db/index.js";
import { createPostgresDatabase } from "./db/postgres-client.js";
import { createSqliteRepositories } from "./repositories/sqlite/index.js";
import { createPostgresRepositories } from "./repositories/postgres/index.js";
import type { Repositories } from "./repositories/interfaces/index.js";

const provider = (process.env.DATABASE_PROVIDER ?? "sqlite").toLowerCase();

let repositories: Repositories;
let closeDatabase: (() => void | Promise<void>) | undefined;

if (provider === "sqlite") {
    const database = await createSqliteDatabase({
        databasePath: process.env.DATABASE_URL ?? "mission-control.db",
        migrationsFolder: resolve(process.cwd(), "drizzle"),
    });

    repositories = createSqliteRepositories(database.db);
    closeDatabase = () => { database.close(); };
} else if (provider === "postgres") {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString?.trim()) {
        throw new Error("DATABASE_URL is required when DATABASE_PROVIDER=postgres");
    }

    const database = await createPostgresDatabase({
        connectionString,
        migrationsFolder: resolve(process.cwd(), "drizzle-postgres"),
    });

    repositories = createPostgresRepositories(database.db);
    closeDatabase = () => { database.close(); };
} else {
    throw new Error(
        `Unsupported DATABASE_PROVIDER "${provider}". Use "sqlite" or "postgres".`,
    );
}

const app = createApp(repositories, {
    adminToken: process.env.ADMIN_TOKEN ?? "",
    refereePassword: process.env.REFEREE_PASSWORD ?? "",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
});

const server = serve({
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 3001),
});

async function shutdown() {
    server.close();
    await closeDatabase?.();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
