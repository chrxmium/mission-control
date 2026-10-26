import { eq } from "drizzle-orm";
import * as v from "valibot";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { db } from "../db/index.js";
import { events } from "../db/schema.js";

const eventStatus = v.picklist(["draft", "active", "completed"] as const);

const createEventSchema = v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1)),
    season: v.pipe(v.string(), v.trim(), v.minLength(1)),
    location: v.optional(v.nullable(v.string())),
    eventDate: v.optional(v.nullable(v.string())),
    status: v.optional(eventStatus),
    ruleset: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
    tableCount: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    practiceMatchesEnabled: v.optional(v.boolean()),
});

const updateEventSchema = v.partial(createEventSchema);

export const eventsRoutes = new Hono()
    .get("/", (c) => {
        const result = db.select().from(events).all();
        return c.json({ events: result });
    })
    .get("/:id", (c) => {
        const id = Number(c.req.param("id"));

        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid event ID" }, 400);
        }

        const event = db.select().from(events).where(eq(events.id, id)).get();

        if (!event) {
            return c.json({ error: "Event not found" }, 404);
        }

        return c.json({ event });
    })
    .post("/", requireAdmin, async (c) => {
        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(createEventSchema, body);

        if (!parsed.success) {
            return c.json({ error: "Invalid event details" }, 400);
        }

        const data = parsed.output;

        try {
            const values = {
                name: data.name,
                season: data.season,
                location: data.location ?? null,
                eventDate: data.eventDate ?? null,
                status: data.status ?? "draft",
                ruleset: data.ruleset ?? "BIOGLOW",
                tableCount: data.tableCount ?? 1,
                practiceMatchesEnabled: data.practiceMatchesEnabled ?? false,
                createdAt: Date.now(),
            };

            const created = values.status === "active"
                ? db.transaction((tx) => {
                    tx.update(events).set({ status: "draft" }).where(eq(events.status, "active")).run();
                    return tx.insert(events).values(values).returning().get();
                })
                : db.insert(events).values(values).returning().get();

            return c.json({ event: created }, 201);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to create event" }, 500);
        }
    })
    .patch("/:id", requireAdmin, async (c) => {
        const id = Number(c.req.param("id"));

        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid event ID" }, 400);
        }

        const existing = db.select().from(events).where(eq(events.id, id)).get();

        if (!existing) {
            return c.json({ error: "Event not found" }, 404);
        }

        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(updateEventSchema, body);

        if (!parsed.success || Object.keys(parsed.success ? parsed.output : {}).length === 0) {
            return c.json({ error: "Invalid event details" }, 400);
        }

        try {
            const updated = parsed.output.status === "active"
                ? db.transaction((tx) => {
                    tx.update(events).set({ status: "draft" }).where(eq(events.status, "active")).run();
                    return tx.update(events).set(parsed.output).where(eq(events.id, id)).returning().get();
                })
                : db.update(events).set(parsed.output).where(eq(events.id, id)).returning().get();

            return c.json({ event: updated });
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to update event" }, 500);
        }
    });
