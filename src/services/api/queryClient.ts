import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient instance for the app, provided in `AppProviders`.
 * RoadMemo's real data (trips, points, memories) will live in local SQLite,
 * not a remote API — React Query here mainly exists to manage any future
 * network calls (via `apiClient`) with caching/retry, not as the primary
 * data layer.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
