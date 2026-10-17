import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { scoresheets } from "../db/schema.js";

export const scoresheetsRoutes = new Hono();

scoresheetsRoutes.get("/", (c) => {
    const result = db.select().from(scoresheets).all();

    return c.json({
        scoresheets: result,
    });
});

scoresheetsRoutes.get("/:id", (c) => {
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
});
