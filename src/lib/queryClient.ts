import { QueryClient } from "@tanstack/react-query";
import { isRetryableError, queryRetryDelay } from "../api/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (!isRetryableError(error)) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: queryRetryDelay,
      refetchOnReconnect: "always",
      refetchOnWindowFocus: false,
      networkMode: "online",
    },
  },
});
