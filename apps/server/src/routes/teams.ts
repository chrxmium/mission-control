import { eq } from "drizzle-orm";
import { Hono } from "hono";
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
