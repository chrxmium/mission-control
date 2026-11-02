import type { MiddlewareHandler } from "hono";

export function createRequireAdmin(adminToken: string): MiddlewareHandler {
    return async (c, next) => {
        const authorisation = c.req.header("Authorization");

        if (!adminToken || authorisation !== `Bearer ${adminToken}`) {
            return c.json({ error: "Unauthorised" }, 401);
        }

        await next();
    };
}
