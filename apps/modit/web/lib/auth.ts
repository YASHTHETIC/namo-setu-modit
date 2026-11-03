const TOKEN_KEY = "modit_access_token";

export function getAccessToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(TOKEN_KEY) ?? undefined;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  try {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("modit:auth-change", { detail: { token } }));
  } catch {
    /* ignore */
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  try {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("modit:auth-change", { detail: { token: null } }));
  } catch {
    /* ignore */
  }
}
