import type {
    CreateScoresheetInput,
    Scoresheet,
    UpdateScoresheetInput,
} from "../../domain/types.js";

export interface ScoresheetRepository {
    listByEvent(eventId: number): Promise<Scoresheet[]>;
    findById(id: number): Promise<Scoresheet | null>;
    create(input: CreateScoresheetInput): Promise<Scoresheet>;
    update(input: UpdateScoresheetInput): Promise<Scoresheet | null>;
}
