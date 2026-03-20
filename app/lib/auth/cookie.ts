export function shouldUseSecureCookies(req: Request): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    const firstProto = forwardedProto.split(",")[0]?.trim().toLowerCase();
    return firstProto === "https";
  }

  return new URL(req.url).protocol === "https:";
}
