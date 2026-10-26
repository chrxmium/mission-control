import * as v from "valibot";

export const createTeamSchema = v.object({
    eventId: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    number: v.pipe(v.number(), v.integer(), v.minValue(1)),
    name: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type CreateTeamInput = v.InferOutput<typeof createTeamSchema>;
