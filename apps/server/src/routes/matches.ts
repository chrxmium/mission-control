import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
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
