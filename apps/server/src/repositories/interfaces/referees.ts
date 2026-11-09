import type {
    CreateRefereeInput,
    Referee,
    RefereeAssignment,
    ReplaceRefereeAssignmentsInput,
} from "../../domain/types.js";

export interface RefereeRepository {
    list(): Promise<Array<Referee & { matchIds: number[] }>>;
    findById(id: number): Promise<Referee | null>;
    create(input: CreateRefereeInput): Promise<Referee>;
    setActive(id: number, active: boolean): Promise<Referee | null>;
    replaceAssignments(
        input: ReplaceRefereeAssignmentsInput,
    ): Promise<RefereeAssignment[]>;
    listAssignments(refereeId: number): Promise<RefereeAssignment[]>;
    isActive(id: number): Promise<boolean>;
}
