import { z } from 'zod';
import { publicProcedure, router } from '../index';


export const draftsRouter = router({
  list: publicProcedure
    .input(z.object({
      personaId: z.string().optional(),
      userId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { drafts } = await import('@deftwrite/db');

      // TODO: Replace with real DB query
      // const result = await ctx.db.select().from(drafts)
      //   .where(input.personaId ? eq(drafts.personaId, input.personaId) : undefined)
      //   .limit(20);

      // Stub data for development
      return [
        { id: 'draft-1', title: 'Q3 Report Analysis', content: '', status: 'draft', personaId: 'biz', userId: 'user-1', createdAt: new Date() },
        { id: 'draft-2', title: 'Product Launch Post', content: '', status: 'published', personaId: 'ent', userId: 'user-1', createdAt: new Date() },
      ];
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { drafts } = await import('@deftwrite/db');

      // TODO: Replace with real DB query
      // const result = await ctx.db.select().from(drafts).where(eq(drafts.id, input.id)).limit(1);

      return {
        id: input.id,
        title: 'Sample Draft',
        content: 'This is a sample draft content...',
        status: 'draft' as const,
        personaId: 'biz',
        userId: 'user-1',
        createdAt: new Date(),
      };
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().optional(),
      personaId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { drafts } = await import('@deftwrite/db');

      // TODO: Replace with real DB insert
      // await ctx.db.insert(drafts).values({ ...input });
      return { id: `draft-${Date.now()}`, ...input, status: 'draft' as const, createdAt: new Date() };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { drafts } = await import('@deftwrite/db');

      // TODO: Replace with real DB update
      // await ctx.db.update(drafts).set(input).where(eq(drafts.id, input.id));
      return { ...input, id: input.id, createdAt: new Date() };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { drafts } = await import('@deftwrite/db');

      // TODO: Replace with real DB delete
      // await ctx.db.delete(drafts).where(eq(drafts.id, input.id));
      return { deleted: true, id: input.id };
    }),
});
