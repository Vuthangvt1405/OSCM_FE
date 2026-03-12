import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(AUTH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
