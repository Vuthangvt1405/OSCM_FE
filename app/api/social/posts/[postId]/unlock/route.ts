import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/social/posts/[postId]/unlock
 * Proxy unlock request to backend - anyone with password can unlock
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const backendBaseUrl = getBackendBaseUrl();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    // Token is optional - backend allows anonymous unlock
    // Anyone with the correct password can unlock and view the content
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Parse password from request body
    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 },
      );
    }

    // Proxy to backend
    const upstream = await fetch(
      `${backendBaseUrl}/social/posts/${postId}/unlock`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ password }),
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

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Unlock API Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
