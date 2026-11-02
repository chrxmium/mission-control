import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { PostgresDb } from "../../db/postgres-client.js";
import {
    authSessions,
    referees,
    refereeLoginCodes,
} from "../../db/schema.postgres.js";
import type {
    CreateLoginCodeInput,
    CreateSessionInput,
    RedeemLoginCodeInput,
    RedeemedLogin,
} from "../../domain/types.js";
import type { AuthRepository } from "../interfaces/auth.js";
import { forbidden } from "../../domain/errors.js";

export function createPostgresAuthRepository(db: PostgresDb): AuthRepository {
    return {
        async createSession(input: CreateSessionInput) {
            const [session] = await db
                .insert(authSessions)
                .values(input)
                .returning({
                    id: authSessions.id,
                    role: authSessions.role,
                    refereeId: authSessions.refereeId,
                    expiresAt: authSessions.expiresAt,
                });

            return session;
        },

        async findSessionByTokenHash(tokenHash: string) {
            const [session] = await db
                .select({
                    id: authSessions.id,
                    role: authSessions.role,
                    refereeId: authSessions.refereeId,
                    expiresAt: authSessions.expiresAt,
                })
                .from(authSessions)
                .leftJoin(
                    referees,
                    eq(authSessions.refereeId, referees.id),
                )
                .where(
                    and(
                        eq(authSessions.tokenHash, tokenHash),
                        isNull(authSessions.revokedAt),
                        or(
                            eq(authSessions.role, "headref"),
                            eq(referees.active, true),
                        ),
                    ),
                )
                .limit(1);

            return session ?? null;
        },

        async revokeSession(tokenHash: string, revokedAt: number) {
            await db
                .update(authSessions)
                .set({ revokedAt })
                .where(
                    and(
                        eq(authSessions.tokenHash, tokenHash),
                        isNull(authSessions.revokedAt),
                    ),
                );
        },

        async createLoginCode(input: CreateLoginCodeInput) {
            await db.transaction(async (tx) => {
                await tx
                    .update(refereeLoginCodes)
                    .set({ redeemedAt: input.createdAt })
                    .where(
                        and(
                            eq(refereeLoginCodes.refereeId, input.refereeId),
                            isNull(refereeLoginCodes.redeemedAt),
                        ),
                    );

                await tx
                    .insert(refereeLoginCodes)
                    .values(input);
            });
        },

        async redeemLoginCode(input: RedeemLoginCodeInput) {
            return db.transaction(async (tx): Promise<RedeemedLogin | null> => {
                const [code] = await tx
                    .select({
                        id: refereeLoginCodes.id,
                        refereeId: refereeLoginCodes.refereeId,
                        expiresAt: refereeLoginCodes.expiresAt,
                        redeemedAt: refereeLoginCodes.redeemedAt,
                        refereeName: referees.name,
                        refereeUsername: referees.username,
                        refereeActive: referees.active,
                    })
                    .from(refereeLoginCodes)
                    .innerJoin(
                        referees,
                        eq(refereeLoginCodes.refereeId, referees.id),
                    )
                    .where(eq(refereeLoginCodes.tokenHash, input.tokenHash))
                    .limit(1);

                if (!code || code.redeemedAt !== null || code.expiresAt <= input.now) {
                    return null;
                }

                if (!code.refereeActive) {
                    throw forbidden("Referee account is inactive");
                }

                if (input.session.role !== "referee") {
                    return null;
                }

                const [consumed] = await tx
                    .update(refereeLoginCodes)
                    .set({ redeemedAt: input.now })
                    .where(
                        and(
                            eq(refereeLoginCodes.id, code.id),
                            isNull(refereeLoginCodes.redeemedAt),
                            gt(refereeLoginCodes.expiresAt, input.now),
                        ),
                    )
                    .returning({ id: refereeLoginCodes.id });

                if (!consumed) {
                    return null;
                }

                const [session] = await tx
                    .insert(authSessions)
                    .values({
                        ...input.session,
                        refereeId: code.refereeId,
                    })
                    .returning({
                        id: authSessions.id,
                        role: authSessions.role,
                        refereeId: authSessions.refereeId,
                        expiresAt: authSessions.expiresAt,
                    });

                return {
                    session,
                    referee: {
                        id: code.refereeId,
                        name: code.refereeName,
                        username: code.refereeUsername,
                    },
                };
            });
        },
    };
}
