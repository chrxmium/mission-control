import * as v from "valibot";

const positiveInteger = v.pipe(v.number(), v.integer(), v.minValue(1));

export const createMatchSchema = v.object({
    matchNumber: positiveInteger,
    team1Id: positiveInteger,
    team2Id: v.nullish(positiveInteger),
    scheduledAt: v.optional(v.unknown()),
});

export type CreateMatchInput = v.InferOutput<typeof createMatchSchema>;
