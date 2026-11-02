import * as v from "valibot";
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { DomainError } from "../domain/errors.js";
import type { EventRepository } from "../repositories/interfaces/events.js";
import type { TeamRepository } from "../repositories/interfaces/teams.js";
import { createTeamSchema } from "../validators/teams.js";

export function createTeamsRoutes(
    repositories: {
        events: EventRepository;
        teams: TeamRepository;
    },
    requireAdmin: MiddlewareHandler,
) {
    return new Hono()
        .get("/", async (c) => {
            const eventIdParam = c.req.query("eventId");
            let eventId: number | undefined;

            if (eventIdParam !== undefined) {
                eventId = Number(eventIdParam);

                if (!Number.isSafeInteger(eventId) || eventId < 1) {
                    return c.json({ error: "Invalid eventId" }, 400);
                }
            } else {
                const activeEvent = await repositories.events.findActive();
                eventId = activeEvent?.id;
            }

            if (eventId === undefined) {
                return c.json({ teams: [] });
            }

            const result = await repositories.teams.listByEvent(eventId);
            return c.json({ teams: result });
        })
        .get("/:id", async (c) => {
            const id = Number(c.req.param("id"));

            if (!Number.isSafeInteger(id) || id < 1) {
                return c.json({ error: "Team not found" }, 404);
            }

            const team = await repositories.teams.findById(id);

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
            const activeEvent =
                requestedEventId === undefined
                    ? await repositories.events.findActive()
                    : undefined;

            const eventId = requestedEventId ?? activeEvent?.id;

            if (eventId === undefined) {
                return c.json({ error: "No active event found" }, 400);
            }

            try {
                const team = await repositories.teams.create({
                    eventId,
                    number: parsed.output.number,
                    name: parsed.output.name,
                });

                return c.json({ team }, 201);
            } catch (error) {
                if (error instanceof DomainError) {
                    if (error.code === "NOT_FOUND") {
                        return c.json({ error: "Event not found" }, 404);
                    }

                    if (error.code === "CONFLICT") {
                        return c.json(
                            { error: "Team number already exists in this event" },
                            409,
                        );
                    }
                }

                console.error(error);
                return c.json({ error: "Failed to create team" }, 500);
            }
        });
}
