import { eq } from "drizzle-orm";
import { score, type ScoreSheet } from "@mission-control/rules";

import { db } from "../db/index.js";
import { teams } from "../db/schema.js";

const isIntegerInRange = (value: unknown, max?: number) => {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        return false;
    }

    return !(max !== undefined && value > max);
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

const validateScoresheetBody = (body: unknown): string | null => {
    if (typeof body !== "object" || body === null) {
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
        ![2, 3, 4].includes(data.gp as number)
    ) {
        return "Invalid scoresheet data";
    }

    return null;
};

const buildScoreSheet = (body: ScoresheetBody): ScoreSheet => ({
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
});

export const buildScoresheetValues = (
    body: ScoresheetBody,
    sheet: ScoreSheet,
    totalScore: number,
) => ({
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

export const prepareScoresheet = (body: unknown): PreparedScoresheet => {
    const validationError = validateScoresheetBody(body);

    if (validationError) {
        return {
            ok: false,
            error: validationError,
            status: 400,
        };
    }

    const data = body as ScoresheetBody;

    const team = db.select().from(teams).where(eq(teams.id, data.teamId)).get();

    if (!team) {
        return {
            ok: false,
            error: "Team not found",
            status: 404,
        };
    }

    const sheet = buildScoreSheet(data);

    const totalScore = score(sheet);

    return {
        ok: true,
        data,
        sheet,
        totalScore,
    };
};
