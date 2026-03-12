"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePostForm } from "../hooks/usePostForm";
import { useCommunitySearch } from "../hooks/useCommunitySearch";
import { useTagSearch } from "../hooks/useTagSearch";
import { CreatePostForm } from "./CreatePostForm";
import { PostOptionsPanel } from "./PostOptionsPanel";
import { useAuth } from "@/hooks/useAuth";

export function WritePageContent() {
  // Auth check - redirect to login if not authenticated
  const { isAuthenticated, isLoading, requireAuth } = useAuth();

  // Redirect to login if not authenticated (reuse requireAuth logic)
  useEffect(() => {
    if (!isLoading) {
      requireAuth("/write");
    }
  }, [isLoading, requireAuth]);

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
  } = usePostForm();

  // Community search
  const communitySearch = useCommunitySearch();

  // Tag search
  const tagSearch = useTagSearch();

  // Show loading while checking auth
  if (isLoading) {
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
                Post Settings
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
              Post Settings
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
              Posting...
            </>
          ) : isUploadingCover ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
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
