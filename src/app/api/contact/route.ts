import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    name?: string;
    contact?: string;
    message?: string;
  };

  if (!body.name?.trim() || !body.contact?.trim() || !body.message?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
