import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getSearchSuggestions } from "./search-suggestions.ts";
import { products } from "./product-data.ts";

describe("MODIT Blinkit-style Autocomplete Search Suggestions", () => {
  it("returns relevant paint suggestions with valid images for 'paint'", () => {
    const suggestions = getSearchSuggestions("paint", products, 5);
    assert.ok(suggestions.length > 0, "Should return suggestions for 'paint'");
    assert.ok(suggestions.some((s) => s.text.toLowerCase().includes("paint")), "Should include paint terms");

    for (const s of suggestions) {
      assert.ok(s.text.trim().length > 0, "Suggestion text must not be empty");
      assert.ok(s.query.trim().length > 0, "Suggestion query must not be empty");
      if (s.image) {
        assert.ok(s.image.startsWith("/products/"), `Image path must be valid: ${s.image}`);
      }
    }
  });

  it("returns relevant cement suggestions with valid images for 'cement'", () => {
    const suggestions = getSearchSuggestions("cement", products, 5);
    assert.ok(suggestions.length > 0, "Should return suggestions for 'cement'");
    assert.ok(suggestions.some((s) => s.text.toLowerCase().includes("cement")), "Should include cement terms");
  });

  it("returns relevant lighting suggestions for 'light'", () => {
    const suggestions = getSearchSuggestions("light", products, 5);
    assert.ok(suggestions.length > 0, "Should return suggestions for 'light'");
    assert.ok(suggestions.some((s) => s.text.toLowerCase().includes("light")), "Should include lighting terms");
  });

  it("handles whitespace and empty queries gracefully without throwing", () => {
    assert.deepEqual(getSearchSuggestions(""), []);
    assert.deepEqual(getSearchSuggestions("   "), []);
  });

  it("deduplicates suggestions and respects the limit argument", () => {
    const suggestions = getSearchSuggestions("paint", products, 4);
    assert.ok(suggestions.length <= 4, "Must respect limit");

    const texts = suggestions.map((s) => s.text.toLowerCase());
    const unique = new Set(texts);
    assert.equal(texts.length, unique.size, "Suggestions must be deduplicated");
  });
});
