"use client";

import type { ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "@/lib/api/client";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Exam platform: avoid unnecessary API traffic.
        // Data is considered fresh for 60s so navigation
        // doesn't trigger refetches.
        staleTime: 60_000,
        // Don't hammer the API on client errors (401/403/400)
        // and avoid infinite retry loops.
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          return failureCount < 2;
        },
        // Don't refetch when the student tabs back to the
        // exam — timer state is server-side anyway.
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // Keep server requests isolated and preserve the browser
  // cache across renders (Next.js App Router pattern).
  if (typeof window === "undefined") return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function QueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
