import "dotenv/config";

import { serve } from "@hono/node-server";
import {
    avg,
    count,
    desc,
    eq,
    max,
} from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";

import { score } from "../../../packages/rules/src/score";
import type { ScoreSheet } from "../../../packages/rules/src/types";

import { db } from "./db";
import {
    matches,
    scoresheets,
    teams,
} from "./db/schema";

const app = new Hono();

const team1 = alias(teams, "team1");
const team2 = alias(teams, "team2");

app.use(
    "/api/*",
    cors({
        origin: "http://localhost:5173",
        allowHeaders: [
            "Content-Type",
            "Authorization",
        ],
        allowMethods: [
            "GET",
            "POST",
            "PATCH",
            "OPTIONS",
        ],
    }),
);

const isIntegerInRange = (
    value: unknown,
    max?: number,
) => {
    if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 0
    ) {
        return false;
    }

    return !(max !== undefined &&
        value > max);
};

type ScoresheetBody = {
    teamId: number;
    matchNumber: number;
    tableNumber: number;

    m01_young_forest: number;
    m01_grand_tree: number;
    m01_hollow_tree: number;
    m01_queen_knocked_down: boolean;

    m02_base: number;
    m02_canopy: number;

    m03_waterfall: number;

    m04_nest: boolean;
    m04_hollow: boolean;

    m05_haven: number;

    lu_added: number;
    lu_contained: number;

    interference: number;

    gp: 2 | 3 | 4;
};

const validateScoresheetBody = (
    body: unknown,
): string | null => {
    if (
        typeof body !== "object" ||
        body === null
    ) {
        return "Invalid scoresheet body";
    }

    const data = body as Record<string, unknown>;

    if (
        typeof data.teamId !== "number" ||
        !Number.isInteger(data.teamId) ||
        data.teamId <= 0 ||
        typeof data.matchNumber !== "number" ||
        !Number.isInteger(data.matchNumber) ||
        data.matchNumber <= 0 ||
        typeof data.tableNumber !== "number" ||
        !Number.isInteger(data.tableNumber) ||
        data.tableNumber <= 0
    ) {
        return "Invalid scoresheet metadata";
    }

    if (
        !isIntegerInRange(data.m01_young_forest, 3) ||
        !isIntegerInRange(data.m01_grand_tree, 3) ||
        !isIntegerInRange(data.m01_hollow_tree, 3) ||
        typeof data.m01_queen_knocked_down !== "boolean" ||

        !isIntegerInRange(data.m02_base) ||
        !isIntegerInRange(data.m02_canopy, 15) ||

        !isIntegerInRange(data.m03_waterfall, 50) ||

        typeof data.m04_nest !== "boolean" ||
        typeof data.m04_hollow !== "boolean" ||

        !isIntegerInRange(data.m05_haven) ||

        !isIntegerInRange(data.lu_added, 5) ||
        !isIntegerInRange(data.lu_contained) ||

        !isIntegerInRange(data.interference) ||

        ![2, 3, 4].includes(
            data.gp as number,
        )
    ) {
        return "Invalid scoresheet data";
    }

    return null;
};

const buildScoreSheet = (
    body: ScoresheetBody,
): ScoreSheet => ({
    m01_young_forest:
    body.m01_young_forest,

    m01_grand_tree:
    body.m01_grand_tree,

    m01_hollow_tree:
    body.m01_hollow_tree,

    m01_queen_knocked_down:
    body.m01_queen_knocked_down,

    m02_base:
    body.m02_base,

    m02_canopy:
    body.m02_canopy,

    m03_waterfall:
    body.m03_waterfall,

    m04_nest:
    body.m04_nest,

    m04_hollow:
    body.m04_hollow,

    m05_haven:
    body.m05_haven,

    lu_added:
    body.lu_added,

    lu_contained:
    body.lu_contained,

    interference:
    body.interference,

    gp:
    body.gp,
});

const buildScoresheetValues = (
    body: ScoresheetBody,
    sheet: ScoreSheet,
    totalScore: number,
) => ({
    teamId:
    body.teamId,

    matchNumber:
    body.matchNumber,

    tableNumber:
    body.tableNumber,

    m01YoungForest:
    sheet.m01_young_forest,

    m01GrandTree:
    sheet.m01_grand_tree,

    m01HollowTree:
    sheet.m01_hollow_tree,

    m01QueenKnockedDown:
    sheet.m01_queen_knocked_down,

    m02Base:
    sheet.m02_base,

    m02Canopy:
    sheet.m02_canopy,

    m03Waterfall:
    sheet.m03_waterfall,

    m04Nest:
    sheet.m04_nest,

    m04Hollow:
    sheet.m04_hollow,

    m05Haven:
    sheet.m05_haven,

    luAdded:
    sheet.lu_added,

    luContained:
    sheet.lu_contained,

    interference:
    sheet.interference,

    gp:
    sheet.gp,

    totalScore,
});

type PreparedScoresheet =
    | {
    ok: true;
    data: ScoresheetBody;
    sheet: ScoreSheet;
    totalScore: number;
}
    | {
    ok: false;
    error: string;
    status: 400 | 404;
};

const prepareScoresheet = (
    body: unknown,
): PreparedScoresheet => {
    const validationError =
        validateScoresheetBody(body);

    if (validationError) {
        return {
            ok: false,
            error: validationError,
            status: 400,
        };
    }

    const data =
        body as ScoresheetBody;

    const team = db
        .select()
        .from(teams)
        .where(
            eq(
                teams.id,
                data.teamId,
            ),
        )
        .get();

    if (!team) {
        return {
            ok: false,
            error: "Team not found",
            status: 404,
        };
    }

    const sheet =
        buildScoreSheet(data);

    const totalScore =
        score(sheet);

    return {
        ok: true,
        data,
        sheet,
        totalScore,
    };
};

const isSqliteUniqueConstraintError = (
    error: unknown,
) =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE";

const adminToken = process.env.ADMIN_TOKEN;

if (!adminToken) {
    throw new Error("ADMIN_TOKEN is not set");
}

const requireAdmin: MiddlewareHandler = async (
    c,
    next,
) => {
    const authorisation =
        c.req.header("Authorization");

    if (
        authorisation !==
        `Bearer ${adminToken}`
    ) {
        return c.json(
            {
                error: "Unauthorised",
            },
            401,
        );
    }

    await next();
};

// GET endpoint requests

app.get("/health", (c) => {
    return c.json({
        ok: true,
    });
});

app.get("/api/v1/teams", (c) => {
    const result = db
        .select()
        .from(teams)
        .all();

    return c.json({
        teams: result,
    });
});

app.get("/api/v1/teams/:id", (c) => {
    const id = Number(
        c.req.param("id"),
    );

    const team = db
        .select()
        .from(teams)
        .where(
            eq(
                teams.id,
                id,
            ),
        )
        .get();

    if (!team) {
        return c.json(
            {
                error: "Team not found",
            },
            404,
        );
    }

    return c.json({
        team,
    });
});

app.get(
    "/api/v1/scoresheets",
    (c) => {
        const result = db
            .select()
            .from(scoresheets)
            .all();

        return c.json({
            scoresheets: result,
        });
    },
);

app.get(
    "/api/v1/scoresheets/:id",
    (c) => {
        const id = Number(
            c.req.param("id"),
        );

        const scoresheet = db
            .select()
            .from(scoresheets)
            .where(
                eq(
                    scoresheets.id,
                    id,
                ),
            )
            .get();

        if (!scoresheet) {
            return c.json(
                {
                    error: "Scoresheet not found",
                },
                404,
            );
        }

        return c.json({
            scoresheet,
        });
    },
);

app.get("/api/v1/rankings", (c) => {
    const result = db
        .select({
            teamId: teams.id,
            teamNumber: teams.number,
            teamName: teams.name,
            matches: count(scoresheets.id),
            averageScore: avg(
                scoresheets.totalScore,
            ),
            highScore: max(
                scoresheets.totalScore,
            ),
        })
        .from(teams)
        .leftJoin(
            scoresheets,
            eq(
                teams.id,
                scoresheets.teamId,
            ),
        )
        .groupBy(
            teams.id,
        )
        .orderBy(
            desc(
                avg(
                    scoresheets.totalScore,
                ),
            ),
        )
        .all();

    const rankings = result.map(
        (team, index) => ({
            rank:
                team.matches > 0
                    ? index + 1
                    : null,

            teamId:
            team.teamId,

            teamNumber:
            team.teamNumber,

            teamName:
            team.teamName,

            matches:
            team.matches,

            averageScore:
                team.averageScore !== null
                    ? Number(
                        team.averageScore,
                    )
                    : null,

            highScore:
            team.highScore,
        }),
    );

    return c.json({
        rankings,
    });
});

app.get("/api/v1/matches", (c) => {
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
    .innerJoin(
        team1,
        eq(matches.team1Id, team1.id),
    )
    .leftJoin(
        team2,
        eq(matches.team2Id, team2.id),
    )
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

// POST endpoint requests

app.post(
    "/api/v1/teams",
    requireAdmin,
    async (c) => {
        const body =
            await c.req.json();

        if (
            typeof body.number !== "number" ||
            !Number.isInteger(
                body.number,
            ) ||
            body.number <= 0 ||
            typeof body.name !== "string" ||
            body.name.trim().length <= 0
        ) {
            return c.json(
                {
                    error: "Invalid request body",
                },
                400,
            );
        }

        try {
            const newTeam = db
                .insert(teams)
                .values({
                    number: body.number,
                    name: body.name.trim(),
                })
                .returning()
                .get();

            return c.json(
                {
                    team: newTeam,
                },
                201,
            );
        } catch (error) {
            console.error(error);

            return c.json(
                {
                    error: "Team number already exists",
                },
                409,
            );
        }
    },
);

app.post(
    "/api/v1/scoresheets",
    requireAdmin,
    async (c) => {
        const body =
            await c.req.json();

        const prepared =
            prepareScoresheet(body);

        if (!prepared.ok) {
            return c.json(
                {
                    error: prepared.error,
                },
                prepared.status,
            );
        }

        const {
            data,
            sheet,
            totalScore,
        } = prepared;

        try {
            const newScoresheet = db
                .insert(scoresheets)
                .values({
                    ...buildScoresheetValues(
                        data,
                        sheet,
                        totalScore,
                    ),

                    submittedAt:
                        new Date().toISOString(),
                })
                .returning()
                .get();

            return c.json(
                {
                    scoresheet:
                    newScoresheet,
                },
                201,
            );
        } catch (error) {
            if (isSqliteUniqueConstraintError(error)) {
                return c.json(
                    {
                        error: "Scoresheet already exists for this team and match",
                    },
                    409,
                );
            }

            console.error(error);

            return c.json(
                {
                    error: "Failed to save scoresheet",
                },
                500,
            );
        }
    },
);

app.patch(
    "/api/v1/scoresheets/:id",
    requireAdmin,
    async (c) => {
        const id =
            Number(c.req.param("id"));

        // existing ID / existence checks

        const body =
            await c.req.json();

        const prepared =
            prepareScoresheet(body);

        if (!prepared.ok) {
            return c.json(
                {
                    error: prepared.error,
                },
                prepared.status,
            );
        }

        const {
            data,
            sheet,
            totalScore,
        } = prepared;

        try {
            const updatedScoresheet = db
                .update(scoresheets)
                .set(
                    buildScoresheetValues(
                        data,
                        sheet,
                        totalScore,
                    ),
                )
                .where(
                    eq(
                        scoresheets.id,
                        id,
                    ),
                )
                .returning()
                .get();

            return c.json({
                scoresheet:
                updatedScoresheet,
            });
        } catch (error) {
            if (isSqliteUniqueConstraintError(error)) {
                return c.json(
                    {
                        error: "Scoresheet already exists for this team and match",
                    },
                    409,
                );
            }

            console.error(error);

            return c.json(
                {
                    error: "Failed to save scoresheet",
                },
                500,
            );
        }
    },
);

app.post(
    "/api/v1/matches",
    requireAdmin,
    async (c) => {
        const body = await c.req.json();

        if (
            typeof body.matchNumber !== "number" ||
            !Number.isInteger(body.matchNumber) ||
            body.matchNumber <= 0
        ) {
            return c.json(
                { error: "Invalid match number" },
                400,
            );
        }

        if (
            typeof body.team1Id !== "number" ||
            !Number.isInteger(body.team1Id) ||
            body.team1Id <= 0
        ) {
            return c.json(
                { error: "Invalid team 1 ID" },
                400,
            );
        }

        const team2Id = body.team2Id ?? null;

        if (
            team2Id !== null &&
            (
                typeof team2Id !== "number" ||
                !Number.isInteger(team2Id) ||
                team2Id <= 0
            )
        ) {
            return c.json(
                { error: "Invalid team 2 ID" },
                400,
            );
        }

        if (team2Id === body.team1Id) {
            return c.json(
                {
                    error:
                        "A team cannot play against itself",
                },
                400,
            );
        }

        const firstTeam = db
            .select()
            .from(teams)
            .where(eq(teams.id, body.team1Id))
            .get();

        if (!firstTeam) {
            return c.json(
                { error: "Team 1 not found" },
                404,
            );
        }

        if (team2Id !== null) {
            const secondTeam = db
                .select()
                .from(teams)
                .where(eq(teams.id, team2Id))
                .get();

            if (!secondTeam) {
                return c.json(
                    { error: "Team 2 not found" },
                    404,
                );
            }
        }

        const scheduledAt =
            typeof body.scheduledAt === "string" &&
            body.scheduledAt.trim() !== ""
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

            return c.json(
                { match: created },
                201,
            );
        } catch (error) {
            if (
                isSqliteUniqueConstraintError(error)
            ) {
                return c.json(
                    {
                        error:
                            "Match number already exists",
                    },
                    409,
                );
            }

            console.error(error);

            return c.json(
                { error: "Failed to create match" },
                500,
            );
        }
    },
);

app.post(
    "/api/v1/matches/:id/submit",
    requireAdmin,
    async (c) => {
        const matchId = Number(c.req.param("id"));

        if (!Number.isInteger(matchId) || matchId <= 0) {
            return c.json({ error: "Invalid match ID" }, 400);
        }

        const body = await c.req.json().catch(() => null);

        if (!body || typeof body !== "object") {
            return c.json({ error: "Invalid request body" }, 400);
        }

        const { tableNumber, sharedM05, team1, team2 } = body;

        if (
            !Number.isInteger(tableNumber) ||
            tableNumber <= 0
        ) {
            return c.json({ error: "Invalid table number" }, 400);
        }

        if (
            !Number.isInteger(sharedM05) ||
            sharedM05 < 0
        ) {
            return c.json({ error: "Invalid M05 value" }, 400);
        }

        const match = db
            .select()
            .from(matches)
            .where(eq(matches.id, matchId))
            .get();

        if (!match) {
            return c.json({ error: "Match not found" }, 404);
        }

        if (match.status === "submitted") {
            return c.json(
                { error: "Match has already been submitted" },
                409,
            );
        }

        type SubmittedTeam = {
            teamId: number;
            participation: "playing" | "no_show";
            sheet: ScoreSheet;
        };

        const isSubmittedTeam = (
            value: unknown,
        ): value is SubmittedTeam => {
            if (typeof value !== "object" || value === null) {
                return false;
            }

            const data = value as Record<string, unknown>;

            return (
                typeof data.teamId === "number" &&
                Number.isInteger(data.teamId) &&
                (
                    data.participation === "playing" ||
                    data.participation === "no_show"
                ) &&
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
                return c.json(
                    { error: "Team 2 data is required" },
                    400,
                );
            }

            if (team2.teamId !== match.team2Id) {
                return c.json({ error: "Team 2 mismatch" }, 400);
            }
        } else if (team2 != null) {
            return c.json(
                { error: "This is a solo match" },
                400,
            );
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
            return c.json(
                { error: prepared1.error },
                prepared1.status,
            );
        }

        const prepared2 =
            match.team2Id !== null
                ? prepareTeam(team2 as SubmittedTeam)
                : null;

        if (prepared2 && !prepared2.ok) {
            return c.json(
                { error: prepared2.error },
                prepared2.status,
            );
        }

        try {
            const result = db.transaction((tx) => {
                const currentMatch = tx
                    .select()
                    .from(matches)
                    .where(eq(matches.id, matchId))
                    .get();

                if (
                    !currentMatch ||
                    currentMatch.status === "submitted"
                ) {
                    throw new Error("MATCH_ALREADY_SUBMITTED");
                }

                const timestamp = new Date().toISOString();

                const firstScoresheet = tx
                    .insert(scoresheets)
                    .values({
                        ...buildScoresheetValues(
                            prepared1.data,
                            prepared1.sheet,
                            prepared1.totalScore,
                        ),
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

                tx.update(matches)
                    .set({ status: "submitted" })
                    .where(eq(matches.id, matchId))
                    .run();

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
            if (
                error instanceof Error &&
                error.message === "MATCH_ALREADY_SUBMITTED"
            ) {
                return c.json(
                    { error: "Match has already been submitted" },
                    409,
                );
            }

            if (isSqliteUniqueConstraintError(error)) {
                return c.json(
                    { error: "Scoresheet already exists" },
                    409,
                );
            }

            console.error(error);

            return c.json(
                { error: "Failed to submit match" },
                500,
            );
        }
    },
);

serve({
    fetch: app.fetch,
    port: 3001,
});