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
  const res = await fetch(url, {
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
