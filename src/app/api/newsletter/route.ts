import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/newsletterMailer";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Best-effort: notify admin of new subscriber.
  try {
    await sendEmail(parsed.data.email);
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}
