import type { ComponentType } from "react";
import { DeliveryBarWidget } from "@/widgets/delivery-bar";
import { DispatchBannerWidget } from "@/widgets/dispatch-banner";
import { PromoBannerWidget } from "@/widgets/promo-banner";
import { AssuredStripWidget } from "@/widgets/assured-strip";
import { CategoryGridWidget } from "@/widgets/category-grid";
import { FeatureBarWidget } from "@/widgets/feature-bar";
import { ProductCarouselWidget } from "@/widgets/product-carousel";
import { ProductGridWidget } from "@/widgets/product-grid";

// ── Component Registry ──────────────────────────────────────────────
// Maps section type strings (from backend JSON) to React components.
// Adding a new section type = add one entry here + create the widget.

export const WIDGET_REGISTRY: Record<string, ComponentType<{ data: Record<string, unknown> }>> = {
  DeliveryBar: DeliveryBarWidget,
  DispatchBanner: DispatchBannerWidget,
  PromoBanner: PromoBannerWidget,
  AssuredStrip: AssuredStripWidget,
  CategoryGrid: CategoryGridWidget,
  FeatureBar: FeatureBarWidget,
  ProductCarousel: ProductCarouselWidget,
  ProductGrid: ProductGridWidget,
};
