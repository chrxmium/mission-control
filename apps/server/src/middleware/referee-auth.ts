import type { MiddlewareHandler } from "hono";

import { verifySession } from "../auth.js";

export const requireSession: MiddlewareHandler = async (c, next) => {
    const authorisation = c.req.header("Authorization");

    if (!authorisation?.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorised" }, 401);
    }

    const token = authorisation.slice(7);

    if (!verifySession(token)) {
        return c.json({ error: "Invalid or expired session" }, 401);
    }

    await next();
};
