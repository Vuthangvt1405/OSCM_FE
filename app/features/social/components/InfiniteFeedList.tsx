"use client";

import React, { useEffect, useRef } from "react";
import { FeedCard } from "./FeedCard";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";

export type InfiniteFeedListProps = {
  pageSize?: number;
};

export default function InfiniteFeedList({
  pageSize = 10,
}: InfiniteFeedListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    posts,
    status,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteFeed({ pageSize });

  useEffect(() => {
    if (!hasNextPage) return;
    if (isFetchingNextPage) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!hasNextPage) return;
        if (isFetchingNextPage) return;
        fetchNextPage();
      },
      { rootMargin: "240px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === "pending") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
          Loading…
        </div>
      </div>
    );
  }

  if (status === "error") {
    const message =
      error instanceof Error ? error.message : "Failed to load posts";

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
        {message}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
        No posts yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}

      {hasNextPage ? (
        <div className="space-y-2">
          <div ref={sentinelRef} className="h-8" aria-hidden="true" />
          <div className="text-center text-xs text-slate-500">
            {isFetchingNextPage ? "Loading more…" : "Scroll to load more"}
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-slate-500">
          You’re all caught up
        </div>
      )}
    </div>
  );
}
