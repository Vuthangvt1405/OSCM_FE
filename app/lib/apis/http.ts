/**
 * Get the base URL for API requests.
 * In server-side contexts (Server Components), relative URLs need a base URL.
 * In client-side contexts, the browser handles this automatically.
 */
function getBaseUrl(): string {
  // Check if we're in a server-side context
  if (typeof window !== "undefined") {
    // Client-side: use relative URL (browser handles it)
    return "";
  }

  // Server-side: use environment variable or default to localhost
  // NEXT_PUBLIC_VERCEL_URL is set by Vercel in production
  // VERCEL_URL is also available in serverless functions
  return process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
}

/**
 * Resolve a URL to an absolute URL if it's relative.
 */
function resolveUrl(url: string): string {
  // If already absolute, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If relative, prepend base URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}${url}`;
}

type ErrorShape = {
  message?: string;
  status?: number;
  timestamp?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") return payload || fallback;
  if (isRecord(payload) && typeof payload.message === "string")
    return payload.message || fallback;
  return fallback;
}

export async function postJson<TResponse, TBody>(
  url: string,
  body: TBody,
  init?: Omit<RequestInit, "method" | "body">,
): Promise<TResponse> {
  const resolvedUrl = resolveUrl(url);
  const res = await fetch(resolvedUrl, {
    ...init,
    method: "POST",
    redirect: "error",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload as ErrorShape, fallback));
  }

  return payload as TResponse;
}

export async function getJson<TResponse>(
  url: string,
  init?: Omit<RequestInit, "method">,
): Promise<TResponse> {
  const resolvedUrl = resolveUrl(url);
  const res = await fetch(resolvedUrl, {
    ...init,
    method: "GET",
    redirect: "error",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload as ErrorShape, fallback));
  }

  return payload as TResponse;
}
