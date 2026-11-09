import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import { resolve } from "node:path";

import * as schema from "./schema.postgres.js";

neonConfig.webSocketConstructor = ws;

export interface PostgresDatabaseOptions {
    connectionString: string;
    migrationsFolder?: string;
    runMigrations?: boolean;
    maxConnections?: number;
}

export async function createPostgresDatabase(options: PostgresDatabaseOptions) {
    if (!options.connectionString.trim()) {
        throw new Error("POSTGRES_DATABASE_URL is required for PostgreSQL");
    }

    const pool = new Pool({
        connectionString: options.connectionString,
        max: options.maxConnections ?? 5,
    });

    try {
        const db = drizzle(pool, { schema });

        if (options.runMigrations ?? true) {
            if (!options.migrationsFolder) {
                throw new Error(
                    "migrationsFolder is required when PostgreSQL migrations are enabled",
                );
            }

            await migrate(db, {
                migrationsFolder: resolve(options.migrationsFolder),
            });
        }

        console.log("PostgreSQL database is ready.");

        return {
            db,
            close: () => pool.end(),
        };
    } catch (error) {
        console.error("PostgreSQL initialisation failed:", error);
        await pool.end();
        throw error;
    }
}

export type PostgresDb = ReturnType<typeof drizzle<typeof schema>>;
