"use client";

import { useCallback, useEffect, useState } from "react";

import { getAccessToken } from "./auth.ts";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __moditInstallPrompt?: BeforeInstallPromptEvent | null;
    __modit_is_standalone?: boolean;
    __modit_app_installed?: boolean;
  }
}

export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.__modit_app_installed || window.__modit_is_standalone) return true;
    if (window.localStorage && (
      window.localStorage.getItem("modit_app_installed") === "true" ||
      window.localStorage.getItem("modit_is_standalone") === "true"
    )) return true;
    if (window.sessionStorage && (
      window.sessionStorage.getItem("modit_app_installed") === "true" ||
      window.sessionStorage.getItem("modit_is_standalone") === "true"
    )) return true;
    if (typeof document !== "undefined" && document.cookie && (
      document.cookie.includes("modit_app_installed=true") ||
      document.cookie.includes("modit_is_standalone=true")
    )) return true;
    if (
      typeof document !== "undefined" &&
      document.documentElement &&
      (document.documentElement.classList.contains("is-installed") ||
        document.documentElement.classList.contains("is-standalone") ||
        document.documentElement.classList.contains("is-app") ||
        document.documentElement.getAttribute("data-app-installed") === "true" ||
        document.documentElement.getAttribute("data-is-app") === "true")
    ) {
      return true;
    }
  } catch {}
  return false;
}

export function markAppInstalled(): void {
  if (typeof window === "undefined") return;
  window.__modit_is_standalone = true;
  window.__modit_app_installed = true;
  window.__moditInstallPrompt = null;
  try {
    if (window.localStorage) {
      window.localStorage.setItem("modit_app_installed", "true");
      window.localStorage.setItem("modit_is_standalone", "true");
    }
    if (window.sessionStorage) {
      window.sessionStorage.setItem("modit_is_standalone", "true");
      window.sessionStorage.setItem("modit_app_installed", "true");
    }
    if (typeof document !== "undefined") {
      document.cookie = "modit_app_installed=true; path=/; max-age=31536000; SameSite=Lax";
      document.cookie = "modit_is_standalone=true; path=/; max-age=31536000; SameSite=Lax";
      if (document.documentElement) {
        document.documentElement.classList.add("is-standalone", "is-app", "is-installed");
        document.documentElement.setAttribute("data-is-app", "true");
        document.documentElement.setAttribute("data-app-installed", "true");
      }
    }
    window.dispatchEvent(new CustomEvent("modit:pwa-installed"));
  } catch {}
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.__modit_is_standalone || window.__modit_app_installed) return true;
    if (isAppInstalled()) {
      window.__modit_is_standalone = true;
      return true;
    }
    if (window.sessionStorage && window.sessionStorage.getItem("modit_is_standalone") === "true") {
      window.__modit_is_standalone = true;
      return true;
    }
    if (
      typeof document !== "undefined" &&
      document.documentElement &&
      (document.documentElement.classList.contains("is-standalone") ||
        document.documentElement.classList.contains("is-app") ||
        document.documentElement.getAttribute("data-is-app") === "true")
    ) {
      window.__modit_is_standalone = true;
      return true;
    }

    const nav = window.navigator as unknown as { standalone?: boolean; userAgent?: string };
    const ua = nav.userAgent || "";
    const isStand =
      Boolean(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      Boolean(window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) ||
      Boolean(window.matchMedia && window.matchMedia("(display-mode: minimal-ui)").matches) ||
      Boolean(window.matchMedia && window.matchMedia("(display-mode: window-controls-overlay)").matches) ||
      nav.standalone === true ||
      (typeof document !== "undefined" &&
        Boolean(
          document.referrer &&
            (document.referrer.includes("android-app://") || document.referrer.includes("in.modit.app"))
        )) ||
      window.location.search.includes("source=pwa") ||
      window.location.search.includes("utm_source=pwa") ||
      window.location.search.includes("utm_source=playstore") ||
      window.location.search.includes("pwa=1") ||
      window.location.search.includes("twa=1") ||
      window.location.search.includes("source=twa") ||
      window.location.search.includes("app=1") ||
      window.location.search.includes("package=in.modit.app") ||
      window.location.search.includes("standalone=1") ||
      /;\s*wv\b/i.test(ua) ||
      (/Android/i.test(ua) && /Version\/[\d.]+/i.test(ua) && /Chrome\/[\d.]+/i.test(ua)) ||
      /in\.modit\.app|MODIT-APP|Bubblewrap/i.test(ua);

    if (isStand) {
      window.__modit_is_standalone = true;
      try {
        window.sessionStorage.setItem("modit_is_standalone", "true");
        if (typeof document !== "undefined" && document.documentElement) {
          document.documentElement.classList.add("is-standalone", "is-app");
          document.documentElement.setAttribute("data-is-app", "true");
        }
      } catch {}
      return true;
    }
  } catch {}
  return false;
}

export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState(() => isStandalone());
  useEffect(() => {
    setStandalone(isStandalone());
    const onInstalled = () => setStandalone(true);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("modit:pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("modit:pwa-installed", onInstalled);
    };
  }, []);
  return standalone;
}

export function useIsAppInstalled(): boolean {
  const [installed, setInstalled] = useState(() => isAppInstalled());
  useEffect(() => {
    setInstalled(isAppInstalled());
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("modit:pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("modit:pwa-installed", onInstalled);
    };
  }, []);
  return installed;
}

/** PWA install prompt state (beforeinstallprompt). */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== "undefined" && window.__moditInstallPrompt) {
      return window.__moditInstallPrompt;
    }
    return null;
  });
  const [installed, setInstalled] = useState(() => isStandalone() || isAppInstalled());

  useEffect(() => {
    const isApp = isStandalone() || isAppInstalled();
    let hasInstalledFlag = false;
    try {
      hasInstalledFlag = localStorage.getItem("modit_app_installed") === "true" ||
        localStorage.getItem("modit_is_standalone") === "true";
    } catch {}

    setInstalled(isApp || hasInstalledFlag);

    // Hydrate cached prompt from window if early head script caught it
    if (window.__moditInstallPrompt && !deferred) {
      setDeferred(window.__moditInstallPrompt);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      const p = e as BeforeInstallPromptEvent;
      window.__moditInstallPrompt = p;
      setDeferred(p);
    };

    const onPromptReady = () => {
      if (window.__moditInstallPrompt) {
        setDeferred(window.__moditInstallPrompt);
      }
    };

    const onInstalled = () => {
      markAppInstalled();
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("modit:pwa-prompt-ready", onPromptReady);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("modit:pwa-installed", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("modit:pwa-prompt-ready", onPromptReady);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("modit:pwa-installed", onInstalled);
    };
  }, [deferred]);

  const install = useCallback(async () => {
    const promptEvent = deferred || (typeof window !== "undefined" ? window.__moditInstallPrompt : null);
    if (!promptEvent) return false;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === "accepted") {
        markAppInstalled();
        setInstalled(true);
        setDeferred(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("PWA install error:", err);
      return false;
    }
  }, [deferred]);

  return {
    canInstall: Boolean(deferred || (typeof window !== "undefined" && window.__moditInstallPrompt)) && !installed,
    installed,
    install,
  };
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

/** Fire-and-forget broadcast to all push subscribers via our API. Staff-only endpoint. */
export function broadcastPush(title: string, body: string, url = "/"): void {
  try {
    void fetch("/api/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken() ?? ""}`,
      },
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
