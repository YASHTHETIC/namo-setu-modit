import { NextResponse } from "next/server";
import { broadcastPush, isPushConfigured, subscriptionCount } from "@/lib/push-server";

// Simple abuse guard for the demo endpoint (per-instance).
let lastSendAt = 0;
const MIN_GAP_MS = 5_000;

export async function POST(req: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured on server" }, { status: 503 });
  }
  const now = Date.now();
  if (now - lastSendAt < MIN_GAP_MS) {
    return NextResponse.json({ error: "Too many requests — wait a few seconds" }, { status: 429 });
  }
  lastSendAt = now;

  try {
    const body = await req.json();
    const title = String(body?.title ?? "").slice(0, 80);
    const message = String(body?.body ?? "").slice(0, 200);
    const url = String(body?.url ?? "/").slice(0, 200);
    if (!title || !message) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }
    if (!url.startsWith("/")) {
      return NextResponse.json({ error: "url must be a site path" }, { status: 400 });
    }
    const result = await broadcastPush({ title, body: message, url });
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ configured: isPushConfigured(), subscribers: subscriptionCount() });
}
