"use client";

import {
  fetchSocialPostsPage,
  type BackendPostFeedItem,
} from "@/lib/apis/social";
import type { FeedPost } from "@/lib/social/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type UseInfiniteFeedOptions = {
  pageSize: number;
};

type UseInfiniteFeedResult = {
  posts: FeedPost[];
  status: "pending" | "success" | "error";
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
};

function formatCreatedAtLabel(value: string | null | undefined): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function toFeedPost(item: BackendPostFeedItem): FeedPost {
  const cover = typeof item.cover === "string" ? item.cover.trim() : "";
  const authorName = item.author?.username?.trim() || "Unknown";
  const createdAtLabel = formatCreatedAtLabel(item.createdAt);

  // Map backend reaction to frontend type (direct pass-through)
  let userReaction: "LIKE" | "DISLIKE" | null | undefined = undefined;
  if (item.myReaction === "LIKE") {
    userReaction = "LIKE";
  } else if (item.myReaction === "DISLIKE") {
    userReaction = "DISLIKE";
  } else if (item.myReaction === null) {
    userReaction = null;
  }

  return {
    id: String(item.id),
    authorName,
    title: item.title,
    caption: item.caption ?? undefined,
    score: 0,
    createdAtLabel: createdAtLabel || "",
    image: cover ? { src: cover, alt: "Post cover" } : undefined,
    userReaction,
    likeCount: item.likeCount ?? 0,
    dislikeCount: item.dislikeCount ?? 0,
  };
}

export function useInfiniteFeed({
  pageSize,
}: UseInfiniteFeedOptions): UseInfiniteFeedResult {
  const query = useInfiniteQuery({
    queryKey: ["social-posts", pageSize],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchSocialPostsPage({ page: Number(pageParam), size: pageSize }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
  });

  const posts = useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages.flatMap((page) => page.items).map(toFeedPost);
  }, [query.data]);

  return {
    posts,
    status: query.status,
    error: query.error,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
