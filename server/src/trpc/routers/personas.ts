import { z } from 'zod';
import { publicProcedure, router } from '../index';


export const personasRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const { personas } = await import('@deftwrite/db');

      // TODO: Replace with real DB query when DB is connected
      // const result = await ctx.db.select().from(personas)
      //   .where(input.userId ? eq(personas.userId, input.userId) : undefined)
      //   .orderBy(personas.createdAt);

      // Stub data for development
      return [
        { id: 'biz', name: 'Business', emoji: '💼', color: '#60a5fa', icon: 'briefcase', systemPrompt: '', tone: 'professional', styleNotes: '', createdAt: new Date() },
        { id: 'ent', name: 'Entrepreneur', emoji: '🚀', color: '#34d399', icon: 'rocket', systemPrompt: '', tone: 'bold', styleNotes: '', createdAt: new Date() },
        { id: 'pseudo', name: 'Pseudonym', emoji: '👻', color: '#a78bfa', icon: 'ghost', systemPrompt: '', tone: 'literary', styleNotes: '', createdAt: new Date() },
      ];
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { personas } = await import('@deftwrite/db');

      // TODO: Replace with real DB query
      // const result = await ctx.db.select().from(personas).where(eq(personas.id, input.id)).limit(1);

      const stub = {
        id: 'biz',
        name: 'Business',
        emoji: '💼',
        color: '#60a5fa',
        icon: 'briefcase',
        systemPrompt: 'You are a business writing assistant. Help refine professional, data-driven content.',
        tone: 'professional',
        styleNotes: 'Use concrete numbers, avoid jargon, prefer active voice.',
        createdAt: new Date(),
      };
      return stub;
    }),

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().min(1).max(50),
      emoji: z.string().length(1),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      icon: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { personas } = await import('@deftwrite/db');

      // TODO: Replace with real DB insert
      // await ctx.db.insert(personas).values({ ...input });
      return { id: `persona-${Date.now()}`, ...input, emoji: input.emoji, color: input.color, icon: input.icon, systemPrompt: '', tone: 'professional', styleNotes: '' };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(50).optional(),
      emoji: z.string().length(1).optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      icon: z.string().optional(),
      systemPrompt: z.string().optional(),
      tone: z.string().optional(),
      styleNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { personas } = await import('@deftwrite/db');

      // TODO: Replace with real DB update
      // await ctx.db.update(personas).set(input).where(eq(personas.id, input.id));
      return { ...input };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { personas } = await import('@deftwrite/db');

      // TODO: Replace with real DB delete
      // await ctx.db.delete(personas).where(eq(personas.id, input.id));
      return { deleted: true, id: input.id };
    }),
});
