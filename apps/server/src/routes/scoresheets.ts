import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { DomainError } from "../domain/errors.js";
import type { Repositories } from "../repositories/interfaces/index.js";
import { buildScoresheetValues, prepareScoresheet } from "../services/scoring.js";

export function createScoresheetsRoutes(
    repositories: Pick<Repositories, "events" | "teams" | "matches" | "scoresheets">,
) {
    const { events, teams, matches, scoresheets } = repositories;
    const app = new Hono();

    app.get("/", async (c) => {
        const eventIdParam = c.req.query("eventId");
        const activeEvent = eventIdParam === undefined ? await events.findActive() : undefined;
        const eventId = eventIdParam === undefined ? activeEvent?.id : Number(eventIdParam);

        if (eventId === undefined || !Number.isSafeInteger(eventId) || eventId < 1) {
            return c.json({ scoresheets: [] });
        }

        return c.json({ scoresheets: await scoresheets.listByEvent(eventId) });
    });

    app.get("/:id", async (c) => {
        const id = Number(c.req.param("id"));
        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid scoresheet ID" }, 400);
        }

        const scoresheet = await scoresheets.findById(id);
        if (!scoresheet) return c.json({ error: "Scoresheet not found" }, 404);

        return c.json({ scoresheet });
    });

    app.post("/", requireAdmin, async (c) => {
        const body = await c.req.json().catch(() => null);
        const prepared = prepareScoresheet(body);
        if (!prepared.ok) return c.json({ error: prepared.error }, prepared.status);

        const { data, sheet, totalScore } = prepared;
        const team = await teams.findById(data.teamId);
        if (!team) return c.json({ error: "Team not found" }, 404);

        const matchResult = (await matches.listByEvent(team.eventId)).find(
            ({ match }) => match.matchNumber === data.matchNumber,
        );
        if (!matchResult) return c.json({ error: "Match not found for this team and event" }, 404);

        const match = matchResult.match;
        if (match.team1Id !== team.id && match.team2Id !== team.id) {
            return c.json({ error: "Team does not participate in this match" }, 400);
        }

        try {
            const newScoresheet = await scoresheets.create({
                values: {
                    eventId: team.eventId,
                    ...buildScoresheetValues(data, sheet, totalScore),
                    submittedAt: new Date().toISOString(),
                },
            });
            return c.json({ scoresheet: newScoresheet }, 201);
        } catch (error) {
            if (error instanceof DomainError) {
                if (error.code === "CONFLICT") return c.json({ error: error.message }, 409);
                if (error.code === "NOT_FOUND") return c.json({ error: error.message }, 404);
                if (error.code === "VALIDATION") return c.json({ error: error.message }, 400);
            }
            console.error(error);
            return c.json({ error: "Failed to save scoresheet" }, 500);
        }
    });

    app.patch("/:id", requireAdmin, async (c) => {
        const id = Number(c.req.param("id"));
        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid scoresheet ID" }, 400);
        }

        const existing = await scoresheets.findById(id);
        if (!existing) return c.json({ error: "Scoresheet not found" }, 404);

        const body = await c.req.json().catch(() => null);
        const prepared = prepareScoresheet(body);
        if (!prepared.ok) return c.json({ error: prepared.error }, prepared.status);

        const { data, sheet, totalScore } = prepared;
        if (data.teamId !== existing.teamId || data.matchNumber !== existing.matchNumber) {
            return c.json({ error: "A scoresheet cannot be moved to another team or match" }, 400);
        }

        const values = buildScoresheetValues(data, sheet, totalScore);
        try {
            const updatedScoresheet = await scoresheets.update({
                id,
                values: {
                    tableNumber: values.tableNumber,
                    m01YoungForest: values.m01YoungForest,
                    m01GrandTree: values.m01GrandTree,
                    m01HollowTree: values.m01HollowTree,
                    m01QueenKnockedDown: values.m01QueenKnockedDown,
                    m02Base: values.m02Base,
                    m02Canopy: values.m02Canopy,
                    m03Waterfall: values.m03Waterfall,
                    m04Nest: values.m04Nest,
                    m04Hollow: values.m04Hollow,
                    m05Haven: values.m05Haven,
                    luAdded: values.luAdded,
                    luContained: values.luContained,
                    interference: values.interference,
                    gp: values.gp,
                    totalScore: values.totalScore,
                    submittedAt: existing.submittedAt,
                },
            });

            if (!updatedScoresheet) return c.json({ error: "Scoresheet not found" }, 404);
            return c.json({ scoresheet: updatedScoresheet });
        } catch (error) {
            if (error instanceof DomainError && error.code === "CONFLICT") {
                return c.json({ error: error.message }, 409);
            }
            console.error(error);
            return c.json({ error: "Failed to save scoresheet" }, 500);
        }
    });

    return app;
}
