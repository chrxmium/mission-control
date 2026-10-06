import "dotenv/config";
import { db } from "./db";
import { teams } from "./db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

const adminToken = process.env.ADMIN_TOKEN;

if (!adminToken) {
    throw new Error("ADMIN_TOKEN is not set");
}

// GET endpoint requests
app.get("/health", (c) => {
    return c.json({ ok: true });
});

app.get("/api/v1/teams", (c) => {
    const result = db.select().from(teams).all();

    return c.json({
        teams: result,
    });
});

app.get("/api/v1/teams/:id", (c) => {
    const id = Number(c.req.param("id"));

    const team = db
        .select()
        .from(teams)
        .where(eq(teams.id, id))
        .get();

    if (!team) {
        return c.json(
            {
                error: "Team not found",
            },
            404,
        );
    }

    return c.json({
        team,
    });
});

// POST endpoint requests

app.post("/api/v1/teams", async (c) => {
    const authorisation = c.req.header("Authorization");

    if (authorisation !== `Bearer ${adminToken}`) {
        return c.json(
            {
                error: "Unauthorised",
            },
            401,
        );
    }

    const body = await c.req.json();

    if (
        typeof body.number !== "number" ||
        !Number.isInteger(body.number) ||
        body.number <= 0 ||
        typeof body.name !== "string" ||
        body.name.trim().length <= 0
    ) {
        return c.json(
            {
                error: "Invalid request body",
            },
            400,
        );
    }

    const newTeam = db
        .insert(teams)
        .values({
            number: body.number,
            name: body.name.trim(),
        })
        .returning()
        .get();

    return c.json(
        {
            team: newTeam,
        },
        201,
    );
});

serve({
    fetch: app.fetch,
    port: 3001,
});