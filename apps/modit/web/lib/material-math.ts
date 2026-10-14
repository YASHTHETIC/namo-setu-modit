/**
 * Material math — pure functions for the MODIT calculators.
 *
 * Every formula states its assumptions (also shown in the UI and covered by
 * unit tests). Paint constants match the original paint calculator exactly —
 * do not "improve" them without updating the tests.
 */

export interface PaintEstimate {
  wallArea: number;
  paintLitres: number;
  primerLitres: number;
  puttyKg: number;
  tapeMeters: number;
  rollerCount: number;
}

export function estimatePaint(areaSqft: number, heightFt: number, coats: number, wallOnly: boolean): PaintEstimate {
  const a = Math.max(1, areaSqft);
  const wallArea = wallOnly ? a * 2 * heightFt : a * 2 * heightFt + a;
  const coveragePerLitre = 120; // sq ft per litre per coat
  return {
    wallArea,
    paintLitres: Math.ceil((wallArea * coats) / coveragePerLitre),
    primerLitres: Math.ceil(wallArea / coveragePerLitre),
    puttyKg: Math.ceil(wallArea * 0.3),
    tapeMeters: Math.ceil((wallArea / 100) * 4),
    rollerCount: Math.max(1, Math.ceil(wallArea / 200)),
  };
}

export interface TilesEstimate {
  tileCount: number;
  adhesiveBags: number; // 20 kg bags
  groutKg: number;
}

export function estimateTiles(areaSqft: number, tileLenIn: number, tileWidIn: number, wastagePct = 10): TilesEstimate {
  const a = Math.max(1, areaSqft);
  const tileSqft = Math.max(0.01, (tileLenIn * tileWidIn) / 144);
  const w = 1 + Math.max(0, wastagePct) / 100;
  return {
    tileCount: Math.ceil((a / tileSqft) * w),
    // 20 kg bag of tile adhesive covers ~55 sq ft at 3 mm bed thickness
    adhesiveBags: Math.ceil(a / 55),
    // cement grout: ~1 kg per 100 sq ft of normal joints
    groutKg: Math.ceil(a / 100),
  };
}

export type ConcreteGrade = "M15" | "M20" | "M25";

const MIX_RATIOS: Record<ConcreteGrade, { cement: number; sand: number; agg: number }> = {
  M15: { cement: 1, sand: 2, agg: 4 },
  M20: { cement: 1, sand: 1.5, agg: 3 },
  M25: { cement: 1, sand: 1, agg: 2 },
};

export interface ConcreteEstimate {
  wetVolumeCuft: number;
  cementBags: number; // 50 kg bags
  sandCuft: number;
  aggCuft: number;
  sandBrass: number; // 1 brass = 100 cu ft
  aggBrass: number;
}

export function estimateConcrete(
  lengthFt: number, widthFt: number, thicknessIn: number, grade: ConcreteGrade,
): ConcreteEstimate {
  const wet = Math.max(0.01, lengthFt * widthFt * (thicknessIn / 12));
  const dryM3 = (wet * 1.52) / 35.3147; // dry-volume factor 1.52
  const mix = MIX_RATIOS[grade];
  const total = mix.cement + mix.sand + mix.agg;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  // cement density 1440 kg/m3, 1 bag = 50 kg
  const sandCuft = dryM3 * (mix.sand / total) * 35.3147;
  const aggCuft = dryM3 * (mix.agg / total) * 35.3147;
  return {
    wetVolumeCuft: round1(wet),
    cementBags: Math.ceil((dryM3 * (mix.cement / total) * 1440) / 50),
    sandCuft: round1(sandCuft),
    aggCuft: round1(aggCuft),
    sandBrass: round2(sandCuft / 100),
    aggBrass: round2(aggCuft / 100),
  };
}

export interface SteelEstimate {
  kgPerMeter: number;
  totalKg: number;
  bars12m: number; // standard 12 m lengths that cover the run
}

export function estimateSteel(diameterMm: number, totalLengthM: number): SteelEstimate {
  const d = Math.max(1, diameterMm);
  const kgPerMeter = Math.round(((d * d) / 162.2) * 1000) / 1000; // IS 456: 0.006165 * d^2
  const totalKg = Math.round(totalLengthM * kgPerMeter * 10) / 10;
  return {
    kgPerMeter,
    totalKg,
    bars12m: Math.ceil(Math.max(0, totalLengthM) / 12),
  };
}
