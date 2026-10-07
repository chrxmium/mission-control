import {
    integer,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
    id: integer("id").primaryKey({
        autoIncrement: true,
    }),

    number: integer("number")
        .notNull()
        .unique(),

    name: text("name")
        .notNull(),
});

export const matches = sqliteTable(
    "matches",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),

        matchNumber: integer("match_number").notNull(),

        teamId: integer("team_id")
            .notNull()
            .references(() => teams.id),

        scheduledAt: text("scheduled_at"),

        status: text("status")
            .notNull()
            .default("upcoming"),
    },
    (table) => ({
        matchTeamUnique: uniqueIndex(
            "matches_match_team_unique",
        ).on(
            table.matchNumber,
            table.teamId,
        ),
    }),
);

export const scoresheets = sqliteTable(
    "scoresheets",
    {
        id: integer("id").primaryKey({
            autoIncrement: true,
        }),

        teamId: integer("team_id")
            .notNull()
            .references(() => teams.id),

        matchNumber: integer("match_number")
            .notNull(),

        tableNumber: integer("table_number")
            .notNull(),

        // M01 - Mighty Microbiomes
        m01YoungForest: integer(
            "m01_young_forest",
        ).notNull(),

        m01GrandTree: integer(
            "m01_grand_tree",
        ).notNull(),

        m01HollowTree: integer(
            "m01_hollow_tree",
        ).notNull(),

        m01QueenKnockedDown: integer(
            "m01_queen_knocked_down",
            {
                mode: "boolean",
            },
        ).notNull(),

        // M02 - Roots of Renewal
        m02Base: integer(
            "m02_base",
        ).notNull(),

        m02Canopy: integer(
            "m02_canopy",
        ).notNull(),

        // M03 - Cave Waterfall
        m03Waterfall: integer(
            "m03_waterfall",
        ).notNull(),

        // M04 - Rainforest Awakening
        m04Nest: integer(
            "m04_nest",
            {
                mode: "boolean",
            },
        ).notNull(),

        m04Hollow: integer(
            "m04_hollow",
            {
                mode: "boolean",
            },
        ).notNull(),

        // M05 - Central Haven
        m05Haven: integer(
            "m05_haven",
        ).notNull(),

        // Level Up Challenge - Invasive Attack
        luAdded: integer(
            "lu_added",
        ).notNull(),

        luContained: integer(
            "lu_contained",
        ).notNull(),

        // Interference Penalties
        interference: integer(
            "interference",
        ).notNull(),

        // Gracious Professionalism
        gp: integer(
            "gp",
        ).notNull(),

        // Calculated final score
        totalScore: integer(
            "total_score",
        ).notNull(),

        submittedAt: text(
            "submitted_at",
        ).notNull(),
    },
    (table) => ({
        teamMatchUnique: uniqueIndex(
            "scoresheets_team_match_unique",
        ).on(
            table.teamId,
            table.matchNumber,
        ),
    }),
);