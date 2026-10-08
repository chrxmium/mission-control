import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const databasePath =
    process.env.DATABASE_URL ?? "mission-control.db";

mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);

export const db = drizzle(sqlite, {
    schema,
});