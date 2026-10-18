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

    const invalidLogin = await request("POST", "/api/v1/auth/login", {
        password: "wrong-password",
    });
    check("Invalid referee login", invalidLogin.status, 401);

    const unauthorisedTeam = await request("POST", "/api/v1/teams", {
        number: 1001,
        name: "Alpha Robotics",
    });
    check("Admin authentication required", unauthorisedTeam.status, 401);

    const login = await request("POST", "/api/v1/auth/login", {
        password: process.env.REFEREE_PASSWORD,
    });
    check("Referee login", login.status, 200);
    assert.equal(typeof login.body.token, "string");
    check("Session duration", login.body.expiresIn, 43200);

    const refereeHeaders = {
        Authorization: `Bearer ${login.body.token}`,
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
            sheet: emptySheet,
        },
    };

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

    console.log("\nAll API integration tests passed.");
} finally {
    rmSync(testDirectory, { recursive: true, force: true });
}
