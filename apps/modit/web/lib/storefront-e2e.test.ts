import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { products, COMMON_EMULSION_SHADES } from "./product-data.ts";
import { resolveProduct, isPaintProduct } from "./pricing.ts";
import { useCartStore } from "./cart-store.ts";
import { PROJECT_KITS, resolveKit, findKitsByQuery } from "./ai-kits.ts";
import { isStandalone, isAppInstalled, markAppInstalled } from "./pwa.ts";

describe("MODIT Storefront End-to-End Flow & Functionality", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  describe("1. Catalog & Paint Shade Completeness", () => {
    it("ensures every paint product in the catalog has valid shades and variants", () => {
      const paintProducts = products.filter(isPaintProduct);
      assert.ok(paintProducts.length > 0, "Catalog must contain paint products");

      for (const raw of paintProducts) {
        const p = resolveProduct(raw);
        assert.equal(p.hasShades, true, `Paint product ${p.name} must have hasShades=true`);
        assert.ok(p.shades && p.shades.length >= 5, `Paint product ${p.name} must have at least 5 shades`);

        // Verify Soft Lilac (manager Canva showcase reference) is present
        const lilac = p.shades.find((s) => s.name === "Soft Lilac");
        assert.ok(lilac, `Paint product ${p.name} must contain Soft Lilac`);
        assert.equal(lilac.code.toLowerCase(), "#8a6fa0");

        // Verify all shades have legitimate 6-character hex codes
        for (const sh of p.shades) {
          assert.match(sh.code, /^#[0-9a-fA-F]{6}$/, `Shade ${sh.name} must have valid hex`);
          assert.ok(sh.name.trim().length > 0, "Shade must have non-empty name");
        }

        // Verify volume pack sizes exist
        assert.ok(p.variants && p.variants.length > 0, `Paint product ${p.name} must have pack size variants`);
      }
    });

    it("ensures COMMON_EMULSION_SHADES includes Soft Lilac, Off White, and Sky Mist", () => {
      const names = COMMON_EMULSION_SHADES.map((s) => s.name);
      assert.ok(names.includes("Soft Lilac"));
      assert.ok(names.includes("Off White"));
      assert.ok(names.includes("Sky Mist"));
    });
  });

  describe("2. Cart Multi-Shade Isolation & In-Place Upgrade Flow", () => {
    const paintRaw = products.find(isPaintProduct) || products[0];
    const paint = resolveProduct(paintRaw);

    it("keeps distinct paint shades in separate cart lines and handles steppers independently", () => {
      const store = useCartStore.getState();

      // Step 1: Add Soft Lilac
      store.addItem(paint, 1, undefined, "Soft Lilac");
      let items = useCartStore.getState().items;
      assert.equal(items.length, 1);
      assert.equal(items[0].shade, "Soft Lilac");
      assert.equal(items[0].quantity, 1);

      // Step 2: Add Sky Mist (same product, different shade)
      store.addItem(paint, 1, undefined, "Sky Mist");
      items = useCartStore.getState().items;
      assert.equal(items.length, 2, "Distinct shades must NOT merge into a single line");
      assert.equal(items[0].shade, "Soft Lilac");
      assert.equal(items[1].shade, "Sky Mist");

      // Step 3: Increment Soft Lilac by adding again
      store.addItem(paint, 2, undefined, "Soft Lilac");
      items = useCartStore.getState().items;
      assert.equal(items.length, 2);
      const lilacLine = items.find((i) => i.shade === "Soft Lilac");
      const mistLine = items.find((i) => i.shade === "Sky Mist");
      assert.ok(lilacLine && mistLine);
      assert.equal(lilacLine.quantity, 3);
      assert.equal(mistLine.quantity, 1);

      // Step 4: Step down Soft Lilac
      store.stepDown(paint.id, undefined, "Soft Lilac");
      items = useCartStore.getState().items;
      assert.equal(items.find((i) => i.shade === "Soft Lilac")?.quantity, 2);
      assert.equal(items.find((i) => i.shade === "Sky Mist")?.quantity, 1);

      // Step 5: Remove Sky Mist specifically
      store.removeItem(paint.id, undefined, "Sky Mist");
      items = useCartStore.getState().items;
      assert.equal(items.length, 1);
      assert.equal(items[0].shade, "Soft Lilac");
    });

    it("upgrades an unshaded placeholder line in-place when a shade is picked", () => {
      const store = useCartStore.getState();

      // Simulate a legacy unshaded line in cart
      store.addItem(paint, 1, undefined, undefined);
      let items = useCartStore.getState().items;
      assert.equal(items.length, 1);
      assert.equal(items[0].shade, undefined);

      // User clicks "Pick Colour Shade" and selects "Soft Lilac"
      store.addItem(paint, 1, undefined, "Soft Lilac");
      items = useCartStore.getState().items;

      // Unshaded line should be upgraded in-place to Soft Lilac
      assert.equal(items.length, 1, "Should upgrade in-place rather than creating duplicate orphan line");
      assert.equal(items[0].shade, "Soft Lilac");
      assert.equal(items[0].quantity, 1);
    });
  });

  describe("3. Blinkit-style AI Project Kits End-to-End", () => {
    it("ensures kit-room-paint provisions shades for paint items", () => {
      const kits = PROJECT_KITS;
      const paintKit = kits.find((k) => k.id === "kit-room-paint");
      assert.ok(paintKit, "Room paint kit must exist");

      const resolved = resolveKit(paintKit);
      assert.ok(resolved.resolvedItems.length > 0, "Kit items must resolve");

      // Verify each resolved paint item has a default shade or isPaintProduct check
      for (const item of resolved.resolvedItems) {
        if (isPaintProduct(item.product)) {
          assert.ok(item.product.hasShades, "Paint item in kit must have shades");
          assert.ok(item.product.shades && item.product.shades.length > 0);
        }
      }
    });

    it("matches project kits by natural language query", () => {
      const paintMatches = findKitsByQuery("paint 2 bedroom walls");
      assert.ok(paintMatches.some((k) => k.id === "kit-room-paint"));

      const waterMatches = findKitsByQuery("terrace waterproofing leak");
      assert.ok(waterMatches.some((k) => k.id === "kit-waterproofing"));
    });
  });

  describe("4. In-App Standalone & Install Guard", () => {
    it("guarantees no app install prompt shows when app is installed or running in standalone", () => {
      assert.equal(typeof isStandalone(), "boolean");
      assert.equal(typeof isAppInstalled(), "boolean");

      const storage: Record<string, string> = {};
      const mockWin: any = {
        localStorage: {
          getItem: (k: string) => storage[k] || null,
          setItem: (k: string, v: string) => { storage[k] = v; },
        },
        sessionStorage: {
          getItem: (k: string) => storage[k] || null,
          setItem: (k: string, v: string) => { storage[k] = v; },
        },
        dispatchEvent: () => true,
        matchMedia: () => ({ matches: false }),
        navigator: { userAgent: "Mozilla/5.0" },
        location: { search: "" },
      };
      (globalThis as any).window = mockWin;

      // Mark app installed
      markAppInstalled();
      assert.equal(isAppInstalled(), true);
      assert.equal(isStandalone(), true);

      delete (globalThis as any).window;
    });
  });
});
