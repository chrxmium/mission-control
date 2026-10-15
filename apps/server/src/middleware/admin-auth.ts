import type { MiddlewareHandler } from "hono";

const adminToken = process.env.ADMIN_TOKEN;

if (!adminToken) {
    throw new Error("ADMIN_TOKEN is not set");
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
    const authorisation = c.req.header("Authorization");

    if (authorisation !== `Bearer ${adminToken}`) {
        return c.json({ error: "Unauthorised" }, 401);
    }

    await next();
};
