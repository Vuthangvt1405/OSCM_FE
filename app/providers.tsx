"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import React, { useState } from "react";
import { SidebarProvider } from "@/features/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>{children}</SidebarProvider>
      <Toaster
        position="top-center"
        richColors
        theme="light"
        style={{ top: "44px" }}
      />
    </QueryClientProvider>
  );
}
