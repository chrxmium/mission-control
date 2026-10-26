import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

assert.equal(process.cwd().endsWith("/apps/server"), true, "Run API tests from apps/server");

const testDirectory = mkdtempSync(join(tmpdir(), "mission-control-test-"));

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = join(testDirectory, "test.db");
process.env.ADMIN_TOKEN = "integration-test-admin-token";
process.env.REFEREE_PASSWORD = "integration-test-referee-password";

const { app } = await import("../src/app.js");

const adminHeaders = {
    Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
};

async function request(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
) {
    const response = await app.request(path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    return {
        status: response.status,
        body: (await response.json()) as any,
    };
}

function check(label: string, actual: unknown, expected: unknown) {
    assert.deepEqual(actual, expected, label);
    console.log(`PASS ${label}`);
}

const emptySheet = {
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
};

try {
    const health = await request("GET", "/health");
    check("Health endpoint", health.status, 200);
    check("Health response", health.body.ok, true);

    const unauthorisedTeam = await request("POST", "/api/v1/teams", {
        number: 1001,
        name: "Alpha Robotics",
    });
    check("Admin authentication required", unauthorisedTeam.status, 401);

    const headLogin = await request("POST", "/api/v1/auth/headref/login", {
        password: process.env.REFEREE_PASSWORD,
    });
    check("Head referee login", headLogin.status, 200);
    assert.equal(typeof headLogin.body.token, "string");

    const headHeaders = {
        Authorization: `Bearer ${headLogin.body.token}`,
    };

    const createdReferee = await request(
        "POST",
        "/api/v1/referees",
        { name: "Test Referee", username: "test-referee" },
        headHeaders,
    );
    check("Create referee account", createdReferee.status, 201);
    const managedRefereeId = createdReferee.body.referee.id as number;

    const refereeList = await request("GET", "/api/v1/referees", undefined, headHeaders);
    check("List referee accounts", refereeList.status, 200);
    assert.ok(refereeList.body.referees.some((r: { id: number }) => r.id === managedRefereeId));

    const firstLoginCode = await request(
        "POST",
        `/api/v1/referees/${managedRefereeId}/login-code`,
        undefined,
        headHeaders,
    );
    check("Generate first referee login code", firstLoginCode.status, 201);
    check("First QR expires in five minutes", firstLoginCode.body.expiresIn, 300);

    const loginCode = await request(
        "POST",
        `/api/v1/referees/${managedRefereeId}/login-code`,
        undefined,
        headHeaders,
    );
    check("Generate replacement referee login code", loginCode.status, 201);
    assert.notEqual(loginCode.body.code, firstLoginCode.body.code);
    check("Replacement QR expires in five minutes", loginCode.body.expiresIn, 300);

    const staleCode = await request("POST", "/api/v1/auth/referee/redeem", {
        code: firstLoginCode.body.code,
    });
    check("Reject replaced referee login code", staleCode.status, 401);

    const redeemedCode = await request("POST", "/api/v1/auth/referee/redeem", {
        code: loginCode.body.code,
    });
    check("Redeem referee login code", redeemedCode.status, 200);
    assert.equal(typeof redeemedCode.body.token, "string");
    check("Referee session lasts 24 hours", redeemedCode.body.expiresIn, 86400);
    check("Redeemed identity matches referee", redeemedCode.body.referee.id, managedRefereeId);

    const reusedCode = await request("POST", "/api/v1/auth/referee/redeem", {
        code: loginCode.body.code,
    });
    check("Reject reused referee login code", reusedCode.status, 401);

    const refereeHeaders = {
        Authorization: `Bearer ${redeemedCode.body.token}`,
    };

    const teamIds: number[] = [];

    const invalidTeams = [
        { number: 0, name: "Invalid" },
        { number: -1, name: "Invalid" },
        { number: 1.5, name: "Invalid" },
        { number: "1001", name: "Invalid" },
        { number: 1001, name: "" },
        { number: 1001, name: "   " },
    ];

    for (const body of invalidTeams) {
        const result = await request("POST", "/api/v1/teams", body, adminHeaders);

        check("Reject invalid team input", result.status, 400);
        check("Preserve validation error", result.body.error, "Invalid request body");
    }

    for (const [number, name] of [
        [1001, "Alpha Robotics"],
        [1002, "Beta Robotics"],
        [1003, "Gamma Robotics"],
    ] as const) {
        const result = await request("POST", "/api/v1/teams", { number, name }, adminHeaders);

        check(`Create team ${number}`, result.status, 201);
        assert.equal(typeof result.body.team.id, "number");
        teamIds.push(result.body.team.id);
    }

    const standardMatch = await request(
        "POST",
        "/api/v1/matches",
        {
            matchNumber: 1,
            team1Id: teamIds[0],
            team2Id: teamIds[1],
        },
        adminHeaders,
    );

    check("Create standard match", standardMatch.status, 201);

    const soloMatch = await request(
        "POST",
        "/api/v1/matches",
        {
            matchNumber: 2,
            team1Id: teamIds[2],
            team2Id: null,
        },
        adminHeaders,
    );

    check("Create solo match", soloMatch.status, 201);

    const matches = await request("GET", "/api/v1/matches");
    check("List matches", matches.status, 200);
    check("Match count", matches.body.matches.length, 2);

    const assignmentOptions = await request(
        "GET",
        "/api/v1/referees/assignment-options",
        undefined,
        headHeaders,
    );
    check("Load referee assignment options", assignmentOptions.status, 200);
    assert.ok(assignmentOptions.body.matches.some((match: { id: number }) =>
        match.id === standardMatch.body.match.id
    ));

    const assignment = await request(
        "PATCH",
        `/api/v1/referees/${managedRefereeId}/assignments`,
        {
            tableNumber: 1,
            matchIds: [standardMatch.body.match.id],
        },
        headHeaders,
    );
    check("Assign referee table and match", assignment.status, 200);

    const refereeHome = await request("GET", "/api/v1/referees/me", undefined, refereeHeaders);
    check("Protected referee dashboard", refereeHome.status, 200);
    check("Dashboard identifies signed-in referee", refereeHome.body.referee.name, "Test Referee");
    check("Dashboard shows assigned table", refereeHome.body.referee.tableNumber, 1);
    assert.ok(Array.isArray(refereeHome.body.matches));
    assert.ok(refereeHome.body.matches.some((match: { matchNumber: number }) =>
        match.matchNumber === 1
    ));


    const solo = matches.body.matches.find((match: any) => match.matchNumber === 2);
    check("Solo match has no second team", solo.team2, null);

    const standardPayload = {
        tableNumber: 1,
        sharedM05: 0,
        team1: {
            teamId: teamIds[0],
            participation: "playing",
            sheet: emptySheet,
        },
        team2: {
            teamId: teamIds[1],
            participation: "no_show",
            sheet: {},
        },
    };

    const invalidScoresheets = [
        { ...emptySheet, m01_young_forest: 4 },
        { ...emptySheet, m02_canopy: 16 },
        { ...emptySheet, m03_waterfall: 51 },
        { ...emptySheet, lu_added: 6 },
        { ...emptySheet, interference: -1 },
        { ...emptySheet, gp: 5 },
        { ...emptySheet, m04_nest: 1 },
    ];

    for (const sheet of invalidScoresheets) {
        const result = await request(
            "POST",
            "/api/v1/scoresheets",
            {
                ...sheet,
                teamId: teamIds[0],
                matchNumber: 999,
                tableNumber: 1,
            },
            adminHeaders,
        );

        check("Reject invalid mission data", result.status, 400);
        check("Preserve mission validation error", result.body.error, "Invalid scoresheet data");
    }

    const invalidMetadata = await request(
        "POST",
        "/api/v1/scoresheets",
        {
            ...emptySheet,
            teamId: 0,
            matchNumber: 999,
            tableNumber: 1,
        },
        adminHeaders,
    );

    check("Reject invalid scoresheet metadata", invalidMetadata.status, 400);
    check(
        "Preserve metadata validation error",
        invalidMetadata.body.error,
        "Invalid scoresheet metadata",
    );

    const invalidSubmissions = [
        {
            name: "Invalid table number",
            body: { ...standardPayload, tableNumber: 0 },
            error: "Invalid table number",
        },
        {
            name: "Invalid shared M05",
            body: { ...standardPayload, sharedM05: -1 },
            error: "Invalid M05 value",
        },
        {
            name: "Invalid Team 1 participation",
            body: {
                ...standardPayload,
                team1: { ...standardPayload.team1, participation: "unknown" },
            },
            error: "Invalid Team 1 data",
        },
        {
            name: "Missing Team 2",
            body: { ...standardPayload, team2: null },
            error: "Team 2 data is required",
        },
        {
            name: "Mismatched Team 1",
            body: {
                ...standardPayload,
                team1: { ...standardPayload.team1, teamId: teamIds[2] },
            },
            error: "Team 1 mismatch",
        },
    ];

    for (const test of invalidSubmissions) {
        const result = await request(
            "POST",
            `/api/v1/matches/${standardMatch.body.match.id}/submit`,
            test.body,
            refereeHeaders,
        );

        check(test.name, result.status, 400);
        check(`${test.name} error`, result.body.error, test.error);
    }

    const invalidSoloSubmission = await request(
        "POST",
        `/api/v1/matches/${soloMatch.body.match.id}/submit`,
        {
            ...standardPayload,
            team1: { ...standardPayload.team1, teamId: teamIds[2] },
        },
        refereeHeaders,
    );

    check("Reject second team in solo match", invalidSoloSubmission.status, 400);
    check("Preserve solo match error", invalidSoloSubmission.body.error, "This is a solo match");

    const unauthorisedSubmission = await request(
        "POST",
        `/api/v1/matches/${standardMatch.body.match.id}/submit`,
        standardPayload,
    );

    check("Submission requires referee login", unauthorisedSubmission.status, 401);

    const standardSubmission = await request(
        "POST",
        `/api/v1/matches/${standardMatch.body.match.id}/submit`,
        standardPayload,
        refereeHeaders,
    );

    check("Submit standard match", standardSubmission.status, 201);
    assert.ok(standardSubmission.body.scoresheets.team1);
    assert.ok(standardSubmission.body.scoresheets.team2);
    check(
        "No-show team receives zero points",
        standardSubmission.body.scoresheets.team2.totalScore,
        0,
    );

    const duplicate = await request(
        "POST",
        `/api/v1/matches/${standardMatch.body.match.id}/submit`,
        standardPayload,
        refereeHeaders,
    );

    check("Reject duplicate submission", duplicate.status, 409);

    const soloSubmission = await request(
        "POST",
        `/api/v1/matches/${soloMatch.body.match.id}/submit`,
        {
            tableNumber: 2,
            sharedM05: 0,
            team1: {
                teamId: teamIds[2],
                participation: "playing",
                sheet: emptySheet,
            },
            team2: null,
        },
        refereeHeaders,
    );

    check("Submit solo match", soloSubmission.status, 201);
    assert.ok(soloSubmission.body.scoresheets.team1);
    check("Solo match has one scoresheet", soloSubmission.body.scoresheets.team2, null);

    const scoresheets = await request("GET", "/api/v1/scoresheets");
    check("List scoresheets", scoresheets.status, 200);
    check("Three scoresheets created", scoresheets.body.scoresheets.length, 3);

    const rankings = await request("GET", "/api/v1/rankings");
    check("Rankings endpoint", rankings.status, 200);
    check("Three teams ranked", rankings.body.rankings.length, 3);

    for (const team of rankings.body.rankings) {
        check(`Team ${team.teamNumber} match count`, team.matches, 1);
    }

    const deactivated = await request(
        "PATCH",
        `/api/v1/referees/${managedRefereeId}/active`,
        { active: false },
        headHeaders,
    );
    check("Deactivate referee account", deactivated.status, 200);

    const inactiveCode = await request(
        "POST",
        `/api/v1/referees/${managedRefereeId}/login-code`,
        undefined,
        headHeaders,
    );
    check("Cannot generate code for inactive referee", inactiveCode.status, 404);

    const inactiveSession = await request(
        "GET",
        "/api/v1/referees/me",
        undefined,
        refereeHeaders,
    );
    check("Inactive referee session rejected", inactiveSession.status, 401);


    const listedEvents = await request("GET", "/api/v1/events");
    check("List events", listedEvents.status, 200);
    const originalActiveEvent = listedEvents.body.events.find(
        (event: { status: string }) => event.status === "active",
    );
    assert.ok(originalActiveEvent, "Expected a seeded active event");
    const originalEventId = originalActiveEvent.id;

    const secondEventResponse = await request(
        "POST",
        "/api/v1/events",
        {
            name: "Second Test Event",
            season: "BIOGLOW 2026-2027",
            status: "draft",
        },
        adminHeaders,
    );
    check("Create second draft event", secondEventResponse.status, 201);
    const secondEvent = secondEventResponse.body.event;
    check("Second event starts as draft", secondEvent.status, "draft");

    const secondTeam1Response = await request(
        "POST",
        "/api/v1/teams",
        { eventId: secondEvent.id, number: 1001, name: "Second Alpha" },
        adminHeaders,
    );
    check("Create first team in second event", secondTeam1Response.status, 201);

    const secondTeam2Response = await request(
        "POST",
        "/api/v1/teams",
        { eventId: secondEvent.id, number: 1002, name: "Second Beta" },
        adminHeaders,
    );
    check("Create second team in second event", secondTeam2Response.status, 201);

    const secondTeam1Id = secondTeam1Response.body.team.id;
    const secondTeam2Id = secondTeam2Response.body.team.id;

    const originalTeams = await request("GET", "/api/v1/teams");
    check("Default teams use active event", originalTeams.status, 200);
    assert.ok(originalTeams.body.teams.some((team: { id: number }) => team.id === teamIds[0]));
    assert.ok(!originalTeams.body.teams.some((team: { id: number }) => team.id === secondTeam1Id));

    const secondEventTeams = await request("GET", `/api/v1/teams?eventId=${secondEvent.id}`);
    check("List teams for second event", secondEventTeams.status, 200);
    check("Second event has only its two teams", secondEventTeams.body.teams.length, 2);
    assert.ok(secondEventTeams.body.teams.some((team: { id: number }) => team.id === secondTeam1Id));
    assert.ok(!secondEventTeams.body.teams.some((team: { id: number }) => team.id === teamIds[0]));

    const secondMatchResponse = await request(
        "POST",
        "/api/v1/matches",
        {
            eventId: secondEvent.id,
            matchNumber: 1,
            team1Id: secondTeam1Id,
            team2Id: secondTeam2Id,
        },
        adminHeaders,
    );
    check("Create match in second event with reused match number", secondMatchResponse.status, 201);
    const secondMatchId = secondMatchResponse.body.match.id;

    const originalMatches = await request("GET", "/api/v1/matches");
    check("Default matches use active event", originalMatches.status, 200);
    check("Original event still has its two matches", originalMatches.body.matches.length, 2);
    assert.ok(!originalMatches.body.matches.some((match: { id: number }) => match.id === secondMatchId));

    const secondEventMatches = await request("GET", `/api/v1/matches?eventId=${secondEvent.id}`);
    check("List matches for second event", secondEventMatches.status, 200);
    check("Second event has its own match", secondEventMatches.body.matches.length, 1);
    check("Second event match ID", secondEventMatches.body.matches[0].id, secondMatchId);

    const crossEventMatch = await request(
        "POST",
        "/api/v1/matches",
        {
            eventId: secondEvent.id,
            matchNumber: 2,
            team1Id: teamIds[0],
            team2Id: secondTeam2Id,
        },
        adminHeaders,
    );
    check("Reject match mixing teams from different events", crossEventMatch.status, 400);

    const activateSecondEvent = await request(
        "PATCH",
        `/api/v1/events/${secondEvent.id}`,
        { status: "active" },
        adminHeaders,
    );
    check("Activate second event by patch", activateSecondEvent.status, 200);
    check("Second event becomes active", activateSecondEvent.body.event.status, "active");

    const eventsAfterPatchActivation = await request("GET", "/api/v1/events");
    const activeAfterPatch = eventsAfterPatchActivation.body.events.filter(
        (event: { status: string }) => event.status === "active",
    );
    check("Only one active event after patch activation", activeAfterPatch.length, 1);
    check(
        "Previous active event becomes draft",
        eventsAfterPatchActivation.body.events.find(
            (event: { id: number }) => event.id === originalEventId,
        )?.status,
        "draft",
    );

    const teamsAfterActivation = await request("GET", "/api/v1/teams");
    check("Default teams follow newly active event", teamsAfterActivation.status, 200);
    check("New active event teams", teamsAfterActivation.body.teams.length, 2);
    assert.ok(teamsAfterActivation.body.teams.every(
        (team: { eventId: number }) => team.eventId === secondEvent.id,
    ));

    const matchesAfterActivation = await request("GET", "/api/v1/matches");
    check("Default matches follow newly active event", matchesAfterActivation.status, 200);
    check("New active event match count", matchesAfterActivation.body.matches.length, 1);
    check("New active event default match ID", matchesAfterActivation.body.matches[0].id, secondMatchId);

    const thirdEventResponse = await request(
        "POST",
        "/api/v1/events",
        {
            name: "Third Active Event",
            season: "BIOGLOW 2026-2027",
            status: "active",
        },
        adminHeaders,
    );
    check("Create event directly as active", thirdEventResponse.status, 201);
    check("Newly created event is active", thirdEventResponse.body.event.status, "active");

    const eventsAfterPostActivation = await request("GET", "/api/v1/events");
    const activeAfterPost = eventsAfterPostActivation.body.events.filter(
        (event: { status: string }) => event.status === "active",
    );
    check("Only one active event after active creation", activeAfterPost.length, 1);
    check(
        "Previously active second event becomes draft",
        eventsAfterPostActivation.body.events.find(
            (event: { id: number }) => event.id === secondEvent.id,
        )?.status,
        "draft",
    );

    console.log("\nAll API integration tests passed.");
} finally {
    rmSync(testDirectory, { recursive: true, force: true });
}
