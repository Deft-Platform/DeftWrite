import { z } from 'zod';
import { publicProcedure, router } from '../index';
import { ideas } from '@deftwrite/db';
import { eq, desc, and, sql } from 'drizzle-orm';

export const ideasRouter = router({
  list: publicProcedure
    .input(z.object({
      personaId: z.string().optional(),
      userId: z.string().optional(),
      draftId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const whereClause = and(
        eq(ideas.userId, input.userId || ''),
        input.personaId ? eq(ideas.personaId, input.personaId) : undefined,
        input.draftId ? eq(ideas.draftId, input.draftId) : undefined,
      );
      return ctx.db.select().from(ideas)
        .where(whereClause)
        .orderBy(desc(ideas.createdAt))
        .limit(100);
    }),

  create: publicProcedure
    .input(z.object({
      content: z.string().min(1).max(500),
      personaId: z.string(),
      userId: z.string(),
      draftId: z.string().optional(),
      contentType: z.enum(['article', 'book', 'social']).default('article'),
    }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.insert(ideas).values({
        ...input,
        status: 'not-started',
      }).returning();
      return row;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      content: z.string().min(1).max(500).optional(),
      status: z.enum(['not-started', 'draft', 'published', 'archived']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.update(ideas)
        .set(input)
        .where(eq(ideas.id, input.id))
        .returning();
      return row;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.delete(ideas).where(eq(ideas.id, input.id)).returning();
      return { deleted: true, ...row };
    }),
});
