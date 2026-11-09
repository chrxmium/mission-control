import type { MiddlewareHandler } from "hono";
import type { AuthRepository } from "../repositories/interfaces/auth.js";
import { hashToken } from "../services/auth-utils.js";

export function createRefereeAuthMiddleware(repository: AuthRepository) {
    async function getSession(token: string) {
        if (!token) return null;

        const session = await repository.findSessionByTokenHash(hashToken(token));

        if (!session || Date.now() >= session.expiresAt) {
            return null;
        }

        return session;
    }

    async function readSession(authorization: string | undefined) {
        if (!authorization?.startsWith("Bearer ")) return null;

        return getSession(authorization.slice(7));
    }

    const requireSession: MiddlewareHandler = async (c, next) => {
        if (!(await readSession(c.req.header("Authorization")))) {
            return c.json({ error: "Invalid or expired session" }, 401);
        }

        await next();
    };

    const requireRefereeSession: MiddlewareHandler = async (c, next) => {
        const session = await readSession(c.req.header("Authorization"));

        if (!session) {
            return c.json({ error: "Invalid or expired session" }, 401);
        }

        if (session.role !== "referee" || session.refereeId === null) {
            return c.json({ error: "Referee access required" }, 403);
        }

        await next();
    };

    const requireHeadRefSession: MiddlewareHandler = async (c, next) => {
        const session = await readSession(c.req.header("Authorization"));

        if (!session) {
            return c.json({ error: "Invalid or expired session" }, 401);
        }

        if (session.role !== "headref") {
            return c.json({ error: "Head referee access required" }, 403);
        }

        await next();
    };

    return {
        getSession,
        requireSession,
        requireRefereeSession,
        requireHeadRefSession,
    };
}
