
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { Hono } from "hono";

import { requireHeadRefSession } from "../middleware/referee-auth.js";
import { db } from "../db/index.js";
import { referees } from "../db/schema.js";

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
        const result = db.select().from(referees).all();

        return c.json({ referees: result });
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
        const parsed = v.safeParse(
            v.object({ active: v.boolean() }),
            body,
        );

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
    });
