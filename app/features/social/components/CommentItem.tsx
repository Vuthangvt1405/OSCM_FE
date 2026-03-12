"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Comment } from "@/lib/social/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_DEPTH = 2; // Level 0, 1, 2 (3 levels total)

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReply: (commentId: string, content: string) => Promise<void>;
  onReaction: (commentId: string, type: "LIKE" | "DISLIKE") => Promise<void>;
  isAuthenticated: boolean;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateString;
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return format(date, "MMM d");
  } catch {
    return dateString;
  }
}

export function CommentItem({
  comment,
  postId,
  onReply,
  onReaction,
  isAuthenticated,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState("");
  const [dislikeAnimation, setDislikeAnimation] = useState("");

  const canReply = comment.level < MAX_DEPTH;
  const level = comment.level;

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!isAuthenticated) return;

    // Trigger animation
    if (type === "LIKE") {
      setLikeAnimation("scale-110");
      setTimeout(() => setLikeAnimation(""), 150);
    } else {
      setDislikeAnimation("scale-110");
      setTimeout(() => setDislikeAnimation(""), 150);
    }

    try {
      await onReaction(comment.id, type);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  return (
    <div className="flex gap-3">
      {/* Vertical line column for replies */}
      {level > 0 && (
        <div className="relative flex-shrink-0 w-6 flex justify-center">
          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {/* Comment content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Avatar size="sm">
            <AvatarImage src={comment.author.avatarUrl ?? undefined} />
            <AvatarFallback>
              {getInitials(comment.author.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
            {comment.author.displayName}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            • {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 pl-8">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pl-8 mb-3">
          {/* Like button */}
          <button
            type="button"
            aria-label={`Like (${comment.likeCount})`}
            onClick={() => handleReaction("LIKE")}
            disabled={!isAuthenticated}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-xs transition-all duration-150 ${likeAnimation} ${
              comment.myReaction === "LIKE"
                ? "border-orange-400 bg-orange-500 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ThumbsUp
              className="h-3 w-3"
              fill={comment.myReaction === "LIKE" ? "currentColor" : "none"}
            />
            {comment.likeCount > 0 && (
              <span className="font-medium">{comment.likeCount}</span>
            )}
          </button>

          {/* Dislike button */}
          <button
            type="button"
            aria-label={`Dislike (${comment.dislikeCount})`}
            onClick={() => handleReaction("DISLIKE")}
            disabled={!isAuthenticated}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-xs transition-all duration-150 ${dislikeAnimation} ${
              comment.myReaction === "DISLIKE"
                ? "border-indigo-400 bg-indigo-500 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ThumbsDown
              className="h-3 w-3"
              fill={comment.myReaction === "DISLIKE" ? "currentColor" : "none"}
            />
            {comment.dislikeCount > 0 && (
              <span className="font-medium">{comment.dislikeCount}</span>
            )}
          </button>

          {/* Reply button */}
          {canReply && (
            <button
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              disabled={!isAuthenticated}
              className={`inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition dark:text-slate-400 dark:hover:text-slate-200 ${
                !isAuthenticated ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <MessageCircle className="h-3 w-3" />
              <span>Reply</span>
            </button>
          )}

          {/* Max depth indicator */}
          {!canReply && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Max depth reached
            </span>
          )}
        </div>

        {/* Reply form */}
        {isReplying && isAuthenticated && (
          <div className="pl-8 mb-3">
            <Textarea
              value={replyContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setReplyContent(e.target.value)
              }
              placeholder="Write a reply..."
              className="min-h-[80px] text-sm"
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyContent.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Reply"}
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                onReply={onReply}
                onReaction={onReaction}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
