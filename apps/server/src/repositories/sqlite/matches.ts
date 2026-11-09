import { and, eq, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { SqliteDb } from "../../db/client.js";
import { matches, refereeMatches, scoresheets, teams } from "../../db/schema.js";
import { conflict, invalidState, notFound, validationError } from "../../domain/errors.js";
import type {
    CreateMatchInput,
    Match,
    MatchWithParticipants,
    SubmitMatchInput,
    SubmittedMatch,
} from "../../domain/types.js";
import type { MatchRepository } from "../interfaces/matches.js";
import { isSqliteUniqueConstraintError } from "../../utils/sqlite.js";

export function createSqliteMatchRepository(db: SqliteDb): MatchRepository {
    const team1 = alias(teams, "match_team1");
    const team2 = alias(teams, "match_team2");

    async function listMatches(eventId: number, refereeId?: number) {
        const base = db
            .select({
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
            })
            .from(matches)
            .innerJoin(team1, eq(matches.team1Id, team1.id))
            .leftJoin(team2, eq(matches.team2Id, team2.id));

        const rows = refereeId === undefined
            ? await base
                .where(eq(matches.eventId, eventId))
                .orderBy(asc(matches.matchNumber))
            : await base
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

            if (assignments.length === 0) return [];

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
                .where(eq(teams.eventId, input.eventId));

            const participantMap = new Map(
                participants.map((team) => [team.id, team.eventId]),
            );

            for (const teamId of participantIds) {
                if (!participantMap.has(teamId)) {
                    throw validationError("Match teams must belong to the selected event");
                }
            }

            try {
                const [created] = await db
                    .insert(matches)
                    .values(input)
                    .returning();

                return created;
            } catch (error) {
                if (isSqliteUniqueConstraintError(error)) {
                    throw conflict("Match number already exists in this event");
                }

                throw error;
            }
        },

        async submit(input: SubmitMatchInput): Promise<SubmittedMatch> {
            try {
                return db.transaction((tx) => {
                    const [match] = tx
                        .select()
                        .from(matches)
                        .where(eq(matches.id, input.matchId))
                        .limit(1)
                        .all();

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

                    const [createdTeam1] = tx
                        .insert(scoresheets)
                        .values({
                            ...input.team1,
                            submittedAt: input.submittedAt,
                        })
                        .returning()
                        .all();

                    let createdTeam2 = null;

                    if (input.team2) {
                        const [created] = tx
                            .insert(scoresheets)
                            .values({
                                ...input.team2,
                                submittedAt: input.submittedAt,
                            })
                            .returning()
                            .all();

                        createdTeam2 = created;
                    }

                    tx.update(matches)
                        .set({ status: "submitted" })
                        .where(eq(matches.id, input.matchId))
                        .run();

                    return {
                        team1: createdTeam1,
                        team2: createdTeam2,
                    };
                });
            } catch (error) {
                if (isSqliteUniqueConstraintError(error)) {
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
