import { eq } from "drizzle-orm";
import * as v from "valibot";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { db } from "../db/index.js";
import { events, teams } from "../db/schema.js";
import { createTeamSchema } from "../validators/teams.js";

export const teamsRoutes = new Hono()
    .get("/", (c) => {
        const eventIdParam = c.req.query("eventId");
        let eventId: number | undefined;

        if (eventIdParam !== undefined) {
            eventId = Number(eventIdParam);

            if (!Number.isSafeInteger(eventId) || eventId < 1) {
                return c.json({ error: "Invalid eventId" }, 400);
            }
        } else {
            const activeEvent = db
                .select({ id: events.id })
                .from(events)
                .where(eq(events.status, "active"))
                .get();

            eventId = activeEvent?.id;
        }

        if (eventId === undefined) {
            return c.json({ teams: [] });
        }

        const result = db
            .select()
            .from(teams)
            .where(eq(teams.eventId, eventId))
            .all();

        return c.json({ teams: result });
    })
    .get("/:id", (c) => {
        const id = Number(c.req.param("id"));

        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Team not found" }, 404);
        }

        const team = db.select().from(teams).where(eq(teams.id, id)).get();

        if (!team) {
            return c.json({ error: "Team not found" }, 404);
        }

        return c.json({ team });
    })
    .post("/", requireAdmin, async (c) => {
        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(createTeamSchema, body);

        if (!parsed.success) {
            return c.json({ error: "Invalid request body" }, 400);
        }

        const requestedEventId = parsed.output.eventId;
        const activeEvent = requestedEventId === undefined
            ? db
                .select({ id: events.id })
                .from(events)
                .where(eq(events.status, "active"))
                .get()
            : undefined;

        const eventId = requestedEventId ?? activeEvent?.id;

        if (eventId === undefined) {
            return c.json({ error: "No active event found" }, 400);
        }

        const event = db
            .select({ id: events.id })
            .from(events)
            .where(eq(events.id, eventId))
            .get();

        if (!event) {
            return c.json({ error: "Event not found" }, 404);
        }

        try {
            const newTeam = db
                .insert(teams)
                .values({
                    eventId,
                    number: parsed.output.number,
                    name: parsed.output.name,
                })
                .returning()
                .get();

            return c.json({ team: newTeam }, 201);
        } catch (error) {
            console.error(error);

            return c.json(
                { error: "Team number already exists in this event" },
                409,
            );
        }
    });
