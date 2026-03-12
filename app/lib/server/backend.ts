export function getBackendBaseUrl(): string {
  const raw =
    process.env.ODYSSEUS_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080";

  return raw.replace(/\/$/, "");
}
