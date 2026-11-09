import type {
    CreateEventInput,
    Event,
    UpdateEventInput,
} from "../../domain/types.js";

export interface EventRepository {
    list(): Promise<Event[]>;
    findById(id: number): Promise<Event | null>;
    findActive(): Promise<Event | null>;
    create(input: CreateEventInput): Promise<Event>;
    update(id: number, input: UpdateEventInput): Promise<Event | null>;
    activate(id: number): Promise<Event | null>;
}
