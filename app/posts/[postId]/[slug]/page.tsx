import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPostDetailServer } from "@/lib/server/social";
import { generateSlugFromTitle } from "@/lib/apis/social";
import { PostDetailContent } from "@/features/social/components/PostDetailContent";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SiteHeader } from "@/components/Header";

// Force dynamic rendering for SSR
export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{
    postId: string;
    slug: string;
  }>;
}

/**
 * Generate SEO metadata for the post
 */
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { postId } = await params;

  try {
    const post = await fetchPostDetailServer(postId);

    // Handle null content (e.g., for locked/password-protected posts)
    const description =
      post.caption || (post.content ? post.content.slice(0, 160) : "");

    return {
      title: `${post.title} | Odysseus`,
      description,
      openGraph: {
        title: post.title,
        description,
        type: "article",
        publishedTime: post.createdAt,
        modifiedTime: post.updatedAt,
        authors: [post.author.username],
        images: post.cover ? [post.cover] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        images: post.cover ? [post.cover] : [],
      },
    };
  } catch {
    return {
      title: "Post | Odysseus",
    };
  }
}

/**
 * Server component for post detail page
 * Fetches post data on the server side for SSR and SEO
 */
export default async function PostPage({ params }: PostPageProps) {
  const { postId, slug } = await params;

  let post;
  try {
    post = await fetchPostDetailServer(postId);
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }

  // Verify slug matches (for SEO-friendly URLs)
  // If slug doesn't match, we still show the content but update the URL
  const expectedSlug = generateSlugFromTitle(post.title);
  const slugMismatch = slug !== expectedSlug;

  return (
    <SiteHeader>
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="mx-auto h-full w-full max-w-6xl overflow-hidden px-4">
            <div className="box-border h-full py-8">
              <div className="scrollbar-hidden h-full min-h-0 overflow-y-auto rounded-lg bg-white p-8">
                <PostDetailContent post={post} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </SiteHeader>
  );
}
