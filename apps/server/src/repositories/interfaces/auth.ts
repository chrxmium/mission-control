import type {
    AuthenticatedSession,
    CreateLoginCodeInput,
    CreateSessionInput,
    RedeemLoginCodeInput,
    RedeemedLogin,
} from "../../domain/types.js";

export interface AuthRepository {
    createSession(input: CreateSessionInput): Promise<AuthenticatedSession>;
    findSessionByTokenHash(tokenHash: string): Promise<AuthenticatedSession | null>;
    revokeSession(tokenHash: string, revokedAt: number): Promise<void>;
    createLoginCode(input: CreateLoginCodeInput): Promise<void>;
    redeemLoginCode(input: RedeemLoginCodeInput): Promise<RedeemedLogin | null>;
}
