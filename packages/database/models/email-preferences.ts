import { pgTable, uuid, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const emailPreferencesTable = pgTable(
  "email_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    newResponseEmail: boolean("new_response_email").notNull().default(true),
    weeklyDigest: boolean("weekly_digest").notNull().default(false),
    marketing: boolean("marketing").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("email_preferences_user_id_idx").on(table.userId)],
);

export type SelectEmailPreference = typeof emailPreferencesTable.$inferSelect;
export type InsertEmailPreference = typeof emailPreferencesTable.$inferInsert;
