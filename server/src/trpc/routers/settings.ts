import { z } from 'zod';
import { publicProcedure, router } from '../index';


export const settingsRouter = router({
  get: publicProcedure
    .query(async ({ ctx }) => {
      // TODO: Replace with real DB query
      return {
        brandName: 'DeftWrite',
        defaultPersona: 'biz',
        tone: 'professional',
        autoSave: true,
      };
    }),

  update: publicProcedure
    .input(z.object({
      brandName: z.string().min(1).max(50).optional(),
      defaultPersona: z.string().optional(),
      tone: z.string().optional(),
      autoSave: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Replace with real DB update
      return { ...input, updatedAt: new Date() };
    }),
});
