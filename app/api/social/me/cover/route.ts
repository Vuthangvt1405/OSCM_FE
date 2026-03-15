import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const backendBaseUrl = getBackendBaseUrl();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("source");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("source", file);

    const headers: HeadersInit = {
      authorization: `Bearer ${token}`,
    };

    const upstream = await fetch(`${backendBaseUrl}/api/social/me/cover`, {
      method: "POST",
      headers,
      body: backendFormData,
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
