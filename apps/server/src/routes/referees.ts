import { randomBytes } from "node:crypto";
import * as v from "valibot";
import { Hono } from "hono";

import { getSession, hashToken } from "../auth.js";
import { DomainError } from "../domain/errors.js";
import { requireHeadRefSession, requireRefereeSession } from "../middleware/referee-auth.js";
import type { Repositories } from "../repositories/interfaces/index.js";

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

const assignmentSchema = v.object({
    eventId: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    tableNumber: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(99))),
    matchIds: v.array(v.pipe(v.number(), v.integer(), v.minValue(1))),
});

function bearerSession(authorization: string | undefined) {
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.slice(7);
    return token ? getSession(token) : null;
}

export function createRefereesRoutes(
    repositories: Pick<Repositories, "events" | "matches" | "referees" | "auth">,
) {
    const { events, matches, referees, auth } = repositories;
    const app = new Hono();

    app.get("/me", requireRefereeSession, async (c) => {
        const session = bearerSession(c.req.header("Authorization"));
        if (!session || session.role !== "referee" || session.refereeId === null) {
            return c.json({ error: "Referee access required" }, 403);
        }

        const referee = await referees.findById(session.refereeId);
        if (!referee) return c.json({ error: "Referee not found" }, 404);

        const assignedMatches = await matches.listAssignedToReferee(referee.id);

        return c.json({
            referee: {
                id: referee.id,
                name: referee.name,
                username: referee.username,
                tableNumber: referee.tableNumber,
            },
            session: { expiresAt: session.expiresAt },
            matches: assignedMatches.map(({ match, team1, team2 }) => ({
                id: match.id,
                matchNumber: match.matchNumber,
                scheduledAt: match.scheduledAt,
                status: match.status,
                team1,
                team2,
            })),
        });
    });

    app.get("/assignment-options", requireHeadRefSession, async (c) => {
        const eventIdParam = c.req.query("eventId");
        const activeEvent = eventIdParam === undefined ? await events.findActive() : undefined;
        const eventId = eventIdParam === undefined ? activeEvent?.id : Number(eventIdParam);

        if (eventId === undefined || !Number.isSafeInteger(eventId) || eventId < 1) {
            return c.json({ matches: [] });
        }

        const event = await events.findById(eventId);
        if (!event) return c.json({ error: "Event not found" }, 404);

        const eventMatches = await matches.listByEvent(eventId);

        return c.json({
            matches: eventMatches.map(({ match, team1, team2 }) => ({
                id: match.id,
                matchNumber: match.matchNumber,
                scheduledAt: match.scheduledAt,
                status: match.status,
                teams: team2
                    ? `Team ${team1.number} vs Team ${team2.number}`
                    : `Team ${team1.number} (solo)`,
            })),
        });
    });

    app.get("/", requireHeadRefSession, async (c) => {
        return c.json({ referees: await referees.list() });
    });

    app.post("/", requireHeadRefSession, async (c) => {
        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(createRefereeSchema, body);

        if (!parsed.success) {
            return c.json({ error: "Invalid request body" }, 400);
        }

        try {
            const referee = await referees.create({
                name: parsed.output.name,
                username: parsed.output.username,
                createdAt: Date.now(),
            });

            return c.json({ referee }, 201);
        } catch (error) {
            if (error instanceof DomainError && error.code === "CONFLICT") {
                return c.json({ error: "Username already exists" }, 409);
            }
            console.error(error);
            return c.json({ error: "Failed to create referee" }, 500);
        }
    });

    app.patch("/:id/assignments", requireHeadRefSession, async (c) => {
        const id = Number(c.req.param("id"));
        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid referee ID" }, 400);
        }

        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(assignmentSchema, body);
        if (!parsed.success) {
            return c.json({ error: "Expected a valid table number and match ID list" }, 400);
        }

        const matchIds = parsed.output.matchIds;
        if (new Set(matchIds).size !== matchIds.length) {
            return c.json({ error: "Duplicate match IDs are not allowed" }, 400);
        }

        const referee = await referees.findById(id);
        if (!referee) return c.json({ error: "Referee not found" }, 404);

        const eventId = parsed.output.eventId;
        if (eventId !== undefined && !(await events.findById(eventId))) {
            return c.json({ error: "Event not found" }, 404);
        }

        try {
            await referees.replaceAssignments({
                refereeId: id,
                tableNumber: parsed.output.tableNumber,
                matchIds,
                eventId,
                assignedAt: Date.now(),
            });
        } catch (error) {
            if (error instanceof DomainError) {
                if (error.code === "NOT_FOUND") {
                    return c.json({ error: "Referee not found" }, 404);
                }
                if (error.code === "VALIDATION") {
                    if (error.message.includes("selected event")) {
                        return c.json(
                            { error: "All assigned matches must belong to the selected event" },
                            400,
                        );
                    }
                    return c.json({ error: "One or more matches were not found" }, 400);
                }
            }
            console.error(error);
            return c.json({ error: "Failed to update referee assignments" }, 500);
        }

        return c.json({
            ok: true,
            tableNumber: parsed.output.tableNumber,
            matchIds,
        });
    });

    app.patch("/:id/active", requireHeadRefSession, async (c) => {
        const id = Number(c.req.param("id"));
        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid referee ID" }, 400);
        }

        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(v.object({ active: v.boolean() }), body);
        if (!parsed.success) {
            return c.json({ error: "Expected an active boolean" }, 400);
        }

        const referee = await referees.setActive(id, parsed.output.active);
        if (!referee) return c.json({ error: "Referee not found" }, 404);

        return c.json({ referee });
    });

    app.post("/:id/login-code", requireHeadRefSession, async (c) => {
        const refereeId = Number(c.req.param("id"));
        if (!Number.isSafeInteger(refereeId) || refereeId < 1) {
            return c.json({ error: "Invalid referee ID" }, 400);
        }

        const referee = await referees.findById(refereeId);
        if (!referee || !referee.active) {
            return c.json({ error: "Active referee not found" }, 404);
        }

        const headrefSession = bearerSession(c.req.header("Authorization"));
        if (!headrefSession || headrefSession.role !== "headref") {
            return c.json({ error: "Head referee access required" }, 403);
        }

        const code = randomBytes(32).toString("hex");
        const now = Date.now();
        const expiresAt = now + CODE_DURATION;

        await auth.createLoginCode({
            tokenHash: hashToken(code),
            refereeId,
            createdBySessionId: headrefSession.id,
            createdAt: now,
            expiresAt,
        });

        return c.json(
            {
                code,
                referee: {
                    id: referee.id,
                    name: referee.name,
                    username: referee.username,
                },
                expiresAt,
                expiresIn: CODE_DURATION / 1000,
            },
            201,
        );
    });

    return app;
}
