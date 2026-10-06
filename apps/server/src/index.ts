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

app.get("/api/v1/teams", (c) => {
    return c.json({
        teams,
    });
});

serve({
    fetch: app.fetch,
    port: 3001,
});