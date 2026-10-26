import { isSqliteUniqueConstraintError } from "../utils/sqlite.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { buildScoresheetValues, prepareScoresheet } from "../services/scoring.js";
import { db } from "../db/index.js";
import { events, matches, scoresheets, teams } from "../db/schema.js";

export const scoresheetsRoutes = new Hono()

    .get("/", (c) => {
        const eventIdParam = c.req.query("eventId");
        const activeEvent = eventIdParam === undefined
            ? db.select({ id: events.id }).from(events).where(eq(events.status, "active")).get()
            : undefined;
        const eventId = eventIdParam === undefined ? activeEvent?.id : Number(eventIdParam);

        if (eventId === undefined || !Number.isSafeInteger(eventId) || eventId < 1) {
            return c.json({ scoresheets: [] });
        }

        const result = db
            .select()
            .from(scoresheets)
            .where(eq(scoresheets.eventId, eventId))
            .all();

        return c.json({ scoresheets: result });
    })

    .get("/:id", (c) => {
        const id = Number(c.req.param("id"));

        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid scoresheet ID" }, 400);
        }

        const scoresheet = db.select().from(scoresheets).where(eq(scoresheets.id, id)).get();

        if (!scoresheet) {
            return c.json({ error: "Scoresheet not found" }, 404);
        }

        return c.json({ scoresheet });
    })

    .post("/", requireAdmin, async (c) => {
        const body = await c.req.json().catch(() => null);

        const prepared = prepareScoresheet(body);

        if (!prepared.ok) {
            return c.json({ error: prepared.error }, prepared.status);
        }

        const { data, sheet, totalScore } = prepared;
        const team = db.select().from(teams).where(eq(teams.id, data.teamId)).get();

        if (!team) {
            return c.json({ error: "Team not found" }, 404);
        }

        const match = db
            .select()
            .from(matches)
            .where(eq(matches.matchNumber, data.matchNumber))
            .all()
            .find((item) => item.eventId === team.eventId);

        if (!match) {
            return c.json({ error: "Match not found for this team and event" }, 404);
        }

        try {
            const newScoresheet = db
                .insert(scoresheets)
                .values({
                    eventId: team.eventId,
                    ...buildScoresheetValues(data, sheet, totalScore),
                    submittedAt: new Date().toISOString(),
                })
                .returning()
                .get();

            return c.json({ scoresheet: newScoresheet }, 201);
        } catch (error) {
            if (isSqliteUniqueConstraintError(error)) {
                return c.json(
                    { error: "Scoresheet already exists for this team and match" },
                    409,
                );
            }

            console.error(error);
            return c.json({ error: "Failed to save scoresheet" }, 500);
        }
    })

    .patch("/:id", requireAdmin, async (c) => {
        const id = Number(c.req.param("id"));

        if (!Number.isSafeInteger(id) || id < 1) {
            return c.json({ error: "Invalid scoresheet ID" }, 400);
        }

        const existing = db.select().from(scoresheets).where(eq(scoresheets.id, id)).get();

        if (!existing) {
            return c.json({ error: "Scoresheet not found" }, 404);
        }

        const body = await c.req.json().catch(() => null);
        const prepared = prepareScoresheet(body);

        if (!prepared.ok) {
            return c.json({ error: prepared.error }, prepared.status);
        }

        const { data, sheet, totalScore } = prepared;

        if (data.teamId !== existing.teamId || data.matchNumber !== existing.matchNumber) {
            return c.json(
                { error: "A scoresheet cannot be moved to another team or match" },
                400,
            );
        }

        try {
            const updatedScoresheet = db
                .update(scoresheets)
                .set({
                    ...buildScoresheetValues(data, sheet, totalScore),
                    eventId: existing.eventId,
                })
                .where(eq(scoresheets.id, id))
                .returning()
                .get();

            return c.json({ scoresheet: updatedScoresheet });
        } catch (error) {
            if (isSqliteUniqueConstraintError(error)) {
                return c.json(
                    { error: "Scoresheet already exists for this team and match" },
                    409,
                );
            }

            console.error(error);
            return c.json({ error: "Failed to save scoresheet" }, 500);
        }
    });
