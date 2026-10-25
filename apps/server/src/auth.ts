import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "./db/index.js";
import { authSessions, referees } from "./db/schema.js";

const HEADREF_SESSION_DURATION = 12 * 60 * 60 * 1000;
const REFEREE_SESSION_DURATION = 24 * 60 * 60 * 1000;

export type SessionRole = "headref" | "referee";

export type AuthenticatedSession = {
    id: number;
    role: SessionRole;
    refereeId: number | null;
    expiresAt: number;
};

const refereePassword: string = (() => {
    const password = process.env.REFEREE_PASSWORD;

    if (!password) {
        throw new Error("REFEREE_PASSWORD is not configured");
    }

    return password;
})();

export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function verifyPassword(password: string): boolean {
    const supplied = Buffer.from(password);
    const expected = Buffer.from(refereePassword);

    if (supplied.length !== expected.length) {
        return false;
    }

    return timingSafeEqual(supplied, expected);
}

export function createSession(
    role: SessionRole = "referee",
    refereeId: number | null = null,
): string {
    const token = randomBytes(32).toString("hex");
    const now = Date.now();

    const duration = role === "referee"
        ? REFEREE_SESSION_DURATION
        : HEADREF_SESSION_DURATION;

    db.insert(authSessions)
        .values({
            tokenHash: hashToken(token),
            role,
            refereeId,
            createdAt: now,
            expiresAt: now + duration,
            revokedAt: null,
        })
        .run();

    return token;
}

export function getSession(token: string): AuthenticatedSession | null {
    const session = db
        .select({
            id: authSessions.id,
            role: authSessions.role,
            refereeId: authSessions.refereeId,
            expiresAt: authSessions.expiresAt,
            revokedAt: authSessions.revokedAt,
        })
        .from(authSessions)
        .where(eq(authSessions.tokenHash, hashToken(token)))
        .get();

    if (!session || session.revokedAt !== null || Date.now() >= session.expiresAt) {
        return null;
    }

    if (session.role === "referee" && session.refereeId !== null) {
        const referee = db
            .select({ active: referees.active })
            .from(referees)
            .where(eq(referees.id, session.refereeId))
            .get();

        if (!referee?.active) {
            return null;
        }
    }

    return {
        id: session.id,
        role: session.role,
        refereeId: session.refereeId,
        expiresAt: session.expiresAt,
    };
}

export function verifySession(token: string): boolean {
    return getSession(token) !== null;
}

export function revokeSession(token: string): void {
    db.update(authSessions)
        .set({ revokedAt: Date.now() })
        .where(eq(authSessions.tokenHash, hashToken(token)))
        .run();
}
