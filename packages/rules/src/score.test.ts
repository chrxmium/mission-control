import assert from "node:assert/strict";

import { score } from "./score";
import type { ScoreSheet } from "./types";

const sample: ScoreSheet = {
    m01_young_forest: 3,
    m01_grand_tree: 2,
    m01_hollow_tree: 1,
    m01_queen_knocked_down: true,

    m02_base: 4,
    m02_canopy: 7,

    m03_waterfall: 12,

    m04_nest: true,
    m04_hollow: true,

    m05_haven: 5,

    lu_added: 2,
    lu_contained: 3,

    interference: 0,
    gp: 3
};

assert.equal(score(sample), 455);

console.log("All score tests passed.");