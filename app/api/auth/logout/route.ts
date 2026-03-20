import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { shouldUseSecureCookies } from "@/lib/auth/cookie";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secureCookie = shouldUseSecureCookies(req);
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(AUTH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
