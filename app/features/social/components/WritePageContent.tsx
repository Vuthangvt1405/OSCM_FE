"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { usePostForm } from "../hooks/usePostForm";
import { useCommunitySearch } from "../hooks/useCommunitySearch";
import { useTagSearch } from "../hooks/useTagSearch";
import { CreatePostForm } from "./CreatePostForm";
import { PostOptionsPanel } from "./PostOptionsPanel";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { fetchPostDetail } from "@/lib/apis/social";
import type { PostDetailResponse } from "@/lib/social/types";
import { toast } from "sonner";

export function WritePageContent() {
  // Auth check - redirect to login if not authenticated
  const { isAuthenticated, isLoading, requireAuth } = useAuth();

  // Redirect to login if not authenticated (reuse requireAuth logic)
  useEffect(() => {
    if (!isLoading) {
      requireAuth("/write");
    }
  }, [isLoading, requireAuth]);

  const searchParams = useSearchParams();
  const editPostId = searchParams.get("postId") ?? undefined;
  const [initialPost, setInitialPost] = useState<PostDetailResponse | null>(
    null,
  );
  const [isLoadingInitialPost, setIsLoadingInitialPost] = useState(false);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInitialPost = async () => {
      if (!editPostId) {
        setInitialPost(null);
        setIsLoadingInitialPost(false);
        setEditLoadError(null);
        return;
      }

      setIsLoadingInitialPost(true);
      setEditLoadError(null);
      try {
        const post = await fetchPostDetail(editPostId);
        if (!cancelled) {
          setInitialPost(post);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load post for editing";
          setInitialPost(null);
          setEditLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInitialPost(false);
        }
      }
    };

    loadInitialPost();

    return () => {
      cancelled = true;
    };
  }, [editPostId]);

  // Form state and submission
  const {
    form,
    submit,
    isSubmitting,
    isUploadingCover,
    isValid,
    handleCoverSelect,
    handleCoverRemove,
    coverPreviewUrl,
  } = usePostForm({ postId: editPostId, initialPost });

  // Community search
  const communitySearch = useCommunitySearch();

  // Tag search
  const tagSearch = useTagSearch();

  // Show loading while checking auth
  if (isLoading || isLoadingInitialPost) {
    return (
      <main className="flex h-[calc(100vh-57px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  // Don't render if not authenticated (requireAuth will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (editPostId && !initialPost) {
    return (
      <main className="flex h-[calc(100vh-57px)] w-full items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Unable to load post editor
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {editLoadError ?? "This post could not be loaded for editing."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back home
            </Link>
            <Link
              href="/write"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start a new post
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-57px)] w-full lg:overflow-hidden">
      <div className="mx-auto box-border h-full max-w-6xl px-4 py-6">
        <div className="grid h-full gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Content - Create Post Form */}
          <CreatePostForm form={form} />

          {/* Sidebar - Hidden on mobile, visible on lg+ */}
          <aside className="hidden h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="h-full overflow-y-auto p-6">
              <h2 className="mb-6 text-lg font-semibold text-slate-900">
                {editPostId ? "Edit Post Settings" : "Post Settings"}
              </h2>
              <PostOptionsPanel
                form={form}
                communitySearch={communitySearch}
                tagSearch={tagSearch}
                coverPreviewUrl={coverPreviewUrl}
                isUploadingCover={isUploadingCover}
                onCoverSelect={handleCoverSelect}
                onCoverRemove={handleCoverRemove}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile PostOptions - shown below on small screens */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-6xl px-4 pb-24">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">
              {editPostId ? "Edit Post Settings" : "Post Settings"}
            </h2>
            <PostOptionsPanel
              form={form}
              communitySearch={communitySearch}
              tagSearch={tagSearch}
              coverPreviewUrl={coverPreviewUrl}
              isUploadingCover={isUploadingCover}
              onCoverSelect={handleCoverSelect}
              onCoverRemove={handleCoverRemove}
            />
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons - Bottom Right */}
      <div className="fixed bottom-4 right-3 z-50 flex flex-col items-end gap-3">
        <button
          onClick={submit}
          disabled={!isValid}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {editPostId ? "Saving..." : "Posting..."}
            </>
          ) : isUploadingCover ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : editPostId ? (
            "Save"
          ) : (
            "Post"
          )}
        </button>
        <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-lg transition-colors hover:bg-slate-50">
          Save Draft
        </button>
      </div>
    </main>
  );
}
