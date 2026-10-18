import { eq } from "drizzle-orm";
import * as v from "valibot";
import { createTeamSchema } from "../validators/teams.js";
import { Hono } from "hono";
import { requireAdmin } from "../middleware/admin-auth.js";
import { db } from "../db/index.js";
import { teams } from "../db/schema.js";

export const teamsRoutes = new Hono()

    .get("/", (c) => {
        const result = db.select().from(teams).all();

        return c.json({
            teams: result,
        });
    })

    .get("/:id", (c) => {
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
    })

    .post("/", requireAdmin, async (c) => {
        const body = await c.req.json().catch(() => null);
        const parsed = v.safeParse(createTeamSchema, body);

        if (!parsed.success) {
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
                    number: parsed.output.number,
                    name: parsed.output.name,
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
