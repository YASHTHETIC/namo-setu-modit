// ── Server-Driven UI Types ──────────────────────────────────────────
// These types mirror the backend Pydantic models in backend/app/schemas/layout.py
// The component registry maps SectionType strings to React widget components.

// ── Section Types ───────────────────────────────────────────────────

export type SectionType =
  | "DeliveryBar"
  | "DispatchBanner"
  | "PromoBanner"
  | "AssuredStrip"
  | "CategoryGrid"
  | "FeatureBar"
  | "ProductCarousel"
  | "ProductGrid";

// Known section types for registry typing — but Section.type is string
// so the renderer can handle unknown/forward types gracefully.

// ── Action Model ────────────────────────────────────────────────────

export interface WidgetAction {
  type: "navigate" | "deeplink" | "external_url";
  target?: string;
  params?: Record<string, string>;
}

// ── Section Data Models ─────────────────────────────────────────────

export interface DeliveryBarData {
  eta_minutes: number;
  pincode: string;
  city: string;
  is_serviceable: boolean;
}

export interface DispatchBannerData {
  dispatch_time: string;
  dispatch_date: string;
  icon_url?: string;
}

export interface PromoBannerData {
  title: string;
  subtitle?: string;
  badge_text?: string;
  badge_color: string;
  image_url?: string;
  bg_gradient: string;
  action?: WidgetAction;
  valid_till?: string;
}

export interface AssuredFeature {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface AssuredStripData {
  title: string;
  features: AssuredFeature[];
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
  action?: WidgetAction;
}

export interface CategoryGridData {
  categories: CategoryItem[];
  columns: number;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface FeatureBarData {
  features: FeatureItem[];
  bg_gradient: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  discount: number;
  rating: number;
  review_count: number;
  image_url: string;
  badge?: string;
  delivery_text: string;
  action?: WidgetAction;
}

export interface ProductCarouselData {
  title: string;
  products: ProductSummary[];
  see_all_action?: WidgetAction;
}

export interface ProductGridData {
  title?: string;
  products: ProductSummary[];
  columns: number;
}

// ── Section Wrapper ─────────────────────────────────────────────────

export interface Section {
  type: string;
  id: string;
  data: Record<string, unknown>;
  order: number;
  visible: boolean;
}

// ── Layout Response ─────────────────────────────────────────────────

export interface LayoutMeta {
  pincode: string;
  city: string;
  eta: string;
  store_id?: string;
  is_serviceable: boolean;
  user_segment: string;
}

export interface LayoutResponse {
  version: string;
  screen: string;
  meta: LayoutMeta;
  sections: Section[];
}

// ── Helper to cast section data ──────────────────────────────────────

export function castSectionData<T>(data: Record<string, unknown>): T {
  return data as T;
}
