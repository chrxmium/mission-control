import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { createSqliteDb } from "./client.js";

type AppliedMigration = {
    hash: string;
    created_at: number;
};

export interface SqliteDatabaseOptions {
    databasePath: string;
    migrationsFolder: string;
}

export async function createSqliteDatabase(options: SqliteDatabaseOptions) {
    const databasePath = resolve(options.databasePath);
    const migrationsFolder = resolve(options.migrationsFolder);

    mkdirSync(dirname(databasePath), { recursive: true });

    const databaseExisted = existsSync(databasePath);
    const sqlite = new Database(databasePath);

    try {
        sqlite.pragma("foreign_keys = ON");

        const db = createSqliteDb(sqlite);
        const migrations = readMigrationFiles({ migrationsFolder });

        if (migrations.length === 0) {
            throw new Error("No database migrations found");
        }

        const hasMigrationTable = sqlite
            .prepare(
                "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'",
            )
            .get();

        const lastApplied = hasMigrationTable
            ? (sqlite
                  .prepare(
                      "SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1",
                  )
                  .get() as AppliedMigration | undefined)
            : undefined;

        if (databaseExisted && !hasMigrationTable) {
            const existingTables = sqlite
                .prepare(
                    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
                )
                .all();

            if (existingTables.length > 0) {
                throw new Error("Existing database has no Drizzle migration history");
            }
        }

        if (lastApplied) {
            const matchingMigration = migrations.find(
                (migration) => migration.folderMillis === Number(lastApplied.created_at),
            );

            if (!matchingMigration || matchingMigration.hash !== lastApplied.hash) {
                throw new Error("Database migration history does not match this release");
            }
        }

        const pending = migrations.filter(
            (migration) => !lastApplied || migration.folderMillis > Number(lastApplied.created_at),
        );

        if (pending.length === 0) {
            console.log("Database schema is up to date.");
            return {
                db,
                close: () => sqlite.close(),
            };
        }

        if (lastApplied) {
            const backupDirectory = join(dirname(databasePath), "backups");
            mkdirSync(backupDirectory, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupPath = join(
                backupDirectory,
                `mission-control-${timestamp}-${randomUUID()}.db`,
            );

            console.log(`Backing up database to ${backupPath}`);
            await sqlite.backup(backupPath);
            console.log("Database backup completed.");
        }

        console.log(`Applying ${pending.length} database migration(s).`);

        migrate(db, { migrationsFolder });

        console.log("Database migrations applied successfully.");

        return {
            db,
            close: () => sqlite.close(),
        };
    } catch (error) {
        console.error("Database initialisation failed:", error);
        sqlite.close();
        throw error;
    }
}
