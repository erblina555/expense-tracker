import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type AlertRequest = {
  message?: string;
  subject?: string;
};

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ALERT_FROM_EMAIL ?? "alerts@example.com";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
  }

  const body = (await request.json()) as AlertRequest;
  const subject = body.subject ?? "Budget alert";
  const message = body.message ?? "Your monthly budget needs attention.";

  if (!resendApiKey) {
    return NextResponse.json({
      delivered: false,
      reason: "RESEND_API_KEY is not configured.",
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: fromEmail,
      html: `<p>${message}</p>`,
      subject,
      to: data.user.email,
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Email provider failed to send the alert." },
      { status: 502 },
    );
  }

  return NextResponse.json({ delivered: true });
}
