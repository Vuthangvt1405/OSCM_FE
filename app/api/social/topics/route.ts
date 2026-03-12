import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const backendBaseUrl = getBackendBaseUrl();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log(123)

    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "0";
    const size = url.searchParams.get("size") || "20";
    const search = url.searchParams.get("q");

    let backendUrl = `${backendBaseUrl}/social/topics?page=${page}&size=${size}`;

    if (search) {
      backendUrl = `${backendBaseUrl}/social/topics/search?query=${encodeURIComponent(search)}&page=${page}&size=${size}`;
    }

    const upstream = await fetch(backendUrl, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    });

    console.log(123);

    const contentType = upstream.headers.get("content-type") ?? "";
    let payload: unknown;
    try {
      payload = contentType.includes("application/json")
        ? await upstream.json()
        : await upstream.text();
    } catch {
      const text = await upstream.text();
      payload = "Unexpected response format: " + text;
    }

    if (!upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
