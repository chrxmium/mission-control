import { Hono } from "hono";
import type { Repositories } from "../repositories/interfaces/index.js";

export function createRankingsRoutes(
    repositories: Pick<Repositories, "events" | "teams" | "scoresheets">,
) {
    const { events, teams, scoresheets } = repositories;
    const app = new Hono();

    app.get("/", async (c) => {
        const eventIdParam = c.req.query("eventId");
        const activeEvent = eventIdParam === undefined ? await events.findActive() : undefined;
        const eventId = eventIdParam === undefined ? activeEvent?.id : Number(eventIdParam);

        if (eventId === undefined || !Number.isSafeInteger(eventId) || eventId < 1) {
            return c.json({ rankings: [] });
        }

        const [eventTeams, eventScoresheets] = await Promise.all([
            teams.listByEvent(eventId),
            scoresheets.listByEvent(eventId),
        ]);

        const rankings = eventTeams
            .map((team) => {
                const teamScoresheets = eventScoresheets.filter(
                    (scoresheet) => scoresheet.teamId === team.id,
                );
                const matches = teamScoresheets.length;
                const totalScore = teamScoresheets.reduce(
                    (sum, scoresheet) => sum + scoresheet.totalScore,
                    0,
                );

                return {
                    teamId: team.id,
                    teamNumber: team.number,
                    teamName: team.name,
                    matches,
                    averageScore: matches > 0 ? totalScore / matches : null,
                    highScore:
                        matches > 0
                            ? Math.max(...teamScoresheets.map((scoresheet) => scoresheet.totalScore))
                            : null,
                };
            })
            .sort((a, b) => {
                if (a.averageScore === null) return b.averageScore === null ? 0 : 1;
                if (b.averageScore === null) return -1;
                return b.averageScore - a.averageScore;
            })
            .map((team, index) => ({
                rank: team.matches > 0 ? index + 1 : null,
                ...team,
            }));

        return c.json({ rankings });
    });

    return app;
}
