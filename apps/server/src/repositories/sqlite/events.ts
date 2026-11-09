import { desc, eq, ne } from "drizzle-orm";
import type { SqliteDb } from "../../db/client.js";
import { events } from "../../db/schema.js";
import { notFound } from "../../domain/errors.js";
import type {
    CreateEventInput,
    Event,
    UpdateEventInput,
} from "../../domain/types.js";
import type { EventRepository } from "../interfaces/events.js";

export function createSqliteEventRepository(db: SqliteDb): EventRepository {
    return {
        async list() {
            return db.select().from(events).orderBy(desc(events.createdAt));
        },

        async findById(id) {
            const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
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
                const [created] = await db.insert(events).values(input).returning();
                return created;
            }

            return db.transaction((tx) => {
                tx.update(events)
                    .set({ status: "draft" })
                    .where(eq(events.status, "active"))
                    .run();

                const [created] = tx.insert(events).values(input).returning().all();
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

            return db.transaction((tx) => {
                const [existing] = tx
                    .select({ id: events.id })
                    .from(events)
                    .where(eq(events.id, id))
                    .limit(1)
                    .all();

                if (!existing) return null;

                tx.update(events)
                    .set({ status: "draft" })
                    .where(ne(events.id, id))
                    .run();

                const [updated] = tx
                    .update(events)
                    .set(input)
                    .where(eq(events.id, id))
                    .returning()
                    .all();

                return updated ?? null;
            });
        },

        async activate(id: number) {
            return db.transaction((tx) => {
                const [existing] = tx
                    .select({ id: events.id })
                    .from(events)
                    .where(eq(events.id, id))
                    .limit(1)
                    .all();

                if (!existing) return null;

                tx.update(events)
                    .set({ status: "draft" })
                    .where(ne(events.id, id))
                    .run();

                const [updated] = tx
                    .update(events)
                    .set({ status: "active" })
                    .where(eq(events.id, id))
                    .returning()
                    .all();

                return updated ?? null;
            });
        },
    };
}
