import type { MiddlewareHandler } from "hono";
import { getSession } from "../auth.js";

function readSession(c: Parameters<MiddlewareHandler>[0]) {
    const authorization = c.req.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }

    return getSession(authorization.slice(7));
}

// Transitional guard: accepts any valid session for existing endpoints.
export const requireSession: MiddlewareHandler = async (c, next) => {
    if (!readSession(c)) {
        return c.json({ error: "Invalid or expired session" }, 401);
    }

    await next();
};

// For endpoints that require an identified, active referee.
export const requireRefereeSession: MiddlewareHandler = async (c, next) => {
    const session = readSession(c);

    if (!session) {
        return c.json({ error: "Invalid or expired session" }, 401);
    }

    if (session.role !== "referee" || session.refereeId === null) {
        return c.json({ error: "Referee access required" }, 403);
    }

    await next();
};

// For management endpoints used by the head referee.
export const requireHeadRefSession: MiddlewareHandler = async (c, next) => {
    const session = readSession(c);

    if (!session) {
        return c.json({ error: "Invalid or expired session" }, 401);
    }

    if (session.role !== "headref") {
        return c.json({ error: "Head referee access required" }, 403);
    }

    await next();
};
