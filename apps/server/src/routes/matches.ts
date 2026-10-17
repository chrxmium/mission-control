import { isSqliteUniqueConstraintError } from "../utils/sqlite.js";
import type { ScoreSheet } from "@mission-control/rules";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { db } from "../db/index.js";
import { matches, scoresheets, teams } from "../db/schema.js";
import { requireSession } from "../middleware/referee-auth.js";
import { buildScoresheetValues, prepareScoresheet } from "../services/scoring.js";

export const matchesRoutes = new Hono();

const team1 = alias(teams, "team1");
const team2 = alias(teams, "team2");

matchesRoutes.get("/", (c) => {
    const result = db
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
        .from(matches)
        .innerJoin(team1, eq(matches.team1Id, team1.id))
        .leftJoin(team2, eq(matches.team2Id, team2.id))
        .orderBy(matches.matchNumber)
        .all();

    const formatted = result.map((match) => ({
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
            match.team2Id === null
                ? null
                : {
                      id: match.team2Id,
                      number: match.team2Number,
                      name: match.team2Name,
                  },
    }));

    return c.json({
        matches: formatted,
    });
});

matchesRoutes.post("/", requireAdmin, async (c) => {
    const body = await c.req.json();

    if (
        typeof body.matchNumber !== "number" ||
        !Number.isInteger(body.matchNumber) ||
        body.matchNumber <= 0
    ) {
        return c.json({ error: "Invalid match number" }, 400);
    }

    if (typeof body.team1Id !== "number" || !Number.isInteger(body.team1Id) || body.team1Id <= 0) {
        return c.json({ error: "Invalid team 1 ID" }, 400);
    }

    const team2Id = body.team2Id ?? null;

    if (
        team2Id !== null &&
        (typeof team2Id !== "number" || !Number.isInteger(team2Id) || team2Id <= 0)
    ) {
        return c.json({ error: "Invalid team 2 ID" }, 400);
    }

    if (team2Id === body.team1Id) {
        return c.json(
            {
                error: "A team cannot play against itself",
            },
            400,
        );
    }

    const firstTeam = db.select().from(teams).where(eq(teams.id, body.team1Id)).get();

    if (!firstTeam) {
        return c.json({ error: "Team 1 not found" }, 404);
    }

    if (team2Id !== null) {
        const secondTeam = db.select().from(teams).where(eq(teams.id, team2Id)).get();

        if (!secondTeam) {
            return c.json({ error: "Team 2 not found" }, 404);
        }
    }

    const scheduledAt =
        typeof body.scheduledAt === "string" && body.scheduledAt.trim() !== ""
            ? body.scheduledAt
            : null;

    try {
        const created = db
            .insert(matches)
            .values({
                matchNumber: body.matchNumber,
                team1Id: body.team1Id,
                team2Id,
                scheduledAt,
                status: "upcoming",
            })
            .returning()
            .get();

        return c.json({ match: created }, 201);
    } catch (error) {
        if (isSqliteUniqueConstraintError(error)) {
            return c.json(
                {
                    error: "Match number already exists",
                },
                409,
            );
        }

        console.error(error);

        return c.json({ error: "Failed to create match" }, 500);
    }
});

matchesRoutes.post("/:id/submit", requireSession, async (c) => {
    const matchId = Number(c.req.param("id"));

    if (!Number.isInteger(matchId) || matchId <= 0) {
        return c.json({ error: "Invalid match ID" }, 400);
    }

    const body = await c.req.json().catch(() => null);

    if (!body || typeof body !== "object") {
        return c.json({ error: "Invalid request body" }, 400);
    }

    const { tableNumber, sharedM05, team1, team2 } = body;

    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
        return c.json({ error: "Invalid table number" }, 400);
    }

    if (!Number.isInteger(sharedM05) || sharedM05 < 0) {
        return c.json({ error: "Invalid M05 value" }, 400);
    }

    const match = db.select().from(matches).where(eq(matches.id, matchId)).get();

    if (!match) {
        return c.json({ error: "Match not found" }, 404);
    }

    if (match.status === "submitted") {
        return c.json({ error: "Match has already been submitted" }, 409);
    }

    type SubmittedTeam = {
        teamId: number;
        participation: "playing" | "no_show";
        sheet: ScoreSheet;
    };

    const isSubmittedTeam = (value: unknown): value is SubmittedTeam => {
        if (typeof value !== "object" || value === null) {
            return false;
        }

        const data = value as Record<string, unknown>;

        return (
            typeof data.teamId === "number" &&
            Number.isInteger(data.teamId) &&
            (data.participation === "playing" || data.participation === "no_show") &&
            typeof data.sheet === "object" &&
            data.sheet !== null
        );
    };

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

    // used when team no show
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

    const prepareTeam = (team: SubmittedTeam) => {
        const sheet =
            team.participation === "no_show"
                ? emptySheet
                : {
                      ...team.sheet,
                      m05_haven: sharedM05,
                  };

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

    const prepared2 = match.team2Id !== null ? prepareTeam(team2 as SubmittedTeam) : null;

    if (prepared2 && !prepared2.ok) {
        return c.json({ error: prepared2.error }, prepared2.status);
    }

    try {
        const result = db.transaction((tx) => {
            const currentMatch = tx.select().from(matches).where(eq(matches.id, matchId)).get();

            if (!currentMatch || currentMatch.status === "submitted") {
                throw new Error("MATCH_ALREADY_SUBMITTED");
            }

            const timestamp = new Date().toISOString();

            const firstScoresheet = tx
                .insert(scoresheets)
                .values({
                    ...buildScoresheetValues(prepared1.data, prepared1.sheet, prepared1.totalScore),
                    submittedAt: timestamp,
                })
                .returning()
                .get();

            let secondScoresheet = null;

            if (prepared2?.ok) {
                secondScoresheet = tx
                    .insert(scoresheets)
                    .values({
                        ...buildScoresheetValues(
                            prepared2.data,
                            prepared2.sheet,
                            prepared2.totalScore,
                        ),
                        submittedAt: timestamp,
                    })
                    .returning()
                    .get();
            }

            tx.update(matches).set({ status: "submitted" }).where(eq(matches.id, matchId)).run();

            return {
                team1: firstScoresheet,
                team2: secondScoresheet,
            };
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
        if (error instanceof Error && error.message === "MATCH_ALREADY_SUBMITTED") {
            return c.json({ error: "Match has already been submitted" }, 409);
        }

        if (isSqliteUniqueConstraintError(error)) {
            return c.json({ error: "Scoresheet already exists" }, 409);
        }

        console.error(error);

        return c.json({ error: "Failed to submit match" }, 500);
    }
});
