"use client";

import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useComments } from "@/features/social/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { CommentItem } from "./CommentItem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { Comment } from "@/lib/social/types";

interface CommentSectionProps {
  postId: string;
  isAuthenticated?: boolean;
}

export function CommentSection({ postId }: CommentSectionProps) {
  // Get auth state with loading indicator
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { comments, isLoading, error, addComment, addReply, toggleReaction } =
    useComments(postId);

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalComments = countAllComments(comments);

  function countAllComments(commentList: Comment[]): number {
    return commentList.reduce((total: number, comment: Comment) => {
      return total + 1 + countAllComments(comment.replies);
    }, 0);
  }

  const handleReply = async (
    commentId: string,
    content: string,
  ): Promise<void> => {
    await addReply(commentId, content);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addComment(newComment.trim());
      setNewComment("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to post comment";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Comments
        </h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          ({totalComments})
        </span>
      </div>

      {/* Comment form - show loading or authenticated state */}
      {isAuthLoading ? (
        <div className="mb-6">
          <Skeleton className="min-h-[100px] w-full" />
          <div className="flex justify-end mt-2">
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      ) : isAuthenticated ? (
        <div className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNewComment(e.target.value)
            }
            placeholder="Write a comment..."
            className="min-h-[100px] text-sm"
            disabled={isSubmitting}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Comment"
              )}
            </Button>
          </div>
          {submitError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <a
              href="/login"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Log in
            </a>{" "}
            to leave a comment.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Comments list */}
      {!isLoading && !error && comments.length === 0 && (
        <div className="py-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}

      {!isLoading && !error && comments.length > 0 && (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={handleReply}
              onReaction={toggleReaction}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
