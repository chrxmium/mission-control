import type { ScoreSheet } from "../../../../packages/rules/src/types.ts";

export const createDefaultScoreSheet = (): ScoreSheet => ({
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
});