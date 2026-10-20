import { NextResponse } from "next/server";
import { broadcastPush, isPushConfigured, subscriptionCount } from "@/lib/push-server";
import { env } from "@/lib/env";

// Simple abuse guard (per-instance).
let lastSendAt = 0;
const MIN_GAP_MS = 5_000;

// This endpoint reviews every push subscriber's device. Only staff may hit
// it — verified against the backend, the same source of truth as the
// admin-panel gate (a client-side gate alone is not protection).
async function staffGate(req: Request): Promise<NextResponse | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Staff login required" }, { status: 401 });
  }
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/staff-status`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Staff check failed" }, { status: 403 });
    }
    const data = (await res.json()) as { is_staff?: boolean };
    if (!data.is_staff) {
      return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: "Could not verify staff access" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured on server" }, { status: 503 });
  }
  const denied = await staffGate(req);
  if (denied) return denied;
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

export async function GET(req: Request) {
  const denied = await staffGate(req);
  if (denied) return denied;
  return NextResponse.json({ configured: isPushConfigured(), subscribers: subscriptionCount() });
}
