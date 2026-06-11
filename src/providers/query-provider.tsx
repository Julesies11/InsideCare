'use client';

import { ReactNode, useState } from 'react';
import { handleError } from '@/errors/error-handler';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            handleError(error, {
              category: 'network',
              title: 'Data Fetching Error',
            });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            handleError(error, { category: 'network', title: 'Action Failed' });
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { QueryProvider };
