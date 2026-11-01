import type { ScoreSheet } from "@mission-control/rules";

export type EventStatus = "draft" | "active" | "completed";
export type SessionRole = "headref" | "referee";

export interface Event {
    id: number;
    name: string;
    season: string;
    location: string | null;
    eventDate: string | null;
    status: EventStatus;
    ruleset: string;
    tableCount: number;
    practiceMatchesEnabled: boolean;
    createdAt: number;
}

export interface CreateEventInput {
    name: string;
    season: string;
    location: string | null;
    eventDate: string | null;
    status: EventStatus;
    ruleset: string;
    tableCount: number;
    practiceMatchesEnabled: boolean;
    createdAt: number;
}

export interface UpdateEventInput {
    name?: string;
    season?: string;
    location?: string | null;
    eventDate?: string | null;
    status?: EventStatus;
    ruleset?: string;
    tableCount?: number;
    practiceMatchesEnabled?: boolean;
}

export interface Team {
    id: number;
    eventId: number;
    number: number;
    name: string;
}

export interface CreateTeamInput {
    eventId: number;
    number: number;
    name: string;
}

export interface TeamSummary {
    id: number;
    number: number;
    name: string;
}

export interface Match {
    id: number;
    eventId: number;
    matchNumber: number;
    team1Id: number;
    team2Id: number | null;
    scheduledAt: string | null;
    status: string;
}

export interface MatchWithParticipants {
    match: Match;
    team1: TeamSummary;
    team2: TeamSummary | null;
}

export interface CreateMatchInput {
    eventId: number;
    matchNumber: number;
    team1Id: number;
    team2Id: number | null;
    scheduledAt: string | null;
}

export interface Referee {
    id: number;
    name: string;
    username: string;
    tableNumber: number | null;
    active: boolean;
    createdAt: number;
}

export interface CreateRefereeInput {
    name: string;
    username: string;
    createdAt: number;
}

export interface RefereeAssignment {
    refereeId: number;
    matchId: number;
    assignedAt: number;
}

export interface ReplaceRefereeAssignmentsInput {
    refereeId: number;
    tableNumber: number | null;
    matchIds: number[];
    eventId?: number;
    assignedAt: number;
}

export interface AuthSession {
    id: number;
    tokenHash: string;
    role: SessionRole;
    refereeId: number | null;
    createdAt: number;
    expiresAt: number;
    revokedAt: number | null;
}

export interface AuthenticatedSession {
    id: number;
    role: SessionRole;
    refereeId: number | null;
    expiresAt: number;
}

export interface CreateSessionInput {
    tokenHash: string;
    role: SessionRole;
    refereeId: number | null;
    createdAt: number;
    expiresAt: number;
}

export interface RefereeLoginCode {
    id: number;
    tokenHash: string;
    refereeId: number;
    createdBySessionId: number;
    createdAt: number;
    expiresAt: number;
    redeemedAt: number | null;
}

export interface CreateLoginCodeInput {
    tokenHash: string;
    refereeId: number;
    createdBySessionId: number;
    createdAt: number;
    expiresAt: number;
}

export interface RedeemLoginCodeInput {
    tokenHash: string;
    now: number;
    session: CreateSessionInput;
}

export interface RedeemedLogin {
    session: AuthenticatedSession;
    referee: Pick<Referee, "id" | "name" | "username">;
}

export interface Scoresheet {
    id: number;
    eventId: number;
    teamId: number;
    matchNumber: number;
    tableNumber: number;
    m01YoungForest: number;
    m01GrandTree: number;
    m01HollowTree: number;
    m01QueenKnockedDown: boolean;
    m02Base: number;
    m02Canopy: number;
    m03Waterfall: number;
    m04Nest: boolean;
    m04Hollow: boolean;
    m05Haven: number;
    luAdded: number;
    luContained: number;
    interference: number;
    gp: number;
    totalScore: number;
    submittedAt: string;
}

export type ScoresheetValues = Omit<Scoresheet, "id">;

export interface CreateScoresheetInput {
    values: ScoresheetValues;
}

export interface UpdateScoresheetInput {
    id: number;
    values: Omit<ScoresheetValues, "eventId" | "teamId" | "matchNumber">;
}

export interface SubmitMatchInput {
    matchId: number;
    submittedAt: string;
    team1: ScoresheetValues;
    team2: ScoresheetValues | null;
}

export interface SubmittedMatch {
    team1: Scoresheet;
    team2: Scoresheet | null;
}

export interface TeamRanking {
    rank: number | null;
    teamId: number;
    teamNumber: number;
    teamName: string;
    matches: number;
    averageScore: number | null;
    highScore: number | null;
}

export interface RefereeDashboard {
    referee: Pick<Referee, "id" | "name" | "username" | "tableNumber">;
    matches: MatchWithParticipants[];
}
