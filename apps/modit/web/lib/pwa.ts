"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** PWA install prompt state (beforeinstallprompt). */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
      return true;
    }
    return false;
  }, [deferred]);

  return { canInstall: Boolean(deferred) && !installed, installed, install };
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationsGranted(): boolean {
  return notificationsSupported() && Notification.permission === "granted";
}

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

/**
 * Register this browser for true server push (works even with the app closed).
 * Fetches the VAPID public key from our own API, subscribes via the service
 * worker, and stores the subscription server-side.
 */
export async function subscribeForServerPush(): Promise<{ ok: boolean; reason?: string }> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { ok: false, reason: "Push not supported on this browser" };
    }
    const keyRes = await fetch("/api/push/vapid-key");
    if (!keyRes.ok) return { ok: false, reason: "Push not configured on server" };
    const { publicKey } = await keyRes.json();
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    if (!res.ok) return { ok: false, reason: "Could not save subscription" };
    try {
      localStorage.setItem("modit_push_subscribed", "1");
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Subscription failed" };
  }
}

/** Fire-and-forget broadcast to all push subscribers via our API. */
export function broadcastPush(title: string, body: string, url = "/"): void {
  try {
    void fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, url }),
    });
  } catch {
    /* offline — ignore */
  }
}

/**
 * Show an OS-level notification for an order event.
 * Prefers the service worker registration (works when the tab is backgrounded);
 * falls back to the page Notification API.
 */
export async function showSystemNotification(title: string, body: string, url = "/") {
  if (!notificationsGranted()) return;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url },
      } as NotificationOptions);
      return;
    }
  } catch {
    /* fall through to page notification */
  }
  try {
    new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {
    /* ignore */
  }
}
