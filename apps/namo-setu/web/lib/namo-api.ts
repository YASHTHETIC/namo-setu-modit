"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiClient, createNamoApi } from "@foundation/api-client";

import { getAccessToken } from "./auth";
import { env } from "./env";

function getNamoApi() {
  return createNamoApi(
    createApiClient({
      baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
      accessToken: getAccessToken(),
    })
  );
}

export const namoKeys = {
  all: ["namo"] as const,
  temples: (params?: Record<string, unknown>) => ["namo", "temples", params] as const,
  temple: (id: string) => ["namo", "temple", id] as const,
  search: (params?: Record<string, unknown>) => ["namo", "search", params] as const,
  popular: () => ["namo", "popular"] as const,
  nearby: (coords: { latitude: number; longitude: number }) => ["namo", "nearby", coords] as const,
  darshanSlots: (templeId: string) => ["namo", "darshan-slots", templeId] as const,
  darshanBookings: () => ["namo", "darshan-bookings"] as const,
  donations: () => ["namo", "donations"] as const,
  pujaPackages: (templeId: string) => ["namo", "puja", templeId] as const,
  accommodation: (templeId?: string) => ["namo", "accommodation", templeId] as const,
  rooms: (hotelId?: string) => ["namo", "rooms", hotelId] as const,
  travelPackages: (templeId?: string) => ["namo", "travel-packages", templeId] as const,
  guides: (cityId?: string) => ["namo", "guides", cityId] as const,
  transport: (templeId?: string) => ["namo", "transport", templeId] as const,
  analytics: () => ["namo", "analytics"] as const,
  festivalReminders: (payload?: Record<string, unknown>) => ["namo", "festival-reminders", payload] as const,
  adminUsers: () => ["namo", "admin-users"] as const,
  sessions: () => ["namo", "sessions"] as const,
  notifications: (params?: Record<string, unknown>) => ["namo", "notifications", params] as const,
  notificationsUnread: () => ["namo", "notifications", "unread"] as const,
};

export function useTemples(params?: { search?: string; category?: string; page?: number }) {
  return useQuery({
    queryKey: namoKeys.temples(params),
    queryFn: () => getNamoApi().listTemples(params),
  });
}

export function useTempleSearch(params?: { q?: string; category?: string }) {
  return useQuery({
    queryKey: namoKeys.search(params),
    queryFn: () => getNamoApi().searchTemples(params),
  });
}

export function usePopularTemples() {
  return useQuery({
    queryKey: namoKeys.popular(),
    queryFn: () => getNamoApi().popularTemples(),
  });
}

export function useTemple(templeId: string | undefined) {
  return useQuery({
    queryKey: namoKeys.temple(templeId ?? ""),
    queryFn: () => getNamoApi().getTemple(templeId!),
    enabled: Boolean(templeId),
  });
}

export function useNearbyTemples(latitude: number, longitude: number, enabled = false) {
  return useQuery({
    queryKey: namoKeys.nearby({ latitude, longitude }),
    queryFn: () => getNamoApi().nearbyTemples({ latitude, longitude, radius_km: 50 }),
    enabled: enabled && Boolean(latitude && longitude),
  });
}

export function useDarshanSlots(templeId: string | undefined) {
  return useQuery({
    queryKey: namoKeys.darshanSlots(templeId ?? ""),
    queryFn: () => getNamoApi().listDarshanSlots(templeId!),
    enabled: Boolean(templeId),
  });
}

export function useMyDarshanBookings() {
  return useQuery({
    queryKey: namoKeys.darshanBookings(),
    queryFn: () => getNamoApi().myDarshanBookings(),
  });
}

export function useBookDarshan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getNamoApi().bookDarshan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: namoKeys.darshanBookings() });
    },
  });
}

export function useCancelDarshanBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      getNamoApi().cancelDarshanBooking(bookingId, reason),
    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: namoKeys.darshanBookings() });
      const previous = queryClient.getQueryData<Awaited<ReturnType<ReturnType<typeof getNamoApi>["myDarshanBookings"]>>>(
        namoKeys.darshanBookings()
      );
      if (previous) {
        queryClient.setQueryData(
          namoKeys.darshanBookings(),
          previous.map((b) => (b.id === bookingId ? { ...b, booking_status: "cancelled" } : b))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(namoKeys.darshanBookings(), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: namoKeys.darshanBookings() }),
  });
}

export function useMyDonations() {
  return useQuery({
    queryKey: namoKeys.donations(),
    queryFn: () => getNamoApi().myDonations(),
  });
}

export function useDonate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getNamoApi().donate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: namoKeys.donations() }),
  });
}

export function usePujaPackages(templeId: string | undefined) {
  return useQuery({
    queryKey: namoKeys.pujaPackages(templeId ?? ""),
    queryFn: () => getNamoApi().listPujaPackages(templeId!),
    enabled: Boolean(templeId),
  });
}

export function useAccommodation(templeId?: string) {
  return useQuery({
    queryKey: namoKeys.accommodation(templeId),
    queryFn: () => getNamoApi().listAccommodation(templeId),
  });
}

export function useRooms(hotelId?: string) {
  return useQuery({
    queryKey: namoKeys.rooms(hotelId),
    queryFn: () => getNamoApi().listRooms(hotelId),
  });
}

export function useTravelPackages(templeId?: string) {
  return useQuery({
    queryKey: namoKeys.travelPackages(templeId),
    queryFn: () => getNamoApi().listTravelPackages(templeId),
  });
}

export function useGuides(cityId?: string) {
  return useQuery({
    queryKey: namoKeys.guides(cityId),
    queryFn: () => getNamoApi().listGuides(cityId),
  });
}

export function useTransport(templeId?: string) {
  return useQuery({
    queryKey: namoKeys.transport(templeId),
    queryFn: () => getNamoApi().listTransport(templeId),
  });
}

export function useTripPlanner() {
  return useMutation({
    mutationFn: getNamoApi().planTrip,
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: namoKeys.analytics(),
    queryFn: () => getNamoApi().analyticsSummary(),
  });
}

export function useFestivalReminders(payload?: { temple_id?: string; days_ahead?: number }) {
  return useQuery({
    queryKey: namoKeys.festivalReminders(payload),
    queryFn: () => getNamoApi().festivalReminders(payload),
  });
}

export function useAiAssistant(mode: "recommendation" | "spiritual" | "voice" | "faq" | "nearby") {
  const api = getNamoApi();
  const handlers = {
    recommendation: api.aiRecommendations,
    spiritual: api.spiritualGuide,
    voice: (message: string, templeId?: string) => api.voiceAssistant(message, message, templeId),
    faq: api.faqAssistant,
    nearby: api.nearbyAi,
  };
  return useMutation({
    mutationFn: ({ message, templeId }: { message: string; templeId?: string }) =>
      handlers[mode](message, templeId),
  });
}

export function useCreateTemple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getNamoApi().createTemple,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: namoKeys.all }),
  });
}

export function useUpdateTemple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      getNamoApi().updateTemple(id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: namoKeys.temple(vars.id) });
      queryClient.invalidateQueries({ queryKey: namoKeys.all });
    },
  });
}

export function useDeleteTemple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getNamoApi().deleteTemple(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: namoKeys.all });
      const queries = queryClient.getQueriesData<{ items: Array<{ id: string }> }>({ queryKey: ["namo", "temples"] });
      queries.forEach(([key, data]) => {
        if (data?.items) {
          queryClient.setQueryData(key, { ...data, items: data.items.filter((t) => t.id !== id) });
        }
      });
      return { queries };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: namoKeys.all }),
  });
}

export function useCreateFestival() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templeId, payload }: { templeId: string; payload: Record<string, unknown> }) =>
      getNamoApi().createFestival(templeId, payload),
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: namoKeys.temple(vars.templeId) }),
  });
}

export function useCreatePuja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getNamoApi().createPuja,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: namoKeys.all }),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: namoKeys.adminUsers(),
    queryFn: () => getNamoApi().adminUsers(),
  });
}

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      getNamoApi().login(email, password),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: getNamoApi().register,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => getNamoApi().forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: getNamoApi().resetPassword,
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => getNamoApi().verifyEmail(token),
  });
}

// Session hooks
export function useSessions() {
  return useQuery({
    queryKey: namoKeys.sessions(),
    queryFn: () => getNamoApi().listSessions(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => getNamoApi().revokeSession(sessionId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: namoKeys.sessions() }),
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getNamoApi().revokeAllOtherSessions(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: namoKeys.sessions() }),
  });
}

// Notification hooks
export function useNotifications(params?: { page?: number; page_size?: number; channel?: string; unread_only?: boolean }) {
  return useQuery({
    queryKey: namoKeys.notifications(params),
    queryFn: () => getNamoApi().listNotifications(params),
  });
}

export function useNotificationsUnread() {
  return useQuery({
    queryKey: namoKeys.notificationsUnread(),
    queryFn: () => getNamoApi().listNotifications({ unread_only: true, page_size: 1 }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => getNamoApi().markNotificationRead(notificationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: namoKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: namoKeys.notificationsUnread() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getNamoApi().markAllNotificationsRead(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: namoKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: namoKeys.notificationsUnread() });
    },
  });
}

// Security hooks
export function useChangePassword() {
  return useMutation({
    mutationFn: getNamoApi().changePassword,
  });
}

export function useEnableTwoFactor() {
  return useMutation({
    mutationFn: () => getNamoApi().enableTwoFactor(),
  });
}

export function useDisableTwoFactor() {
  return useMutation({
    mutationFn: (code: string) => getNamoApi().disableTwoFactor(code),
  });
}

export { getNamoApi };
