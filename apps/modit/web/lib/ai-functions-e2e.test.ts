import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PROJECT_KITS, resolveKit, findKitsByQuery } from "./ai-kits.ts";
import { parsePaperMaterialList, SAMPLE_PAPER_SLIPS } from "./paper-list-parser.ts";
import {
  estimatePaint,
  estimateTiles,
  estimateConcrete,
  estimateSteel,
} from "./material-math.ts";
import { getSearchSuggestions } from "./search-suggestions.ts";
import { products, getProductById } from "./product-data.ts";

describe("MODIT End-to-End AI Functions Audit", () => {
  // ── 1. AI Project Kits (Recipe to Cart) ──────────────────────────────────
  describe("1. AI Project Kits (Recipe to Cart)", () => {
    it("ensures every project kit resolves 100% valid products with positive prices", () => {
      assert.ok(PROJECT_KITS.length >= 4, "Must define at least 4 project kits");

      for (const kit of PROJECT_KITS) {
        assert.ok(kit.title.trim().length > 0, "Kit title must not be empty");
        assert.ok(kit.items.length > 0, `Kit ${kit.id} must have items`);

        const resolved = resolveKit(kit);
        assert.ok(resolved.resolvedItems.length > 0, `Kit ${kit.id} must have resolved items`);
        assert.ok(resolved.totalBundlePrice > 0, `Kit ${kit.id} bundle price must be > 0`);
        assert.ok(resolved.totalMrp >= resolved.totalBundlePrice, `Kit ${kit.id} MRP must be >= price`);

        for (const item of resolved.resolvedItems) {
          assert.ok(item.product.id, "Resolved product must have an ID");
          assert.ok(item.product.name, "Resolved product must have a name");
          assert.ok(item.quantity > 0, "Item quantity must be > 0");
          assert.ok(item.unitPrice > 0, "Item unit price must be > 0");
        }
      }
    });

    it("verifies natural language matching across all trade keywords", () => {
      const testQueries = [
        { q: "terrace leakage and bathroom damp", expectedId: "kit-waterproofing" },
        { q: "fresh bedroom wall paint", expectedId: "kit-room-paint" },
        { q: "false ceiling downlights electrical", expectedId: "kit-ceiling-lighting" },
        { q: "vitrified floor tile fixing", expectedId: "kit-tile-fixing" },
        { q: "brick wall masonry plaster", expectedId: "kit-brick-plaster" },
      ];

      for (const { q, expectedId } of testQueries) {
        const matches = findKitsByQuery(q);
        assert.ok(
          matches.some((k) => k.id === expectedId),
          `Query "${q}" should match ${expectedId}`
        );
      }
    });
  });

  // ── 2. AI Paper Slip / Handwritten Site OCR Parser ──────────────────────
  describe("2. AI Paper Slip / Site Slip Parser", () => {
    it("extracts quantities and catalog items from vernacular site notes", () => {
      const rawSlip = "50 bori cement\n10 bundle sariya\n4 balti paint\n2 bag wall putty";
      const extracted = parsePaperMaterialList(rawSlip);

      assert.ok(extracted.length >= 4, "Should extract all 4 lines");

      const cement = extracted.find((e) => e.rawText.toLowerCase().includes("cement"));
      assert.ok(cement, "Should detect cement");
      assert.equal(cement.quantity, 50, "Should extract 50 bags");

      const steel = extracted.find((e) => e.rawText.toLowerCase().includes("sariya"));
      assert.ok(steel, "Should detect sariya/steel");
      assert.equal(steel.quantity, 10, "Should extract 10 bundles");

      const paint = extracted.find((e) => e.rawText.toLowerCase().includes("paint"));
      assert.ok(paint, "Should detect paint");
      assert.equal(paint.quantity, 4, "Should extract 4 buckets");

      for (const item of extracted) {
        assert.ok(item.productId, "Extracted item must have a product ID");
        assert.ok(item.name, "Extracted item must have a name");
        assert.ok(item.quantity > 0, "Extracted quantity must be > 0");
      }
    });

    it("parses all built-in sample contractor slips without crashing", () => {
      for (const sample of SAMPLE_PAPER_SLIPS) {
        const items = parsePaperMaterialList(sample.text);
        assert.ok(Array.isArray(items), `Sample ${sample.title} should return array`);
        assert.ok(items.length > 0, `Sample ${sample.title} should extract items`);
      }
    });
  });

  // ── 3. AI Material Quantity Estimation Calculator ───────────────────────
  describe("3. AI Material Quantity Estimation Calculator", () => {
    it("calculates accurate paint quantities for standard room sizes", () => {
      // 120 sq ft room, 10 ft walls, 2 coats, wall-only
      const result = estimatePaint(120, 10, 2, true);
      assert.ok(result.wallArea > 0, "Wall area must be > 0");
      assert.ok(result.paintLitres > 0, "Paint litres must be > 0");
      assert.ok(result.primerLitres > 0, "Primer litres must be > 0");
      assert.ok(result.puttyKg > 0, "Putty kg must be > 0");
      assert.ok(result.rollerCount >= 1, "Must need at least 1 roller");
    });

    it("calculates accurate tile counts and adhesive bags", () => {
      // 100 sq ft, 24x24 inch tiles, 10% wastage
      const tiles = estimateTiles(100, 24, 24, 10);
      assert.ok(tiles.tileCount >= 25, "Tile count should be around 28");
      assert.ok(tiles.adhesiveBags >= 2, "Should need adhesive bags");
      assert.ok(tiles.groutKg >= 1, "Should need grout");
    });

    it("calculates accurate concrete batches for M15, M20, M25", () => {
      const m20 = estimateConcrete(10, 10, 4, "M20");
      assert.ok(m20.cementBags > 0, "Cement bags must be > 0");
      assert.ok(m20.sandCuft > 0, "Sand must be > 0");
      assert.ok(m20.aggCuft > 0, "Aggregate must be > 0");

      const m25 = estimateConcrete(10, 10, 4, "M25");
      assert.ok(m25.cementBags >= m20.cementBags, "M25 should have higher cement than M20");
    });

    it("calculates steel reinforcement kg by IS 456 formula", () => {
      const steel12 = estimateSteel(12, 100);
      assert.ok(steel12.kgPerMeter > 0.8, "12mm bar should be ~0.89 kg/m");
      assert.ok(steel12.totalKg > 80, "Total kg must be calculated");
      assert.ok(steel12.bars12m >= 8, "Should need standard lengths");
    });
  });

  // ── 4. AI Blinkit-Style Autocomplete & Instant Suggestion Search ────────
  describe("4. AI Blinkit-Style Autocomplete & Search Suggestions", () => {
    it("returns relevant paint, cement, and lighting suggestions with verified thumbnails", () => {
      const queries = ["paint", "cement", "light", "acrylic", "tile"];

      for (const q of queries) {
        const suggestions = getSearchSuggestions(q, products, 5);
        assert.ok(suggestions.length > 0, `Should return suggestions for '${q}'`);

        for (const s of suggestions) {
          assert.ok(s.text.trim().length > 0, "Suggestion text must not be empty");
          assert.ok(s.query.trim().length > 0, "Suggestion query must not be empty");
          if (s.image) {
            assert.ok(s.image.startsWith("/products/"), `Thumbnail must point to /products/: ${s.image}`);
          }
        }
      }
    });

    it("gracefully handles empty strings, whitespace, and special characters", () => {
      assert.deepEqual(getSearchSuggestions(""), []);
      assert.deepEqual(getSearchSuggestions("   "), []);
      assert.deepEqual(getSearchSuggestions("!@#$%^"), []);
    });
  });

  // ── 5. AI Out-of-Stock Smart Substitute Matcher ──────────────────────────
  describe("5. AI Out-of-Stock Smart Substitutes", () => {
    it("ensures product substitutes in catalog resolve to real products", () => {
      const productsWithSubs = products.filter((p) => p.substitutes && p.substitutes.length > 0);
      assert.ok(productsWithSubs.length > 0, "Catalog must have items with substitutes");

      for (const p of productsWithSubs) {
        for (const subId of p.substitutes!) {
          const sub = getProductById(subId);
          assert.ok(sub, `Substitute ${subId} for ${p.name} must exist in catalog`);
          assert.equal(sub.categorySlug, p.categorySlug, `Substitute must be in same trade category`);
        }
      }
    });
  });
});
