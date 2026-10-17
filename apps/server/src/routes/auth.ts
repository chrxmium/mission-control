import { Hono } from "hono";
import { createSession, verifyPassword } from "../auth.js";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
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
