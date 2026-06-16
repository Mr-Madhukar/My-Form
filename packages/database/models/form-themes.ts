import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const formThemesTable = pgTable("form_themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  preset: varchar("preset", { length: 50 }).notNull(),
  accentColor: varchar("accent_color", { length: 7 }).notNull(),
  aiAccentColor: varchar("ai_accent_color", { length: 7 }),
  isSystem: boolean("is_system").notNull().default(false),
  createdBy: uuid("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectFormTheme = typeof formThemesTable.$inferSelect;
export type InsertFormTheme = typeof formThemesTable.$inferInsert;
