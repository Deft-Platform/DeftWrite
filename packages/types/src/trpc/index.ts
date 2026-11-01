import type { RootConfig } from '@trpc/server';

export interface TRPCContext {
  db: any;
  userId: string | null;
}

export type { RootConfig } from '@trpc/server';
