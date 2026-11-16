import { z } from 'zod';
import { publicProcedure, router } from '../index';
import { drafts, ideas } from '@deftwrite/db';
import { eq, and, desc } from 'drizzle-orm';

export const draftsRouter = router({
  list: publicProcedure
    .input(z.object({
      personaId: z.string().optional(),
      userId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const whereClause = and(
        eq(drafts.userId, input.userId || ''),
        input.personaId ? eq(drafts.personaId, input.personaId) : undefined,
      );
      return ctx.db.select().from(drafts)
        .where(whereClause)
        .orderBy(desc(drafts.updatedAt))
        .limit(50);
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.select().from(drafts).where(eq(drafts.id, input.id)).limit(1);
      return result[0] ?? null;
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string().min(1).max(200).default('Untitled'),
      content: z.string().default(''),
      personaId: z.string(),
      userId: z.string(),
      contentType: z.enum(['article', 'book', 'social']).default('article'),
    }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.insert(drafts).values({
        ...input,
        status: 'not-started',
      }).returning();
      return row;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().optional(),
      status: z.enum(['not-started', 'draft', 'published', 'archived']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.update(drafts)
        .set(input)
        .where(eq(drafts.id, input.id))
        .returning();
      return row;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Cascade delete: remove associated ideas and other FK'd rows first
      await ctx.db.delete(ideas).where(eq(ideas.draftId, input.id));
      const [row] = await ctx.db.delete(drafts).where(eq(drafts.id, input.id)).returning();
      return { deleted: true, ...row };
    }),
});
