"use client";

import type { Product, ProductVariant } from "./product-data.ts";
import { getProductById, COMMON_EMULSION_SHADES } from "./product-data.ts";
import type { Sale } from "./admin-store.ts";

export interface DisplayProduct extends Product {
  onSale: boolean;
  saleName: string | null;
  salePrice: number | null;
  hidden: boolean;
}

export function saleAppliesTo(sale: Sale, product: Product): boolean {
  if (sale.scope === "all") return true;
  if (sale.scope === "category") return sale.categorySlugs.includes(product.categorySlug);
  if (sale.scope === "products") return sale.productIds.includes(product.id);
  return false;
}

/** True for any paint, enamel, emulsion, distemper, primer or coating. */
export function isPaintProduct(p: { name?: string; categorySlug?: string; category?: string }): boolean {
  const slug = (p.categorySlug ?? "").toLowerCase();
  const cat = (p.category ?? "").toLowerCase();
  const name = (p.name ?? "").toLowerCase();
  if (slug === "painting" || cat.includes("paint")) return true;
  return /\b(paint|emulsion|enamel|distemper|color|colour|varnish|royale|tractor|apex|ace|apcolite|nerolac|berger|asian\s*paints|dulux|primer|stainer)\b/i.test(name);
}

/** Generate practical pack-size and unit options for products without explicit variants. */
export function getGeneratedVariants(product: Product): ProductVariant[] | undefined {
  if (product.variants && product.variants.length > 1) {
    return product.variants;
  }

  const p = product.price;
  const m = product.mrp > p ? product.mrp : Math.round(p * 1.15);
  const d = product.discount || Math.max(5, Math.round(((m - p) / m) * 100));
  const slug = (product.categorySlug || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // 1. Paints & Coatings (1L, 4L, 10L, 20L)
  if (isPaintProduct(product)) {
    const is20L = name.includes("20l") || name.includes("20 l") || name.includes("20kg");
    const is10L = name.includes("10l") || name.includes("10 l") || name.includes("10kg");
    const is4L = name.includes("4l") || name.includes("4 l") || name.includes("4kg");

    if (is20L) {
      return [
        { id: `${product.id}-1l`, label: "1L", unit: "Can (1 L)", unitCode: "CAN", price: Math.max(120, Math.round(p * 0.07)), mrp: Math.max(150, Math.round(m * 0.07)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 1000 },
        { id: `${product.id}-4l`, label: "4L", unit: "Can (4 L)", unitCode: "CAN", price: Math.max(380, Math.round(p * 0.24)), mrp: Math.max(450, Math.round(m * 0.24)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 800 },
        { id: `${product.id}-10l`, label: "10L", unit: "Bucket (10 L)", unitCode: "CAN", price: Math.max(850, Math.round(p * 0.52)), mrp: Math.max(1050, Math.round(m * 0.52)), discount: d + 2, bulkPrice: null, bulkMinQty: null, stockLevel: 500 },
        { id: `${product.id}-20l`, label: "20L", unit: "Bucket (20 L)", unitCode: "CAN", price: p, mrp: m, discount: d + 4, bulkPrice: Math.round(p * 0.95), bulkMinQty: 3, stockLevel: 400 },
      ];
    }

    if (is10L) {
      return [
        { id: `${product.id}-1l`, label: "1L", unit: "Can (1 L)", unitCode: "CAN", price: Math.max(120, Math.round(p * 0.13)), mrp: Math.max(150, Math.round(m * 0.13)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 1000 },
        { id: `${product.id}-4l`, label: "4L", unit: "Can (4 L)", unitCode: "CAN", price: Math.max(380, Math.round(p * 0.44)), mrp: Math.max(450, Math.round(m * 0.44)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 800 },
        { id: `${product.id}-10l`, label: "10L", unit: "Bucket (10 L)", unitCode: "CAN", price: p, mrp: m, discount: d + 2, bulkPrice: Math.round(p * 0.95), bulkMinQty: 3, stockLevel: 500 },
        { id: `${product.id}-20l`, label: "20L", unit: "Bucket (20 L)", unitCode: "CAN", price: Math.round(p * 1.88), mrp: Math.round(m * 1.88), discount: d + 4, bulkPrice: Math.round(p * 1.8), bulkMinQty: 2, stockLevel: 400 },
      ];
    }

    if (is4L) {
      return [
        { id: `${product.id}-1l`, label: "1L", unit: "Can (1 L)", unitCode: "CAN", price: Math.max(120, Math.round(p * 0.28)), mrp: Math.max(150, Math.round(m * 0.28)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 1000 },
        { id: `${product.id}-4l`, label: "4L", unit: "Can (4 L)", unitCode: "CAN", price: p, mrp: m, discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 800 },
        { id: `${product.id}-10l`, label: "10L", unit: "Bucket (10 L)", unitCode: "CAN", price: Math.round(p * 2.3), mrp: Math.round(m * 2.3), discount: d + 2, bulkPrice: null, bulkMinQty: null, stockLevel: 500 },
        { id: `${product.id}-20l`, label: "20L", unit: "Bucket (20 L)", unitCode: "CAN", price: Math.round(p * 4.35), mrp: Math.round(m * 4.35), discount: d + 4, bulkPrice: Math.round(p * 4.15), bulkMinQty: 2, stockLevel: 400 },
      ];
    }

    return [
      { id: `${product.id}-1l`, label: "1L", unit: "Can (1 L)", unitCode: "CAN", price: p, mrp: m, discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 1000 },
      { id: `${product.id}-4l`, label: "4L", unit: "Can (4 L)", unitCode: "CAN", price: Math.round(p * 3.75), mrp: Math.round(m * 3.75), discount: d + 2, bulkPrice: Math.round(p * 3.55), bulkMinQty: 5, stockLevel: 800 },
      { id: `${product.id}-10l`, label: "10L", unit: "Bucket (10 L)", unitCode: "CAN", price: Math.round(p * 8.9), mrp: Math.round(m * 8.9), discount: d + 4, bulkPrice: Math.round(p * 8.4), bulkMinQty: 3, stockLevel: 500 },
      { id: `${product.id}-20l`, label: "20L", unit: "Bucket (20 L)", unitCode: "CAN", price: Math.round(p * 16.8), mrp: Math.round(m * 16.8), discount: d + 6, bulkPrice: Math.round(p * 15.9), bulkMinQty: 2, stockLevel: 400 },
    ];
  }

  // 2. Cement (1 Bag, 10 Bags, 50 Bags Bulk)
  if (slug === "cement" || name.includes("cement")) {
    return [
      { id: `${product.id}-1bag`, label: "1 Bag (50kg)", unit: "Bag (50 kg)", unitCode: "BAG", price: p, mrp: m, discount: d, bulkPrice: Math.round(p * 0.96), bulkMinQty: 10, stockLevel: 5000 },
      { id: `${product.id}-10bags`, label: "10 Bags Pack", unit: "10 Bags (500 kg)", unitCode: "BAG", price: Math.round(p * 10 * 0.98), mrp: m * 10, discount: d + 2, bulkPrice: Math.round(p * 10 * 0.95), bulkMinQty: 2, stockLevel: 500 },
      { id: `${product.id}-50bags`, label: "50 Bags (Bulk)", unit: "50 Bags (2.5 MT)", unitCode: "BAG", price: Math.round(p * 50 * 0.95), mrp: m * 50, discount: d + 5, bulkPrice: Math.round(p * 50 * 0.92), bulkMinQty: 1, stockLevel: 100 },
    ];
  }

  // 3. Adhesives & Fevicol (250g, 500g, 1kg, 2kg, 5kg)
  if (slug === "fevicol" || name.includes("adhesive") || name.includes("fevicol")) {
    return [
      { id: `${product.id}-250g`, label: "250g", unit: "250g Pack", unitCode: "PC", price: Math.max(35, Math.round(p * 0.32)), mrp: Math.max(45, Math.round(m * 0.32)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 400 },
      { id: `${product.id}-500g`, label: "500g", unit: "500g Bottle", unitCode: "PC", price: Math.max(70, Math.round(p * 0.58)), mrp: Math.max(85, Math.round(m * 0.58)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 350 },
      { id: `${product.id}-1kg`, label: "1kg", unit: "1kg Jar", unitCode: "KG", price: p, mrp: m, discount: d, bulkPrice: Math.round(p * 0.95), bulkMinQty: 5, stockLevel: 500 },
      { id: `${product.id}-2kg`, label: "2kg", unit: "2kg Tub", unitCode: "KG", price: Math.round(p * 1.92), mrp: Math.round(m * 1.92), discount: d + 2, bulkPrice: Math.round(p * 1.85), bulkMinQty: 5, stockLevel: 250 },
      { id: `${product.id}-5kg`, label: "5kg", unit: "5kg Bucket", unitCode: "KG", price: Math.round(p * 4.6), mrp: Math.round(m * 4.6), discount: d + 4, bulkPrice: Math.round(p * 4.4), bulkMinQty: 3, stockLevel: 150 },
    ];
  }

  // 4. Tiles & Tiling (1 Box, 5 Boxes, 10 Boxes, 20 Boxes)
  if (slug === "tiles" || slug === "tiling") {
    return [
      { id: `${product.id}-1box`, label: "1 Box", unit: "Box (4 pcs)", unitCode: "BOX", price: p, mrp: m, discount: d, bulkPrice: Math.round(p * 0.95), bulkMinQty: 5, stockLevel: 200 },
      { id: `${product.id}-5boxes`, label: "5 Boxes Pack", unit: "5 Boxes (20 pcs)", unitCode: "BOX", price: Math.round(p * 5 * 0.97), mrp: m * 5, discount: d + 3, bulkPrice: Math.round(p * 5 * 0.94), bulkMinQty: 2, stockLevel: 80 },
      { id: `${product.id}-10boxes`, label: "10 Boxes (Room Pack)", unit: "10 Boxes (40 pcs)", unitCode: "BOX", price: Math.round(p * 10 * 0.94), mrp: m * 10, discount: d + 6, bulkPrice: Math.round(p * 10 * 0.91), bulkMinQty: 1, stockLevel: 50 },
      { id: `${product.id}-20boxes`, label: "20 Boxes (Floor Pack)", unit: "20 Boxes (80 pcs)", unitCode: "BOX", price: Math.round(p * 20 * 0.91), mrp: m * 20, discount: d + 9, bulkPrice: Math.round(p * 20 * 0.88), bulkMinQty: 1, stockLevel: 30 },
    ];
  }

  // 5. Pipes & Conduits (0.75", 1.0", 1.25", 1.5")
  if (slug === "pipes" || slug === "conduits" || name.includes("pipe") || name.includes("conduit")) {
    return [
      { id: `${product.id}-075in`, label: "0.75\" (10ft)", unit: "10 ft Length", unitCode: "LEN", price: Math.max(55, Math.round(p * 0.8)), mrp: Math.max(70, Math.round(m * 0.8)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 300 },
      { id: `${product.id}-1in`, label: "1.0\" (10ft)", unit: "10 ft Length", unitCode: "LEN", price: p, mrp: m, discount: d, bulkPrice: Math.round(p * 0.95), bulkMinQty: 10, stockLevel: 400 },
      { id: `${product.id}-125in`, label: "1.25\" (10ft)", unit: "10 ft Length", unitCode: "LEN", price: Math.round(p * 1.35), mrp: Math.round(m * 1.35), discount: d, bulkPrice: Math.round(p * 1.3), bulkMinQty: 5, stockLevel: 200 },
      { id: `${product.id}-15in`, label: "1.5\" (10ft)", unit: "10 ft Length", unitCode: "LEN", price: Math.round(p * 1.65), mrp: Math.round(m * 1.65), discount: d, bulkPrice: Math.round(p * 1.58), bulkMinQty: 5, stockLevel: 150 },
    ];
  }

  // 6. Wires & Cables (1.0 sq mm, 1.5 sq mm, 2.5 sq mm, 4.0 sq mm)
  if (slug === "electrical" && (name.includes("wire") || name.includes("cable"))) {
    return [
      { id: `${product.id}-1sqmm`, label: "1.0 sq mm", unit: "90m Coil", unitCode: "COIL", price: Math.max(550, Math.round(p * 0.72)), mrp: Math.max(700, Math.round(m * 0.72)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 300 },
      { id: `${product.id}-15sqmm`, label: "1.5 sq mm", unit: "90m Coil", unitCode: "COIL", price: Math.max(850, Math.round(p * 0.88)), mrp: Math.max(1050, Math.round(m * 0.88)), discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 400 },
      { id: `${product.id}-25sqmm`, label: "2.5 sq mm", unit: "90m Coil", unitCode: "COIL", price: p, mrp: m, discount: d, bulkPrice: Math.round(p * 0.95), bulkMinQty: 3, stockLevel: 500 },
      { id: `${product.id}-4sqmm`, label: "4.0 sq mm", unit: "90m Coil", unitCode: "COIL", price: Math.round(p * 1.58), mrp: Math.round(m * 1.58), discount: d, bulkPrice: Math.round(p * 1.52), bulkMinQty: 2, stockLevel: 250 },
    ];
  }

  // 7. Switches & Modular Accessories (1 Pc, Pack of 5, Pack of 10, Box of 20)
  if (slug === "switches") {
    return [
      { id: `${product.id}-1pc`, label: "1 Piece", unit: "Piece", unitCode: "PC", price: p, mrp: m, discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 500 },
      { id: `${product.id}-5pack`, label: "Pack of 5", unit: "Pack of 5", unitCode: "PC", price: Math.round(p * 5 * 0.96), mrp: m * 5, discount: d + 2, bulkPrice: null, bulkMinQty: null, stockLevel: 200 },
      { id: `${product.id}-10pack`, label: "Pack of 10", unit: "Pack of 10", unitCode: "PC", price: Math.round(p * 10 * 0.92), mrp: m * 10, discount: d + 4, bulkPrice: null, bulkMinQty: null, stockLevel: 100 },
      { id: `${product.id}-20box`, label: "Box of 20", unit: "Box of 20", unitCode: "BOX", price: Math.round(p * 20 * 0.88), mrp: m * 20, discount: d + 6, bulkPrice: null, bulkMinQty: null, stockLevel: 60 },
    ];
  }

  // 8. Hinges, Hardware, Handles (1 Unit, Pair 2 pcs, Pack of 6, Box of 12)
  if (slug === "hinges" || slug === "hardware-tools" || slug === "locks" || slug === "wardrobe") {
    return [
      { id: `${product.id}-1pc`, label: "1 Unit", unit: "Unit", unitCode: "PC", price: p, mrp: m, discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 300 },
      { id: `${product.id}-2pack`, label: "Pair (2 pcs)", unit: "Pair (2 pcs)", unitCode: "PC", price: Math.round(p * 2 * 0.97), mrp: m * 2, discount: d + 1, bulkPrice: null, bulkMinQty: null, stockLevel: 150 },
      { id: `${product.id}-6pack`, label: "Pack of 6", unit: "Pack of 6", unitCode: "PC", price: Math.round(p * 6 * 0.93), mrp: m * 6, discount: d + 3, bulkPrice: null, bulkMinQty: null, stockLevel: 100 },
      { id: `${product.id}-12box`, label: "Box of 12", unit: "Box of 12", unitCode: "BOX", price: Math.round(p * 12 * 0.88), mrp: m * 12, discount: d + 6, bulkPrice: null, bulkMinQty: null, stockLevel: 50 },
    ];
  }

  // Default fallback for any other catalog product: 1 Unit + Pack of 5 + Pack of 10
  return [
    { id: `${product.id}-1u`, label: "1 Unit", unit: product.unit || "Unit", unitCode: product.unitCode || "PC", price: p, mrp: m, discount: d, bulkPrice: null, bulkMinQty: null, stockLevel: 250 },
    { id: `${product.id}-5u`, label: "Pack of 5", unit: `5 × ${product.unit || "Units"}`, unitCode: product.unitCode || "PC", price: Math.round(p * 5 * 0.96), mrp: m * 5, discount: d + 2, bulkPrice: null, bulkMinQty: null, stockLevel: 100 },
    { id: `${product.id}-10u`, label: "Pack of 10", unit: `10 × ${product.unit || "Units"}`, unitCode: product.unitCode || "PC", price: Math.round(p * 10 * 0.92), mrp: m * 10, discount: d + 4, bulkPrice: null, bulkMinQty: null, stockLevel: 50 },
  ];
}

/**
 * Resolve display fields for a product. Guarantees that every product has
 * options/variants, and every paint product has 20 color shades.
 */
export function resolveProduct(product: Product): DisplayProduct {
  const price = product.price;
  const mrp = product.mrp;

  const isPaint = isPaintProduct(product);
  let shades = product.shades;
  if (isPaint) {
    if (!product.shades || product.shades.length === 0) {
      shades = COMMON_EMULSION_SHADES;
    } else {
      const existingNames = new Set(product.shades.map((s) => s.name.toLowerCase()));
      const combined = [...product.shades];
      for (const cs of COMMON_EMULSION_SHADES) {
        if (!existingNames.has(cs.name.toLowerCase())) {
          combined.push(cs);
        }
      }
      shades = combined;
    }
  }
  const hasShades = Boolean(isPaint || product.hasShades || (shades && shades.length > 0));

  const variants = getGeneratedVariants(product);

  const discount =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : product.discount;

  return {
    ...product,
    price,
    mrp,
    discount,
    onSale: false,
    saleName: null,
    salePrice: null,
    hidden: false,
    hasShades,
    shades,
    variants,
  };
}

/** Resolve a list, dropping hidden products. */
export function useDisplayProducts(products: Product[]): DisplayProduct[] {
  return products
    .map((p) => resolveProduct(p))
    .filter((p) => !p.hidden);
}

/**
 * Current active sale — server-side sales engine is not launched yet, so
 * there is never a client-visible sale. Kept for the future integration point.
 */
export function useActiveSale(): Sale | null {
  return null;
}

export interface LiveSummary {
  price: number;
  mrp: number;
  discount: number;
  onSale: boolean;
  saleName: string | null;
  hidden: boolean;
}

/**
 * Live pricing for lightweight summary cards (home rails) that only carry
 * id + fallback price/mrp/discount. Falls back to the baked-in values when
 * the full product is unavailable.
 */
export function useLiveSummary(
  id: string,
  fallback: { price: number; mrp: number; discount: number }
): LiveSummary {
  const full = getProductById(id);
  if (!full) return { ...fallback, onSale: false, saleName: null, hidden: false };
  const r = resolveProduct(full);
  return {
    price: r.price,
    mrp: r.mrp,
    discount: r.discount,
    onSale: r.onSale,
    saleName: r.saleName,
    hidden: r.hidden,
  };
}

/** Non-reactive version for event handlers. */
export function getLiveSummary(
  id: string,
  fallback: { price: number; mrp: number; discount: number }
): LiveSummary {
  const full = getProductById(id);
  if (!full) return { ...fallback, onSale: false, saleName: null, hidden: false };
  const r = resolveProduct(full);
  return {
    price: r.price,
    mrp: r.mrp,
    discount: r.discount,
    onSale: r.onSale,
    saleName: r.saleName,
    hidden: r.hidden,
  };
}

/** Label + count for the card button, e.g. "4 Options" / "20 Colours". */
export function optionsLabel(product: { variants?: unknown[]; shades?: unknown[]; hasShades?: boolean }): string | null {
  const vCount = product.variants?.length ?? 0;
  const sCount = product.shades?.length ?? 0;
  if (vCount > 1) return `${vCount} Options`;
  if (vCount === 1 && sCount > 0) return `${sCount} Colours`;
  if (sCount > 0) return `${sCount} Colours`;
  return null;
}
