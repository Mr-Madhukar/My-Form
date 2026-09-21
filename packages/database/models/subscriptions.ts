import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  plan: varchar("plan", { length: 20 }).notNull().default("free"), // free | pro | team
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("monthly"), // monthly | annual
  status: varchar("status", { length: 30 }).notNull().default("active"), // active | cancelled | expired | past_due

  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 120 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 120 }),
  razorpaySignature: varchar("razorpay_signature", { length: 255 }),

  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectSubscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
