// NOTE: This is a very simple authentication system that is not suitable for production use.
// It is only intended for use in a local development environment.
// I just want to submit this MVP okay bro :cry:
// I'll get it to a deployable standard later, I promise :pray:
import { randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_DURATION = 12 * 60 * 60 * 1000;

type Session = {
    expiresAt: number;
};

const sessions = new Map<string, Session>();

const refereePassword = process.env.REFEREE_PASSWORD;

if (!refereePassword) {
    throw new Error("REFEREE_PASSWORD is not configured");
}

export function verifyPassword(password: string): boolean {
    const supplied = Buffer.from(password);
    const expected = Buffer.from(refereePassword!);

    if (supplied.length !== expected.length) {
        return false;
    }

    return timingSafeEqual(supplied, expected);
}

export function createSession(): string {
    const token = randomBytes(32).toString("hex");

    sessions.set(token, {
        expiresAt: Date.now() + SESSION_DURATION,
    });

    return token;
}

export function verifySession(token: string): boolean {
    const session = sessions.get(token);

    if (!session) {
        return false;
    }

    if (Date.now() >= session.expiresAt) {
        sessions.delete(token);
        return false;
    }

    return true;
}