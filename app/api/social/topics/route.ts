import { getBackendBaseUrl } from "@/lib/server/backend";
import { NextResponse } from "next/server";

/**
 * GET /api/social/topics
 *
 * List topics or search by query.
 * Backend endpoint is public (permitAll).
 *
 * Query params:
 * - q: search query (optional)
 * - page: page number (default: 0)
 * - size: page size (default: 20)
 */
export async function GET(req: Request) {
  try {
    const backendBaseUrl = getBackendBaseUrl();

    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "0";
    const size = url.searchParams.get("size") || "20";
    const search = url.searchParams.get("q");

    let backendUrl = `${backendBaseUrl}/api/social/topics?page=${page}&size=${size}`;

    if (search) {
      backendUrl = `${backendBaseUrl}/api/social/topics/search?query=${encodeURIComponent(search)}&page=${page}&size=${size}`;
    }

    const upstream = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "content-type": "application/json",
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
    console.error("[TopicsAPI] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
