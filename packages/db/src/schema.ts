import { sql, relations } from "drizzle-orm";
import {
  bigserial,
  pgTable,
  timestamp,
  varchar,
  boolean,
  integer,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const User = pgTable("user", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  clerkId: varchar("clerkId", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 255 }),
  phoneNumberVerified: boolean("phone_number_verified").default(false).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => sql`now()`),
});

export const UserRelations = relations(User, ({ many, one }) => ({
  wakeUpCalls: many(WakeUpCalls),
  preferences: one(UserPreferences),
}));

export const WakeUpCalls = pgTable("wakeup_calls", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigserial("user_id", { mode: "number" })
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  message: varchar("wakeup_message", { length: 1000 }),
  scheduledTime: timestamp("scheduled_time", { mode: "date", withTimezone: true }).notNull(),
  actualTime: timestamp("actual_time", { mode: "date", withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  repeatDays: varchar("repeat_days", { length: 7 }), // e.g., "0123456" for every day
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'completed', 'snoozed', 'missed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => sql`now()`),
});

export const WakeUpCallsRelations = relations(WakeUpCalls, ({ one, many }) => ({
  user: one(User, {
    fields: [WakeUpCalls.userId],
    references: [User.id],
  }),
  snoozes: many(Snoozes),
}));

export const Snoozes = pgTable("snoozes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  wakeUpCallId: bigserial("wakeup_call_id", { mode: "number" })
    .notNull()
    .references(() => WakeUpCalls.id, { onDelete: "cascade" }),
  snoozedAt: timestamp("snoozed_at", { mode: "date", withTimezone: true }).notNull(),
  snoozeUntil: timestamp("snooze_until", { mode: "date", withTimezone: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const SnoozesRelations = relations(Snoozes, ({ one }) => ({
  wakeUpCall: one(WakeUpCalls, {
    fields: [Snoozes.wakeUpCallId],
    references: [WakeUpCalls.id],
  }),
}));

export const WakeUpCallLogs = pgTable("wakeup_call_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  wakeUpCallId: bigserial("wakeup_call_id", { mode: "number" })
    .notNull()
    .references(() => WakeUpCalls.id),
  status: varchar("status", { length: 20 }).notNull(), // e.g., "completed", "missed", "snoozed"
  responseTime: integer("response_time"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const WakeUpCallLogsRelations = relations(WakeUpCallLogs, ({ one }) => ({
  wakeUpCall: one(WakeUpCalls, {
    fields: [WakeUpCallLogs.wakeUpCallId],
    references: [WakeUpCalls.id],
  }),
}));

export const UserPreferences = pgTable("user_preferences", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigserial("user_id", { mode: "number" })
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  defaultMessage: text("default_message"),
  defaultVoice: varchar("default_voice", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }).notNull(),
  maxSnoozeCount: integer("max_snooze_count").default(5),
  defaultSnoozeTime: integer("default_snooze_time").default(5), // in minutes
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => sql`now()`),
});

export const UserPreferencesRelations = relations(UserPreferences, ({ one }) => ({
  user: one(User, {
    fields: [UserPreferences.userId],
    references: [User.id],
  }),
}));

export const CreateUserSchema = createInsertSchema(User, {
  email: z.string().email(),
  name: z.string(),
  phoneNumber: z.string()
}).omit({
  id: true,
  clerkId: true,

  createdAt: true,
  updatedAt: true,
});