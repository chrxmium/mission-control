import { avg, count, desc, eq, max } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { scoresheets, teams } from "../db/schema.js";

export const rankingsRoutes = new Hono()

    .get("/", (c) => {
        const result = db
            .select({
                teamId: teams.id,
                teamNumber: teams.number,
                teamName: teams.name,
                matches: count(scoresheets.id),
                averageScore: avg(scoresheets.totalScore),
                highScore: max(scoresheets.totalScore),
            })
            .from(teams)
            .leftJoin(scoresheets, eq(teams.id, scoresheets.teamId))
            .groupBy(teams.id)
            .orderBy(desc(avg(scoresheets.totalScore)))
            .all();

        const rankings = result.map((team, index) => ({
            rank: team.matches > 0 ? index + 1 : null,

            teamId: team.teamId,

            teamNumber: team.teamNumber,

            teamName: team.teamName,

            matches: team.matches,

            averageScore: team.averageScore !== null ? Number(team.averageScore) : null,

            highScore: team.highScore,
        }));

        return c.json({
            rankings,
        });
    });
