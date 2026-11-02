import { sql } from "drizzle-orm";
import {
    bigint,
    boolean,
    index,
    integer,
    pgTable,
    serial,
    text,
    uniqueIndex,
} from "drizzle-orm/pg-core";

export const events = pgTable(
    "events",
    {
        id: serial("id").primaryKey(),
        name: text("name").notNull(),
        season: text("season").notNull(),
        location: text("location"),
        eventDate: text("event_date"),
        status: text("status", { enum: ["draft", "active", "completed"] })
            .notNull()
            .default("draft"),
        ruleset: text("ruleset").notNull().default("BIOGLOW"),
        tableCount: integer("table_count").notNull().default(1),
        practiceMatchesEnabled: boolean("practice_matches_enabled").notNull().default(false),
        createdAt: bigint("created_at", { mode: "number" }).notNull(),
    },
    (table) => ({
        oneActiveEvent: uniqueIndex("events_one_active_unique")
            .on(table.status)
            .where(sql`${table.status} = 'active'`),
    }),
);

export const teams = pgTable(
    "teams",
    {
        id: serial("id").primaryKey(),
        eventId: integer("event_id")
            .notNull()
            .references(() => events.id),
        number: integer("number").notNull(),
        name: text("name").notNull(),
    },
    (table) => ({
        eventNumberUnique: uniqueIndex("teams_event_number_unique").on(
            table.eventId,
            table.number,
        ),
    }),
);

export const referees = pgTable("referees", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    tableNumber: integer("table_number"),
    active: boolean("active").notNull().default(true),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const authSessions = pgTable("auth_sessions", {
    id: serial("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    role: text("role", { enum: ["headref", "referee"] }).notNull(),
    refereeId: integer("referee_id").references(() => referees.id),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
    revokedAt: bigint("revoked_at", { mode: "number" }),
});

export const refereeLoginCodes = pgTable("referee_login_codes", {
    id: serial("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    refereeId: integer("referee_id")
        .notNull()
        .references(() => referees.id),
    createdBySessionId: integer("created_by_session_id")
        .notNull()
        .references(() => authSessions.id),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
    redeemedAt: bigint("redeemed_at", { mode: "number" }),
});

export const matches = pgTable(
    "matches",
    {
        id: serial("id").primaryKey(),
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
        eventIndex: index("matches_event_id_idx").on(table.eventId),
    }),
);

export const refereeMatches = pgTable(
    "referee_matches",
    {
        id: serial("id").primaryKey(),
        refereeId: integer("referee_id")
            .notNull()
            .references(() => referees.id),
        matchId: integer("match_id")
            .notNull()
            .references(() => matches.id),
        assignedAt: bigint("assigned_at", { mode: "number" }).notNull(),
    },
    (table) => ({
        refereeMatchUnique: uniqueIndex("referee_matches_referee_match_unique").on(
            table.refereeId,
            table.matchId,
        ),
        matchIndex: index("referee_matches_match_id_idx").on(table.matchId),
    }),
);

export const scoresheets = pgTable(
    "scoresheets",
    {
        id: serial("id").primaryKey(),
        eventId: integer("event_id")
            .notNull()
            .references(() => events.id),
        teamId: integer("team_id")
            .notNull()
            .references(() => teams.id),
        matchNumber: integer("match_number").notNull(),
        tableNumber: integer("table_number").notNull(),
        m01YoungForest: integer("m01_young_forest").notNull(),
        m01GrandTree: integer("m01_grand_tree").notNull(),
        m01HollowTree: integer("m01_hollow_tree").notNull(),
        m01QueenKnockedDown: boolean("m01_queen_knocked_down").notNull(),
        m02Base: integer("m02_base").notNull(),
        m02Canopy: integer("m02_canopy").notNull(),
        m03Waterfall: integer("m03_waterfall").notNull(),
        m04Nest: boolean("m04_nest").notNull(),
        m04Hollow: boolean("m04_hollow").notNull(),
        m05Haven: integer("m05_haven").notNull(),
        luAdded: integer("lu_added").notNull(),
        luContained: integer("lu_contained").notNull(),
        interference: integer("interference").notNull(),
        gp: integer("gp").notNull(),
        totalScore: integer("total_score").notNull(),
        submittedAt: text("submitted_at").notNull(),
    },
    (table) => ({
        eventTeamMatchUnique: uniqueIndex("scoresheets_event_team_match_unique").on(
            table.eventId,
            table.teamId,
            table.matchNumber,
        ),
        eventIndex: index("scoresheets_event_id_idx").on(table.eventId),
    }),
);
