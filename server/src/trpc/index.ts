import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import { personasRouter } from './routers/personas';
import { draftsRouter } from './routers/drafts';
import { ideasRouter } from './routers/ideas';
import { chatRouter } from './routers/chat';
import { settingsRouter } from './routers/settings';

const trpc = initTRPC.context<Context>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

export const appRouter = trpc.router({
  personas: personasRouter,
  drafts: draftsRouter,
  ideas: ideasRouter,
  chat: chatRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
