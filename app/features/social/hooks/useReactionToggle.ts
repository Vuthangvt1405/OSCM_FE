"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { togglePostReaction } from "@/lib/apis/social";
import { useAuth } from "@/hooks/useAuth";

export type ReactionType = "LIKE" | "DISLIKE";

// Query key constants for cache management
export const SOCIAL_POSTS_QUERY_KEY = "social-posts";
export const POST_DETAIL_QUERY_KEY = "post-detail";

export type UseReactionToggleOptions = {
  postId: string;
  currentReaction: ReactionType | null | undefined;
  /** Initial like count for optimistic updates */
  initialLikeCount?: number;
  /** Initial dislike count for optimistic updates */
  initialDislikeCount?: number;
};

export type UseReactionToggleReturn = {
  /** Current optimistic reaction state */
  reaction: ReactionType | null;
  /** Is API call in progress */
  isPending: boolean;
  /** Animation class for LIKE button */
  likeAnimationClass: string;
  /** Animation class for DISLIKE button */
  dislikeAnimationClass: string;
  /** Toggle function */
  toggle: (type: ReactionType) => Promise<void>;
  /** Current optimistic like count */
  likeCount: number;
  /** Current optimistic dislike count */
  dislikeCount: number;
};

/**
 * Custom hook for handling reaction toggles with optimistic updates and animations.
 *
 * Behavior:
 * - If user has no reaction → Creates new reaction (plays bubble-pop animation)
 * - If user has same reaction → Removes it (plays bubble-shrink animation)
 * - If user has different reaction → Updates to new type (plays bubble-pop animation)
 *
 * Uses useState with ref tracking to prevent state reset during pending operations.
 */
export function useReactionToggle({
  postId,
  currentReaction,
  initialLikeCount = 0,
  initialDislikeCount = 0,
}: UseReactionToggleOptions): UseReactionToggleReturn {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading, requireAuth } = useAuth();

  // Track if we're in the middle of an API call
  const isPendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  // Use useState for optimistic state, initialized from props
  const [optimisticReaction, setOptimisticReaction] =
    useState<ReactionType | null>(currentReaction ?? null);
  const [optimisticLikeCount, setOptimisticLikeCount] =
    useState(initialLikeCount);
  const [optimisticDislikeCount, setOptimisticDislikeCount] =
    useState(initialDislikeCount);

  // Animation states for each button
  const [likeAnimation, setLikeAnimation] = useState<"pop" | "shrink" | null>(
    null,
  );
  const [dislikeAnimation, setDislikeAnimation] = useState<
    "pop" | "shrink" | null
  >(null);

  // Track previous prop values to detect actual changes
  const prevPropsRef = useRef({
    currentReaction,
    initialLikeCount,
    initialDislikeCount,
  });

  // Sync with prop changes ONLY when not pending AND props actually changed
  useEffect(() => {
    const prevProps = prevPropsRef.current;

    // Check if props actually changed
    const propsChanged =
      prevProps.currentReaction !== currentReaction ||
      prevProps.initialLikeCount !== initialLikeCount ||
      prevProps.initialDislikeCount !== initialDislikeCount;

    // Only sync when:
    // 1. We're not in the middle of an optimistic update
    // 2. Props actually changed (new data from server)
    if (!isPendingRef.current && propsChanged) {
      const newReaction = currentReaction ?? null;
      setOptimisticReaction(newReaction);
      setOptimisticLikeCount(initialLikeCount);
      setOptimisticDislikeCount(initialDislikeCount);

      // Update prev props ref
      prevPropsRef.current = {
        currentReaction,
        initialLikeCount,
        initialDislikeCount,
      };
    }
  }, [currentReaction, initialLikeCount, initialDislikeCount]);

  // Clear animations after they play
  useEffect(() => {
    if (likeAnimation) {
      const timer = setTimeout(() => setLikeAnimation(null), 400);
      return () => clearTimeout(timer);
    }
  }, [likeAnimation]);

  useEffect(() => {
    if (dislikeAnimation) {
      const timer = setTimeout(() => setDislikeAnimation(null), 400);
      return () => clearTimeout(timer);
    }
  }, [dislikeAnimation]);

  // Generate animation classes
  const likeAnimationClass =
    likeAnimation === "pop"
      ? "animate-bubble-pop"
      : likeAnimation === "shrink"
        ? "animate-bubble-shrink"
        : "";

  const dislikeAnimationClass =
    dislikeAnimation === "pop"
      ? "animate-bubble-pop"
      : dislikeAnimation === "shrink"
        ? "animate-bubble-shrink"
        : "";

  const toggle = useCallback(
    async (type: ReactionType) => {
      if (isPendingRef.current) return;

      // Auth check - wait for auth to load, then check
      if (isAuthLoading) {
        return; // Wait for auth to finish loading
      }

      if (!isAuthenticated) {
        requireAuth();
        return;
      }

      // Store previous values for potential rollback
      const prevReaction = optimisticReaction;
      const prevLikeCount = optimisticLikeCount;
      const prevDislikeCount = optimisticDislikeCount;

      // Calculate new reaction state and counts
      let newReaction: ReactionType | null;
      let newLikeCount = prevLikeCount;
      let newDislikeCount = prevDislikeCount;

      if (optimisticReaction === type) {
        // Same reaction clicked → toggle off
        newReaction = null;

        if (type === "LIKE") {
          newLikeCount = Math.max(0, prevLikeCount - 1);
          setLikeAnimation("shrink");
        } else {
          newDislikeCount = Math.max(0, prevDislikeCount - 1);
          setDislikeAnimation("shrink");
        }
      } else {
        // Different reaction or no reaction → set to new type
        newReaction = type;

        // Handle previous reaction shrink animation and count adjustment
        if (prevReaction === "LIKE") {
          setLikeAnimation("shrink");
          newLikeCount = Math.max(0, prevLikeCount - 1);
        } else if (prevReaction === "DISLIKE") {
          setDislikeAnimation("shrink");
          newDislikeCount = Math.max(0, prevDislikeCount - 1);
        }

        // Handle new reaction pop animation and count adjustment
        if (type === "LIKE") {
          setLikeAnimation("pop");
          newLikeCount = newLikeCount + 1;
        } else {
          setDislikeAnimation("pop");
          newDislikeCount = newDislikeCount + 1;
        }
      }

      // Set pending state BEFORE updating state to prevent useEffect sync
      isPendingRef.current = true;
      setIsPending(true);

      // Apply optimistic updates immediately
      setOptimisticReaction(newReaction);
      setOptimisticLikeCount(newLikeCount);
      setOptimisticDislikeCount(newDislikeCount);

      // Optimistically update the React Query cache for feed posts
      queryClient.setQueryData(
        [SOCIAL_POSTS_QUERY_KEY],
        (
          oldData:
            | {
                pages: {
                  items: {
                    id: string;
                    myReaction?: string | null;
                    likeCount?: number;
                    dislikeCount?: number;
                  }[];
                }[];
              }
            | undefined,
        ) => {
          if (!oldData?.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === postId
                  ? {
                      ...item,
                      myReaction: newReaction,
                      likeCount: newLikeCount,
                      dislikeCount: newDislikeCount,
                    }
                  : item,
              ),
            })),
          };
        },
      );

      // Also update post detail cache if it exists
      queryClient.setQueryData(
        [POST_DETAIL_QUERY_KEY, postId],
        (
          oldData:
            | {
                myReaction?: string | null;
                likeCount?: number;
                dislikeCount?: number;
              }
            | undefined,
        ) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            myReaction: newReaction,
            likeCount: newLikeCount,
            dislikeCount: newDislikeCount,
          };
        },
      );

      try {
        const response = await togglePostReaction(postId, type);

        // Update with server-returned counts if available
        if (response.likeCount !== undefined) {
          setOptimisticLikeCount(response.likeCount);
        }
        if (response.dislikeCount !== undefined) {
          setOptimisticDislikeCount(response.dislikeCount);
        }

        // Invalidate queries to ensure sync with server
        await queryClient.invalidateQueries({
          queryKey: [SOCIAL_POSTS_QUERY_KEY],
        });
        await queryClient.invalidateQueries({
          queryKey: [POST_DETAIL_QUERY_KEY, postId],
        });
      } catch (error) {
        // Rollback on error
        setOptimisticReaction(prevReaction);
        setOptimisticLikeCount(prevLikeCount);
        setOptimisticDislikeCount(prevDislikeCount);
        setLikeAnimation(null);
        setDislikeAnimation(null);

        // Restore feed cache
        queryClient.setQueryData(
          [SOCIAL_POSTS_QUERY_KEY],
          (
            oldData:
              | {
                  pages: {
                    items: {
                      id: string;
                      myReaction?: string | null;
                      likeCount?: number;
                      dislikeCount?: number;
                    }[];
                  }[];
                }
              | undefined,
          ) => {
            if (!oldData?.pages) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.id === postId
                    ? {
                        ...item,
                        myReaction: prevReaction,
                        likeCount: prevLikeCount,
                        dislikeCount: prevDislikeCount,
                      }
                    : item,
                ),
              })),
            };
          },
        );

        // Restore post detail cache
        queryClient.setQueryData(
          [POST_DETAIL_QUERY_KEY, postId],
          (
            oldData:
              | {
                  myReaction?: string | null;
                  likeCount?: number;
                  dislikeCount?: number;
                }
              | undefined,
          ) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              myReaction: prevReaction,
              likeCount: prevLikeCount,
              dislikeCount: prevDislikeCount,
            };
          },
        );

        console.error("Failed to toggle reaction:", error);
      } finally {
        isPendingRef.current = false;
        setIsPending(false);
      }
    },
    [
      postId,
      optimisticReaction,
      optimisticLikeCount,
      optimisticDislikeCount,
      currentReaction,
      initialLikeCount,
      initialDislikeCount,
      queryClient,
      isAuthenticated,
      isAuthLoading,
    ],
  );

  return {
    reaction: optimisticReaction,
    isPending,
    likeAnimationClass,
    dislikeAnimationClass,
    toggle,
    likeCount: optimisticLikeCount,
    dislikeCount: optimisticDislikeCount,
  };
}
