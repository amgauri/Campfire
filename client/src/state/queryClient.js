import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api/httpClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx); retry network/server errors twice.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});