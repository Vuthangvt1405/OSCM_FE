"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedPost } from "@/lib/social/types";
import {
  Bookmark,
  Eye,
  MessageCircle,
  MinusCircle,
  MoreHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { generateSlugFromTitle } from "@/lib/apis/social";
import { useReactionToggle } from "@/features/social/hooks/useReactionToggle";
import { useAuth } from "@/hooks/useAuth";

type FeedCardPost = FeedPost & {
  viewCount?: number;
  commentCount?: number;
  authorAvatarSrc?: string | null;
};

export type FeedCardProps = {
  post: FeedCardPost;
  href?: string;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function isValidImageSrc(src: string | undefined): boolean {
  if (!src || typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;
  if (s.startsWith("/")) return true;
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

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
  console.log("reaction", reaction);

  return (
    <div
      className="inline-flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={`Like (${likeCount})`}
        onClick={() => toggle("LIKE")}
        disabled={isPending}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 transition-all duration-150 ${
          reaction === "LIKE"
            ? "border-orange-400 bg-orange-500 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:scale-105"
        } ${likeAnimationClass}`}
      >
        <ThumbsUp
          className="h-4 w-4"
          fill={reaction === "LIKE" ? "currentColor" : "none"}
        />
        <span className="text-sm font-medium">{likeCount}</span>
      </button>
      <button
        type="button"
        aria-label={`Dislike (${dislikeCount})`}
        onClick={() => toggle("DISLIKE")}
        disabled={isPending}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 transition-all duration-150 ${
          reaction === "DISLIKE"
            ? "border-indigo-400 bg-indigo-500 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:scale-105"
        } ${dislikeAnimationClass}`}
      >
        <ThumbsDown
          className="h-4 w-4"
          fill={reaction === "DISLIKE" ? "currentColor" : "none"}
        />
        <span className="text-sm font-medium">{dislikeCount}</span>
      </button>
    </div>
  );
}

export function FeedCard({ post, href }: FeedCardProps) {
  const router = useRouter();
  const { session } = useAuth();
  const viewCount = post.viewCount ?? post.score;
  const commentCount = post.commentCount ?? 0;
  const isOwnPostAuthor = Boolean(
    session?.userId && post.author?.authorId && session.userId === post.author.authorId,
  );
  // Use provided href or generate SEO-friendly URL with slug
  const postHref =
    href ?? `/posts/${post.id}/${generateSlugFromTitle(post.title)}`;

  const handleCardClick = () => {
    router.push(postHref);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {post.authorAvatarSrc ? (
          <Image
            src={post.authorAvatarSrc}
            alt={`${post.authorName} avatar`}
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {getInitials(post.authorName)}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-medium text-slate-900">
              {post.authorName}
            </div>
            {isOwnPostAuthor ? (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Mine
              </div>
            ) : null}
            {post.authorRole ? (
              <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {post.authorRole}
              </div>
            ) : null}
            {post.topic ? (
              <Link
                href={`/topics/${post.topic.id}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                c/{post.topic.name}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="min-w-0">
          <h3 className="text-2xl font-extrabold leading-tight text-slate-900">
            <Link
              href={postHref}
              className="outline-none transition hover:underline focus-visible:underline"
            >
              {post.title}
            </Link>
          </h3>

          {post.caption ? (
            <p className="mt-2 line-clamp-2 text-base text-slate-600">
              {post.caption}
            </p>
          ) : null}
        </div>

        {post.image && isValidImageSrc(post.image.src) ? (
          <div className="md:justify-self-end">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <Image
                src={post.image.src}
                alt={post.image.alt}
                width={220}
                height={124}
                className="h-[124px] w-[220px] object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
          <ReactionButtons
            postId={post.id}
            userReaction={post.userReaction}
            likeCount={post.likeCount}
            dislikeCount={post.dislikeCount}
          />
          <div className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>{post.createdAtLabel}</span>
          </div>

          <div className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{viewCount}</span>
          </div>

          <div className="inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </div>
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Hide"
          >
            <MinusCircle className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Bookmark"
          >
            <Bookmark className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
