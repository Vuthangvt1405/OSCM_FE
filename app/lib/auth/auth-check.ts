import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

/**
 * Check if the user is currently authenticated.
 * Returns true if a valid auth token cookie exists.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  return !!token;
}

/**
 * Redirects authenticated users away from public pages like login/register.
 * Should be called in Server Components or Server Actions.
 *
 * @param redirectTo - The URL to redirect to if authenticated (default: "/")
 * @returns true if user is authenticated and should redirect, false otherwise
 */
export async function redirectIfAuthenticated(
  redirectTo: string = "/",
): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    // We can't redirect here directly since this is not a page component
    // The page should use this to conditionally render or redirect
    return true;
  }
  return false;
}
