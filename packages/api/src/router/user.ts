import type { TRPCRouterRecord } from "@trpc/server";
import { protectedProcedure, publicProcedure } from "../trpc";
import { eq } from "@rally/db";
import { User } from "@rally/db/schema";

export const userRouter = {
    getUserWithPreferences: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.User.findFirst({
            with: {
                preferences: true,
            },
            where: eq(User.clerkId, ctx.auth.userId),
        })
    }),
} satisfies TRPCRouterRecord;