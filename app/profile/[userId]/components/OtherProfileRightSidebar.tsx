"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { NewFollower, Topic } from "@/lib/social/types";
import { Hash, ChevronRight, UserPlus } from "lucide-react";
import Link from "next/link";
import { followUser, unfollowUser, checkFollowStatus } from "@/lib/apis/social";
import { useAuth } from "@/hooks/useAuth";

export type OtherProfileRightSidebarProps = {
  suggestedUsers?: NewFollower[];
  similarInterests?: Topic[];
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function OtherProfileRightSidebar({
  suggestedUsers = [],
  similarInterests = [],
}: OtherProfileRightSidebarProps) {
  const { isAuthenticated } = useAuth();
  const hasSuggestions = suggestedUsers.length > 0;
  const hasInterests = similarInterests.length > 0;

  // Track follow status for each suggested user
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());

  // Check follow status for all suggested users on mount
  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated || suggestedUsers.length === 0) {
      setFollowingUsers(new Set());
      return () => {
        cancelled = true;
      };
    }

    const checkAllFollowStatus = async () => {
      const statuses = await Promise.all(
        suggestedUsers.map(async (user) => {
          try {
            return (await checkFollowStatus(user.id)) ? user.id : null;
          } catch {
            // Ignore errors, default to not following
            return null;
          }
        }),
      );

      if (!cancelled) {
        setFollowingUsers(
          new Set(statuses.filter((id): id is string => Boolean(id))),
        );
      }
    };

    void checkAllFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, suggestedUsers]);

  const handleFollow = async (userId: string) => {
    if (loadingUsers.has(userId)) return;

    try {
      setLoadingUsers((prev) => new Set(prev).add(userId));
      const isCurrentlyFollowing = followingUsers.has(userId);

      if (isCurrentlyFollowing) {
        await unfollowUser(userId);
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await followUser(userId);
        setFollowingUsers((prev) => new Set(prev).add(userId));
      }
    } catch (err) {
      console.warn("Failed to toggle follow:", err);
    } finally {
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* People You May Know Section */}
      {hasSuggestions && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            People You May Know
          </h3>
          <div className="space-y-3">
            {suggestedUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-lg p-2"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {getInitials(user.displayName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${user.id}`}
                    className="block truncate text-sm font-medium text-slate-900 hover:text-orange-500"
                  >
                    {user.displayName}
                  </Link>
                  {user.bio && (
                    <p className="truncate text-xs text-slate-500">
                      {user.bio}
                    </p>
                  )}
                </div>
                <button
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    followingUsers.has(user.id)
                      ? "border-2 border-slate-300 bg-transparent text-slate-600 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  } ${loadingUsers.has(user.id) ? "opacity-50" : ""}`}
                  onClick={() => handleFollow(user.id)}
                  disabled={loadingUsers.has(user.id)}
                >
                  {followingUsers.has(user.id) ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
          {suggestedUsers.length > 5 && (
            <button className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
              View all {suggestedUsers.length} suggestions
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Similar Interests Section */}
      {hasInterests && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            Similar Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {similarInterests.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.id}`}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <Hash className="h-3 w-3" />
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasSuggestions && !hasInterests && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <UserPlus className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-xs text-slate-400">No suggestions yet</p>
        </div>
      )}
    </div>
  );
}
