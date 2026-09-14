"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@foundation/ui";

let ToastProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
try {
  const ui = require("@foundation/ui");
  ToastProvider = ui.ToastProvider || null;
} catch {}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof Error && "status" in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500 && status !== 408) {
                  return false;
                }
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  const content = (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return (
    <ErrorBoundary>
      {ToastProvider ? <ToastProvider>{content}</ToastProvider> : content}
    </ErrorBoundary>
  );
}
