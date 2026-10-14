import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import * as schema from "./schema.js";

const databasePath = resolve(process.env.DATABASE_URL ?? "mission-control.db");

mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);

sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

const migrationsFolder = resolve(process.cwd(), "drizzle");

try {
    migrate(db, { migrationsFolder });
    console.log("Database migrations applied successfully.");
} catch (error) {
    console.error("Database migration failed:", error);
    sqlite.close();
    throw error;
}
