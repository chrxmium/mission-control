import { and, asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { PostgresDb } from "../../db/postgres-client.js";
import {
    matches,
    refereeMatches,
    scoresheets,
    teams,
} from "../../db/schema.postgres.js";
import {
    conflict,
    invalidState,
    notFound,
    validationError,
} from "../../domain/errors.js";
import type {
    CreateMatchInput,
    MatchWithParticipants,
    SubmitMatchInput,
    SubmittedMatch,
} from "../../domain/types.js";
import type { MatchRepository } from "../interfaces/matches.js";
import { isPostgresUniqueConstraintError } from "../../utils/postgres.js";

export function createPostgresMatchRepository(db: PostgresDb): MatchRepository {
    const team1 = alias(teams, "match_team1");
    const team2 = alias(teams, "match_team2");

    async function listMatches(eventId: number, refereeId?: number) {
        const selection = {
            match: matches,
            team1: {
                id: team1.id,
                number: team1.number,
                name: team1.name,
            },
            team2: {
                id: team2.id,
                number: team2.number,
                name: team2.name,
            },
        };

        const rows = refereeId === undefined
            ? await db
                .select(selection)
                .from(matches)
                .innerJoin(team1, eq(matches.team1Id, team1.id))
                .leftJoin(team2, eq(matches.team2Id, team2.id))
                .where(eq(matches.eventId, eventId))
                .orderBy(asc(matches.matchNumber))
            : await db
                .select(selection)
                .from(matches)
                .innerJoin(team1, eq(matches.team1Id, team1.id))
                .leftJoin(team2, eq(matches.team2Id, team2.id))
                .innerJoin(
                    refereeMatches,
                    and(
                        eq(refereeMatches.matchId, matches.id),
                        eq(refereeMatches.refereeId, refereeId),
                    ),
                )
                .where(eq(matches.eventId, eventId))
                .orderBy(asc(matches.matchNumber));

        return rows.map((row): MatchWithParticipants => ({
            match: row.match,
            team1: row.team1,
            team2: row.team2,
        }));
    }

    return {
        async listByEvent(eventId) {
            return listMatches(eventId);
        },

        async listAssignedToReferee(refereeId) {
            const assignments = await db
                .select({ eventId: matches.eventId })
                .from(refereeMatches)
                .innerJoin(matches, eq(refereeMatches.matchId, matches.id))
                .where(eq(refereeMatches.refereeId, refereeId));

            const eventIds = [...new Set(assignments.map((row) => row.eventId))];
            const result: MatchWithParticipants[] = [];

            for (const eventId of eventIds) {
                result.push(...await listMatches(eventId, refereeId));
            }

            return result.sort(
                (a, b) => a.match.matchNumber - b.match.matchNumber,
            );
        },

        async findById(id) {
            const [match] = await db
                .select()
                .from(matches)
                .where(eq(matches.id, id))
                .limit(1);

            return match ?? null;
        },

        async findForTeamAndNumber(eventId, teamId, matchNumber) {
            const [match] = await db
                .select()
                .from(matches)
                .where(and(
                    eq(matches.eventId, eventId),
                    eq(matches.matchNumber, matchNumber),
                ))
                .limit(1);

            if (!match) return null;

            return match.team1Id === teamId || match.team2Id === teamId
                ? match
                : null;
        },

        async create(input: CreateMatchInput) {
            const participantIds = input.team2Id === null
                ? [input.team1Id]
                : [input.team1Id, input.team2Id];

            if (input.team2Id === input.team1Id) {
                throw validationError("A team cannot play against itself");
            }

            const participants = await db
                .select({ id: teams.id, eventId: teams.eventId })
                .from(teams)
                .where(inArray(teams.id, participantIds));

            if (
                participants.length !== participantIds.length ||
                participants.some((team) => team.eventId !== input.eventId)
            ) {
                throw validationError("Match teams must belong to the selected event");
            }

            try {
                const [created] = await db
                    .insert(matches)
                    .values(input)
                    .returning();

                return created;
            } catch (error) {
                if (isPostgresUniqueConstraintError(error)) {
                    throw conflict("Match number already exists in this event");
                }

                throw error;
            }
        },

        async submit(input: SubmitMatchInput): Promise<SubmittedMatch> {
            try {
                return await db.transaction(async (tx) => {
                    const [match] = await tx
                        .select()
                        .from(matches)
                        .where(eq(matches.id, input.matchId))
                        .limit(1)
                        .for("update");

                    if (!match) throw notFound("Match not found");

                    if (match.status === "submitted") {
                        throw invalidState("Match has already been submitted");
                    }

                    if (
                        input.team1.teamId !== match.team1Id ||
                        input.team1.eventId !== match.eventId
                    ) {
                        throw validationError("Submitted Team 1 does not match this match");
                    }

                    if (match.team2Id === null && input.team2 !== null) {
                        throw validationError("A solo match cannot have a second scoresheet");
                    }

                    if (match.team2Id !== null && input.team2 === null) {
                        throw validationError("Team 2 scoresheet is required");
                    }

                    if (
                        input.team2 &&
                        (
                            input.team2.teamId !== match.team2Id ||
                            input.team2.eventId !== match.eventId
                        )
                    ) {
                        throw validationError("Submitted Team 2 does not match this match");
                    }

                    const [createdTeam1] = await tx
                        .insert(scoresheets)
                        .values({
                            ...input.team1,
                            submittedAt: input.submittedAt,
                        })
                        .returning();

                    let createdTeam2: SubmittedMatch["team2"] = null;

                    if (input.team2) {
                        const [created] = await tx
                            .insert(scoresheets)
                            .values({
                                ...input.team2,
                                submittedAt: input.submittedAt,
                            })
                            .returning();

                        createdTeam2 = created;
                    }

                    await tx
                        .update(matches)
                        .set({ status: "submitted" })
                        .where(eq(matches.id, input.matchId));

                    return {
                        team1: createdTeam1,
                        team2: createdTeam2,
                    };
                });
            } catch (error) {
                if (isPostgresUniqueConstraintError(error)) {
                    throw conflict("Scoresheet already exists for this match");
                }

                throw error;
            }
        },

        async listAssignmentOptions(eventId) {
            return db
                .select()
                .from(matches)
                .where(eq(matches.eventId, eventId))
                .orderBy(asc(matches.matchNumber));
        },

        async isAssignedToReferee(refereeId, matchId) {
            const [assignment] = await db
                .select({ id: refereeMatches.id })
                .from(refereeMatches)
                .where(and(
                    eq(refereeMatches.refereeId, refereeId),
                    eq(refereeMatches.matchId, matchId),
                ))
                .limit(1);

            return Boolean(assignment);
        },
    };
}
