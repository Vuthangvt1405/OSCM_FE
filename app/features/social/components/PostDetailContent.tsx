"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bookmark,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PostDetailResponse } from "@/lib/social/types";
import { LexicalContentViewer } from "./LexicalContentViewer";
import { useSidebarAvailability } from "@/features/sidebar";
import { PostPasswordModal } from "./PostPasswordModal";
import { Button } from "@/components/ui/button";
import { useReactionToggle } from "@/features/social/hooks/useReactionToggle";
import { useAuth } from "@/hooks/useAuth";
import { CommentSection } from "./CommentSection";
import { checkFollowStatus, followUser, unfollowUser } from "@/lib/apis/social";

interface PostDetailContentProps {
  post: PostDetailResponse;
}

/**
 * Get initials from author name
 */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Format date string to readable format
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

/**
 * Reaction buttons component
 */
function ReactionButtons({
  postId,
  userReaction,
  likeCount: initialLikeCount,
  dislikeCount: initialDislikeCount,
}: {
  postId: string;
  userReaction?: "LIKE" | "DISLIKE" | null;
  likeCount?: number;
  dislikeCount?: number;
}) {
  const {
    reaction,
    isPending,
    likeAnimationClass,
    dislikeAnimationClass,
    toggle,
    likeCount,
    dislikeCount,
  } = useReactionToggle({
    postId,
    currentReaction: userReaction,
    initialLikeCount: initialLikeCount ?? 0,
    initialDislikeCount: initialDislikeCount ?? 0,
  });

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Like (${likeCount})`}
        onClick={() => toggle("LIKE")}
        disabled={isPending}
        className={`inline-flex h-10 items-center justify-center gap-1 rounded-full border px-3 transition-all duration-150 ${
          reaction === "LIKE"
            ? "border-orange-400 bg-orange-500 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:scale-105"
        } ${likeAnimationClass}`}
      >
        <ThumbsUp
          className="h-4 w-4"
          fill={reaction === "LIKE" ? "currentColor" : "none"}
        />
        {likeCount > 0 && (
          <span className="text-sm font-medium">{likeCount}</span>
        )}
      </button>
      <button
        type="button"
        aria-label={`Dislike (${dislikeCount})`}
        onClick={() => toggle("DISLIKE")}
        disabled={isPending}
        className={`inline-flex h-10 items-center justify-center gap-1 rounded-full border px-3 transition-all duration-150 ${
          reaction === "DISLIKE"
            ? "border-indigo-400 bg-indigo-500 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:scale-105"
        } ${dislikeAnimationClass}`}
      >
        <ThumbsDown
          className="h-4 w-4"
          fill={reaction === "DISLIKE" ? "currentColor" : "none"}
        />
        {dislikeCount > 0 && (
          <span className="text-sm font-medium">{dislikeCount}</span>
        )}
      </button>
    </div>
  );
}

/**
 * Main Post Detail Content component
 */
export function PostDetailContent({ post }: PostDetailContentProps) {
  // Get auth state
  const { isAuthenticated, session, requireAuth } = useAuth();

  // State for password unlock modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Store unlocked content (decrypted)
  const [unlockedContent, setUnlockedContent] =
    useState<PostDetailResponse | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCheckingFollowStatus, setIsCheckingFollowStatus] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);

  const authorId = post.author.authorId;
  const isOwnPostAuthor = Boolean(
    session?.userId && session.userId === authorId,
  );

  useEffect(() => {
    let cancelled = false;

    const setIfActive = (fn: () => void) => {
      if (!cancelled) fn();
    };

    const loadFollowStatus = async () => {
      if (!isAuthenticated || !authorId || isOwnPostAuthor) {
        setIsFollowing(false);
        return;
      }

      setIsCheckingFollowStatus(true);
      try {
        const following = await checkFollowStatus(authorId);
        setIfActive(() => setIsFollowing(following));
      } catch {
        setIfActive(() => setIsFollowing(false));
      } finally {
        setIfActive(() => setIsCheckingFollowStatus(false));
      }
    };

    loadFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [authorId, isAuthenticated, isOwnPostAuthor]);

  // Determine if post is currently locked (and not yet unlocked)
  const isLocked = post.locked && !unlockedContent;

  // Enable sidebar toggle button in header
  useSidebarAvailability();

  // Validate cover URL - only use Next.js Image for valid URLs
  const coverUrl = post.cover?.startsWith("http") ? post.cover : null;

  // Get content to display (unlocked or original)
  const contentToDisplay = unlockedContent?.content ?? post.content;

  // Handle successful unlock
  const handleUnlock = (unlockedPost: PostDetailResponse) => {
    setUnlockedContent(unlockedPost);
  };

  const handleFollowClick = async () => {
    if (!requireAuth(window.location.pathname)) {
      return;
    }

    if (
      !authorId ||
      isOwnPostAuthor ||
      isFollowPending ||
      isCheckingFollowStatus
    ) {
      return;
    }

    if (isFollowing) {
      setIsUnfollowModalOpen(true);
      return;
    }

    setIsFollowPending(true);
    try {
      await followUser(authorId);
      setIsFollowing(true);
      toast.success(`You are now following @${post.author.username}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to follow user");
    } finally {
      setIsFollowPending(false);
    }
  };

  const handleConfirmUnfollow = async () => {
    if (!authorId || isFollowPending) {
      return;
    }

    setIsFollowPending(true);
    try {
      await unfollowUser(authorId);
      setIsFollowing(false);
      setIsUnfollowModalOpen(false);
      toast.success(`Unfollowed @${post.author.username}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to unfollow user",
      );
    } finally {
      setIsFollowPending(false);
    }
  };

  const followButtonDisabled =
    isFollowPending || isCheckingFollowStatus || !authorId;

  return (
    <article className="max-w-4xl mx-auto">
      {/* Author Header */}
      <header className="flex items-center gap-4 mb-6">
        {post.author.avatarUrl ? (
          <Image
            src={post.author.avatarUrl}
            alt={`${post.author.username} avatar`}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
            {getInitials(post.author.username)}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/@${post.author.username}`}
              className="font-semibold text-slate-900 hover:underline"
            >
              {post.author.username}
            </Link>
            {post.topic && (
              <Link
                href={`/topics/${post.topic.id}`}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                c/{post.topic.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{formatDate(post.createdAt)}</span>
            {post.visibility && (
              <>
                <span>·</span>
                <span className="capitalize">
                  {post.visibility.toLowerCase()}
                </span>
              </>
            )}
          </div>
        </div>

        {isOwnPostAuthor ? (
          <Link
            href={`/write?postId=${post.id}`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Manage post
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleFollowClick}
            disabled={followButtonDisabled}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isFollowing
                ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                : "bg-slate-900 text-white hover:bg-slate-800"
            } ${followButtonDisabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {isFollowPending
              ? isFollowing
                ? "Unfollowing..."
                : "Following..."
              : isCheckingFollowStatus
                ? "Loading..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
          </button>
        )}
      </header>

      {/* Title */}
      <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
        {post.title}
      </h1>

      {/* Cover Image - only render if valid URL */}
      {coverUrl && (
        <div className="mb-8">
          <Image
            src={coverUrl}
            alt={post.caption || post.title}
            width={1200}
            height={630}
            className="w-full h-auto rounded-xl"
            priority
          />
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
          {post.caption}
        </p>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="mb-8">
        {isLocked ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
              <Lock className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              This post is password protected
            </h3>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
              Enter the password to unlock and read the full content.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Lock className="w-4 h-4 mr-2" />
              Unlock with Password
            </Button>
          </div>
        ) : (
          <LexicalContentViewer content={contentToDisplay} />
        )}
      </div>

      {/* Password Unlock Modal */}
      <PostPasswordModal
        postId={post.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUnlock={handleUnlock}
      />

      <Dialog
        open={isUnfollowModalOpen}
        onOpenChange={(open) => {
          if (!isFollowPending) {
            setIsUnfollowModalOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unfollow @{post.author.username}?</DialogTitle>
            <DialogDescription>
              Their posts may appear less often in your feed after unfollowing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsUnfollowModalOpen(false)}
              disabled={isFollowPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmUnfollow}
              disabled={isFollowPending}
            >
              {isFollowPending ? "Unfollowing..." : "Unfollow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="flex items-center justify-between py-6 border-t border-b border-slate-200">
        <div className="flex items-center gap-4">
          <ReactionButtons
            postId={post.id}
            userReaction={post.myReaction}
            likeCount={post.likeCount}
            dislikeCount={post.dislikeCount}
          />

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Bookmark"
          >
            <Bookmark className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Comment Section - isAuthenticated is now handled internally */}
      <CommentSection postId={post.id} />
    </article>
  );
}
