import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createSession, verifyPassword } from "./auth.js";
import { healthRoutes } from "./routes/health.js";
import { teamsRoutes } from "./routes/teams.js";
import { scoresheetsRoutes } from "./routes/scoresheets.js";
import { rankingsRoutes } from "./routes/rankings.js";
import { matchesRoutes } from "./routes/matches.js";

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

// POST endpoint requests

app.post("/api/v1/auth/login", async (c) => {
    const body = await c.req.json().catch(() => null);

    if (!body || typeof body.password !== "string") {
        return c.json({ error: "Invalid request" }, 400);
    }

    if (!verifyPassword(body.password)) {
        return c.json({ error: "Incorrect password" }, 401);
    }

    const token = createSession();

    return c.json({
        token,
        expiresIn: 43200,
    });
});

serve({
    fetch: app.fetch,
    port: 3001,
});
