import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq } from "@moris-bot/db";
import {
  CreateDecodedSessionSchema,
  DecodedSession,
} from "@moris-bot/db/schema";

import { protectedProcedure } from "../trpc";

export const sessionRouter = {
  save: protectedProcedure
    .input(CreateDecodedSessionSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(DecodedSession).values({
        ...input,
        userId: ctx.session.user.id,
      });
    }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.DecodedSession.findMany({
      where: eq(DecodedSession.userId, ctx.session.user.id),
      orderBy: desc(DecodedSession.createdAt),
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.DecodedSession.findFirst({
        where: and(
          eq(DecodedSession.id, input.id),
          eq(DecodedSession.userId, ctx.session.user.id),
        ),
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) => {
      return ctx.db
        .delete(DecodedSession)
        .where(
          and(
            eq(DecodedSession.id, input),
            eq(DecodedSession.userId, ctx.session.user.id),
          ),
        );
    }),
} satisfies TRPCRouterRecord;
