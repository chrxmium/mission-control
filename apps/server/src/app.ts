import { Hono } from "hono";
import { cors } from "hono/cors";

import { healthRoutes } from "./routes/health.js";
import { scoresheetsRoutes } from "./routes/scoresheets.js";
import { rankingsRoutes } from "./routes/rankings.js";
import { createMatchesRoutes } from "./routes/matches.js";
import { createAuthRoutes } from "./routes/auth.js";
import { refereesRoutes } from "./routes/referees.js";
import { createEventsRoutes } from "./routes/events.js";
import { createTeamsRoutes } from "./routes/teams.js";

import { db } from "./db/index.js";
import { createSqliteRepositories } from "./repositories/sqlite/index.js";
import type { Repositories } from "./repositories/interfaces/index.js";

export function createApp(repositories: Repositories) {
    const app = new Hono();

    app.use(
        "/api/*",
        cors({
            origin: "http://localhost:5173",
            allowHeaders: ["Content-Type", "Authorization"],
            allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
        }),
    );

    return app
        .route("/health", healthRoutes)
        .route("/api/v1/teams", createTeamsRoutes(repositories))
        .route("/api/v1/scoresheets", scoresheetsRoutes)
        .route("/api/v1/rankings", rankingsRoutes)
        .route("/api/v1/matches", createMatchesRoutes(repositories))
        .route("/api/v1/referees", refereesRoutes)
        .route("/api/v1/auth", createAuthRoutes(repositories.auth, process.env.REFEREE_PASSWORD ?? ""))
        .route("/api/v1/events", createEventsRoutes(repositories.events));
}

const repositories = createSqliteRepositories(db);

export const app = createApp(repositories);
export const routes = app;
export type AppType = typeof routes;
