import type { ScoreSheet } from "../../../../packages/rules/src/types.ts";

export type ParticipationStatus =
    | "playing"
    | "no_show"
    | "nullified";

export interface TeamMatchScore {
    teamId: number;
    participation: ParticipationStatus;
    sheet: ScoreSheet;
}

export interface MatchScoringState {
    matchId: number;
    tableNumber: number;

    sharedM05: number;

    team1: TeamMatchScore;
    team2: TeamMatchScore | null;
}