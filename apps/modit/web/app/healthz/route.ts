import { NextResponse } from "next/server";

// Tiny liveness probe for the renderer (PM2 watchdog / uptime checkers).
// Intentionally dependency-free: it reports the app process is up, that's all.
export async function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
