import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const backendBaseUrl = getBackendBaseUrl();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    console.log("Received POST request to create post");
    console.log("Token present:", !!token);

    if (!token) {
      console.log("No authentication token found");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
      console.log("Parsed request body:", body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { message: "Malformed JSON request" },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${backendBaseUrl}/social/posts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", upstream.status);
    console.log("Backend response headers:", Object.fromEntries(upstream.headers.entries()));
    
    const contentType = upstream.headers.get("content-type") ?? "";
    let payload: unknown;
    try {
      payload = contentType.includes("application/json")
        ? await upstream.json()
        : await upstream.text();
      console.log("Backend response payload:", payload);
    } catch {
      const text = await upstream.text();
      console.log("Backend response text:", text);
      payload = "Unexpected response format: " + text;
    }

    if (!upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const backendBaseUrl = getBackendBaseUrl();

  const url = new URL(req.url);
  const page = url.searchParams.get("page") ?? "0";
  const size = url.searchParams.get("size") ?? "10";

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;

  const upstream = await fetch(
    `${backendBaseUrl}/social/posts?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    },
  );

  const contentType = upstream.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await upstream.json()
    : await upstream.text();

  const res = NextResponse.json(payload, { status: upstream.status });

  const xPage = upstream.headers.get("x-page");
  const xSize = upstream.headers.get("x-size");
  const xHasNext = upstream.headers.get("x-has-next");

  if (xPage) res.headers.set("x-page", xPage);
  if (xSize) res.headers.set("x-size", xSize);
  if (xHasNext) res.headers.set("x-has-next", xHasNext);

  return res;
}
