import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { protectedProcedure, publicProcedure } from "../trpc";
import { count, eq } from "@rally/db";
import { User, WakeUpCalls, CreateWakeUpCallSchema, Snoozes } from "@rally/db/schema";
import { z } from "zod";
import { parseVoiceCommand } from "../utils/voiceCommands";
import { generateInitialTwiML, generateSnoozeResponseTwiML } from "@rally/comms";

export const wakeupCallRouter = {
    list: protectedProcedure.query(async ({ ctx }) => {
        const { clerkId } = ctx;
        const user = await ctx.db.query.User.findFirst({
            where: eq(User.clerkId, clerkId),
        });

        if (!user) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Error creating wakeup call",
            });
        }

        return ctx.db.query.WakeUpCalls.findMany({
            where: eq(WakeUpCalls.userId, user.id),
        });
    }),
    create: protectedProcedure.input(CreateWakeUpCallSchema).mutation(async ({ ctx, input }) => {
        const { clerkId } = ctx;
        const { scheduledTime, recurrenceRule, message } = input;

        const user = await ctx.db.query.User.findFirst({
            where: eq(User.clerkId, clerkId),
            with: {
                preferences: true,
            },
        });

        if (!user) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Error creating wakeup call",
            });
        }

        return ctx.db.insert(WakeUpCalls).values({
            userId: user.id,
            scheduledTime,
            recurrenceRule,
            message: message || user.preferences?.defaultMessage || "",
            isActive: true,
        }).returning({id: WakeUpCalls.id})
    }),

    update: protectedProcedure.input(z.object({
        id: z.number(),
        scheduledTime: z.date().optional(),
        recurrenceRule: z.object({
            frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
            interval: z.number().positive().optional(),
            byDay: z.array(z.number().min(0).max(6)).optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
            exceptions: z.array(z.date()).optional(),
        }).optional(),
        message: z.string().min(1).max(1000).optional(),
        isActive: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;

        // Remove undefined fields from updateData
        const filteredUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        return ctx.db.update(WakeUpCalls)
            .set(filteredUpdateData)
            .where(eq(WakeUpCalls.id, id))
            .returning({id: WakeUpCalls.id});
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
        return ctx.db.delete(WakeUpCalls).where(eq(WakeUpCalls.id, input.id)).returning({id: WakeUpCalls.id});
    }),

    initiateCall: publicProcedure
        .input(z.object({ wakeUpCallId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const { wakeUpCallId } = input;
            const wakeUpCall = await ctx.db.query.WakeUpCalls.findFirst({
                where: eq(WakeUpCalls.id, wakeUpCallId),
            });

            if (!wakeUpCall) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Wake-up call not found",
                });
            }

            await ctx.db.update(WakeUpCalls)
                .set({ status: 'initiated' })
                .where(eq(WakeUpCalls.id, wakeUpCallId));

            const twiml = generateInitialTwiML(wakeUpCall.message, wakeUpCallId);
            return { twiml };
        }),

    completeCall: publicProcedure
        .input(z.object({ wakeUpCallId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const { wakeUpCallId } = input;
            await ctx.db.update(WakeUpCalls)
                .set({ 
                    status: 'completed',
                    actualTime: new Date(),
                })
                .where(eq(WakeUpCalls.id, wakeUpCallId));

            return { success: true };
        }),

    snooze: publicProcedure
        .input(z.object({
            wakeUpCallId: z.number(),
            voiceCommand: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { wakeUpCallId, voiceCommand } = input;

            const wakeUpCall = await ctx.db.query.WakeUpCalls.findFirst({
                where: eq(WakeUpCalls.id, wakeUpCallId),
                with: {
                    user: {
                        with: {
                            preferences: true,
                        },
                    },
                },
            });

            if (!wakeUpCall) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Wake-up call not found",
                });
            }

            if (!wakeUpCall.user.preferences?.allowSnooze) {
                const twiml = generateSnoozeResponseTwiML("You have disabled snoozing for this call. The call will end now.");
                return { success: false, twiml };
            }

            const snoozeDurationVoiceCommand = parseVoiceCommand(voiceCommand);
            const defaultSnoozeDuration = wakeUpCall.user.preferences?.defaultSnoozeDuration ?? 10;

            let snoozeDuration: number;
            let twiml: string;

            if (snoozeDurationVoiceCommand === null) {
                snoozeDuration = defaultSnoozeDuration;
                twiml = generateSnoozeResponseTwiML(`I didn't understand that. I'll snooze for the default ${defaultSnoozeDuration} minutes.`);
            } else {
                snoozeDuration = snoozeDurationVoiceCommand;
                twiml = generateSnoozeResponseTwiML(`Okay, I'll call you back in ${snoozeDuration} minutes.`);
            }

            const snoozeCount = await ctx.db
                .select({ count: count(Snoozes.id) })
                .from(Snoozes)
                .where(eq(Snoozes.wakeUpCallId, wakeUpCallId))
                .then((result) => result[0]?.count ?? 0);

            const maxSnoozeCount = wakeUpCall.user.preferences?.maxSnoozeCount ?? 5;

            if (snoozeCount >= maxSnoozeCount) {
                twiml = generateSnoozeResponseTwiML("Maximum snooze limit reached. The call will end now.");
                return { success: false, twiml };
            }

            const now = new Date();
            const snoozeUntil = new Date(now.getTime() + snoozeDuration * 60000);

            await ctx.db.insert(Snoozes).values({
                wakeUpCallId,
                snoozedAt: now,
                snoozeUntil,
            });

            await ctx.db.update(WakeUpCalls)
                .set({ 
                    status: 'snoozed',
                    actualTime: snoozeUntil,
                })
                .where(eq(WakeUpCalls.id, wakeUpCallId));

            return { success: true, twiml, snoozeUntil };
        }),

} satisfies TRPCRouterRecord;