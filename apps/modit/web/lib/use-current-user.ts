"use client";

import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";

import { getAccessToken } from "./auth";
import { env } from "./env";

export const STAFF_ROLE_NAMES = ["super_admin", "admin", "support", "manager"] as const;
export const SUPPLIER_ROLE_NAME = "supplier";

interface MeRole {
  name?: string;
}

interface MeResponse {
  id?: string;
  email?: string;
  full_name?: string | null;
  roles?: MeRole[];
}

/** Logged-in user + role flags. Disabled without a token (public pages). */
export function useCurrentUser() {
  const token = typeof window !== "undefined" ? getAccessToken() : null;
  const query = useQuery({
    queryKey: ["modit", "me"],
    queryFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      return client.request<MeResponse>("/auth/me");
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
    gcTime: 120_000,
  });
  const roles = (query.data?.roles ?? [])
    .map((r) => r?.name)
    .filter((n): n is string => typeof n === "string");
  return {
    ...query,
    loggedIn: Boolean(token),
    roles,
    isStaff: roles.some((r) => (STAFF_ROLE_NAMES as readonly string[]).includes(r)),
    isSupplier: roles.includes(SUPPLIER_ROLE_NAME),
  };
}
