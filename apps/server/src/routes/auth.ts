import { randomBytes } from "node:crypto";
import { Hono } from "hono";
import * as v from "valibot";

import { DomainError } from "../domain/errors.js";
import type { AuthRepository } from "../repositories/interfaces/auth.js";
import type { SessionRole } from "../domain/types.js";
import { loginSchema } from "../validators/auth.js";
import { hashToken, verifyPassword } from "../services/auth-utils.js";

const redeemSchema = v.object({
    code: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
});

const HEADREF_SESSION_DURATION = 12 * 60 * 60 * 1000;
const REFEREE_SESSION_DURATION = 24 * 60 * 60 * 1000;

export function createAuthRoutes(repository: AuthRepository, refereePassword: string) {
    return new Hono()
        .post("/headref/login", async (c) => {
            const body = await c.req.json().catch(() => null);
            const parsed = v.safeParse(loginSchema, body);

            if (!parsed.success) {
                return c.json({ error: "Invalid request" }, 400);
            }

            if (!refereePassword || !verifyPassword(parsed.output.password, refereePassword)) {
                return c.json({ error: "Incorrect password" }, 401);
            }

            const token = randomBytes(32).toString("hex");
            const now = Date.now();

            await repository.createSession({
                tokenHash: hashToken(token),
                role: "headref",
                refereeId: null,
                createdAt: now,
                expiresAt: now + HEADREF_SESSION_DURATION,
            });

            return c.json({ token, expiresIn: HEADREF_SESSION_DURATION / 1000 });
        })
        .post("/referee/redeem", async (c) => {
            const body = await c.req.json().catch(() => null);
            const parsed = v.safeParse(redeemSchema, body);

            if (!parsed.success) {
                return c.json({ error: "Invalid login code" }, 400);
            }

            const token = randomBytes(32).toString("hex");
            const now = Date.now();

            try {
                const redeemed = await repository.redeemLoginCode({
                    tokenHash: hashToken(parsed.output.code),
                    now,
                    session: {
                        tokenHash: hashToken(token),
                        role: "referee" satisfies SessionRole,
                        refereeId: null,
                        createdAt: now,
                        expiresAt: now + REFEREE_SESSION_DURATION,
                    },
                });

                if (!redeemed) {
                    return c.json({ error: "Invalid, expired, or already-used code" }, 401);
                }

                return c.json({
                    token,
                    expiresIn: REFEREE_SESSION_DURATION / 1000,
                    referee: redeemed.referee,
                });
            } catch (error) {
                if (error instanceof DomainError && error.code === "FORBIDDEN") {
                    return c.json({ error: "Referee account is inactive" }, 403);
                }

                throw error;
            }
        });
}
