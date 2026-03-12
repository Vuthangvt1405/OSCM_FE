import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { json } from "zod";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  if (!postId)
    return NextResponse.json({ message: "Post ID required" }, { status: 400 });

  let body: { type?: string };

  try {
    body = (await req.json()) as { type?: string };
  } catch {
    return NextResponse.json(
      { message: "Malformed JSON request" },
      { status: 400 },
    );
  }

  const type =
    body.type === "LIKE" || body.type === "DISLIKE" ? body.type : null;

  if (!type)
    return NextResponse.json(
      { message: "type muse LIKE or DISLIKE" },
      { status: 400 },
    );

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const backendBaseUrl = getBackendBaseUrl();
  const res = await fetch(
    `${backendBaseUrl}/social/posts/${postId}/reactions`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ type }),
    },
  );

  if (!res.ok) {
    const payload = res.headers
      .get("content-type")
      ?.includes("application/json")
      ? await res.json().catch(() => {})
      : {};

    return NextResponse.json(payload, { status: res.status });
  }

  // Forward the response body with reaction counts from backend
  const payload = res.headers.get("content-type")?.includes("application/json")
    ? await res.json().catch(() => ({ likeCount: 0, dislikeCount: 0 }))
    : { likeCount: 0, dislikeCount: 0 };

  return NextResponse.json(payload);
}
