"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useCallback, useMemo } from "react";
import { Toaster } from "sonner";

// Query client with optimized settings
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Don't refetch on window focus to reduce API calls
        refetchOnWindowFocus: false,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
        // Retry failed requests up to 2 times
        retry: 2,
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Consider data stale after network error
        networkMode: "online",
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient only once
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="crewai-theme"
      >
        {children}
        <Toaster
          position="bottom-right"
          theme="system"
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: "bg-card border-border text-card-foreground",
              title: "text-foreground",
              description: "text-muted-foreground",
              success: "!bg-success/10 !border-success/20 !text-success",
              error: "!bg-destructive/10 !border-destructive/20 !text-destructive",
              warning: "!bg-warning/10 !border-warning/20 !text-warning",
              info: "!bg-info/10 !border-info/20 !text-info",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
