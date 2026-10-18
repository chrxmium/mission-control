import { Hono } from "hono";
import { cors } from "hono/cors";

import { healthRoutes } from "./routes/health.js";
import { teamsRoutes } from "./routes/teams.js";
import { scoresheetsRoutes } from "./routes/scoresheets.js";
import { rankingsRoutes } from "./routes/rankings.js";
import { matchesRoutes } from "./routes/matches.js";
import { authRoutes } from "./routes/auth.js";

export const app = new Hono();

app.use(
    "/api/*",
    cors({
        origin: "http://localhost:5173",
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    }),
);

// GET endpoint requests

export const routes = app
    .route("/health", healthRoutes)
    .route("/api/v1/teams", teamsRoutes)
    .route("/api/v1/scoresheets", scoresheetsRoutes)
    .route("/api/v1/rankings", rankingsRoutes)
    .route("/api/v1/matches", matchesRoutes)
    .route("/api/v1/auth", authRoutes);

export type AppType = typeof routes;

// POST endpoint requests
