import { createTRPCReact, httpBatchLink } from '@trpc/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<any>();

export { httpBatchLink };
