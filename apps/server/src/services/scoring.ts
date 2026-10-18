import * as v from "valibot";
import { eq } from "drizzle-orm";
import { score, type ScoreSheet } from "@mission-control/rules";

import { db } from "../db/index.js";
import { teams } from "../db/schema.js";
import {
    scoresheetMetadataSchema,
    scoresheetSchema,
    type ScoresheetBody,
} from "../validators/scoresheets.js";

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
    if (typeof body !== "object" || body === null) {
        return {
            ok: false,
            error: "Invalid scoresheet body",
            status: 400,
        };
    }

    const metadata = v.safeParse(scoresheetMetadataSchema, body);

    if (!metadata.success) {
        return {
            ok: false,
            error: "Invalid scoresheet metadata",
            status: 400,
        };
    }

    const parsed = v.safeParse(scoresheetSchema, body);

    if (!parsed.success) {
        return {
            ok: false,
            error: "Invalid scoresheet data",
            status: 400,
        };
    }

    const data = parsed.output;

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
