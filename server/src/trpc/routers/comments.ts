import { z } from 'zod';
import { publicProcedure, router } from '../index';
import { comments, drafts, users } from '@deftwrite/db';
import { eq, and, asc } from 'drizzle-orm';

export const commentsRouter = router({
  listByDraft: publicProcedure
    .input(z.object({
      draftId: z.string(),
      resolved: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.select()
        .from(comments)
        .where(and(
          eq(comments.draftId, input.draftId),
          input.resolved !== undefined ? eq(comments.resolved, input.resolved) : undefined,
        ))
        .orderBy(asc(comments.createdAt));
    }),

  listBySection: publicProcedure
    .input(z.object({
      sectionId: z.string(),
      resolved: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Get all sections for this section's draft to find nested comments
      const result = await ctx.db.select({
        comment: comments,
        section: drafts,
      })
      .from(comments)
      .leftJoin(drafts, eq(comments.draftId, drafts.id))
      .where(eq(comments.sectionId || '', '')) // Fallback to draft-level
      .orderBy(asc(comments.createdAt));

      return result.map(r => r.comment);
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.select()
        .from(comments)
        .where(eq(comments.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: publicProcedure
    .input(z.object({
      draftId: z.string(),
      text: z.string().min(1).max(2000),
      rangeStart: z.number().int().optional(),
      rangeEnd: z.number().int().optional(),
      parentId: z.string().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.insert(comments).values({
        ...input,
        userId: ctx.userId || null,
        resolved: false,
      }).returning();
      return (result as any[])[0] ?? null;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      text: z.string().min(1).max(2000).optional(),
      resolved: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.update(comments)
        .set({
          text: input.text,
          resolved: input.resolved ?? false,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, input.id))
        .returning();
      return (result as any[])[0] ?? null;
    }),

  resolveBatch: publicProcedure
    .input(z.object({
      ids: z.array(z.string()),
      resolved: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.update(comments)
        .set({ resolved: input.resolved, updatedAt: new Date() })
        .where(and(
          ...input.ids.map(id => eq(comments.id, id)),
        ))
        .returning();
      return result as any[];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.delete(comments)
        .where(eq(comments.id, input.id))
        .returning();
      const row = (result as any[])[0];
      return { deleted: true, ...(row || {}) };
    }),
});
