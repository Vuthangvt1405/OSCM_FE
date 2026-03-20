import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { shouldUseSecureCookies } from "@/lib/auth/cookie";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const secureCookie = shouldUseSecureCookies(request);
  const loginUrl = new URL("/login", request.url);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.set(AUTH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
