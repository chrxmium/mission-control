import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
    id: integer("id").primaryKey({
        autoIncrement: true,
    }),

    number: integer("number")
        .notNull()
        .unique(),

    name: text("name")
        .notNull(),
});