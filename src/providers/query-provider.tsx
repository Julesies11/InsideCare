'use client';

import { ReactNode, useState } from 'react';
import {
  QueryCache,
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { handleError } from '@/errors/error-handler';

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            handleError(error, { category: 'network', title: 'Data Fetching Error' });
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
