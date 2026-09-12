import { NextRequest, NextResponse } from "next/server";
import { CONTACT_EMAIL } from "@shared/constants";
import {
  hasSentToday,
  rememberSuccessfulSend,
} from "@features/contact/lib/contact-limit.server";

const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

export async function POST(request: NextRequest) {
  if (hasSentToday(request.headers)) {
    return NextResponse.json(
      { ok: false, error: "already_sent" },
      { status: 429 },
    );
  }

  const body = (await request.json()) as {
    name?: string;
    contact?: string;
    message?: string;
  };

  const name = body.name?.trim() ?? "";
  const contact = body.contact?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !contact || !message) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return NextResponse.json(
      { ok: false, error: "Email service is not configured" },
      { status: 500 },
    );
  }

  const response = await fetch(EMAILJS_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        from_name: name,
        from_contact: contact,
        from_email: contact,
        message,
        to_email: CONTACT_EMAIL,
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, error: "send_failed" },
      { status: 502 },
    );
  }

  const headers = new Headers();
  headers.set("Set-Cookie", rememberSuccessfulSend(request.headers));
  return NextResponse.json({ ok: true }, { headers });
}
