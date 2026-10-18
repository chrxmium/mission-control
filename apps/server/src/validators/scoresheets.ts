import * as v from "valibot";

const positiveInteger = v.pipe(v.number(), v.integer(), v.minValue(1));

const nonNegativeInteger = v.pipe(v.number(), v.integer(), v.minValue(0));

const boundedInteger = (maximum: number) =>
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(maximum));

export const scoresheetMetadataSchema = v.object({
    teamId: positiveInteger,
    matchNumber: positiveInteger,
    tableNumber: positiveInteger,
});

export const scoresheetSchema = v.object({
    ...scoresheetMetadataSchema.entries,

    m01_young_forest: boundedInteger(3),
    m01_grand_tree: boundedInteger(3),
    m01_hollow_tree: boundedInteger(3),
    m01_queen_knocked_down: v.boolean(),

    m02_base: nonNegativeInteger,
    m02_canopy: boundedInteger(15),

    m03_waterfall: boundedInteger(50),

    m04_nest: v.boolean(),
    m04_hollow: v.boolean(),

    m05_haven: nonNegativeInteger,

    lu_added: boundedInteger(5),
    lu_contained: nonNegativeInteger,

    interference: nonNegativeInteger,

    gp: v.picklist([2, 3, 4] as const),
});

export type ScoresheetBody = v.InferOutput<typeof scoresheetSchema>;
