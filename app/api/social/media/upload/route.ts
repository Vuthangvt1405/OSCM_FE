import { getBackendBaseUrl } from "@/lib/server/backend";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const backendBaseUrl = getBackendBaseUrl();
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const res = await fetch(`${backendBaseUrl}/api/social/media/upload`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body: backendFormData,
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Backend upload failed:", res.status, payload);
      return NextResponse.json(payload, { status: res.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
