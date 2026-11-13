/**
 * Handwritten Paper & Site Slip Material Extractor for MODIT RFQ
 *
 * Parses handwritten site slips ("kachha parcha", paper lists, WhatsApp text)
 * and maps them to real MODIT catalog SKUs with extracted quantities.
 */

import { products, type Product } from "./product-data.ts";

export interface ExtractedMaterial {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  rawText: string;
}

interface MaterialPattern {
  keywords: string[];
  fallbackSku: string;
  defaultUnit: string;
  defaultQuantity: number;
}

const MATERIAL_PATTERNS: MaterialPattern[] = [
  {
    keywords: ["cement", "katta", "bori", "ultratech", "ambuja", "acc", "shree cement"],
    fallbackSku: "CEM-ACC-50",
    defaultUnit: "bags",
    defaultQuantity: 50,
  },
  {
    keywords: ["sariya", "tmt", "steel", "loha", "bar", "12mm", "10mm", "16mm", "nail", "nails"],
    fallbackSku: "HNF-BSF-00000021",
    defaultUnit: "bundles",
    defaultQuantity: 10,
  },
  {
    keywords: ["putty", "birla putty", "jk putty", "wall putty", "putti"],
    fallbackSku: "PNT-AP-PTTY",
    defaultUnit: "bags",
    defaultQuantity: 5,
  },
  {
    keywords: ["paint", "balti", "tractor emulsion", "emulsion", "asian paints", "berger", "nerolac", "royale", "apex"],
    fallbackSku: "PNT-AP-TRC20",
    defaultUnit: "buckets",
    defaultQuantity: 4,
  },
  {
    keywords: ["primer", "primer balti", "exterior primer", "interior primer"],
    fallbackSku: "PNT-AP-TCIP",
    defaultUnit: "buckets",
    defaultQuantity: 2,
  },
  {
    keywords: ["waterproofing", "dr fixit", "doctor fixit", "lw+", "pidilite", "damp proof", "smartcare"],
    fallbackSku: "WAT-1-138",
    defaultUnit: "cans",
    defaultQuantity: 4,
  },
  {
    keywords: ["tile", "tiles", "adhesive", "kajaria", "somany", "flooring", "vitrified"],
    fallbackSku: "NEW-5003",
    defaultUnit: "boxes",
    defaultQuantity: 15,
  },
  {
    keywords: ["pipe", "cpvc", "pvc", "ashirvad", "astral", "conduit"],
    fallbackSku: "SAN-7-114",
    defaultUnit: "lengths",
    defaultQuantity: 12,
  },
  {
    keywords: ["wire", "taar", "havells", "polycab", "electrical", "switch"],
    fallbackSku: "HAR-12-41",
    defaultUnit: "rolls",
    defaultQuantity: 3,
  },
];

/** Extract quantity number from a line like "50 katta cement" or "paint 4 balti" */
function extractQuantity(line: string, fallbackQty: number): number {
  const match = line.match(/(\d+[\d.]*)/);
  if (!match) return fallbackQty;
  const val = parseFloat(match[1]);
  return Number.isFinite(val) && val > 0 ? val : fallbackQty;
}

/**
 * Parse lines from handwritten paper OCR / slip text and match against MODIT products.
 */
export function parsePaperMaterialList(rawText: string): ExtractedMaterial[] {
  if (!rawText || !rawText.trim()) return [];

  // Split into items by newline, comma, semicolon, plus, or conjunctions
  const lines = rawText
    .split(/[\n,;+]|\band\b|\baur\b/i)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);

  const results: ExtractedMaterial[] = [];
  const seenIds = new Set<string>();

  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const pattern of MATERIAL_PATTERNS) {
      const matches = pattern.keywords.some((k) => lower.includes(k));
      if (!matches) continue;

      // Find matching product in catalog
      let matchedProduct: Product | undefined = products.find((p) => p.sku === pattern.fallbackSku);
      if (!matchedProduct) {
        matchedProduct = products.find(
          (p) =>
            pattern.keywords.some((k) => p.name.toLowerCase().includes(k)) ||
            pattern.keywords.some((k) => p.categorySlug.toLowerCase().includes(k))
        );
      }

      if (matchedProduct && !seenIds.has(matchedProduct.id)) {
        seenIds.add(matchedProduct.id);
        const qty = extractQuantity(line, pattern.defaultQuantity);
        results.push({
          productId: matchedProduct.id,
          name: matchedProduct.name,
          quantity: Math.round(qty),
          unit: pattern.defaultUnit,
          rawText: line,
        });
        break;
      }
    }
  }

  return results;
}

/** Pre-set realistic paper slip samples for instant testing */
export const SAMPLE_PAPER_SLIPS = [
  {
    label: "Site Foundation Slip",
    text: "50 bori cement + 10 bundle sariya + 5 bag wall putty",
  },
  {
    label: "Painting & Waterproofing Slip",
    text: "4 balti Tractor Emulsion paint + 2 balti primer + 4 can damp proof waterproofing",
  },
  {
    label: "Finishing & Tiles Slip",
    text: "15 box tile adhesive + 12 pipe + 3 roll electrical wire",
  },
];
