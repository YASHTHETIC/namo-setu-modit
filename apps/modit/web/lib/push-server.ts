import webpush from "web-push";

let configured = false;

function ensureConfig() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@modit.in";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: number;
  userAgent?: string;
}

// NOTE: serverless-safe for demo traffic. For production scale, move this to
// Vercel KV / Postgres — function instances don't share memory.
const store: StoredSubscription[] = [];

export function isPushConfigured(): boolean {
  return ensureConfig();
}

export function addSubscription(sub: Omit<StoredSubscription, "createdAt">): { added: boolean; count: number } {
  const exists = store.some((s) => s.endpoint === sub.endpoint);
  if (!exists) {
    store.push({ ...sub, createdAt: Date.now() });
  }
  return { added: !exists, count: store.length };
}

export function removeSubscription(endpoint: string): void {
  const idx = store.findIndex((s) => s.endpoint === endpoint);
  if (idx >= 0) store.splice(idx, 1);
}

export function subscriptionCount(): number {
  return store.length;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function broadcastPush(payload: PushPayload): Promise<{ sent: number; failed: number; total: number }> {
  if (!ensureConfig()) {
    return { sent: 0, failed: 0, total: store.length };
  }
  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/icons/icon-192.png",
  });
  let sent = 0;
  let failed = 0;
  const dead: string[] = [];
  await Promise.all(
    store.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys } as webpush.PushSubscription,
          data
        );
        sent += 1;
      } catch (err: unknown) {
        failed += 1;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) dead.push(sub.endpoint);
      }
    })
  );
  dead.forEach(removeSubscription);
  return { sent, failed, total: store.length };
}
