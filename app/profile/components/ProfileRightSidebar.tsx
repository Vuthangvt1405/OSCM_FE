"use client";

import Image from "next/image";
import type { NewFollower, Topic } from "@/lib/social/types";
import { Hash, ChevronRight } from "lucide-react";
import Link from "next/link";

export type ProfileRightSidebarProps = {
  newFollowers?: NewFollower[];
  topTags?: Topic[];
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileRightSidebar({
  newFollowers = [],
  topTags = [],
}: ProfileRightSidebarProps) {
  return (
    <div className="space-y-6">
      {/* New Followers Section */}
      {newFollowers.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            New Followers
          </h3>
          <div className="space-y-3">
            {newFollowers.slice(0, 5).map((follower) => (
              <Link
                key={follower.id}
                href={`/profile/${follower.id}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
              >
                {follower.avatarUrl ? (
                  <Image
                    src={follower.avatarUrl}
                    alt={follower.displayName}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {getInitials(follower.displayName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {follower.displayName}
                  </p>
                  {follower.bio && (
                    <p className="truncate text-xs text-slate-500">
                      {follower.bio}
                    </p>
                  )}
                </div>
                <button className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800">
                  Follow
                </button>
              </Link>
            ))}
          </div>
          {newFollowers.length > 5 && (
            <button className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
              View all {newFollowers.length} followers
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top Tags Section */}
      {topTags.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Top Tags</h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
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
      {newFollowers.length === 0 && topTags.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <Hash className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-xs text-slate-400">No activity yet</p>
        </div>
      )}
    </div>
  );
}
