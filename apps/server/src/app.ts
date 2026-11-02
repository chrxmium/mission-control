import { Hono } from "hono";
import { cors } from "hono/cors";

import { healthRoutes } from "./routes/health.js";
import { createScoresheetsRoutes } from "./routes/scoresheets.js";
import { createRankingsRoutes } from "./routes/rankings.js";
import { createMatchesRoutes } from "./routes/matches.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createRefereesRoutes } from "./routes/referees.js";
import { createEventsRoutes } from "./routes/events.js";
import { createTeamsRoutes } from "./routes/teams.js";
import { createRequireAdmin } from "./middleware/admin-auth.js";
import { createRefereeAuthMiddleware } from "./middleware/referee-auth.js";
import type { Repositories } from "./repositories/interfaces/index.js";

export interface AppConfig {
    adminToken: string;
    refereePassword: string;
    corsOrigin: string;
}

export function createApp(repositories: Repositories, config: AppConfig) {
    const app = new Hono();
    const requireAdmin = createRequireAdmin(config.adminToken);
    const refereeAuth = createRefereeAuthMiddleware(repositories.auth);

    app.use(
        "/api/*",
        cors({
            origin: config.corsOrigin,
            allowHeaders: ["Content-Type", "Authorization"],
            allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
        }),
    );

    return app
        .route("/health", healthRoutes)
        .route("/api/v1/teams", createTeamsRoutes(repositories, requireAdmin))
        .route("/api/v1/scoresheets", createScoresheetsRoutes(repositories, requireAdmin))
        .route("/api/v1/rankings", createRankingsRoutes(repositories))
        .route("/api/v1/matches", createMatchesRoutes(repositories, {
            requireAdmin,
            requireSession: refereeAuth.requireSession,
        }))
        .route("/api/v1/referees", createRefereesRoutes(repositories, refereeAuth))
        .route("/api/v1/auth", createAuthRoutes(repositories.auth, config.refereePassword))
        .route("/api/v1/events", createEventsRoutes(repositories.events, requireAdmin));
}

export type AppType = ReturnType<typeof createApp>;
