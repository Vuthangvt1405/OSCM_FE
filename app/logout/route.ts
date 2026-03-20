import { NextResponse } from "next/server";

/**
 * Safety route for legacy `/logout` navigation.
 *
 * Do not mutate auth state on GET.
 * Real logout must happen via POST `/api/auth/logout`.
 */
export async function GET(request: Request) {
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}
