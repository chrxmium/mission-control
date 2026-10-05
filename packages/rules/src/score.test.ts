import assert from "node:assert/strict";

import { score } from "./score";
import type { ScoreSheet } from "./types";

const baseSheet: ScoreSheet = {
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

// Normal scoring test
assert.equal(
    score(baseSheet),
    455,
    "Normal score should equal 455"
);

// First interference: -10 points
assert.equal(
    score({
        ...baseSheet,
        interference: 1
    }),
    445,
    "First interference should subtract 10 points"
);

// Second interference: -30 points total
assert.equal(
    score({
        ...baseSheet,
        interference: 2
    }),
    425,
    "Second interference should subtract 30 points"
);

// Third interference: score becomes 0
assert.equal(
    score({
        ...baseSheet,
        interference: 3
    }),
    0,
    "Third interference should make the score 0"
);

// More than three interferences: score remains 0
assert.equal(
    score({
        ...baseSheet,
        interference: 5
    }),
    0,
    "Three or more interferences should make the score 0"
);

// M01 counts should cap at 3
assert.equal(
    score({
        ...baseSheet,

        m01_young_forest: 10,
        m01_grand_tree: 10,
        m01_hollow_tree: 10
    }),
    515,
    "M01 locations should each cap at 3"
);

// M01 bonus should not apply if queen is not knocked down
assert.equal(
    score({
        ...baseSheet,
        m01_queen_knocked_down: false
    }),
    415,
    "M01 bonus should require the queen to be knocked down"
);

// M01 bonus should not apply with fewer than 3 in the Young Forest
assert.equal(
    score({
        ...baseSheet,
        m01_young_forest: 2
    }),
    395,
    "M01 bonus should require 3 species in the Young Forest"
);

// M02 Canopy Chamber should cap at 15
assert.equal(
    score({
        ...baseSheet,
        m02_canopy: 20
    }),
    535,
    "M02 Canopy Chamber should cap at 15"
);

// M03 Waterfall should cap at 50
assert.equal(
    score({
        ...baseSheet,
        m03_waterfall: 100
    }),
    645,
    "M03 Waterfall should cap at 50"
);

// Level Up added should cap at 5
assert.equal(
    score({
        ...baseSheet,
        lu_added: 10
    }),
    515,
    "Level Up added invasive species should cap at 5"
);

// Contained invasive species are not capped
assert.equal(
    score({
        ...baseSheet,
        lu_contained: 10
    }),
    525,
    "Contained invasive species should not be capped"
);

// GP should not affect the score
assert.equal(
    score({
        ...baseSheet,
        gp: 2
    }),
    455,
    "GP rating should not affect match score"
);

assert.equal(
    score({
        ...baseSheet,
        gp: 4
    }),
    455,
    "GP rating should not affect match score"
);

// Score cannot go below 0
const lowScoreSheet: ScoreSheet = {
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

    interference: 1,

    gp: 3
};

assert.equal(
    score(lowScoreSheet),
    0,
    "Score should never go below 0"
);

console.log("All score tests passed.");