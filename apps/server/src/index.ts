import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

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

app.get("/health", (c) => {
    return c.json({ ok: true });
});


app.get("/api/v1/teams/:id", (c) => {
    const id = Number(c.req.param("id"));

    const team = teams.find((t) => t.id === id); // find the team by id

    if (!team) {
        return c.json({ error: "Team not found" }, 404); // if no team found, error
    }

    return c.json({
        team, // if no id input, return all teams
    });
});

serve({
    fetch: app.fetch,
    port: 3001,
});