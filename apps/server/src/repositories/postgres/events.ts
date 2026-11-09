import { desc, eq, ne } from "drizzle-orm";
import type { PostgresDb } from "../../db/postgres-client.js";
import { events } from "../../db/schema.postgres.js";
import type {
    CreateEventInput,
    UpdateEventInput,
} from "../../domain/types.js";
import type { EventRepository } from "../interfaces/events.js";

export function createPostgresEventRepository(db: PostgresDb): EventRepository {
    return {
        async list() {
            return db.select().from(events).orderBy(desc(events.createdAt));
        },

        async findById(id) {
            const [event] = await db
                .select()
                .from(events)
                .where(eq(events.id, id))
                .limit(1);

            return event ?? null;
        },

        async findActive() {
            const [event] = await db
                .select()
                .from(events)
                .where(eq(events.status, "active"))
                .limit(1);

            return event ?? null;
        },

        async create(input: CreateEventInput) {
            if (input.status !== "active") {
                const [created] = await db
                    .insert(events)
                    .values(input)
                    .returning();

                return created;
            }

            return db.transaction(async (tx) => {
                await tx
                    .update(events)
                    .set({ status: "draft" })
                    .where(eq(events.status, "active"));

                const [created] = await tx
                    .insert(events)
                    .values(input)
                    .returning();

                return created;
            });
        },

        async update(id: number, input: UpdateEventInput) {
            if (input.status !== "active") {
                const [updated] = await db
                    .update(events)
                    .set(input)
                    .where(eq(events.id, id))
                    .returning();

                return updated ?? null;
            }

            return db.transaction(async (tx) => {
                const [existing] = await tx
                    .select({ id: events.id })
                    .from(events)
                    .where(eq(events.id, id))
                    .limit(1);

                if (!existing) return null;

                await tx
                    .update(events)
                    .set({ status: "draft" })
                    .where(ne(events.id, id));

                const [updated] = await tx
                    .update(events)
                    .set(input)
                    .where(eq(events.id, id))
                    .returning();

                return updated ?? null;
            });
        },

        async activate(id: number) {
            return db.transaction(async (tx) => {
                const [existing] = await tx
                    .select({ id: events.id })
                    .from(events)
                    .where(eq(events.id, id))
                    .limit(1);

                if (!existing) return null;

                await tx
                    .update(events)
                    .set({ status: "draft" })
                    .where(ne(events.id, id));

                const [updated] = await tx
                    .update(events)
                    .set({ status: "active" })
                    .where(eq(events.id, id))
                    .returning();

                return updated ?? null;
            });
        },
    };
}
