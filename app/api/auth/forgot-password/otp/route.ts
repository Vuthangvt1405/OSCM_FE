import { getBackendBaseUrl } from "@/lib/server/backend";
import { NextResponse } from "next/server";

type RequestBody = { email: string };

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
    

    const res = await fetch(`${backendBaseUrl}/api/auth/forgot-password/otp`, {
        method:"POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({email: body.email ?? ""}),
        
    });

    if(!res.ok) {
        const payload = res.headers.get("content-type")?.includes("application/json") ? await res.json() : {message: "Request failed"};
        return NextResponse.json(payload, { status: res.status });
    }

    return NextResponse.json({ok: true}, { status: 200 });
}