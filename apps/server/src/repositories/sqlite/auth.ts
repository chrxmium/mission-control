import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { SqliteDb } from "../../db/client.js";
import {
    authSessions,
    referees,
    refereeLoginCodes,
} from "../../db/schema.js";
import type {
    AuthenticatedSession,
    CreateLoginCodeInput,
    CreateSessionInput,
    RedeemLoginCodeInput,
    RedeemedLogin,
} from "../../domain/types.js";
import type { AuthRepository } from "../interfaces/auth.js";

export function createSqliteAuthRepository(db: SqliteDb): AuthRepository {
    return {
        async createSession(input: CreateSessionInput) {
            return db
                .insert(authSessions)
                .values(input)
                .returning({
                    id: authSessions.id,
                    role: authSessions.role,
                    refereeId: authSessions.refereeId,
                    expiresAt: authSessions.expiresAt,
                })
                .get();
        },

        async findSessionByTokenHash(tokenHash: string) {
            const session = await db
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
                .get();

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
                )
                .run();
        },

        async createLoginCode(input: CreateLoginCodeInput) {
            await db.transaction((tx) => {
                tx.update(refereeLoginCodes)
                    .set({ redeemedAt: input.createdAt })
                    .where(
                        and(
                            eq(refereeLoginCodes.refereeId, input.refereeId),
                            isNull(refereeLoginCodes.redeemedAt),
                        ),
                    )
                    .run();

                tx.insert(refereeLoginCodes)
                    .values(input)
                    .run();
            });
        },

        async redeemLoginCode(input: RedeemLoginCodeInput) {
            return db.transaction((tx): RedeemedLogin | null => {
                const code = tx
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
                    .get();

                if (
                    !code ||
                    code.redeemedAt !== null ||
                    code.expiresAt <= input.now ||
                    !code.refereeActive ||
                    input.session.refereeId !== code.refereeId ||
                    input.session.role !== "referee"
                ) {
                    return null;
                }

                const consumed = tx
                    .update(refereeLoginCodes)
                    .set({ redeemedAt: input.now })
                    .where(
                        and(
                            eq(refereeLoginCodes.id, code.id),
                            isNull(refereeLoginCodes.redeemedAt),
                            gt(refereeLoginCodes.expiresAt, input.now),
                        ),
                    )
                    .returning({ id: refereeLoginCodes.id })
                    .get();

                if (!consumed) {
                    return null;
                }

                const session = tx
                    .insert(authSessions)
                    .values(input.session)
                    .returning({
                        id: authSessions.id,
                        role: authSessions.role,
                        refereeId: authSessions.refereeId,
                        expiresAt: authSessions.expiresAt,
                    })
                    .get();

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
