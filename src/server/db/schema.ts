// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  jsonb,
  smallint,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import isMobilePhone from "validator/lib/isMobilePhone";
import  { z } from "zod";
import { daysOfWeekToString } from "~/utils";
import { stringToDaysOfWeek } from "~/utils";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `rally_${name}`);

export const recurrencePattern = createTable(
  "recurrence_pattern",
  {
    id: serial("id").primaryKey(),
    wakeUpCallId: serial("wake_up_call_id").references(() => wakeUpCall.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'daily', 'weekly', 'monthly'
    daysOfWeek: varchar("days_of_week", { length: 20 })
      .notNull()
      .default(''), // Store as "0,1,2,3,4,5,6"
    endsAt: timestamp("ends_at", { withTimezone: true }), // optional end date
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

export const recurrencePatternSchema = createInsertSchema(recurrencePattern, {
  type: z.enum(['daily', 'weekly', 'monthly']),
  daysOfWeek: z.string().transform((val, ctx) => {
    const days = stringToDaysOfWeek(val);
    const isValid = days.every(d => d >= 0 && d <= 6);
    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Days must be between 0 and 6",
      });
      return z.NEVER;
    }
    return daysOfWeekToString(days);
  }),
}).omit({ 
  id: true,
  createdAt: true,
  wakeUpCallId: true,
});

export const recurrencePatternRelations = relations(recurrencePattern, ({ one }) => ({
  wakeUpCall: one(wakeUpCall, {
    fields: [recurrencePattern.id],
    references: [wakeUpCall.recurrencePatternId],
  }),
}));

export const wakeUpCall = createTable(
  "wake_up_call",
  {
    id: serial().primaryKey(),
    userId: varchar({ length: 256 }).notNull(),
    phoneNumber: varchar({ length: 256 }).notNull(),
    message: varchar({ length: 1024 }).notNull(),
    scheduledAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(
      () => new Date()
    ),
    recurrencePatternId: serial(),
    nextOccurrence: timestamp({ withTimezone: true }), // helps with scheduling
    status: varchar({ length: 256 }).notNull().default("pending"),
    metadata: jsonb().$type<Record<string, unknown>>(),
  },
  (table) => ({
    scheduledAtIdx: index().on(table.scheduledAt),
    userIdIdx: index().on(table.userId),
    nextOccurrenceIdx: index().on(table.nextOccurrence),
  })
);

export const CreateWakeUpCallSchema = createInsertSchema(wakeUpCall, {
  phoneNumber: (schema) => schema.phoneNumber.refine(isMobilePhone, "Invalid phone number"),
  message: (schema) => schema.message.min(1, "Message is required").max(1024, "Message must be less than 1024 characters"),
  scheduledAt: (schema) => schema.scheduledAt.min(new Date(), "Scheduled date must be in the future"),
  metadata: z.record(z.string(), z.unknown()),
  nextOccurrence: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  userId: true,
  recurrencePatternId: true,
});

export const wakeUpCallRelations = relations(wakeUpCall, ({ one, many }) => ({
  recurrencePattern: one(recurrencePattern, {
    fields: [wakeUpCall.recurrencePatternId],
    references: [recurrencePattern.id],
  }),
  callLogs: many(callLog),
}));

export const callLog = createTable(
  "call_log",
  {
    id: serial().primaryKey(),
    wakeUpCallId: serial().references(() => wakeUpCall.id, { onDelete: "cascade" }),
    twilioSid: varchar({ length: 256 }),
    status: varchar({ length: 50 }).notNull(),
    error: varchar({ length: 1024 }),
    startedAt: timestamp({ withTimezone: true }).notNull(),
    duration: smallint(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    wakeUpCallIdx: index().on(table.wakeUpCallId),
  })
);

export const callLogRelations = relations(callLog, ({ one }) => ({
  wakeUpCall: one(wakeUpCall, {
    fields: [callLog.wakeUpCallId],
    references: [wakeUpCall.id],
  }),
}));

export const CreateCallLogSchema = createInsertSchema(callLog, {
  wakeUpCallId: z.number().optional(),
  twilioSid: z.string(),
  status: z.string(),
  error: z.string().optional(),
  duration: z.number().optional(),
  startedAt: z.date(),
  metadata: z.record(z.string(), z.unknown()),
}).omit({
  id: true,
  createdAt: true,
});
