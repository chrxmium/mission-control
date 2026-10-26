import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    season: text("season").notNull(),
    location: text("location"),
    eventDate: text("event_date"),
    status: text("status", { enum: ["draft", "active", "completed"] })
        .notNull()
        .default("draft"),
    ruleset: text("ruleset").notNull().default("BIOGLOW"),
    tableCount: integer("table_count").notNull().default(1),
    practiceMatchesEnabled: integer("practice_matches_enabled", { mode: "boolean" })
        .notNull()
        .default(false),
    createdAt: integer("created_at").notNull(),
});

export const teams = sqliteTable(
    "teams",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        eventId: integer("event_id")
            .notNull()
            .references(() => events.id),
        number: integer("number").notNull(),
        name: text("name").notNull(),
    },
    (table) => ({
        eventNumberUnique: uniqueIndex("teams_event_number_unique").on(table.eventId, table.number),
    }),
);

export const referees = sqliteTable("referees", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    tableNumber: integer("table_number"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
});

export const authSessions = sqliteTable("auth_sessions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tokenHash: text("token_hash").notNull().unique(),
    role: text("role", { enum: ["headref", "referee"] }).notNull(),
    refereeId: integer("referee_id").references(() => referees.id),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    revokedAt: integer("revoked_at"),
});

export const refereeLoginCodes = sqliteTable("referee_login_codes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tokenHash: text("token_hash").notNull().unique(),
    refereeId: integer("referee_id")
        .notNull()
        .references(() => referees.id),
    createdBySessionId: integer("created_by_session_id")
        .notNull()
        .references(() => authSessions.id),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    redeemedAt: integer("redeemed_at"),
});

export const matches = sqliteTable(
    "matches",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        eventId: integer("event_id")
            .notNull()
            .references(() => events.id),
        matchNumber: integer("match_number").notNull(),
        team1Id: integer("team_1_id")
            .notNull()
            .references(() => teams.id),
        team2Id: integer("team_2_id").references(() => teams.id),
        scheduledAt: text("scheduled_at"),
        status: text("status").notNull().default("upcoming"),
    },
    (table) => ({
        eventMatchNumberUnique: uniqueIndex("matches_event_match_number_unique").on(
            table.eventId,
            table.matchNumber,
        ),
    }),
);

export const refereeMatches = sqliteTable(
    "referee_matches",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        refereeId: integer("referee_id")
            .notNull()
            .references(() => referees.id),
        matchId: integer("match_id")
            .notNull()
            .references(() => matches.id),
        assignedAt: integer("assigned_at").notNull(),
    },
    (table) => ({
        refereeMatchUnique: uniqueIndex("referee_matches_referee_match_unique").on(
            table.refereeId,
            table.matchId,
        ),
    }),
);

export const scoresheets = sqliteTable(
    "scoresheets",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        eventId: integer("event_id")
            .notNull()
            .references(() => events.id),
        teamId: integer("team_id")
            .notNull()
            .references(() => teams.id),
        matchNumber: integer("match_number").notNull(),
        tableNumber: integer("table_number").notNull(),

        // M01 - Mighty Microbiomes
        m01YoungForest: integer("m01_young_forest").notNull(),
        m01GrandTree: integer("m01_grand_tree").notNull(),
        m01HollowTree: integer("m01_hollow_tree").notNull(),
        m01QueenKnockedDown: integer("m01_queen_knocked_down", {
            mode: "boolean",
        }).notNull(),

        // M02 - Roots of Renewal
        m02Base: integer("m02_base").notNull(),
        m02Canopy: integer("m02_canopy").notNull(),

        // M03 - Cave Waterfall
        m03Waterfall: integer("m03_waterfall").notNull(),

        // M04 - Rainforest Awakening
        m04Nest: integer("m04_nest", { mode: "boolean" }).notNull(),
        m04Hollow: integer("m04_hollow", { mode: "boolean" }).notNull(),

        // M05 - Central Haven
        m05Haven: integer("m05_haven").notNull(),

        // Level Up Challenge - Invasive Attack
        luAdded: integer("lu_added").notNull(),
        luContained: integer("lu_contained").notNull(),

        // Interference Penalties and Gracious Professionalism
        interference: integer("interference").notNull(),
        gp: integer("gp").notNull(),

        // Calculated final score
        totalScore: integer("total_score").notNull(),
        submittedAt: text("submitted_at").notNull(),
    },
    (table) => ({
        eventTeamMatchUnique: uniqueIndex("scoresheets_event_team_match_unique").on(
            table.eventId,
            table.teamId,
            table.matchNumber,
        ),
    }),
);
