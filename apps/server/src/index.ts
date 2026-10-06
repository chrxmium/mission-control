import "dotenv/config";
import { db } from "./db";
import { scoresheets, teams } from "./db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { score } from "../../../packages/rules/src/score";
import type { ScoreSheet } from "../../../packages/rules/src/types";

const isNonNegativeInteger = (value: unknown) =>
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0;

const app = new Hono();

const adminToken = process.env.ADMIN_TOKEN;

if (!adminToken) {
    throw new Error("ADMIN_TOKEN is not set");
}

// GET endpoint requests
app.get("/health", (c) => {
    return c.json({ ok: true });
});

app.get("/api/v1/teams", (c) => {
    const result = db.select().from(teams).all();

    return c.json({
        teams: result,
    });
});

app.get("/api/v1/teams/:id", (c) => {
    const id = Number(c.req.param("id"));

    const team = db
        .select()
        .from(teams)
        .where(eq(teams.id, id))
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

app.get("/api/v1/scoresheets", (c) => {
    const result = db
        .select()
        .from(scoresheets)
        .all();

    return c.json({
        scoresheets: result,
    });
});

app.get("/api/v1/scoresheets/:id", (c) => {
    const id = Number(c.req.param("id"));

    const scoresheet = db
        .select()
        .from(scoresheets)
        .where(eq(scoresheets.id, id))
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
});

// POST endpoint requests

app.post("/api/v1/teams", async (c) => {
    const authorisation = c.req.header("Authorization");

    if (authorisation !== `Bearer ${adminToken}`) {
        return c.json(
            {
                error: "Unauthorised",
            },
            401,
        );
    }

    const body = await c.req.json();

    if (
        typeof body.number !== "number" ||
        !Number.isInteger(body.number) ||
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
});

app.post("/api/v1/scoresheets", async (c) => {
    const authorisation = c.req.header("Authorization");

    if (authorisation !== `Bearer ${adminToken}`) {
        return c.json(
            {
                error: "Unauthorised",
            },
            401,
        );
    }

    const body = await c.req.json();

    if (
        typeof body.teamId !== "number" ||
        !Number.isInteger(body.teamId) ||
        body.teamId <= 0 ||
        typeof body.matchNumber !== "number" ||
        !Number.isInteger(body.matchNumber) ||
        body.matchNumber <= 0 ||
        typeof body.tableNumber !== "number" ||
        !Number.isInteger(body.tableNumber) ||
        body.tableNumber <= 0
    ) {
        return c.json(
            {
                error: "Invalid scoresheet metadata",
            },
            400,
        );
    }

    if (
        !isNonNegativeInteger(body.m01_young_forest) ||
        !isNonNegativeInteger(body.m01_grand_tree) ||
        !isNonNegativeInteger(body.m01_hollow_tree) ||
        typeof body.m01_queen_knocked_down !== "boolean" ||
        !isNonNegativeInteger(body.m02_base) ||
        !isNonNegativeInteger(body.m02_canopy) ||
        !isNonNegativeInteger(body.m03_waterfall) ||
        typeof body.m04_nest !== "boolean" ||
        typeof body.m04_hollow !== "boolean" ||
        !isNonNegativeInteger(body.m05_haven) ||
        !isNonNegativeInteger(body.lu_added) ||
        !isNonNegativeInteger(body.lu_contained) ||
        !isNonNegativeInteger(body.interference) ||
        ![2, 3, 4].includes(body.gp)
    ) {
        return c.json(
            {
                error: "Invalid scoresheet data",
            },
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
            {
                error: "Team not found",
            },
            404,
        );
    }

    const sheet: ScoreSheet = {
        m01_young_forest: body.m01_young_forest,
        m01_grand_tree: body.m01_grand_tree,
        m01_hollow_tree: body.m01_hollow_tree,
        m01_queen_knocked_down: body.m01_queen_knocked_down,

        m02_base: body.m02_base,
        m02_canopy: body.m02_canopy,

        m03_waterfall: body.m03_waterfall,

        m04_nest: body.m04_nest,
        m04_hollow: body.m04_hollow,

        m05_haven: body.m05_haven,

        lu_added: body.lu_added,
        lu_contained: body.lu_contained,

        interference: body.interference,

        gp: body.gp,
    };

    const totalScore = score(sheet);

    try {
        const newScoresheet = db
            .insert(scoresheets)
            .values({
                teamId: body.teamId,
                matchNumber: body.matchNumber,
                tableNumber: body.tableNumber,

                m01YoungForest: sheet.m01_young_forest,
                m01GrandTree: sheet.m01_grand_tree,
                m01HollowTree: sheet.m01_hollow_tree,
                m01QueenKnockedDown: sheet.m01_queen_knocked_down,

                m02Base: sheet.m02_base,
                m02Canopy: sheet.m02_canopy,

                m03Waterfall: sheet.m03_waterfall,

                m04Nest: sheet.m04_nest,
                m04Hollow: sheet.m04_hollow,

                m05Haven: sheet.m05_haven,

                luAdded: sheet.lu_added,
                luContained: sheet.lu_contained,

                interference: sheet.interference,
                gp: sheet.gp,

                totalScore,
                submittedAt: new Date().toISOString(),
            })
            .returning()
            .get();

        return c.json(
            {
                scoresheet: newScoresheet,
            },
            201,
        );
    } catch (error) {
        console.error(error);

        return c.json(
            {
                error: "Failed to create scoresheet",
            },
            500,
        );
    }
});

serve({
    fetch: app.fetch,
    port: 3001,
});