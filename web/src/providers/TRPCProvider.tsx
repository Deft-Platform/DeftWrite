import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, httpBatchLink } from '../trpc/client';
import { useState, type ReactNode } from 'react';

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trpcClient] = useState(() => (trpc as any).createClient({
    links: [
      httpBatchLink({
        url: import.meta.env.VITE_API_URL || 'http://localhost:3001' + '/trpc',
      }),
    ],
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TrpcProvider = (trpc as any).Provider as React.FC<any>;

  return (
    <TrpcProvider client={trpcClient} queryClient={queryClient}>
      {children}
    </TrpcProvider>
  );
}
