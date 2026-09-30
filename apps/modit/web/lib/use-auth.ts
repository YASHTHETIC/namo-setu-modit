"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken } from "./auth";

/** Reactive login state (token in localStorage + cross-tab sync). */
export function useAuthReady(): boolean {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(getAccessToken());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "modit_access_token") setToken(e.newValue ?? undefined);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  void ready;
  return Boolean(token);
}

/**
 * Guard for buyer actions: if logged out, sends to /auth?next=<current page>
 * and returns false. Returns true when the action may proceed.
 */
export function useRequireLogin() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(() => {
    if (getAccessToken()) return true;
    const next = pathname && pathname !== "/auth" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.push(`/auth${next}`);
    return false;
  }, [router, pathname]);
}
