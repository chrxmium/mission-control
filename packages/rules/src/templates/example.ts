import type { ScoresheetTemplate } from "../template.js";

export const exampleTemplate: ScoresheetTemplate = {
    id: "example-competition",
    name: "Example Competition",
    description: "A simple custom scoring template.",

    version: 1,
    status: "draft",

    missions: [
        {
            id: "mission-01",
            name: "Object Collection",
            description: "Collect objects and deliver them to forum.",

            fields: [
                {
                    id: "objects_collected",
                    label: "Objects collected",
                    type: "counter",
                    min: 0,
                    max: 10,
                    pointsEach: 10,
                },
                {
                    id: "bonus_completed",
                    label: "Bonus completed",
                    type: "boolean",
                    pointsIfTrue: 25,
                },
            ],
        },
        {
            id: "mission-02",
            name: "Second Challenge",
            description: "Complete the second challenge.",

            fields: [
                {
                    id: "challenge_result",
                    label: "Challenge result",
                    type: "single_choice",
                    options: [
                        {
                            value: "failed",
                            label: "Not completed",
                            points: 0,
                        },
                        {
                            value: "partial",
                            label: "Partially completed",
                            points: 20,
                        },
                        {
                            value: "complete",
                            label: "Fully completed",
                            points: 50,
                        },
                    ],
                },
            ],
        },
    ],
};