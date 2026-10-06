import "dotenv/config";

import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

const adminToken = process.env.ADMIN_TOKEN;

if (!adminToken) {
    throw new Error("ADMIN_TOKEN is not set");
}

const teams: Team[] = [
    {
        id: 1,
        number: 12345,
        name: "Sample Team Alpha",
    },
    {
        id: 2,
        number: 67890,
        name: "Sample Team Beta",
    },
];

type Team = {
    id: number;
    number: number;
    name: string;
};

// GET endpoint requests
app.get("/health", (c) => {
    return c.json({ ok: true });
});

app.get("/api/v1/teams", (c) => {
    return c.json({
        teams,
    });
});

app.get("/api/v1/teams/:id", (c) => {
    const id = Number(c.req.param("id"));

    const team = teams.find((t) => t.id === id);

    if (!team) {
        return c.json(
            {
                error: "Team not found",
            },
            404,
        );
    }

    return c.json({
        team, // return the matching team
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

    const newTeam: Team = {
        id:
            teams.length > 0
                ? Math.max(...teams.map((t) => t.id)) + 1
                : 1,
        number: body.number,
        name: body.name,
    };

    teams.push(newTeam);

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