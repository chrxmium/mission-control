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


    return total;

}