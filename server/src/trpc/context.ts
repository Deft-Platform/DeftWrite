import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { db } from '@deftwrite/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AppContext {
  db: typeof db;
  userId: string | null;
  req: any;
  res: any;
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<AppContext> {
  return {
    db,
    userId: null,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
