'use server'

import 'server-only'
import { z } from "zod";
import { createWakeUpCall, createRecurringWakeUpCall } from "~/server/queries";
import { CreateWakeUpCallSchema, recurrencePatternSchema } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from 'next/cache';

export type FormState = {
    message: string;
    fields?: Record<string, string>;
    errors?: string[];
}

export async function createWakeUpCallAction(currentState: FormState, data: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const formData = Object.fromEntries(data)
  const parsed = CreateWakeUpCallSchema.safeParse({
    phoneNumber: formData.phoneNumber,
    message: formData.message,
    scheduledAt: new Date(formData.scheduledAt as string),
  });

  const fields: Record<string, string> = {};
  for (const key of Object.keys(formData)) {
      fields[key] = formData[key]?.toString() ?? "";
  }

  if (!parsed.success) {
    return { 
        message: "Invalid form data", 
        fields, 
        errors: parsed.error.errors.map(e => e.message) 
    };
  }

  const isRecurring = formData.isRecurring === "true";

  if (isRecurring) {
    const recurrenceData = recurrencePatternSchema.parse({
      type: formData.recurrenceType,
      daysOfWeek: formData.daysOfWeek,
      endsAt: formData.endsAt ? new Date(formData.endsAt as string) : undefined,
    });
    
    try {
      await createRecurringWakeUpCall(userId, parsed.data, recurrenceData);
    } catch (error) {
      console.error("Error creating recurring wake-up call:", error);
        return {
            message: "Error creating recurring wake-up call",
            fields,
            errors: [error instanceof Error ? error.message : "Unknown error"],
        }
    }
  } else {
    try {
      await createWakeUpCall(userId, parsed.data);
    } catch (error) {
      console.error("Error creating wake-up call:", error);
      return {
        message: "Error creating wake-up call",
        fields,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }

  revalidatePath("/");
  return { message: "Wake-up call created successfully" };
}
