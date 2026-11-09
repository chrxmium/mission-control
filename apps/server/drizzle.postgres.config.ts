import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.postgres.ts",
    out: "./drizzle-postgres",
    dialect: "postgresql",
    dbCredentials: {
        url:
            process.env.POSTGRES_DATABASE_URL_UNPOOLED ??
            process.env.DATABASE_URL_UNPOOLED ??
            process.env.POSTGRES_DATABASE_URL ??
            process.env.DATABASE_URL ??
            "postgresql://postgres:postgres@localhost:5432/mission_control",
    },
});
