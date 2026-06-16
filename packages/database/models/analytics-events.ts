import { pgTable, uuid, varchar, timestamp, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { formsTable } from "./forms";

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "form_view",
  "form_start",
  "form_submit",
  "form_abandon",
]);

export const analyticsEventsTable = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    eventType: analyticsEventTypeEnum("event_type").notNull(),
    metadata: jsonb("metadata"),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("analytics_events_form_id_idx").on(table.formId),
    index("analytics_events_type_idx").on(table.eventType),
    index("analytics_events_created_at_idx").on(table.createdAt),
  ],
);

export type SelectAnalyticsEvent = typeof analyticsEventsTable.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEventsTable.$inferInsert;
