import test from "node:test";
import assert from "node:assert/strict";
import { parsePaperMaterialList, SAMPLE_PAPER_SLIPS } from "./paper-list-parser.ts";

test("paper-list-parser parses cement and steel slip", () => {
  const text = "50 bori cement + 10 bundle sariya";
  const items = parsePaperMaterialList(text);
  assert.ok(items.length >= 2, `Expected at least 2 items, got ${items.length}`);
  const cement = items.find((i) => i.name.toLowerCase().includes("cement"));
  assert.ok(cement, "Should find cement product");
  assert.equal(cement?.quantity, 50);

  const steel = items.find((i) => i.name.toLowerCase().includes("steel") || i.name.toLowerCase().includes("nail") || i.name.toLowerCase().includes("tmt"));
  assert.ok(steel, "Should find steel product");
  assert.equal(steel?.quantity, 10);
});

test("paper-list-parser parses paint slip", () => {
  const text = "4 balti paint + 2 balti primer";
  const items = parsePaperMaterialList(text);
  assert.ok(items.length >= 2, `Expected at least 2 items, got ${items.length}`);
  const paint = items.find((i) => i.name.toLowerCase().includes("emulsion") || i.name.toLowerCase().includes("paint"));
  assert.ok(paint, "Should find paint product");
  assert.equal(paint?.quantity, 4);
});

test("paper-list-parser handles all sample slips without crashing", () => {
  for (const sample of SAMPLE_PAPER_SLIPS) {
    const items = parsePaperMaterialList(sample.text);
    assert.ok(items.length > 0, `Sample '${sample.label}' should yield items`);
  }
});
