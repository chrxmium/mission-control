import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { healthRoutes } from "./routes/health.js";
import { teamsRoutes } from "./routes/teams.js";
import { scoresheetsRoutes } from "./routes/scoresheets.js";
import { rankingsRoutes } from "./routes/rankings.js";
import { matchesRoutes } from "./routes/matches.js";
import { authRoutes } from "./routes/auth.js";

const app = new Hono();

app.use(
    "/api/*",
    cors({
        origin: "http://localhost:5173",
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    }),
);

// GET endpoint requests

app.route("/health", healthRoutes);
app.route("/api/v1/teams", teamsRoutes);
app.route("/api/v1/scoresheets", scoresheetsRoutes);
app.route("/api/v1/rankings", rankingsRoutes);
app.route("/api/v1/matches", matchesRoutes);
app.route("/api/v1/auth", authRoutes);

// POST endpoint requests

serve({
    fetch: app.fetch,
    port: 3001,
});
