import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const backendBaseUrl = getBackendBaseUrl();
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { status: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${backendBaseUrl}/social/me`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "";

  const payload = contentType.includes("application/json")
    ? await upstream.json()
    : await upstream.text();

  if (!upstream.ok) {
    const res = NextResponse.json(payload, { status: upstream.status });

    if (upstream.status === 401 || upstream.status === 403) {
      res.cookies.set(AUTH_TOKEN_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
    return res;
  }

  return NextResponse.json(payload, { status: 200 });
}
