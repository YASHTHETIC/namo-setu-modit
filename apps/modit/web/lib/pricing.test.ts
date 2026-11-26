import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { products } from "./product-data.ts";
import { formatINR } from "./utils.ts";
import {
  resolveProduct,
  isPaintProduct,
  optionsLabel,
  getDefaultVariant,
  getDefaultVariantId,
  extractSizeTokens,
} from "./pricing.ts";

test("extractSizeTokens canonicalizes package dimensions correctly", () => {
  assert.deepEqual(extractSizeTokens("Asian Paints Tractor Emulsion 20L"), ["20l"]);
  assert.deepEqual(extractSizeTokens("Asian Paints Tractor Emulsion 10 L"), ["10l"]);
  assert.deepEqual(extractSizeTokens("Asian Paints Tractor Emulsion 4 Litres"), ["4l"]);
  assert.deepEqual(extractSizeTokens("Asian Paints Tractor Emulsion 1L"), ["1l"]);
  assert.deepEqual(extractSizeTokens("ACC Cement 50kg"), ["50kg"]);
  assert.deepEqual(extractSizeTokens("Fevicol 500g"), ["500g"]);
  assert.deepEqual(extractSizeTokens("Finolex 2.5 sq mm Wire"), ["2.5sqmm"]);
  assert.deepEqual(extractSizeTokens("PRINS PVC 20 mm"), ["20mm"]);
  assert.deepEqual(extractSizeTokens('Ashirvad Pipe 1.0"'), ["1inch"]);
});

test("Asian Paints Tractor Emulsion products match default variant and price to their size", () => {
  const p20l = products.find((p) => p.id === "paint-asian-tractor-20l");
  assert.ok(p20l, "paint-asian-tractor-20l must exist");
  const r20l = resolveProduct(p20l);
  assert.equal(r20l.price, 1800, "20L product display price must be ₹1800, not 1L price");
  assert.equal(r20l.mrp, 2200, "20L product display mrp must be ₹2200");
  assert.equal(r20l.defaultVariant?.label, "20L", "20L product default variant label must be '20L'");
  assert.equal(r20l.defaultVariantId, "paint-asian-tractor-20l-20l");

  const p10l = products.find((p) => p.id === "paint-asian-tractor-10l");
  assert.ok(p10l, "paint-asian-tractor-10l must exist");
  const r10l = resolveProduct(p10l);
  assert.equal(r10l.price, 950, "10L product display price must be ₹950, not 1L price");
  assert.equal(r10l.defaultVariant?.label, "10L", "10L product default variant label must be '10L'");
  assert.equal(r10l.defaultVariantId, "paint-asian-tractor-10l-10l");

  const p1l = products.find((p) => p.id === "paint-asian-tractor-1l");
  assert.ok(p1l, "paint-asian-tractor-1l must exist");
  const r1l = resolveProduct(p1l);
  assert.equal(r1l.price, 120, "1L product display price must be ₹120");
  assert.equal(r1l.defaultVariant?.label, "1L", "1L product default variant label must be '1L'");
  assert.equal(r1l.defaultVariantId, "paint-asian-tractor-1l-1l");
});

test("cement products default to 50kg bag matching title and unit", () => {
  const acc = products.find((p) => p.id === "cement-acc");
  assert.ok(acc);
  const rAcc = resolveProduct(acc);
  assert.equal(rAcc.price, acc.price);
  assert.equal(rAcc.defaultVariant?.label, "1 Bag (50kg)");
});

test("resolveProduct guarantees every paint product has shades and volume variants", () => {
  const paintProducts = products.filter(isPaintProduct);
  assert.ok(paintProducts.length > 50, `Expected at least 50 paint products, got ${paintProducts.length}`);

  for (const raw of paintProducts) {
    const p = resolveProduct(raw);
    assert.equal(p.hasShades, true, `Product ${p.name} must have hasShades=true`);
    assert.ok(p.shades && p.shades.length >= 20, `Product ${p.name} must have at least 20 shades`);
    assert.ok(p.variants && p.variants.length >= 2, `Product ${p.name} must have at least 2 pack-size variants`);
    assert.ok(p.defaultVariant, `Product ${p.name} must have a defaultVariant`);
    assert.ok(p.defaultVariantId, `Product ${p.name} must have a defaultVariantId`);
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

test("formatINR formats 2, 3, 4, and 5-digit prices without truncation", () => {
  assert.equal(formatINR(45), "₹45");
  assert.equal(formatINR(120), "₹120");
  assert.equal(formatINR(950), "₹950");
  assert.equal(formatINR(2400), "₹2,400");
  assert.equal(formatINR(12500), "₹12,500");
  assert.equal(formatINR(94550), "₹94,550");
});

test("product cards never apply CSS truncate to prices and give image wraps explicit sizing", () => {
  const cardFiles = [
    path.resolve("app/products/product-explorer.tsx"),
    path.resolve("components/mobile-product-card.tsx"),
    path.resolve("widgets/product-card.tsx"),
  ];
  for (const file of cardFiles) {
    const src = fs.readFileSync(file, "utf8");
    const lines = src.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes("formatINR(") || line.includes("activePrice.toLocaleString") || line.includes("product.price.toLocaleString")) {
        const prev = lines[idx - 1] ?? "";
        assert.ok(
          !prev.includes("truncate") && !line.includes("truncate"),
          `${path.basename(file)}:${idx + 1} must not apply 'truncate' to product prices`
        );
      }
      if (line.includes("product-image-wrap") && !line.includes("relative h-40")) {
        assert.ok(
          line.includes("aspect-square") || line.includes("h-"),
          `${path.basename(file)}:${idx + 1} product-image-wrap must have explicit aspect/height sizing`
        );
      }
    });
  }
});
