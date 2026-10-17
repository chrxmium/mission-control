import { isSqliteUniqueConstraintError } from "../utils/sqlite.js";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { db } from "../db/index.js";
import { matches, teams } from "../db/schema.js";

export const matchesRoutes = new Hono();

const team1 = alias(teams, "team1");
const team2 = alias(teams, "team2");

matchesRoutes.get("/", (c) => {
    const result = db
        .select({
            id: matches.id,
            matchNumber: matches.matchNumber,
            scheduledAt: matches.scheduledAt,
            status: matches.status,

            team1Id: team1.id,
            team1Number: team1.number,
            team1Name: team1.name,

            team2Id: team2.id,
            team2Number: team2.number,
            team2Name: team2.name,
        })
        .from(matches)
        .innerJoin(team1, eq(matches.team1Id, team1.id))
        .leftJoin(team2, eq(matches.team2Id, team2.id))
        .orderBy(matches.matchNumber)
        .all();

    const formatted = result.map((match) => ({
        id: match.id,
        matchNumber: match.matchNumber,
        scheduledAt: match.scheduledAt,
        status: match.status,

        team1: {
            id: match.team1Id,
            number: match.team1Number,
            name: match.team1Name,
        },

        team2:
            match.team2Id === null
                ? null
                : {
                      id: match.team2Id,
                      number: match.team2Number,
                      name: match.team2Name,
                  },
    }));

    return c.json({
        matches: formatted,
    });
});

matchesRoutes.post("/", requireAdmin, async (c) => {
    const body = await c.req.json();

    if (
        typeof body.matchNumber !== "number" ||
        !Number.isInteger(body.matchNumber) ||
        body.matchNumber <= 0
    ) {
        return c.json({ error: "Invalid match number" }, 400);
    }

    if (typeof body.team1Id !== "number" || !Number.isInteger(body.team1Id) || body.team1Id <= 0) {
        return c.json({ error: "Invalid team 1 ID" }, 400);
    }

    const team2Id = body.team2Id ?? null;

    if (
        team2Id !== null &&
        (typeof team2Id !== "number" || !Number.isInteger(team2Id) || team2Id <= 0)
    ) {
        return c.json({ error: "Invalid team 2 ID" }, 400);
    }

    if (team2Id === body.team1Id) {
        return c.json(
            {
                error: "A team cannot play against itself",
            },
            400,
        );
    }

    const firstTeam = db.select().from(teams).where(eq(teams.id, body.team1Id)).get();

    if (!firstTeam) {
        return c.json({ error: "Team 1 not found" }, 404);
    }

    if (team2Id !== null) {
        const secondTeam = db.select().from(teams).where(eq(teams.id, team2Id)).get();

        if (!secondTeam) {
            return c.json({ error: "Team 2 not found" }, 404);
        }
    }

    const scheduledAt =
        typeof body.scheduledAt === "string" && body.scheduledAt.trim() !== ""
            ? body.scheduledAt
            : null;

    try {
        const created = db
            .insert(matches)
            .values({
                matchNumber: body.matchNumber,
                team1Id: body.team1Id,
                team2Id,
                scheduledAt,
                status: "upcoming",
            })
            .returning()
            .get();

        return c.json({ match: created }, 201);
    } catch (error) {
        if (isSqliteUniqueConstraintError(error)) {
            return c.json(
                {
                    error: "Match number already exists",
                },
                409,
            );
        }

        console.error(error);

        return c.json({ error: "Failed to create match" }, 500);
    }
});
