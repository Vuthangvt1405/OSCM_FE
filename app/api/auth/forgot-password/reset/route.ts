import { getBackendBaseUrl } from "@/lib/server/backend";
import { NextResponse } from "next/server";

type RequestBody = { email: string; otp: string; newPassword: string };

export async function POST(req: Request) {
    const backendBaseUrl = getBackendBaseUrl();
    let body: RequestBody;

    try{
        body = (await req.json()) as RequestBody;
    } catch {
        return NextResponse.json(
            { status: 400, message: "Malformed JSON request" },
            { status: 400 },
        );
    }

    const res = await fetch(`${backendBaseUrl}/api/auth/forgot-password/reset`, {
        method:"POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({email: body.email ?? "", otp: body.otp ?? "", newPassword: body.newPassword ?? ""}),
    });

    if(!res.ok) {
        const payload = res.headers.get("content-type")?.includes("application/json") ? await res.json() : { message: "Request failed" };
        return NextResponse.json(payload, { status: res.status });
    }

    return NextResponse.json({ok: true}, { status: 200 });
}