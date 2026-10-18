import { isSqliteUniqueConstraintError } from "../utils/sqlite.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { buildScoresheetValues, prepareScoresheet } from "../services/scoring.js";
import { db } from "../db/index.js";
import { scoresheets } from "../db/schema.js";

export const scoresheetsRoutes = new Hono()

    .get("/", (c) => {
        const result = db.select().from(scoresheets).all();

        return c.json({
            scoresheets: result,
        });
    })

    .get("/:id", (c) => {
        const id = Number(c.req.param("id"));

        const scoresheet = db.select().from(scoresheets).where(eq(scoresheets.id, id)).get();

        if (!scoresheet) {
            return c.json(
                {
                    error: "Scoresheet not found",
                },
                404,
            );
        }

        return c.json({
            scoresheet,
        });
    })

    .post("/", requireAdmin, async (c) => {
        const body = await c.req.json();

        const prepared = prepareScoresheet(body);

        if (!prepared.ok) {
            return c.json(
                {
                    error: prepared.error,
                },
                prepared.status,
            );
        }

        const { data, sheet, totalScore } = prepared;

        try {
            const newScoresheet = db
                .insert(scoresheets)
                .values({
                    ...buildScoresheetValues(data, sheet, totalScore),

                    submittedAt: new Date().toISOString(),
                })
                .returning()
                .get();

            return c.json(
                {
                    scoresheet: newScoresheet,
                },
                201,
            );
        } catch (error) {
            if (isSqliteUniqueConstraintError(error)) {
                return c.json(
                    {
                        error: "Scoresheet already exists for this team and match",
                    },
                    409,
                );
            }

            console.error(error);

            return c.json(
                {
                    error: "Failed to save scoresheet",
                },
                500,
            );
        }
    })

    .patch("/:id", requireAdmin, async (c) => {
        const id = Number(c.req.param("id"));

        // existing ID / existence checks

        const body = await c.req.json();

        const prepared = prepareScoresheet(body);

        if (!prepared.ok) {
            return c.json(
                {
                    error: prepared.error,
                },
                prepared.status,
            );
        }

        const { data, sheet, totalScore } = prepared;

        try {
            const updatedScoresheet = db
                .update(scoresheets)
                .set(buildScoresheetValues(data, sheet, totalScore))
                .where(eq(scoresheets.id, id))
                .returning()
                .get();

            return c.json({
                scoresheet: updatedScoresheet,
            });
        } catch (error) {
            if (isSqliteUniqueConstraintError(error)) {
                return c.json(
                    {
                        error: "Scoresheet already exists for this team and match",
                    },
                    409,
                );
            }

            console.error(error);

            return c.json(
                {
                    error: "Failed to save scoresheet",
                },
                500,
            );
        }
    });
