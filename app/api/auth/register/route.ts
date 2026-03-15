import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/server/backend";

type RegisterRequest = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  const backendBaseUrl = getBackendBaseUrl();

  let body: RegisterRequest;
  try {
    body = (await req.json()) as RegisterRequest;
  } catch {
    return NextResponse.json(
      { status: 400, message: "Malformed JSON request" },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${backendBaseUrl}/api/v1/auth/register`, {
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

  return NextResponse.json(payload, { status: 200 });
}
