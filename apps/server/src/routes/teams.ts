import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { db } from "../db/index.js";
import { teams } from "../db/schema.js";

export const teamsRoutes = new Hono();

teamsRoutes.get("/", (c) => {
    const result = db.select().from(teams).all();

    return c.json({
        teams: result,
    });
});

teamsRoutes.get("/:id", (c) => {
    const id = Number(c.req.param("id"));

    const team = db.select().from(teams).where(eq(teams.id, id)).get();

    if (!team) {
        return c.json(
            {
                error: "Team not found",
            },
            404,
        );
    }

    return c.json({
        team,
    });
});

teamsRoutes.post("/", requireAdmin, async (c) => {
    const body = await c.req.json();

    if (
        typeof body.number !== "number" ||
        !Number.isInteger(body.number) ||
        body.number <= 0 ||
        typeof body.name !== "string" ||
        body.name.trim().length <= 0
    ) {
        return c.json(
            {
                error: "Invalid request body",
            },
            400,
        );
    }

    try {
        const newTeam = db
            .insert(teams)
            .values({
                number: body.number,
                name: body.name.trim(),
            })
            .returning()
            .get();

        return c.json(
            {
                team: newTeam,
            },
            201,
        );
    } catch (error) {
        console.error(error);

        return c.json(
            {
                error: "Team number already exists",
            },
            409,
        );
    }
});
