import "dotenv/config";

import { serve } from "@hono/node-server";
import {
    avg,
    count,
    desc,
    eq,
    max,
} from "drizzle-orm";
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

            teamId: teams.id,
            teamNumber: teams.number,
            teamName: teams.name,
        })
        .from(matches)
        .innerJoin(
            teams,
            eq(matches.teamId, teams.id),
        )
        .orderBy(matches.matchNumber)
        .all();

    return c.json({
        matches: result,
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
            typeof body.teamId !== "number" ||
            !Number.isInteger(body.teamId) ||
            body.teamId <= 0
        ) {
            return c.json(
                { error: "Invalid team ID" },
                400,
            );
        }

        const team = db
            .select()
            .from(teams)
            .where(eq(teams.id, body.teamId))
            .get();

        if (!team) {
            return c.json(
                { error: "Team not found" },
                404,
            );
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
                    teamId: body.teamId,
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
                            "This team is already scheduled for that match",
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

serve({
    fetch: app.fetch,
    port: 3001,
});