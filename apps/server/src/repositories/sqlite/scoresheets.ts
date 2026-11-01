import { and, eq } from "drizzle-orm";
import type { SqliteDb } from "../../db/client.js";
import { scoresheets, teams } from "../../db/schema.js";
import { conflict, notFound, validationError } from "../../domain/errors.js";
import type {
    CreateScoresheetInput,
    UpdateScoresheetInput,
} from "../../domain/types.js";
import type { ScoresheetRepository } from "../interfaces/scoresheets.js";
import { isSqliteUniqueConstraintError } from "../../utils/sqlite.js";

export function createSqliteScoresheetRepository(db: SqliteDb): ScoresheetRepository {
    return {
        async listByEvent(eventId) {
            return db
                .select()
                .from(scoresheets)
                .where(eq(scoresheets.eventId, eventId));
        },

        async findById(id) {
            const [scoresheet] = await db
                .select()
                .from(scoresheets)
                .where(eq(scoresheets.id, id))
                .limit(1);

            return scoresheet ?? null;
        },

        async create(input: CreateScoresheetInput) {
            const { values } = input;

            const [team] = await db
                .select({ id: teams.id, eventId: teams.eventId })
                .from(teams)
                .where(eq(teams.id, values.teamId))
                .limit(1);

            if (!team) throw notFound("Team not found");

            if (team.eventId !== values.eventId) {
                throw validationError("Team does not belong to this event");
            }

            try {
                const [created] = await db
                    .insert(scoresheets)
                    .values(values)
                    .returning();

                return created;
            } catch (error) {
                if (isSqliteUniqueConstraintError(error)) {
                    throw conflict("Scoresheet already exists for this team and match");
                }

                throw error;
            }
        },

        async update(input: UpdateScoresheetInput) {
            const existing = await db
                .select({ id: scoresheets.id })
                .from(scoresheets)
                .where(eq(scoresheets.id, input.id))
                .limit(1);

            if (existing.length === 0) return null;

            try {
                const [updated] = await db
                    .update(scoresheets)
                    .set(input.values)
                    .where(eq(scoresheets.id, input.id))
                    .returning();

                return updated ?? null;
            } catch (error) {
                if (isSqliteUniqueConstraintError(error)) {
                    throw conflict("Scoresheet already exists for this team and match");
                }

                throw error;
            }
        },
    };
}
