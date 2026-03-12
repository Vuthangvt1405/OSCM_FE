"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchUserProfile,
  fetchUserStats,
  UserProfileResponse,
  UserStatsResponse,
} from "@/lib/apis/social";

export type ProfileData = {
  user: UserProfileResponse | null;
  stats: UserStatsResponse | null;
  isLoading: boolean;
  error: string | null;
};

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [profileData, statsData] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserStats(userId),
      ]);

      setProfile(profileData);
      setStats(statsData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refresh = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    stats,
    isLoading,
    error,
    refresh,
  };
}
