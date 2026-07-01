'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

/** Silently restore the session on first load via the refresh cookie. */
function SessionBootstrap() {
  const { accessToken, setAuth, setHydrated } = useAuthStore();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.post<{ data: { accessToken: string; user: User } }>(
          '/auth/refresh',
          undefined,
          { auth: false },
        );
        if (active) setAuth(res.data.user, res.data.accessToken);
      } catch {
        // not logged in — fine
      } finally {
        setHydrated();
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <SessionBootstrap />
        {children}
        <Toaster richColors position="top-right" theme="system" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
