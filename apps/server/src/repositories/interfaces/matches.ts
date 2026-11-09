import type {
    CreateMatchInput,
    Match,
    MatchWithParticipants,
    SubmitMatchInput,
    SubmittedMatch,
} from "../../domain/types.js";

export interface MatchRepository {
    listByEvent(eventId: number): Promise<MatchWithParticipants[]>;
    listAssignedToReferee(refereeId: number): Promise<MatchWithParticipants[]>;
    findById(id: number): Promise<Match | null>;
    findForTeamAndNumber(
        eventId: number,
        teamId: number,
        matchNumber: number,
    ): Promise<Match | null>;
    create(input: CreateMatchInput): Promise<Match>;
    submit(input: SubmitMatchInput): Promise<SubmittedMatch>;
    listAssignmentOptions(eventId: number): Promise<Match[]>;
    isAssignedToReferee(refereeId: number, matchId: number): Promise<boolean>;
}
