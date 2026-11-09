import type {
    CreateTeamInput,
    Team,
} from "../../domain/types.js";

export interface TeamRepository {
    listByEvent(eventId: number): Promise<Team[]>;
    findById(id: number): Promise<Team | null>;
    create(input: CreateTeamInput): Promise<Team>;
}
