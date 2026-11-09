import { asc, eq, inArray } from "drizzle-orm";
import type { PostgresDb } from "../../db/postgres-client.js";
import {
    matches,
    refereeMatches,
    referees,
} from "../../db/schema.postgres.js";
import {
    conflict,
    notFound,
    validationError,
} from "../../domain/errors.js";
import type {
    CreateRefereeInput,
    RefereeAssignment,
    ReplaceRefereeAssignmentsInput,
} from "../../domain/types.js";
import type { RefereeRepository } from "../interfaces/referees.js";
import { isPostgresUniqueConstraintError } from "../../utils/postgres.js";

export function createPostgresRefereeRepository(
    db: PostgresDb,
): RefereeRepository {
    return {
        async list() {
            const refereeRows = await db
                .select()
                .from(referees)
                .orderBy(asc(referees.id));

            const assignmentRows = await db
                .select({
                    refereeId: refereeMatches.refereeId,
                    matchId: refereeMatches.matchId,
                })
                .from(refereeMatches);

            const matchIdsByReferee = new Map<number, number[]>();

            for (const assignment of assignmentRows) {
                const ids = matchIdsByReferee.get(assignment.refereeId) ?? [];
                ids.push(assignment.matchId);
                matchIdsByReferee.set(assignment.refereeId, ids);
            }

            return refereeRows.map((referee) => ({
                ...referee,
                matchIds: matchIdsByReferee.get(referee.id) ?? [],
            }));
        },

        async findById(id) {
            const [referee] = await db
                .select()
                .from(referees)
                .where(eq(referees.id, id))
                .limit(1);

            return referee ?? null;
        },

        async create(input: CreateRefereeInput) {
            try {
                const [referee] = await db
                    .insert(referees)
                    .values(input)
                    .returning();

                return referee;
            } catch (error) {
                if (isPostgresUniqueConstraintError(error)) {
                    throw conflict("A referee with that username already exists.");
                }

                throw error;
            }
        },

        async setActive(id, active) {
            const [referee] = await db
                .update(referees)
                .set({ active })
                .where(eq(referees.id, id))
                .returning();

            return referee ?? null;
        },

        async replaceAssignments(input: ReplaceRefereeAssignmentsInput) {
            if (new Set(input.matchIds).size !== input.matchIds.length) {
                throw validationError("A match cannot be assigned more than once.");
            }

            return db.transaction(async (tx) => {
                const [referee] = await tx
                    .select({ id: referees.id })
                    .from(referees)
                    .where(eq(referees.id, input.refereeId))
                    .limit(1)
                    .for("update");

                if (!referee) {
                    throw notFound("Referee not found.");
                }

                if (input.matchIds.length > 0) {
                    const matchingMatches = await tx
                        .select({
                            id: matches.id,
                            eventId: matches.eventId,
                        })
                        .from(matches)
                        .where(inArray(matches.id, input.matchIds));

                    if (matchingMatches.length !== input.matchIds.length) {
                        throw validationError("One or more selected matches do not exist.");
                    }

                    if (
                        input.eventId !== undefined &&
                        matchingMatches.some((match) => match.eventId !== input.eventId)
                    ) {
                        throw validationError(
                            "All assigned matches must belong to the selected event.",
                        );
                    }
                }

                await tx
                    .update(referees)
                    .set({ tableNumber: input.tableNumber })
                    .where(eq(referees.id, input.refereeId));

                await tx
                    .delete(refereeMatches)
                    .where(eq(refereeMatches.refereeId, input.refereeId));

                if (input.matchIds.length > 0) {
                    await tx
                        .insert(refereeMatches)
                        .values(
                            input.matchIds.map((matchId) => ({
                                refereeId: input.refereeId,
                                matchId,
                                assignedAt: input.assignedAt,
                            })),
                        );
                }

                return tx
                    .select({
                        refereeId: refereeMatches.refereeId,
                        matchId: refereeMatches.matchId,
                        assignedAt: refereeMatches.assignedAt,
                    })
                    .from(refereeMatches)
                    .where(eq(refereeMatches.refereeId, input.refereeId))
                    .orderBy(asc(refereeMatches.matchId));
            });
        },

        async listAssignments(refereeId: number) {
            return db
                .select({
                    refereeId: refereeMatches.refereeId,
                    matchId: refereeMatches.matchId,
                    assignedAt: refereeMatches.assignedAt,
                })
                .from(refereeMatches)
                .where(eq(refereeMatches.refereeId, refereeId))
                .orderBy(asc(refereeMatches.matchId));
        },

        async isActive(id) {
            const [referee] = await db
                .select({ active: referees.active })
                .from(referees)
                .where(eq(referees.id, id))
                .limit(1);

            return referee?.active ?? false;
        },
    };
}
