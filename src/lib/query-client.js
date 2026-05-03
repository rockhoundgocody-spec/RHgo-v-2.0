import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,           // 60s: skip refetch on remount
      gcTime: 5 * 60_000,          // 5m: keep cache around
      refetchOnMount: false,       // use cached data first
    },
  },
});