import * as v from "valibot";

const positiveInteger = v.pipe(v.number(), v.integer(), v.minValue(1));

export const createMatchSchema = v.object({
    eventId: v.optional(positiveInteger),
    matchNumber: positiveInteger,
    team1Id: positiveInteger,
    team2Id: v.nullish(positiveInteger),
    scheduledAt: v.optional(v.unknown()),
});

export type CreateMatchInput = v.InferOutput<typeof createMatchSchema>;

import type { ScoreSheet } from "@mission-control/rules";

export const submitTableNumberSchema = positiveInteger;
export const sharedM05Schema = v.pipe(v.number(), v.integer(), v.minValue(0));

export const submittedTeamSchema = v.object({
    teamId: v.pipe(v.number(), v.integer()),
    participation: v.picklist(["playing", "no_show"] as const),
    sheet: v.custom<ScoreSheet>((value) => typeof value === "object" && value !== null),
});

export const submitMatchSchema = v.object({
    tableNumber: submitTableNumberSchema,
    sharedM05: sharedM05Schema,
    team1: submittedTeamSchema,
    team2: v.nullish(submittedTeamSchema),
});

export type SubmittedTeam = v.InferOutput<typeof submittedTeamSchema>;
export type SubmitMatchInput = v.InferOutput<typeof submitMatchSchema>;
