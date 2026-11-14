import { products, categories, type Product } from "./product-data.ts";

export interface SearchSuggestion {
  text: string;
  query: string;
  image?: string;
  category?: string;
  count?: number;
}

/** Pre-curated high-intent quick suggestions for major building material trades */
const POPULAR_QUERY_PRESETS: { keyword: string; text: string; query: string; image: string }[] = [
  // Painting & Coating
  { keyword: "paint", text: "Paint brush", query: "paint brush", image: "/products/painting/Asian Brush.png" },
  { keyword: "paint", text: "Acrylic paint", query: "acrylic paint", image: "/products/painting/Asian Paints Royale Luxury Emulsion Base White.png" },
  { keyword: "paint", text: "Paint roller", query: "paint roller", image: "/products/painting/Asian Brush.png" },
  { keyword: "paint", text: "White paint", query: "white paint", image: "/products/painting/Asian Paint.png" },
  { keyword: "paint", text: "Exterior paint", query: "exterior paint", image: "/products/painting/Asian Paints Apex Ultima Base White.png" },
  { keyword: "acrylic", text: "Acrylic paint", query: "acrylic paint", image: "/products/painting/Asian Paints Royale Luxury Emulsion Base White.png" },
  { keyword: "acrylic", text: "Acrylic paint set", query: "acrylic paint", image: "/products/painting/Asian Paints Apcolite Premium Glossy Enamel.png" },
  { keyword: "brush", text: "Paint brush", query: "paint brush", image: "/products/painting/Asian Brush.png" },
  { keyword: "brush", text: "Asian Brush", query: "asian brush", image: "/products/painting/Asian Brush.png" },

  // Cement
  { keyword: "cement", text: "OPC Cement", query: "opc cement", image: "/products/cement/ACC Cement.png" },
  { keyword: "cement", text: "PPC Cement", query: "ppc cement", image: "/products/cement/Ambuja Cement.png" },
  { keyword: "cement", text: "UltraTech Cement", query: "ultratech cement", image: "/products/cement/UltraTech Cement.png" },
  { keyword: "cement", text: "ACC Cement", query: "acc cement", image: "/products/cement/ACC Cement.png" },
  { keyword: "cement", text: "Ambuja Cement", query: "ambuja cement", image: "/products/cement/Ambuja Cement.png" },

  // Lighting
  { keyword: "light", text: "LED Downlight", query: "downlight", image: "/products/lighting/Philip Ultra Glow LED Downlight Round.webp" },
  { keyword: "light", text: "Surface Light", query: "surface light", image: "/products/lighting/Philips Full Glow LED Surface Light Round.webp" },
  { keyword: "light", text: "Strip Light", query: "strip light", image: "/products/lighting/Philips EvenGlow LED Strip Light 5m.webp" },
  { keyword: "light", text: "Tube Light", query: "tube light", image: "/products/lighting/Philip Ultra Glow LED Downlight Round.webp" },
  { keyword: "light", text: "COB Light", query: "cob light", image: "/products/lighting/Philip Ultra Glow LED Downlight Round.webp" },

  // Tiling & Waterproofing
  { keyword: "tile", text: "Tile Adhesive", query: "tile adhesive", image: "/products/tiling/Asian Paints SmartCare Tile Adhesive Grey 30 Kg Bag.png" },
  { keyword: "tile", text: "Waterproofing", query: "waterproofing", image: "/products/tiling/Dr Fixit.png" },
  { keyword: "tile", text: "Tile Grout", query: "grout", image: "/products/tiling/Asian Paints SmartCare Tile Adhesive Grey 30 Kg Bag.png" },
  { keyword: "waterproof", text: "Dr. Fixit Waterproofing", query: "dr fixit", image: "/products/tiling/Dr Fixit.png" },
];

/**
 * Returns clean, instant Blinkit-style autocomplete suggestions.
 * Each suggestion contains a thumbnail image, clean query text,
 * and high relevance.
 */
export function getSearchSuggestions(rawQuery: string, catalog: Product[] = products, limit = 6): SearchSuggestion[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const results: SearchSuggestion[] = [];
  const seenTexts = new Set<string>();

  const add = (item: SearchSuggestion) => {
    const key = item.text.trim().toLowerCase();
    if (!seenTexts.has(key) && key.length > 0) {
      seenTexts.add(key);
      results.push(item);
    }
  };

  // 1. Check curated presets that match query prefix / substring
  for (const preset of POPULAR_QUERY_PRESETS) {
    if (preset.keyword.includes(q) || preset.query.toLowerCase().includes(q) || preset.text.toLowerCase().includes(q)) {
      add({
        text: preset.text,
        query: preset.query,
        image: preset.image,
      });
      if (results.length >= limit) return results;
    }
  }

  // 2. Match Categories and Subcategories
  for (const cat of categories) {
    if (cat.name.toLowerCase().includes(q)) {
      const sample = catalog.find((p) => p.categorySlug === cat.slug);
      add({
        text: cat.name,
        query: cat.name.toLowerCase(),
        image: sample?.images?.[0],
        category: cat.name,
      });
    }
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        if (sub.name.toLowerCase().includes(q)) {
          const sample = catalog.find((p) => p.subCategorySlug === sub.slug || p.categorySlug === cat.slug);
          add({
            text: sub.name,
            query: sub.name.toLowerCase(),
            image: sample?.images?.[0],
            category: cat.name,
          });
        }
      }
    }
    if (results.length >= limit) return results;
  }

  // 3. Match Products in catalog: derive clean phrase or title
  for (const p of catalog) {
    const nameLower = p.name.toLowerCase();
    const brandLower = (p.brand || "").toLowerCase();

    if (nameLower.includes(q) || brandLower.includes(q)) {
      // Find clean presentation title
      add({
        text: p.name,
        query: p.name.toLowerCase(),
        image: p.images?.[0],
        category: p.category,
      });
    }
    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}
