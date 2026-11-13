import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PROJECT_KITS, resolveKit, findKitsByQuery } from "./ai-kits.ts";

describe("MODIT AI Project Kits (Blinkit-style Recipe to Cart)", () => {
  it("defines standard project kits", () => {
    assert.ok(PROJECT_KITS.length >= 5, "Expected at least 5 curated project kits");
    const ids = PROJECT_KITS.map((k) => k.id);
    assert.ok(ids.includes("kit-waterproofing"), "Missing waterproofing kit");
    assert.ok(ids.includes("kit-room-paint"), "Missing painting kit");
    assert.ok(ids.includes("kit-ceiling-lighting"), "Missing lighting kit");
    assert.ok(ids.includes("kit-tile-fixing"), "Missing tiling kit");
    assert.ok(ids.includes("kit-brick-plaster"), "Missing masonry kit");
  });

  it("resolves kit items with verified prices and bundle totals", () => {
    const waterproofing = PROJECT_KITS.find((k) => k.id === "kit-waterproofing")!;
    const resolved = resolveKit(waterproofing);

    assert.ok(resolved.resolvedItems.length > 0, "Resolved items must not be empty");
    assert.ok(resolved.totalBundlePrice > 0, "Bundle price must be positive");
    assert.ok(resolved.totalMrp >= resolved.totalBundlePrice, "MRP must be >= bundle price");
    assert.ok(resolved.savings >= 0, "Savings must be non-negative");

    for (const item of resolved.resolvedItems) {
      assert.ok(item.product.id, "Product must have an id");
      assert.ok(item.quantity > 0, "Quantity must be positive");
      assert.ok(item.unitPrice > 0, "Unit price must be positive");
      assert.equal(item.lineTotal, item.unitPrice * item.quantity);
    }
  });

  it("finds matching kits by natural language query", () => {
    const waterproofMatches = findKitsByQuery("water leakage on roof");
    assert.ok(waterproofMatches.length > 0);
    assert.equal(waterproofMatches[0].id, "kit-waterproofing");

    const paintMatches = findKitsByQuery("bedroom wall paint");
    assert.ok(paintMatches.length > 0);
    assert.equal(paintMatches[0].id, "kit-room-paint");

    const lightMatches = findKitsByQuery("ceiling downlight");
    assert.ok(lightMatches.length > 0);
    assert.equal(lightMatches[0].id, "kit-ceiling-lighting");

    const tileMatches = findKitsByQuery("tile adhesive and grout");
    assert.ok(tileMatches.length > 0);
    assert.equal(tileMatches[0].id, "kit-tile-fixing");
  });

  it("returns all kits for empty query", () => {
    const all = findKitsByQuery("");
    assert.equal(all.length, PROJECT_KITS.length);
  });
});
