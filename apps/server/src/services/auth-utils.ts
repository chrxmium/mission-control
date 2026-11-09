import { createHash, timingSafeEqual } from "node:crypto";

export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function verifyPassword(suppliedPassword: string, expectedPassword: string): boolean {
    if (!expectedPassword) return false;

    const supplied = Buffer.from(suppliedPassword);
    const expected = Buffer.from(expectedPassword);

    if (supplied.length !== expected.length) return false;

    return timingSafeEqual(supplied, expected);
}
