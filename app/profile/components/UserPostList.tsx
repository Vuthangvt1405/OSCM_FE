"use client";

import { FeedCard } from "@/features/social/components/FeedCard";
import type { UserPost, PostFilter } from "@/lib/social/types";
import { Lock, FileText, Eye, EyeOff, FileQuestion } from "lucide-react";

export type UserPostListProps = {
  posts: UserPost[];
  filter: PostFilter;
  onFilterChange: (filter: PostFilter) => void;
  isOwnProfile?: boolean;
};

const filterOptions: {
  id: PostFilter;
  label: string;
  icon: typeof FileText;
}[] = [
  { id: "all", label: "All", icon: FileQuestion },
  { id: "public", label: "Public", icon: Eye },
  { id: "encrypted", label: "Encrypted", icon: Lock },
  { id: "drafts", label: "Drafts", icon: EyeOff },
];

export function UserPostList({
  posts,
  filter,
  onFilterChange,
  isOwnProfile = true,
}: UserPostListProps) {
  // Filter posts based on selection
  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((post) => post.visibility.toLowerCase() === filter);

  // For other users' profiles, only show public posts
  const visiblePosts = isOwnProfile
    ? filteredPosts
    : posts.filter((p) => p.visibility === "PUBLIC");

  return (
    <div className="space-y-4">
      {/* Filter Tabs - only for own profile */}
      {isOwnProfile && (
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const isActive = filter === option.id;
            return (
              <button
                key={option.id}
                onClick={() => onFilterChange(option.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Post List */}
      {visiblePosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center">
          <FileText className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            No posts yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {isOwnProfile
              ? "Start sharing your thoughts with the community"
              : "This user hasn't posted anything yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
