import * as v from "valibot";
import type { ScoreSheet } from "@mission-control/rules";
import { Hono } from "hono";

import { DomainError } from "../domain/errors.js";
import type { Repositories } from "../repositories/interfaces/index.js";
import { requireAdmin } from "../middleware/admin-auth.js";
import { requireSession } from "../middleware/referee-auth.js";
import { createMatchSchema, sharedM05Schema, submittedTeamSchema, submitTableNumberSchema, type SubmittedTeam } from "../validators/matches.js";
import { buildScoresheetValues, prepareScoresheet } from "../services/scoring.js";

const emptySheet: ScoreSheet = {
    m01_young_forest: 0,
    m01_grand_tree: 0,
    m01_hollow_tree: 0,
    m01_queen_knocked_down: false,
    m02_base: 0,
    m02_canopy: 0,
    m03_waterfall: 0,
    m04_nest: false,
    m04_hollow: false,
    m05_haven: 0,
    lu_added: 0,
    lu_contained: 0,
    interference: 0,
    gp: 3,
};

function repositoryError(error: unknown): { error: string; status: 400 | 404 | 409 } | null {
    if (!(error instanceof DomainError)) return null;

    switch (error.code) {
        case "NOT_FOUND":
            return { error: error.message, status: 404 };
        case "CONFLICT":
        case "INVALID_STATE":
            return { error: error.message, status: 409 };
        case "VALIDATION":
            return { error: error.message, status: 400 };
        default:
            return null;
    }
}

export function createMatchesRoutes(repositories: Pick<Repositories, "events" | "teams" | "matches">) {
    const { events, teams, matches } = repositories;

    return new Hono()
        .get("/", async (c) => {
            const eventIdParam = c.req.query("eventId");
            const activeEvent = eventIdParam === undefined
                ? await events.findActive()
                : null;
            const eventId = eventIdParam === undefined
                ? activeEvent?.id
                : Number(eventIdParam);

            if (eventId === undefined || !Number.isSafeInteger(eventId) || eventId < 1) {
                return c.json({ matches: [] });
            }

            const result = await matches.listByEvent(eventId);

            return c.json({
                matches: result.map(({ match, team1, team2 }) => ({
                    ...match,
                    team1,
                    team2,
                })),
            });
        })
        .post("/", requireAdmin, async (c) => {
            const body = await c.req.json().catch(() => null);
            const parsed = v.safeParse(createMatchSchema, body);

            if (!parsed.success) {
                const invalidField = parsed.issues[0]?.path?.[0]?.key;
                const errors: Record<string, string> = {
                    eventId: "Invalid event ID",
                    matchNumber: "Invalid match number",
                    team1Id: "Invalid team 1 ID",
                    team2Id: "Invalid team 2 ID",
                };

                return c.json({ error: errors[String(invalidField)] ?? "Invalid request body" }, 400);
            }

            const data = parsed.output;
            const team2Id = data.team2Id ?? null;

            if (team2Id === data.team1Id) {
                return c.json({ error: "A team cannot play against itself" }, 400);
            }

            const firstTeam = await teams.findById(data.team1Id);

            if (!firstTeam) {
                return c.json({ error: "Team 1 not found" }, 404);
            }

            const eventId = data.eventId ?? firstTeam.eventId;

            if (firstTeam.eventId !== eventId) {
                return c.json({ error: "Team 1 does not belong to this event" }, 400);
            }

            const event = await events.findById(eventId);

            if (!event) {
                return c.json({ error: "Event not found" }, 404);
            }

            if (team2Id !== null) {
                const secondTeam = await teams.findById(team2Id);

                if (!secondTeam) {
                    return c.json({ error: "Team 2 not found" }, 404);
                }

                if (secondTeam.eventId !== eventId) {
                    return c.json({ error: "Teams must belong to the same event" }, 400);
                }
            }

            const scheduledAt =
                typeof data.scheduledAt === "string" && data.scheduledAt.trim() !== ""
                    ? data.scheduledAt
                    : null;

            try {
                const created = await matches.create({
                    eventId,
                    matchNumber: data.matchNumber,
                    team1Id: data.team1Id,
                    team2Id,
                    scheduledAt,
                });

                return c.json({ match: created }, 201);
            } catch (error) {
                const mapped = repositoryError(error);

                if (mapped) {
                    return c.json({ error: mapped.error }, mapped.status);
                }

                console.error(error);
                return c.json({ error: "Failed to create match" }, 500);
            }
        })
        .post("/:id/submit", requireSession, async (c) => {
            const matchId = Number(c.req.param("id"));

            if (!Number.isInteger(matchId) || matchId <= 0) {
                return c.json({ error: "Invalid match ID" }, 400);
            }

            const body = await c.req.json().catch(() => null);

            if (!body || typeof body !== "object") {
                return c.json({ error: "Invalid request body" }, 400);
            }

            const { tableNumber, sharedM05, team1, team2 } = body;

            if (!v.safeParse(submitTableNumberSchema, tableNumber).success) {
                return c.json({ error: "Invalid table number" }, 400);
            }

            if (!v.safeParse(sharedM05Schema, sharedM05).success) {
                return c.json({ error: "Invalid M05 value" }, 400);
            }

            const match = await matches.findById(matchId);

            if (!match) {
                return c.json({ error: "Match not found" }, 404);
            }

            if (match.status === "submitted") {
                return c.json({ error: "Match has already been submitted" }, 409);
            }

            const isSubmittedTeam = (value: unknown): value is SubmittedTeam =>
                v.safeParse(submittedTeamSchema, value).success;

            if (!isSubmittedTeam(team1)) {
                return c.json({ error: "Invalid Team 1 data" }, 400);
            }

            if (team1.teamId !== match.team1Id) {
                return c.json({ error: "Team 1 mismatch" }, 400);
            }

            if (match.team2Id !== null) {
                if (!isSubmittedTeam(team2)) {
                    return c.json({ error: "Team 2 data is required" }, 400);
                }

                if (team2.teamId !== match.team2Id) {
                    return c.json({ error: "Team 2 mismatch" }, 400);
                }
            } else if (team2 != null) {
                return c.json({ error: "This is a solo match" }, 400);
            }

            const prepareTeam = (team: SubmittedTeam) => {
                const sheet =
                    team.participation === "no_show"
                        ? emptySheet
                        : { ...team.sheet, m05_haven: sharedM05 };

                const prepared = prepareScoresheet({
                    ...sheet,
                    teamId: team.teamId,
                    matchNumber: match.matchNumber,
                    tableNumber,
                });

                if (!prepared.ok) {
                    return prepared;
                }

                if (prepared.sheet.interference > 3) {
                    return {
                        ok: false as const,
                        error: "Interference cannot exceed 3",
                        status: 400 as const,
                    };
                }

                return {
                    ...prepared,
                    totalScore:
                        team.participation === "no_show"
                            ? 0
                            : prepared.sheet.interference === 3
                              ? 0
                              : prepared.totalScore,
                };
            };

            const prepared1 = prepareTeam(team1);

            if (!prepared1.ok) {
                return c.json({ error: prepared1.error }, prepared1.status);
            }

            const prepared2 = match.team2Id !== null
                ? prepareTeam(team2 as SubmittedTeam)
                : null;

            if (prepared2 && !prepared2.ok) {
                return c.json({ error: prepared2.error }, prepared2.status);
            }

            const timestamp = new Date().toISOString();

            try {
                const result = await matches.submit({
                    matchId,
                    submittedAt: timestamp,
                    team1: {
                        eventId: match.eventId,
                        ...buildScoresheetValues(
                            prepared1.data,
                            prepared1.sheet,
                            prepared1.totalScore,
                        ),
                        submittedAt: timestamp,
                    },
                    team2: prepared2?.ok
                        ? {
                              eventId: match.eventId,
                              ...buildScoresheetValues(
                                  prepared2.data,
                                  prepared2.sheet,
                                  prepared2.totalScore,
                              ),
                              submittedAt: timestamp,
                          }
                        : null,
                });

                return c.json(
                    {
                        message: "Match submitted successfully",
                        matchId,
                        scoresheets: result,
                    },
                    201,
                );
            } catch (error) {
                const mapped = repositoryError(error);

                if (mapped) {
                    return c.json({ error: mapped.error }, mapped.status);
                }

                console.error(error);
                return c.json({ error: "Failed to submit match" }, 500);
            }
        });
}
