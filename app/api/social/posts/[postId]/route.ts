import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const backendBaseUrl = getBackendBaseUrl();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    // Token is optional - guests can view public posts
    // Backend handles both authenticated and unauthenticated requests
    const headers: HeadersInit = {};
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const upstream = await fetch(`${backendBaseUrl}/social/posts/${postId}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
