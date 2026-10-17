import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveReorderProduct, reorderQuantity } from "./order-reorder.ts";
import { getProductById, getProductBySku } from "./product-data.ts";

describe("resolveReorderProduct", () => {
  it("resolves a static demo line by productId", () => {
    const p = resolveReorderProduct({ productId: "cement-acc", quantity: 5 });
    assert.ok(p);
    assert.equal(p!.id, "cement-acc");
  });

  it("falls back to SKU when product_id is a server UUID (no static match)", () => {
    const anySku = getProductBySku("CEM-ACC-50");
    assert.ok(anySku, "expected a CEM-ACC-50 product in the catalog");
    // Simulate a server order line: DB UUID in product_id, real SKU alongside.
    const p = resolveReorderProduct({
      product_id: "9f8e7d6c-0000-4000-8000-000000000001",
      sku: "CEM-ACC-50",
      quantity: 10,
    });
    assert.ok(p);
    assert.equal(p!.sku, "CEM-ACC-50");
  });

  it("prefers the static id when both id and sku match", () => {
    const staticProduct = getProductById("cement-acc");
    assert.ok(staticProduct);
    const p = resolveReorderProduct({
      productId: "cement-acc",
      sku: staticProduct!.sku,
    });
    assert.equal(p!.id, "cement-acc");
  });

  it("returns undefined for a fully unknown line (never invents a product)", () => {
    const p = resolveReorderProduct({
      product_id: "9f8e7d6c-0000-4000-8000-00000000dead",
      sku: "NO-SUCH-SKU-XXX",
    });
    assert.equal(p, undefined);
  });

  it("returns undefined for an empty line", () => {
    assert.equal(resolveReorderProduct({}), undefined);
  });
});

describe("reorderQuantity", () => {
  it("keeps a positive integer", () => {
    assert.equal(reorderQuantity({ quantity: 7 }), 7);
  });

  it("defaults missing/zero/negative/garbage to 1", () => {
    assert.equal(reorderQuantity({}), 1);
    assert.equal(reorderQuantity({ quantity: 0 }), 1);
    assert.equal(reorderQuantity({ quantity: -3 }), 1);
    assert.equal(reorderQuantity({ quantity: Number.NaN }), 1);
  });

  it("floors fractional quantities", () => {
    assert.equal(reorderQuantity({ quantity: 2.9 }), 2);
  });
});
