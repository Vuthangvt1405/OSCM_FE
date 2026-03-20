"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * User session data returned from /api/auth/me
 * Matches backend UserInfoResponse
 */
export interface UserSession {
  userId: string;
  email: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  coverPictureUrl: string | null;
  bio: string | null;
  telegramId: string | null;
}

export interface UseAuthReturn {
  /** Current user session, null if not authenticated */
  session: UserSession | null;
  /** True while checking authentication status */
  isLoading: boolean;
  /** True if user has valid session */
  isAuthenticated: boolean;
  /** Check auth and redirect to login if not authenticated. Returns true if can proceed. */
  requireAuth: (callbackUrl?: string) => boolean;
  /** Fetch fresh session data */
  refreshSession: () => Promise<void>;
  /** Clear session and redirect to login */
  logout: () => Promise<void>;
}

/**
 * Custom hook for client-side authentication state
 *
 * Usage:
 * ```tsx
 * const { isAuthenticated, requireAuth, session } = useAuth();
 *
 * const handleReaction = () => {
 *   if (!requireAuth()) return; // Redirects to login if not authenticated
 *   // Proceed with reaction
 * };
 * ```
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    await fetchSession();
  }, [fetchSession]);

  const requireAuth = useCallback(
    (callbackUrl?: string): boolean => {
      // If still loading, don't redirect yet - caller should wait
      if (isLoading) {
        return false;
      }

      // After loading complete, check if session exists
      if (!session) {
        const currentPath = window.location.pathname;
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("callbackUrl", callbackUrl || currentPath);
        router.push(loginUrl.toString());
        return false;
      }

      return true;
    },
    [session, isLoading, router],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setSession(null);
      router.push("/login");
    }
  }, [router]);

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    requireAuth,
    refreshSession,
    logout,
  };
}
