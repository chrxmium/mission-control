import { and, eq, inArray, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import * as v from "valibot";
import { Hono } from "hono";
import { alias } from "drizzle-orm/sqlite-core";

import { getSession, hashToken } from "../auth.js";
import { requireHeadRefSession, requireRefereeSession } from "../middleware/referee-auth.js";
import { db } from "../db/index.js";
import { events, matches, refereeLoginCodes, refereeMatches, referees, teams } from "../db/schema.js";

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

function resolveEventId(eventIdParam: string | undefined) {
    if (eventIdParam === undefined) {
        return db
            .select({ id: events.id })
            .from(events)
            .where(eq(events.status, "active"))
            .get()?.id;
    }

    const id = Number(eventIdParam);
    return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export const refereesRoutes = new Hono()
    .get("/me", requireRefereeSession, (c) => {
        const session = bearerSession(c.req.header("Authorization"));
        if (!session || session.role !== "referee" || session.refereeId === null) {
            return c.json({ error: "Referee access required" }, 403);
        }

        const referee = db
            .select({
                id: referees.id,
                name: referees.name,
                username: referees.username,
                tableNumber: referees.tableNumber,
            })
            .from(referees)
            .where(eq(referees.id, session.refereeId))
            .get();

        if (!referee) {
            return c.json({ error: "Referee not found" }, 404);
        }

        const team1 = alias(teams, "dashboard_team1");
        const team2 = alias(teams, "dashboard_team2");

        const assignedMatches = db
            .select({
                id: matches.id,
                matchNumber: matches.matchNumber,
                scheduledAt: matches.scheduledAt,
                status: matches.status,
                team1Id: team1.id,
                team1Number: team1.number,
                team1Name: team1.name,
                team2Id: team2.id,
                team2Number: team2.number,
                team2Name: team2.name,
            })
            .from(refereeMatches)
            .innerJoin(matches, eq(refereeMatches.matchId, matches.id))
            .innerJoin(team1, eq(matches.team1Id, team1.id))
            .leftJoin(team2, eq(matches.team2Id, team2.id))
            .where(eq(refereeMatches.refereeId, referee.id))
            .orderBy(matches.matchNumber)
            .all()
            .map((match) => ({
                id: match.id,
                matchNumber: match.matchNumber,
                scheduledAt: match.scheduledAt,
                status: match.status,
                team1: {
                    id: match.team1Id,
                    number: match.team1Number,
                    name: match.team1Name,
                },
                team2:
                    match.team2Id === null ||
                    match.team2Number === null ||
                    match.team2Name === null
                        ? null
                        : {
                              id: match.team2Id,
                              number: match.team2Number,
                              name: match.team2Name,
                          },
            }));

        return c.json({
            referee,
            session: { expiresAt: session.expiresAt },
            matches: assignedMatches,
        });
    })
    .get("/assignment-options", requireHeadRefSession, (c) => {
        const eventId = resolveEventId(c.req.query("eventId"));

        if (eventId === undefined) {
            return c.json({ matches: [] });
        }

        const event = db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).get();

        if (!event) {
            return c.json({ error: "Event not found" }, 404);
        }

        const team1 = alias(teams, "assignment_team1");
        const team2 = alias(teams, "assignment_team2");

        const options = db
            .select({
                id: matches.id,
                matchNumber: matches.matchNumber,
                scheduledAt: matches.scheduledAt,
                status: matches.status,
                team1Number: team1.number,
                team2Number: team2.number,
            })
            .from(matches)
            .innerJoin(team1, eq(matches.team1Id, team1.id))
            .leftJoin(team2, eq(matches.team2Id, team2.id))
            .where(eq(matches.eventId, eventId))
            .orderBy(matches.matchNumber)
            .all()
            .map((match) => ({
                id: match.id,
                matchNumber: match.matchNumber,
                scheduledAt: match.scheduledAt,
                status: match.status,
                teams: match.team2Number === null
                    ? `Team ${match.team1Number} (solo)`
                    : `Team ${match.team1Number} vs Team ${match.team2Number}`,
            }));

        return c.json({ matches: options });
    })
    .get("/", requireHeadRefSession, (c) => {
        const rows = db.select().from(referees).all();
        const refereesWithAssignments = rows.map((referee) => ({
            ...referee,
            matchIds: db
                .select({ matchId: refereeMatches.matchId })
                .from(refereeMatches)
                .where(eq(refereeMatches.refereeId, referee.id))
                .all()
                .map((row) => row.matchId),
        }));
        return c.json({ referees: refereesWithAssignments });
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
    .patch("/:id/assignments", requireHeadRefSession, async (c) => {
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

        const referee = db.select().from(referees).where(eq(referees.id, id)).get();
        if (!referee) return c.json({ error: "Referee not found" }, 404);

        const eventId = parsed.output.eventId;
        if (eventId !== undefined) {
            const event = db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).get();
            if (!event) return c.json({ error: "Event not found" }, 404);
        }

        if (matchIds.length > 0) {
            const found = db
                .select({ id: matches.id, eventId: matches.eventId })
                .from(matches)
                .where(inArray(matches.id, matchIds))
                .all();

            if (found.length !== matchIds.length) {
                return c.json({ error: "One or more matches were not found" }, 400);
            }

            if (eventId !== undefined && found.some((match) => match.eventId !== eventId)) {
                return c.json({ error: "All assigned matches must belong to the selected event" }, 400);
            }
        }

        db.transaction((tx) => {
            tx.update(referees)
                .set({ tableNumber: parsed.output.tableNumber })
                .where(eq(referees.id, id))
                .run();

            tx.delete(refereeMatches).where(eq(refereeMatches.refereeId, id)).run();

            if (matchIds.length > 0) {
                tx.insert(refereeMatches)
                    .values(
                        matchIds.map((matchId) => ({
                            refereeId: id,
                            matchId,
                            assignedAt: Date.now(),
                        })),
                    )
                    .run();
            }
        });

        return c.json({
            ok: true,
            tableNumber: parsed.output.tableNumber,
            matchIds,
        });
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

        if (!referee) return c.json({ error: "Referee not found" }, 404);
        return c.json({ referee });
    })
    .post("/:id/login-code", requireHeadRefSession, (c) => {
        const refereeId = Number(c.req.param("id"));
        if (!Number.isSafeInteger(refereeId) || refereeId < 1) {
            return c.json({ error: "Invalid referee ID" }, 400);
        }

        const referee = db.select().from(referees).where(eq(referees.id, refereeId)).get();
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

        db.transaction((tx) => {
            tx.update(refereeLoginCodes)
                .set({ redeemedAt: now })
                .where(
                    and(
                        eq(refereeLoginCodes.refereeId, refereeId),
                        isNull(refereeLoginCodes.redeemedAt),
                    ),
                )
                .run();

            tx.insert(refereeLoginCodes)
                .values({
                    tokenHash: hashToken(code),
                    refereeId,
                    createdBySessionId: headrefSession.id,
                    createdAt: now,
                    expiresAt,
                    redeemedAt: null,
                })
                .run();
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
