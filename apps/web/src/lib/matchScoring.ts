import { score } from "../../../../packages/rules/src/score.ts";
import type { ScoreSheet } from "../../../../packages/rules/src/types.ts";

export type ParticipationStatus = "playing" | "no_show";

export interface TeamMatchScore {
    teamId: number;
    participation: ParticipationStatus;
    sheet: ScoreSheet;
}

export interface MatchScoringState {
    matchId: number;
    tableNumber: number;

    // m05 is seperate as it is shared between both teams
    sharedM05: number;

    team1: TeamMatchScore;
    team2: TeamMatchScore | null;
}

// team auto null if they have 3 interference violations
export function isTeamNullified(
    team: TeamMatchScore,
): boolean {
    return (
        team.participation === "playing" &&
        team.sheet.interference >= 3
    );
}

// team only gets m05 if they're playing
export function calculateTeamM05(
    team: TeamMatchScore,
    sharedM05: number,
): number {
    if (
        team.participation !== "playing" ||
        isTeamNullified(team)
    ) {
        return 0;
    }

    return sharedM05 * 5;
}

// calculate final
export function calculateTeamMatchScore(
    team: TeamMatchScore,
    sharedM05: number,
): number {
    // No-show teams receive zero.
    if (team.participation === "no_show") {
        return 0;
    }

    // team auto null if they have 3 interference violations
    if (isTeamNullified(team)) {
        return 0;
    }

    // apply shared m05 value to scoresheet
    // shared scoring engine calculated everything else
    return score({
        ...team.sheet,
        m05_haven: sharedM05,
    });
}