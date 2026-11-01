import type Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

/**
 * Creates a Drizzle database instance around an existing SQLite connection.
 *
 * Connection lifecycle, migrations and filesystem setup are intentionally
 * handled by the runtime bootstrap rather than this module.
 */
export function createSqliteDb(client: Database.Database) {
    return drizzle(client, { schema });
}

export type SqliteDb = ReturnType<typeof createSqliteDb>;
export type SqliteClient = Database.Database;
