import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const backendBaseUrl = getBackendBaseUrl();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const headers: HeadersInit = {};
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "0";
    const size = url.searchParams.get("size") || "10";

    const upstream = await fetch(
      `${backendBaseUrl}/social/posts/user/${userId}?page=${page}&size=${size}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

    const contentType = upstream.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    const response = NextResponse.json(payload);

    // Forward pagination headers
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
    console.error("API Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
