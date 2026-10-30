import { z } from 'zod';
import { publicProcedure, router } from '../index';


export const chatRouter = router({
  send: publicProcedure
    .input(z.object({
      draftId: z.string().optional(),
      personaId: z.string().optional(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const { chatMessages } = await import('@deftwrite/db');

      // TODO: Replace with real AI integration
      return {
        id: `msg-${Date.now()}`,
        message: input.message,
        reply: `This is a simulated AI response to: "${input.message}"`,
        draftId: input.draftId,
        createdAt: new Date(),
      };
    }),

  history: publicProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { chatMessages } = await import('@deftwrite/db');

      // TODO: Replace with real DB query
      return [
        { id: 'msg-1', message: 'Help me write a post', reply: 'Sure! What topic...', draftId: input.draftId, createdAt: new Date() },
      ];
    }),
});
