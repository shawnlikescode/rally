import { sql } from "drizzle-orm";
import {
  bigserial,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const WakeUpCalls = pgTable("wakeup_calls", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  clerkId: varchar("clerkId", { length: 255 }),
  message: varchar("wakeup_message", { length: 1000 }),
  time: timestamp("time", { mode: "date", withTimezone: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => sql`now()`),
});

export const User = pgTable("user", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  clerkId: varchar("clerkId", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
});
