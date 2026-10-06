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

serve({
    fetch: app.fetch,
    port: 3001,
});