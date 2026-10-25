import { and, eq, gt, isNull } from "drizzle-orm";
import { Hono } from "hono";
import * as v from "valibot";

import { createSession, hashToken, verifyPassword } from "../auth.js";
import { db } from "../db/index.js";
import { refereeLoginCodes, referees } from "../db/schema.js";
import { loginSchema } from "../validators/auth.js";

const redeemSchema = v.object({
    code: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
});

export const authRoutes = new Hono()
    .post("/headref/login", async (c) => {
        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(loginSchema, body);

        if (!parsed.success) {
            return c.json({ error: "Invalid request" }, 400);
        }

        if (!verifyPassword(parsed.output.password)) {
            return c.json({ error: "Incorrect password" }, 401);
        }

        const token = createSession("headref");
        return c.json({ token, expiresIn: 43200 });
    })
    .post("/referee/redeem", async (c) => {
        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(redeemSchema, body);

        if (!parsed.success) {
            return c.json({ error: "Invalid login code" }, 400);
        }

        const now = Date.now();
        const tokenHash = hashToken(parsed.output.code);

        const loginCode = db
            .select()
            .from(refereeLoginCodes)
            .where(eq(refereeLoginCodes.tokenHash, tokenHash))
            .get();

        if (!loginCode || loginCode.redeemedAt !== null || now >= loginCode.expiresAt) {
            return c.json({ error: "Invalid, expired, or already-used code" }, 401);
        }

        const referee = db
            .select()
            .from(referees)
            .where(eq(referees.id, loginCode.refereeId))
            .get();

        if (!referee || !referee.active) {
            return c.json({ error: "Referee account is inactive" }, 403);
        }

        // Conditional update ensures a code can only be redeemed once.
        const redeemed = db
            .update(refereeLoginCodes)
            .set({ redeemedAt: now })
            .where(
                and(
                    eq(refereeLoginCodes.id, loginCode.id),
                    isNull(refereeLoginCodes.redeemedAt),
                    gt(refereeLoginCodes.expiresAt, now),
                ),
            )
            .returning()
            .get();

        if (!redeemed) {
            return c.json({ error: "Invalid, expired, or already-used code" }, 401);
        }

        const token = createSession("referee", referee.id);

        return c.json({
            token,
            expiresIn: 86400,
            referee: {
                id: referee.id,
                name: referee.name,
                username: referee.username,
            },
        });
    });
