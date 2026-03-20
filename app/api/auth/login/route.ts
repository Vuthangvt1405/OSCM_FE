import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { shouldUseSecureCookies } from "@/lib/auth/cookie";
import { getBackendBaseUrl } from "@/lib/server/backend";
import { NextResponse } from "next/server";

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
};

export async function POST(req: Request) {
  const backendBaseUrl = getBackendBaseUrl();
  const secureCookie = shouldUseSecureCookies(req);

  let body: LoginRequest;
  try {
    body = (await req.json()) as LoginRequest;
  } catch {
    return NextResponse.json(
      { status: 400, message: "Malformed JSON request" },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${backendBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = upstream.headers.get("content-type") ?? "";

  const payload = contentType.includes("application/json")
    ? await upstream.json()
    : await upstream.text();

  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const data = payload as LoginResponse;
  if (!data?.token) {
    return NextResponse.json(
      { status: 502, message: "Login succeeded but token is missing" },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(AUTH_TOKEN_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}
