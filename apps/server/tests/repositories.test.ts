import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { join } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { createSqliteDb } from "../src/db/client.js";
import { createSqliteRepositories } from "../src/repositories/sqlite/index.js";
import type { ScoresheetValues } from "../src/domain/types.js";

assert.equal(
    process.cwd().endsWith("/apps/server"),
    true,
    "Run repository tests from apps/server",
);

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");

const db = createSqliteDb(sqlite);
migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });

const repositories = createSqliteRepositories(db);

function check(label: string, actual: unknown, expected: unknown) {
    assert.deepEqual(actual, expected, label);
    console.log(`PASS ${label}`);
}

async function rejects(label: string, operation: () => Promise<unknown>) {
    await assert.rejects(operation);
    console.log(`PASS ${label}`);
}

const eventInput = (name: string, status: "draft" | "active" | "completed" = "draft") => ({
    name,
    season: "2026-2027",
    location: "Test venue",
    eventDate: "2026-11-01",
    status,
    ruleset: "BIOGLOW",
    tableCount: 2,
    practiceMatchesEnabled: false,
    createdAt: Date.now(),
});

const scoresheetValues = (
    eventId: number,
    teamId: number,
    matchNumber: number,
    totalScore = 0,
): ScoresheetValues => ({
    eventId,
    teamId,
    matchNumber,
    tableNumber: 1,
    m01YoungForest: 0,
    m01GrandTree: 0,
    m01HollowTree: 0,
    m01QueenKnockedDown: false,
    m02Base: 0,
    m02Canopy: 0,
    m03Waterfall: 0,
    m04Nest: false,
    m04Hollow: false,
    m05Haven: 0,
    luAdded: 0,
    luContained: 0,
    interference: 0,
    gp: 3,
    totalScore,
    submittedAt: new Date().toISOString(),
});

try {
    check(
        "Factory exposes all six repositories",
        Object.keys(repositories).sort(),
        ["auth", "events", "matches", "referees", "scoresheets", "teams"],
    );

    const firstEvent = await repositories.events.create(eventInput("First event", "active"));
    check("Create first active event", firstEvent.status, "active");
    check("Find active event", (await repositories.events.findActive())?.id, firstEvent.id);

    const secondEvent = await repositories.events.create(eventInput("Second event", "active"));
    check("Create second active event", secondEvent.status, "active");
    check("Previous active event is demoted", (await repositories.events.findById(firstEvent.id))?.status, "draft");
    check("New active event is returned", (await repositories.events.findActive())?.id, secondEvent.id);

    const activatedFirst = await repositories.events.activate(firstEvent.id);
    check("Activate existing event", activatedFirst?.status, "active");
    check("Activation demotes previous event", (await repositories.events.findById(secondEvent.id))?.status, "draft");

    check("Missing event returns null", await repositories.events.findById(999999), null);

    const firstTeam = await repositories.teams.create({
        eventId: firstEvent.id,
        number: 1001,
        name: "Alpha Robotics",
    });
    check("Create team", firstTeam.number, 1001);
    check("Find team", (await repositories.teams.findById(firstTeam.id))?.name, "Alpha Robotics");

    await rejects("Reject duplicate team number within an event", () =>
        repositories.teams.create({
            eventId: firstEvent.id,
            number: 1001,
            name: "Duplicate Robotics",
        }),
    );

    await rejects("Reject team creation for missing event", () =>
        repositories.teams.create({
            eventId: 999999,
            number: 2001,
            name: "Orphan Robotics",
        }),
    );

    const secondTeam = await repositories.teams.create({
        eventId: firstEvent.id,
        number: 1002,
        name: "Beta Robotics",
    });

    const otherEventTeam = await repositories.teams.create({
        eventId: secondEvent.id,
        number: 2001,
        name: "Other Event Robotics",
    });

    const match = await repositories.matches.create({
        eventId: firstEvent.id,
        matchNumber: 1,
        team1Id: firstTeam.id,
        team2Id: secondTeam.id,
        scheduledAt: null,
    });
    check("Create match", match.matchNumber, 1);
    check("Find match", (await repositories.matches.findById(match.id))?.id, match.id);

    await rejects("Reject match with a team from another event", () =>
        repositories.matches.create({
            eventId: firstEvent.id,
            matchNumber: 2,
            team1Id: firstTeam.id,
            team2Id: otherEventTeam.id,
            scheduledAt: null,
        }),
    );

    await rejects("Reject match with the same team twice", () =>
        repositories.matches.create({
            eventId: firstEvent.id,
            matchNumber: 2,
            team1Id: firstTeam.id,
            team2Id: firstTeam.id,
            scheduledAt: null,
        }),
    );

    const thirdTeam = await repositories.teams.create({
        eventId: firstEvent.id,
        number: 1003,
        name: "Gamma Robotics",
    });

    const standaloneScoresheet = await repositories.scoresheets.create({
        values: scoresheetValues(firstEvent.id, firstTeam.id, 90, 12),
    });
    check("Create standalone scoresheet", standaloneScoresheet.totalScore, 12);
    check(
        "Find scoresheet",
        (await repositories.scoresheets.findById(standaloneScoresheet.id))?.id,
        standaloneScoresheet.id,
    );
    check(
        "List scoresheets by event",
        (await repositories.scoresheets.listByEvent(firstEvent.id)).length,
        1,
    );

    await rejects("Reject duplicate scoresheet", () =>
        repositories.scoresheets.create({
            values: scoresheetValues(firstEvent.id, firstTeam.id, 90),
        }),
    );

    await rejects("Reject scoresheet for a team from another event", () =>
        repositories.scoresheets.create({
            values: scoresheetValues(firstEvent.id, otherEventTeam.id, 91),
        }),
    );

    const {
        eventId: _eventId,
        teamId: _teamId,
        matchNumber: _matchNumber,
        ...updatedValues
    } = scoresheetValues(firstEvent.id, firstTeam.id, 90, 42);
    const updatedScoresheet = await repositories.scoresheets.update({
        id: standaloneScoresheet.id,
        values: { ...updatedValues, tableNumber: 2 },
    });
    check("Update scoresheet", updatedScoresheet?.totalScore, 42);
    check("Updated scoresheet table number", updatedScoresheet?.tableNumber, 2);
    check(
        "Updating missing scoresheet returns null",
        await repositories.scoresheets.update({
            id: 999999,
            values: updatedValues,
        }),
        null,
    );

    const submitted = await repositories.matches.submit({
        matchId: match.id,
        submittedAt: new Date().toISOString(),
        team1: scoresheetValues(firstEvent.id, firstTeam.id, match.matchNumber, 25),
        team2: scoresheetValues(firstEvent.id, secondTeam.id, match.matchNumber, 18),
    });
    check("Submit two-team match Team 1 score", submitted.team1.totalScore, 25);
    check("Submit two-team match Team 2 score", submitted.team2?.totalScore, 18);
    check(
        "Successful submission updates match status",
        (await repositories.matches.findById(match.id))?.status,
        "submitted",
    );

    await rejects("Reject duplicate match submission", () =>
        repositories.matches.submit({
            matchId: match.id,
            submittedAt: new Date().toISOString(),
            team1: scoresheetValues(firstEvent.id, firstTeam.id, match.matchNumber),
            team2: scoresheetValues(firstEvent.id, secondTeam.id, match.matchNumber),
        }),
    );

    const rollbackMatch = await repositories.matches.create({
        eventId: firstEvent.id,
        matchNumber: 2,
        team1Id: firstTeam.id,
        team2Id: secondTeam.id,
        scheduledAt: null,
    });

    await repositories.scoresheets.create({
        values: scoresheetValues(firstEvent.id, secondTeam.id, rollbackMatch.matchNumber),
    });

    await rejects("Reject submission when second scoresheet conflicts", () =>
        repositories.matches.submit({
            matchId: rollbackMatch.id,
            submittedAt: new Date().toISOString(),
            team1: scoresheetValues(firstEvent.id, firstTeam.id, rollbackMatch.matchNumber),
            team2: scoresheetValues(firstEvent.id, secondTeam.id, rollbackMatch.matchNumber),
        }),
    );

    check(
        "Failed submission rolls back first scoresheet",
        (await repositories.scoresheets.listByEvent(firstEvent.id)).some(
            (sheet) => sheet.teamId === firstTeam.id && sheet.matchNumber === rollbackMatch.matchNumber,
        ),
        false,
    );
    check(
        "Failed submission leaves match unsubmitted",
        (await repositories.matches.findById(rollbackMatch.id))?.status,
        "upcoming",
    );

    const soloMatch = await repositories.matches.create({
        eventId: firstEvent.id,
        matchNumber: 3,
        team1Id: thirdTeam.id,
        team2Id: null,
        scheduledAt: null,
    });

    const soloSubmission = await repositories.matches.submit({
        matchId: soloMatch.id,
        submittedAt: new Date().toISOString(),
        team1: scoresheetValues(firstEvent.id, thirdTeam.id, soloMatch.matchNumber, 31),
        team2: null,
    });
    check("Submit solo match", soloSubmission.team1.totalScore, 31);
    check("Solo match has no second scoresheet", soloSubmission.team2, null);
    check(
        "Solo match status becomes submitted",
        (await repositories.matches.findById(soloMatch.id))?.status,
        "submitted",
    );

    const referee = await repositories.referees.create({
        name: "Test Referee",
        username: "test-referee",
        createdAt: Date.now(),
    });
    check("Create referee", referee.username, "test-referee");
    check("New referee is active", await repositories.referees.isActive(referee.id), true);

    const assignments = await repositories.referees.replaceAssignments({
        refereeId: referee.id,
        tableNumber: 1,
        matchIds: [match.id],
        eventId: firstEvent.id,
        assignedAt: Date.now(),
    });
    check("Create referee assignment", assignments.length, 1);
    check("Check referee assignment", await repositories.matches.isAssignedToReferee(referee.id, match.id), true);
    check("List referee assignments", (await repositories.referees.listAssignments(referee.id)).length, 1);

    await rejects("Reject assignment to a match outside the selected event", () =>
        repositories.referees.replaceAssignments({
            refereeId: referee.id,
            tableNumber: 1,
            matchIds: [999999],
            eventId: firstEvent.id,
            assignedAt: Date.now(),
        }),
    );

    await repositories.referees.replaceAssignments({
        refereeId: referee.id,
        tableNumber: 2,
        matchIds: [],
        eventId: firstEvent.id,
        assignedAt: Date.now(),
    });
    check("Replace assignments removes old assignments", (await repositories.referees.listAssignments(referee.id)).length, 0);

    const headSession = await repositories.auth.createSession({
        tokenHash: "head-session-hash",
        role: "headref",
        refereeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60_000,
    });
    check("Create head referee session", headSession.role, "headref");

    check(
        "Find session by token hash",
        (await repositories.auth.findSessionByTokenHash("head-session-hash"))?.id,
        headSession.id,
    );

    await repositories.auth.createLoginCode({
        tokenHash: "first-login-code",
        refereeId: referee.id,
        createdBySessionId: headSession.id,
        createdAt: 1_000,
        expiresAt: 301_000,
    });

    await repositories.auth.createLoginCode({
        tokenHash: "replacement-login-code",
        refereeId: referee.id,
        createdBySessionId: headSession.id,
        createdAt: 2_000,
        expiresAt: 302_000,
    });

    const refereeSessionInput = {
        tokenHash: "referee-session-hash",
        role: "referee" as const,
        refereeId: referee.id,
        createdAt: 3_000,
        expiresAt: 86_403_000,
    };

    check(
        "Reject replaced login code",
        await repositories.auth.redeemLoginCode({
            tokenHash: "first-login-code",
            now: 3_000,
            session: refereeSessionInput,
        }),
        null,
    );

    const redeemed = await repositories.auth.redeemLoginCode({
        tokenHash: "replacement-login-code",
        now: 3_000,
        session: refereeSessionInput,
    });
    check("Redeem replacement login code", redeemed?.referee.id, referee.id);
    check("Create referee session during redemption", redeemed?.session.role, "referee");

    check(
        "Reject reused login code",
        await repositories.auth.redeemLoginCode({
            tokenHash: "replacement-login-code",
            now: 4_000,
            session: { ...refereeSessionInput, tokenHash: "another-session-hash" },
        }),
        null,
    );

    check(
        "Find redeemed referee session",
        (await repositories.auth.findSessionByTokenHash("referee-session-hash"))?.refereeId,
        referee.id,
    );

    await repositories.auth.revokeSession("referee-session-hash", 5_000);
    check(
        "Revoked session is no longer found",
        await repositories.auth.findSessionByTokenHash("referee-session-hash"),
        null,
    );

    const deactivated = await repositories.referees.setActive(referee.id, false);
    check("Deactivate referee", deactivated?.active, false);
    check("Inactive referee is not active", await repositories.referees.isActive(referee.id), false);

    console.log("\nAll repository integration tests passed.");
} finally {
    sqlite.close();
}
