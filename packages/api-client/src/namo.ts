import type { ApiClient } from "./index";

export interface TempleRead {
  id: string;
  city_id: string;
  state_id: string;
  country_id: string;
  name: string;
  slug: string;
  temple_type: string;
  deity_name: string | null;
  address_line1: string;
  address_line2: string | null;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  dress_code: string | null;
  website_url: string | null;
  phone_number: string | null;
  is_active: boolean;
  rating_avg: number;
  review_count: number;
}

export interface TempleDetailRead extends TempleRead {
  images: Array<{ id: string; caption: string | null; is_primary: boolean }>;
  timings: Array<{ id: string; day_of_week: number; opens_at: string; closes_at: string; notes: string | null }>;
  festivals: FestivalRead[];
  events: Array<{ id: string; title: string; description: string | null; starts_on: string }>;
  attractions: Array<{ id: string; name: string; distance_km: number | null; description: string | null }>;
  reviews: TempleReviewRead[];
}

export interface TempleListResponse {
  items: TempleRead[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface TempleSearchResponse extends TempleListResponse {
  suggestions: string[];
}

export interface DarshanSlotRead {
  id: string;
  temple_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  available_count: number;
  slot_status: string;
}

export interface DarshanBookingRead {
  id: string;
  booking_number: string;
  temple_id: string;
  darshan_slot_id: string | null;
  booking_status: string;
  visit_date: string;
  party_size: number;
  notes: string | null;
  qr_ticket?: string;
}

export interface PujaRead {
  id: string;
  temple_id: string;
  title: string;
  description: string | null;
  base_price: number;
  status: string;
}

export interface DonationRead {
  id: string;
  temple_id: string;
  donor_name: string;
  purpose: string | null;
  amount: number;
  currency: string;
  receipt_number: string | null;
  created_at: string;
}

export interface AccommodationRead {
  id: string;
  temple_id: string | null;
  name: string;
  accommodation_type: string;
  address_line1: string;
  is_active: boolean;
}

export interface RoomRead {
  id: string;
  hotel_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  is_available: boolean;
}

export interface TravelPackageRead {
  id: string;
  temple_id: string | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
}

export interface TourGuideRead {
  id: string;
  name: string;
  rating_avg: number;
  phone_number: string | null;
}

export interface TransportationRead {
  id: string;
  provider_name: string;
  transport_type: string;
  temple_id: string | null;
}

export interface TripPlannerResponse {
  summary: string;
  days: Array<Record<string, unknown>>;
  estimated_budget: number;
  recommendations: string[];
}

export interface AIAssistantResponse {
  answer: string;
  suggested_actions: string[];
  sources: string[];
}

export interface FestivalRead {
  id: string;
  temple_id: string;
  name: string;
  description: string | null;
  starts_on: string;
  ends_on: string | null;
}

export interface FestivalReminderRead {
  festival_id: string;
  temple_id: string;
  title: string;
  starts_on: string;
  reminder_text: string;
}

export interface TempleReviewRead {
  id: string;
  rating: number;
  comment: string | null;
  user_id: string;
}

export interface AnalyticsSummary {
  temples: number;
  darshan_bookings: number;
  puja_bookings: number;
  donations: number;
  donation_amount: number;
  accommodation_bookings: number;
  travel_bookings: number;
  reviews: number;
}

export interface UserRead {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
}

export interface AuthLoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthRegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthForgotPasswordResponse {
  message: string;
}

export interface AuthResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface AuthVerifyEmailResponse {
  message: string;
}

export interface SessionRead {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  last_active: string;
  is_current: boolean;
}

export interface NotificationRead {
  id: string;
  title: string;
  body: string;
  channel: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationRead[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  unread_count: number;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export function createNamoApi(client: ApiClient) {
  const base = "/namo";

  return {
    listTemples(params?: { page?: number; page_size?: number; search?: string; category?: string }) {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.page_size) query.set("page_size", String(params.page_size));
      if (params?.search) query.set("search", params.search);
      if (params?.category) query.set("category", params.category);
      const qs = query.toString();
      return client.request<TempleListResponse>(`${base}/temples${qs ? `?${qs}` : ""}`);
    },

    getTemple(templeId: string) {
      return client.request<TempleDetailRead>(`${base}/temples/${templeId}`);
    },

    createTemple(payload: Record<string, unknown>) {
      return client.request<TempleRead>(`${base}/temples`, { method: "POST", body: JSON.stringify(payload) });
    },

    updateTemple(templeId: string, payload: Record<string, unknown>) {
      return client.request<TempleRead>(`${base}/temples/${templeId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },

    deleteTemple(templeId: string) {
      return client.request<{ message: string; data: string }>(`${base}/temples/${templeId}`, { method: "DELETE" });
    },

    searchTemples(params?: { q?: string; category?: string; page?: number; page_size?: number }) {
      const query = new URLSearchParams();
      if (params?.q) query.set("q", params.q);
      if (params?.category) query.set("category", params.category);
      if (params?.page) query.set("page", String(params.page));
      if (params?.page_size) query.set("page_size", String(params.page_size));
      const qs = query.toString();
      return client.request<TempleSearchResponse>(`${base}/search/temples${qs ? `?${qs}` : ""}`);
    },

    nearbyTemples(payload: { latitude: number; longitude: number; radius_km?: number }) {
      return client.request<TempleRead[]>(`${base}/search/nearby`, { method: "POST", body: JSON.stringify(payload) });
    },

    popularTemples(limit = 10) {
      return client.request<TempleRead[]>(`${base}/search/popular?limit=${limit}`);
    },

    listDarshanSlots(templeId: string) {
      return client.request<DarshanSlotRead[]>(`${base}/temples/${templeId}/darshan/slots`);
    },

    bookDarshan(payload: { temple_id: string; darshan_slot_id?: string; visit_date: string; party_size: number; notes?: string }) {
      return client.request<DarshanBookingRead>(`${base}/darshan/bookings`, { method: "POST", body: JSON.stringify(payload) });
    },

    myDarshanBookings() {
      return client.request<DarshanBookingRead[]>(`${base}/darshan/bookings`);
    },

    cancelDarshanBooking(bookingId: string, reason?: string) {
      return client.request<DarshanBookingRead>(`${base}/darshan/bookings/${bookingId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },

    listPujaPackages(templeId: string) {
      return client.request<PujaRead[]>(`${base}/temples/${templeId}/puja/packages`);
    },

    createPuja(payload: Record<string, unknown>) {
      return client.request<PujaRead>(`${base}/puja/packages`, { method: "POST", body: JSON.stringify(payload) });
    },

    bookPuja(payload: Record<string, unknown>) {
      return client.request(`${base}/puja/bookings`, { method: "POST", body: JSON.stringify(payload) });
    },

    myPujaBookings() {
      return client.request(`${base}/puja/bookings`);
    },

    donate(payload: { temple_id: string; donor_name: string; purpose?: string; amount: number; currency?: string; provider?: string }) {
      return client.request<DonationRead>(`${base}/donations`, { method: "POST", body: JSON.stringify(payload) });
    },

    myDonations() {
      return client.request<DonationRead[]>(`${base}/donations`);
    },

    listAccommodation(templeId?: string) {
      const qs = templeId ? `?temple_id=${templeId}` : "";
      return client.request<AccommodationRead[]>(`${base}/accommodation${qs}`);
    },

    listRooms(hotelId?: string) {
      const qs = hotelId ? `?hotel_id=${hotelId}` : "";
      return client.request<RoomRead[]>(`${base}/accommodation/rooms${qs}`);
    },

    bookAccommodation(payload: Record<string, unknown>) {
      return client.request(`${base}/accommodation/bookings`, { method: "POST", body: JSON.stringify(payload) });
    },

    listTravelPackages(templeId?: string) {
      const qs = templeId ? `?temple_id=${templeId}` : "";
      return client.request<TravelPackageRead[]>(`${base}/travel/packages${qs}`);
    },

    listGuides(cityId?: string) {
      const qs = cityId ? `?city_id=${cityId}` : "";
      return client.request<TourGuideRead[]>(`${base}/travel/guides${qs}`);
    },

    listTransport(templeId?: string) {
      const qs = templeId ? `?temple_id=${templeId}` : "";
      return client.request<TransportationRead[]>(`${base}/travel/transport${qs}`);
    },

    planTrip(payload: Record<string, unknown>) {
      return client.request<TripPlannerResponse>(`${base}/travel/planner`, { method: "POST", body: JSON.stringify(payload) });
    },

    bookTravel(payload: Record<string, unknown>) {
      return client.request(`${base}/travel/bookings`, { method: "POST", body: JSON.stringify(payload) });
    },

    aiRecommendations(message: string, templeId?: string) {
      return client.request<AIAssistantResponse>(`${base}/search/recommendations`, {
        method: "POST",
        body: JSON.stringify({ message, temple_id: templeId }),
      });
    },

    spiritualGuide(message: string, templeId?: string) {
      return client.request<AIAssistantResponse>(`${base}/ai/spiritual-guide`, {
        method: "POST",
        body: JSON.stringify({ message, temple_id: templeId }),
      });
    },

    voiceAssistant(message: string, transcript?: string, templeId?: string) {
      return client.request<AIAssistantResponse>(`${base}/ai/voice-assistant`, {
        method: "POST",
        body: JSON.stringify({ message, transcript, temple_id: templeId }),
      });
    },

    faqAssistant(message: string, templeId?: string) {
      return client.request<AIAssistantResponse>(`${base}/ai/faq`, {
        method: "POST",
        body: JSON.stringify({ message, temple_id: templeId }),
      });
    },

    nearbyAi(message: string, templeId?: string) {
      return client.request<AIAssistantResponse>(`${base}/ai/nearby`, {
        method: "POST",
        body: JSON.stringify({ message, temple_id: templeId }),
      });
    },

    festivalReminders(payload?: { temple_id?: string; state_id?: string; days_ahead?: number }) {
      return client.request<FestivalReminderRead[]>(`${base}/ai/festival-reminders`, {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      });
    },

    createFestival(templeId: string, payload: Record<string, unknown>) {
      return client.request<FestivalRead>(`${base}/temples/${templeId}/festivals`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    analyticsSummary() {
      return client.request<AnalyticsSummary>(`${base}/analytics/summary`);
    },

    adminUsers() {
      return client.request<UserRead[]>("/admin/users");
    },

    // Auth
    login(email: string, password: string) {
      return client.request<AuthLoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },

    register(payload: AuthRegisterPayload) {
      return client.request<AuthLoginResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    forgotPassword(email: string) {
      return client.request<AuthForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    resetPassword(payload: AuthResetPasswordPayload) {
      return client.request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    verifyEmail(token: string) {
      return client.request<AuthVerifyEmailResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
    },

    // Sessions
    listSessions() {
      return client.request<SessionRead[]>("/auth/sessions");
    },

    revokeSession(sessionId: string) {
      return client.request<{ message: string }>(`/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });
    },

    revokeAllOtherSessions() {
      return client.request<{ message: string }>("/auth/sessions", {
        method: "DELETE",
      });
    },

    // Notifications
    listNotifications(params?: { page?: number; page_size?: number; channel?: string; unread_only?: boolean }) {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.page_size) query.set("page_size", String(params.page_size));
      if (params?.channel) query.set("channel", params.channel);
      if (params?.unread_only) query.set("unread_only", String(params.unread_only));
      const qs = query.toString();
      return client.request<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ""}`);
    },

    markNotificationRead(notificationId: string) {
      return client.request<{ message: string }>(`/notifications/${notificationId}/read`, {
        method: "POST",
      });
    },

    markAllNotificationsRead() {
      return client.request<{ message: string }>("/notifications/read-all", {
        method: "POST",
      });
    },

    // Security
    changePassword(payload: ChangePasswordPayload) {
      return client.request<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    enableTwoFactor() {
      return client.request<TwoFactorSetupResponse>("/auth/2fa/enable", {
        method: "POST",
      });
    },

    disableTwoFactor(code: string) {
      return client.request<{ message: string }>("/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
    },
  };
}

export type NamoApi = ReturnType<typeof createNamoApi>;
