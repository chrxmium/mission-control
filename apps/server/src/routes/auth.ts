import { Hono } from "hono";
import * as v from "valibot";
import { loginSchema } from "../validators/auth.js";
import { createSession, verifyPassword } from "../auth.js";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
    const body = await c.req.json().catch(() => null);

    const parsed = v.safeParse(loginSchema, body);

    if (!parsed.success) {
        return c.json({ error: "Invalid request" }, 400);
    }

    if (!verifyPassword(parsed.output.password)) {
        return c.json({ error: "Incorrect password" }, 401);
    }

    const token = createSession();

    return c.json({
        token,
        expiresIn: 43200,
    });
});
