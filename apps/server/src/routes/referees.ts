import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import * as v from "valibot";
import { Hono } from "hono";

import { getSession, hashToken } from "../auth.js";
import { requireHeadRefSession } from "../middleware/referee-auth.js";
import { db } from "../db/index.js";
import { authSessions, refereeLoginCodes, referees } from "../db/schema.js";

const CODE_DURATION = 5 * 60 * 1000;

const createRefereeSchema = v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
    username: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(3),
        v.maxLength(50),
        v.regex(/^[a-zA-Z0-9_-]+$/),
    ),
});

export const refereesRoutes = new Hono()
    .get("/", requireHeadRefSession, (c) => {
        return c.json({ referees: db.select().from(referees).all() });
    })
    .post("/", requireHeadRefSession, async (c) => {
        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(createRefereeSchema, body);

        if (!parsed.success) {
            return c.json({ error: "Invalid request body" }, 400);
        }

        try {
            const referee = db
                .insert(referees)
                .values({
                    name: parsed.output.name,
                    username: parsed.output.username,
                    createdAt: Date.now(),
                })
                .returning()
                .get();

            return c.json({ referee }, 201);
        } catch {
            return c.json({ error: "Username already exists" }, 409);
        }
    })
    .patch("/:id/active", requireHeadRefSession, async (c) => {
        const id = Number(c.req.param("id"));

        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid referee ID" }, 400);
        }

        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(v.object({ active: v.boolean() }), body);

        if (!parsed.success) {
            return c.json({ error: "Expected an active boolean" }, 400);
        }

        const referee = db
            .update(referees)
            .set({ active: parsed.output.active })
            .where(eq(referees.id, id))
            .returning()
            .get();

        if (!referee) {
            return c.json({ error: "Referee not found" }, 404);
        }

        return c.json({ referee });
    })
    .post("/:id/login-code", requireHeadRefSession, (c) => {
        const refereeId = Number(c.req.param("id"));

        if (!Number.isSafeInteger(refereeId) || refereeId < 1) {
            return c.json({ error: "Invalid referee ID" }, 400);
        }

        const referee = db
            .select()
            .from(referees)
            .where(eq(referees.id, refereeId))
            .get();

        if (!referee || !referee.active) {
            return c.json({ error: "Active referee not found" }, 404);
        }

        const authorization = c.req.header("Authorization");
        const headrefToken = authorization?.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";
        const headrefSession = headrefToken ? getSession(headrefToken) : null;

        if (!headrefSession || headrefSession.role !== "headref") {
            return c.json({ error: "Head referee access required" }, 403);
        }

        const code = randomBytes(32).toString("hex");
        const now = Date.now();
        const expiresAt = now + CODE_DURATION;

        db.insert(refereeLoginCodes)
            .values({
                tokenHash: hashToken(code),
                refereeId,
                createdBySessionId: headrefSession.id,
                createdAt: now,
                expiresAt,
                redeemedAt: null,
            })
            .run();

        return c.json({
            code,
            referee: {
                id: referee.id,
                name: referee.name,
                username: referee.username,
            },
            expiresAt,
            expiresIn: CODE_DURATION / 1000,
        }, 201);
    });
