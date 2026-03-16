import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/server/backend";

/**
 * GET /api/social/users/search
 *
 * Search users by query string.
 * Backend endpoint is public (permitAll).
 *
 * Query params:
 * - q: search query
 * - page: page number (default: 0)
 * - size: page size (default: 20)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "20";

  const backendUrl = getBackendBaseUrl();

  if (!query || !query.trim()) {
    return NextResponse.json(
      { message: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const targetUrl = `${backendUrl}/api/social/users/search?q=${encodeURIComponent(query.trim())}&page=${page}&size=${size}`;

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to search users" },
        { status: res.status },
      );
    }

    // Forward pagination headers
    const response = NextResponse.json(data);
    const hasNext = res.headers.get("x-has-next");
    const pageHeader = res.headers.get("x-page");

    if (hasNext) {
      response.headers.set("x-has-next", hasNext);
    }
    if (pageHeader) {
      response.headers.set("x-page", pageHeader);
    }

    return response;
  } catch (error) {
    console.error("[UsersSearchAPI] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
