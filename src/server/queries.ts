import { z } from "zod";
import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";
import { 
  CreateWakeUpCallSchema, 
  recurrencePattern, 
  recurrencePatternSchema, 
  wakeUpCall,
  callLog, 
  CreateCallLogSchema
} from "./db/schema";

// Create a single wake-up call
export function createWakeUpCall(userId: string, data: z.infer<typeof CreateWakeUpCallSchema>) {
  return db.insert(wakeUpCall).values({
    userId,
    ...data,
  }).returning({ id: wakeUpCall.id });
}

// Create a recurring wake-up call
export async function createRecurringWakeUpCall(
  userId: string, 
  data: z.infer<typeof CreateWakeUpCallSchema>, 
  recurrence: z.infer<typeof recurrencePatternSchema>
) {
  return db.transaction(async (tx) => {
    const [recurrencePatternId] = await tx
      .insert(recurrencePattern)
      .values(recurrence)
      .returning({ id: recurrencePattern.id });

    if (!recurrencePatternId) {
      throw new Error("Failed to create recurrence pattern");
    }

    const [wakeUpCallId] = await tx
      .insert(wakeUpCall)
      .values({
        userId,
        ...data,
        recurrencePatternId: recurrencePatternId.id,
      })
      .returning({ id: wakeUpCall.id });

    return wakeUpCallId;
  });
}

// Get all wake-up calls for a user
export function getWakeUpCallsByUserId(userId: string) {
  return db.query.wakeUpCall.findMany({
    where: eq(wakeUpCall.userId, userId),
    with: {
      recurrencePattern: true,
      callLogs: true
    },
    orderBy: (wakeUpCalls) => [wakeUpCalls.scheduledAt]
  });
}

// Get pending wake-up calls that need to be processed
export function getPendingWakeUpCalls() {
  return db.query.wakeUpCall.findMany({
    where: and(
      eq(wakeUpCall.status, "pending"),
      gte(wakeUpCall.scheduledAt, new Date())
    ),
    with: {
      recurrencePattern: true
    }
  });
}

// Update wake-up call status
export function updateWakeUpCall(id: number, userId: string, data: Partial<z.infer<typeof CreateWakeUpCallSchema>>) {
  return db
    .update(wakeUpCall)
    .set(data)
    .where(and(
      eq(wakeUpCall.id, id),
      eq(wakeUpCall.userId, userId)
    ))
    .returning({ id: wakeUpCall.id });
}

// Log a call attempt
export function createCallLog(
  wakeUpCallId: number,
  data: z.infer<typeof CreateCallLogSchema>
) {
  return db
    .insert(callLog)
    .values({
      wakeUpCallId,
      ...data,
    })
    .returning({ id: callLog.id });
}

export async function deleteWakeUpCall(id: number, userId: string) {
  return await db
    .delete(wakeUpCall)
    .where(and(
      eq(wakeUpCall.id, id),
      eq(wakeUpCall.userId, userId)
    ))
    .returning({ id: wakeUpCall.id });
}
