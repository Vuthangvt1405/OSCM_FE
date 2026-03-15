import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/social/posts/search
 *
 * Search posts by title or content.
 * Backend endpoint requires authentication.
 *
 * Query params:
 * - query: search query (required)
 * - page: page number (default: 0)
 * - size: page size (default: 20)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "20";

  const backendBaseUrl = getBackendBaseUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!query || !query.trim()) {
    return NextResponse.json(
      { message: "Query parameter 'query' is required" },
      { status: 400 },
    );
  }

  const targetUrl = `${backendBaseUrl}/api/social/posts/search?query=${encodeURIComponent(query.trim())}&page=${page}&size=${size}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    let payload: unknown;

    try {
      payload = contentType.includes("application/json")
        ? await upstream.json()
        : await upstream.text();
    } catch {
      payload = await upstream.text();
    }

    if (!upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    // Forward pagination headers
    const response = NextResponse.json(payload);
    const hasNext = upstream.headers.get("x-has-next");
    const pageHeader = upstream.headers.get("x-page");

    if (hasNext) {
      response.headers.set("x-has-next", hasNext);
    }
    if (pageHeader) {
      response.headers.set("x-page", pageHeader);
    }

    return response;
  } catch (error) {
    console.error("[PostsSearchAPI] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
