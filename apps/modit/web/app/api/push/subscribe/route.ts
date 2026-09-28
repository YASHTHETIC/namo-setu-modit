import { NextResponse } from "next/server";
import { addSubscription, subscriptionCount } from "@/lib/push-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { endpoint, keys } = body ?? {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const { added, count } = addSubscription({ endpoint, keys, userAgent });
    return NextResponse.json({ ok: true, added, count, total: subscriptionCount() });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
