import type { ScoreSheet } from "./types";

export function score(sheet: ScoreSheet): number {
    let total = 0;

    // M01 - Mighty Microbiomes

    // Each keystone species in the Young Forest is worth 20 points.
    // There can be a maximum of 3.
    total += Math.min(sheet.m01_young_forest, 3) * 20;

    // Each keystone species in the Grand Tree is worth 20 points.
    // Maximum of 3.
    total += Math.min(sheet.m01_grand_tree, 3) * 20;

    // Each keystone species in the Hollow Tree is worth 20 points.
    // Maximum of 3.
    total += Math.min(sheet.m01_hollow_tree, 3) * 20;

    // Bonus: all 3 species must be in the Young Forest
    // AND the invasive queen must be knocked down.
    if (
        sheet.m01_young_forest >= 3 &&
        sheet.m01_queen_knocked_down
    ) {
        total += 40;
    }

    // M02 - Roots of Renewal

    // Each resource in the Grand Tree base is worth 5 points.
    // No maximum.
    total += sheet.m02_base * 5;

    // Each resource in the Canopy Chamber is worth 10 points.
    // Maximum of 15.
    total += Math.min(sheet.m02_canopy, 15) * 10;

    // M03 - Cave Waterfall

    // Each keystone species in the Waterfall is worth 5 points.
    // Maximum of 50
    total += Math.min(sheet.m03_waterfall, 50) * 5;

    // M04 - Rainforest Awakening

    // If all keystone species are released from the nest,
    // award 30 points.
    if (sheet.m04_nest) {
        total += 30;
    }

    // If all keystone species are released from the hollow,
    // award 20 points.
    if (sheet.m04_hollow) {
        total += 20;
    }

    // M05 - Central Haven

    // Each keystone species or resource resting completely
    // in the Central Haven is worth 5 points.

    total += sheet.m05_haven * 5;

    // Level Up Challenge - Invasive Attack

    // Each invasive species added before the match is worth 20 points.
    // Maximum of 5.
    total += Math.min(sheet.lu_added, 5) * 20;

    // Each invasive species contained during the match is worth 10 points.
    // No maximum.
    total += sheet.lu_contained * 10;

    return total;

}