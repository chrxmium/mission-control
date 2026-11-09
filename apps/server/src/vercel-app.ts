import { Hono } from "hono";

import { createApp, type AppType } from "./app.js";
import { createPostgresDatabase } from "./db/postgres-client.js";
import { createPostgresRepositories } from "./repositories/postgres/index.js";

let appPromise: Promise<AppType> | undefined;

function getRuntimeApp(): Promise<AppType> {
    if (!appPromise) {
        appPromise = (async () => {
            const provider = (process.env.DATABASE_PROVIDER ?? "postgres").toLowerCase();

            if (provider !== "postgres") {
                throw new Error("Vercel deployment requires DATABASE_PROVIDER=postgres");
            }

            const connectionString =
                process.env.POSTGRES_DATABASE_URL ?? process.env.DATABASE_URL;

            if (!connectionString?.trim()) {
                throw new Error("POSTGRES_DATABASE_URL is required");
            }

            const database = await createPostgresDatabase({
                connectionString,
                runMigrations: false,
                maxConnections: 1,
            });

            const repositories = createPostgresRepositories(database.db);

            return createApp(repositories, {
                adminToken: process.env.ADMIN_TOKEN ?? "",
                refereePassword: process.env.REFEREE_PASSWORD ?? "",
                corsOrigin: process.env.CORS_ORIGIN ?? "*",
            });
        })().catch((error) => {
            appPromise = undefined;
            throw error;
        });
    }

    return appPromise;
}

const app = new Hono();

app.all("*", async (c) => {
    try {
        const runtimeApp = await getRuntimeApp();
        return runtimeApp.fetch(c.req.raw);
    } catch (error) {
        console.error("Vercel application initialisation failed:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

export default app;
