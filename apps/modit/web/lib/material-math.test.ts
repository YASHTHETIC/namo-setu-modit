import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimateConcrete, estimatePaint, estimateSteel, estimateTiles } from "./material-math.ts";

describe("estimatePaint (legacy constants, do not change)", () => {
  it("120 sq ft bedroom, 10 ft walls, 2 coats", () => {
    const r = estimatePaint(120, 10, 2, true);
    assert.equal(r.wallArea, 2400);
    assert.equal(r.paintLitres, 40); // 2400*2/120
    assert.equal(r.primerLitres, 20); // 2400/120
    assert.equal(r.puttyKg, 720); // 2400*0.3
    assert.equal(r.tapeMeters, 96); // 2400/100*4
    assert.equal(r.rollerCount, 12); // 2400/200
  });

  it("adds ceiling when not wall-only", () => {
    const r = estimatePaint(100, 10, 1, false);
    assert.equal(r.wallArea, 2100); // 100*2*10 + 100
    assert.equal(r.paintLitres, 18); // ceil(2100/120)=17.5->18
  });
});

describe("estimateTiles", () => {
  it("100 sq ft with 2x2 ft tiles at 10% wastage", () => {
    const r = estimateTiles(100, 24, 24, 10);
    assert.equal(r.tileCount, 28); // ceil(100/4*1.1)=ceil(27.5)
    assert.equal(r.adhesiveBags, 2); // ceil(100/55)
    assert.equal(r.groutKg, 1); // ceil(100/100)
  });

  it("12x18 in tiles, no wastage", () => {
    const r = estimateTiles(200, 12, 18, 0);
    assert.equal(r.tileCount, 134); // ceil(200/1.5)=ceil(133.33)
  });
});

describe("estimateConcrete (M20, 10x10 ft slab, 4 in)", () => {
  it("matches hand calculation", () => {
    // wet = 10*10*4/12 = 33.333 cu ft; dry = 33.333*1.52/35.3147 = 1.4348 m3
    // M20 1:1.5:3 (total 5.5): cement = 1.4348*1/5.5*1440 = 375.66 kg -> 8 bags
    const r = estimateConcrete(10, 10, 4, "M20");
    assert.ok(Math.abs(r.wetVolumeCuft - 33.3) < 0.05);
    assert.equal(r.cementBags, 8);
    // sand = 1.4348*1.5/5.5*35.3147 = 13.82 cu ft
    assert.ok(Math.abs(r.sandCuft - 13.8) < 0.05);
    // agg = 1.4348*3/5.5*35.3147 = 27.64 cu ft
    assert.ok(Math.abs(r.aggCuft - 27.6) < 0.05);
    assert.ok(Math.abs(r.sandBrass - 0.14) < 0.005);
  });

  it("M15 uses leaner mix than M25", () => {
    const lean = estimateConcrete(10, 10, 4, "M15");
    const rich = estimateConcrete(10, 10, 4, "M25");
    assert.ok(rich.cementBags > lean.cementBags);
    assert.ok(rich.sandCuft < lean.sandCuft);
  });
});

describe("estimateSteel", () => {
  it("8 mm bar: 0.395 kg/m (IS 456)", () => {
    const r = estimateSteel(8, 100);
    assert.ok(Math.abs(r.kgPerMeter - 0.395) < 0.0005);
    assert.ok(Math.abs(r.totalKg - 39.5) < 0.05);
    assert.equal(r.bars12m, 9); // ceil(100/12)
  });

  it("12 mm bar for a beam", () => {
    const r = estimateSteel(12, 48);
    assert.ok(Math.abs(r.kgPerMeter - 0.888) < 0.0005); // 144/162.2
    assert.ok(Math.abs(r.totalKg - 42.6) < 0.05);
    assert.equal(r.bars12m, 4);
  });
});
