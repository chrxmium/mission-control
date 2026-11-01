import { eq } from "drizzle-orm";
import type { SqliteDb } from "../../db/client.js";
import { events, teams } from "../../db/schema.js";
import { conflict, notFound } from "../../domain/errors.js";
import type { CreateTeamInput } from "../../domain/types.js";
import type { TeamRepository } from "../interfaces/teams.js";
import { isSqliteUniqueConstraintError } from "../../utils/sqlite.js";

export function createSqliteTeamRepository(db: SqliteDb): TeamRepository {
    return {
        async listByEvent(eventId) {
            return db.select().from(teams).where(eq(teams.eventId, eventId));
        },

        async findById(id) {
            const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
            return team ?? null;
        },

        async create(input: CreateTeamInput) {
            const [event] = await db
                .select({ id: events.id })
                .from(events)
                .where(eq(events.id, input.eventId))
                .limit(1);

            if (!event) throw notFound("Event not found");

            try {
                const [created] = await db.insert(teams).values(input).returning();
                return created;
            } catch (error) {
                if (isSqliteUniqueConstraintError(error)) {
                    throw conflict("Team number already exists in this event");
                }

                throw error;
            }
        },
    };
}
