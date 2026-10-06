import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/health", (c) => {
    return c.json({ ok: true });
});

serve({
    fetch: app.fetch,
    port: 3001,
});