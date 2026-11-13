import test from "node:test";
import assert from "node:assert/strict";
import { products } from "./product-data.ts";
import { resolveProduct, isPaintProduct, optionsLabel } from "./pricing.ts";

test("resolveProduct guarantees every paint product has shades and volume variants", () => {
  const paintProducts = products.filter(isPaintProduct);
  assert.ok(paintProducts.length > 50, `Expected at least 50 paint products, got ${paintProducts.length}`);

  for (const raw of paintProducts) {
    const p = resolveProduct(raw);
    assert.equal(p.hasShades, true, `Product ${p.name} must have hasShades=true`);
    assert.ok(p.shades && p.shades.length >= 20, `Product ${p.name} must have at least 20 shades`);
    assert.ok(p.variants && p.variants.length >= 2, `Product ${p.name} must have at least 2 pack-size variants`);
    const label = optionsLabel(p);
    assert.ok(label, `Product ${p.name} must have an options label`);
  }
});

test("resolveProduct provides options for every catalog product", () => {
  assert.equal(products.length, 1120, "Catalog must contain all 1120 products");

  for (const raw of products) {
    const p = resolveProduct(raw);
    assert.ok(p.price > 0, `Product ${p.name} must have positive price`);
    assert.ok(
      (p.variants && p.variants.length > 1) || (p.shades && p.shades.length > 0),
      `Product ${p.name} must have variants or shades`
    );
    const label = optionsLabel(p);
    assert.ok(label, `Product ${p.name} must have an options label so buyers choose their option`);
  }
});
