"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Comment } from "@/lib/social/types";
import {
  createComment,
  createReply,
  fetchComments,
  toggleCommentReaction,
} from "@/lib/apis/social";

export type UseCommentsResult = {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addComment: (content: string) => Promise<Comment>;
  addReply: (commentId: string, content: string) => Promise<Comment>;
  toggleReaction: (
    commentId: string,
    type: "LIKE" | "DISLIKE",
  ) => Promise<void>;
};

export function useComments(postId: string | null): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!postId) {
      setComments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchComments(postId);
      setComments(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load comments";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Track if we've already fetched to prevent infinite loops
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!postId || hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    refresh();
  }, [postId]);

  const addComment = useCallback(
    async (content: string): Promise<Comment> => {
      if (!postId) {
        throw new Error("Post ID is required");
      }
      const newComment = await createComment(postId, content);
      // Refresh to get the updated comment with author info
      await refresh();
      return newComment;
    },
    [postId, refresh],
  );

  const addReply = useCallback(
    async (commentId: string, content: string): Promise<Comment> => {
      if (!postId) {
        throw new Error("Post ID is required");
      }
      const newReply = await createReply(postId, commentId, content);
      // Refresh to get the updated structure
      await refresh();
      return newReply;
    },
    [postId, refresh],
  );

  const toggleReaction = useCallback(
    async (commentId: string, type: "LIKE" | "DISLIKE"): Promise<void> => {
      if (!postId) {
        throw new Error("Post ID is required");
      }

      // Optimistic update
      setComments((prev) => {
        const updateComment = (comment: Comment): Comment => {
          // First, recursively update any replies
          const updatedReplies = comment.replies.map(updateComment);

          // Only update this comment if it matches the target commentId
          if (comment.id !== commentId) {
            return {
              ...comment,
              replies: updatedReplies,
            };
          }

          // Apply reaction changes only to the target comment
          let newReaction: "LIKE" | "DISLIKE" | null = type;
          let newLikeCount = comment.likeCount;
          let newDislikeCount = comment.dislikeCount;

          if (comment.myReaction === type) {
            // Removing reaction
            newReaction = null;
            if (type === "LIKE") {
              newLikeCount = Math.max(0, comment.likeCount - 1);
            } else {
              newDislikeCount = Math.max(0, comment.dislikeCount - 1);
            }
          } else if (comment.myReaction === null) {
            // Adding new reaction
            if (type === "LIKE") {
              newLikeCount = comment.likeCount + 1;
            } else {
              newDislikeCount = comment.dislikeCount + 1;
            }
          } else {
            // Switching reaction
            if (type === "LIKE") {
              newLikeCount = comment.likeCount + 1;
              newDislikeCount = Math.max(0, comment.dislikeCount - 1);
            } else {
              newLikeCount = Math.max(0, comment.likeCount - 1);
              newDislikeCount = comment.dislikeCount + 1;
            }
          }

          return {
            ...comment,
            myReaction: newReaction,
            likeCount: newLikeCount,
            dislikeCount: newDislikeCount,
            replies: updatedReplies,
          };
        };

        return prev.map(updateComment);
      });

      try {
        await toggleCommentReaction(postId, commentId, type);
      } catch (err) {
        // Revert on error
        await refresh();
        throw err;
      }
    },
    [postId, refresh],
  );

  return {
    comments,
    isLoading,
    error,
    refresh,
    addComment,
    addReply,
    toggleReaction,
  };
}
