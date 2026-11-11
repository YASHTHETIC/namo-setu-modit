import { getProductById, type Product } from "./product-data.ts";

export interface KitItem {
  productId: string;
  defaultQty: number;
  role: string;
}

export interface ProjectKit {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  badge: string;
  iconName: "Droplets" | "Paintbrush" | "Lightbulb" | "Grid3X3" | "Layers";
  accentColor: string;
  description: string;
  coverage: string;
  estimatedTime: string;
  keywords: string[];
  items: KitItem[];
}

export interface ResolvedKitItem {
  product: Product;
  quantity: number;
  role: string;
  unitPrice: number;
  lineTotal: number;
  mrpTotal: number;
}

export interface ResolvedKit {
  kit: ProjectKit;
  resolvedItems: ResolvedKitItem[];
  totalBundlePrice: number;
  totalMrp: number;
  savings: number;
  savingsPct: number;
}

export const PROJECT_KITS: ProjectKit[] = [
  {
    id: "kit-waterproofing",
    title: "Terrace & Bathroom Waterproofing Kit",
    subtitle: "Complete damp barrier, crack filler & topcoat system",
    tag: "WATERPROOFING",
    badge: "AI BUNDLE",
    iconName: "Droplets",
    accentColor: "#00BCD4",
    description: "Formulated for persistent moisture, wall dampness, and bathroom/terrace seepage. Contains concrete admixture, crack filler, and water-repellent membrane.",
    coverage: "Covers 150–200 sq ft surface",
    estimatedTime: "2 Coats · 24h curing",
    keywords: ["waterproof", "leak", "damp", "seepage", "terrace", "roof", "bathroom", "crack", "moisture", "rain"],
    items: [
      { productId: "waterproofing-dr-fixit-101-pidiproof-lw-1-ltr-5", defaultQty: 2, role: "Concrete Waterproofing Admixture" },
      { productId: "waterproofing-dr-fixit-201-crack-x-paste-1-kg-10", defaultQty: 1, role: "Flexible Gap & Crack Filler" },
      { productId: "paint-asian-smartcare-terracota", defaultQty: 1, role: "SmartCare Damp Proof Membrane (20L)" },
      { productId: "paint-asian-brush", defaultQty: 2, role: "Heavy-Duty Application Brush" },
    ],
  },
  {
    id: "kit-room-paint",
    title: "1-Room Fresh Painting & Putty Kit",
    subtitle: "Premium emulsion, acrylic putty, primer & blades",
    tag: "PAINTING",
    badge: "POPULAR",
    iconName: "Paintbrush",
    accentColor: "#E91E63",
    description: "Everything required to paint a standard 120–150 sq ft bedroom or office from bare plaster to smooth premium finish without missing essentials.",
    coverage: "Covers 120–150 sq ft room (walls + ceiling)",
    estimatedTime: "Putty + 2 Coats Paint",
    keywords: ["paint", "painting", "room", "bedroom", "wall", "putty", "primer", "emulsion", "color", "roller"],
    items: [
      { productId: "paint-asian-tractor-20l", defaultQty: 1, role: "Tractor Emulsion Finish (20L)" },
      { productId: "paint-asian-putty", defaultQty: 2, role: "TruCare Acrylic Wall Putty" },
      { productId: "paint-asian-int-primer", defaultQty: 1, role: "Interior Wall Primer (20L)" },
      { productId: "paint-asian-putty-blade", defaultQty: 2, role: "Stainless Putty Application Blade" },
    ],
  },
  {
    id: "kit-ceiling-lighting",
    title: "False Ceiling LED Lighting Setup Kit",
    subtitle: "3-in-1 round downlights, junction boxes & conduits",
    tag: "ELECTRICAL",
    badge: "ENERGY SAVER",
    iconName: "Lightbulb",
    accentColor: "#F8CB46",
    description: "Complete room illumination package with color-changing ambient lighting, fire-retardant junction boxes, and smooth installation bends.",
    coverage: "Complete lighting for up to 200 sq ft hall",
    estimatedTime: "Plug & Play · Recessed Fit",
    keywords: ["light", "lighting", "led", "ceiling", "false ceiling", "downlight", "bulb", "conduit", "junction", "electrical"],
    items: [
      { productId: "light-philips-downlight-3in1", defaultQty: 4, role: "Philips Ultra Glow 3-in-1 LED Downlight" },
      { productId: "conduits-conduits-gi-boxes-item-2-2", defaultQty: 2, role: "VIP PVC Surface Junction Box" },
      { productId: "conduits-conduits-gi-boxes-item-14-14", defaultQty: 4, role: "Medium Duty Conduit Bend" },
    ],
  },
  {
    id: "kit-tile-fixing",
    title: "Vitrified Tile Laying & Grout Kit",
    subtitle: "Polymer adhesive, premium tile joint seal & trowel",
    tag: "TILING",
    badge: "PRO CHOICE",
    iconName: "Grid3X3",
    accentColor: "#7CB518",
    description: "Professional tile bonding kit designed to prevent hollow sounds and debonding. Includes high-adhesion polymer mortar and epoxy-grade grout.",
    coverage: "Covers 60–80 sq ft tile floor",
    estimatedTime: "Direct Paste · Rapid Setting",
    keywords: ["tile", "tiling", "floor", "vitrified", "adhesive", "grout", "trowel", "kajaria", "roff", "bathroom tiles"],
    items: [
      { productId: "tile-kajaria-1", defaultQty: 2, role: "Kajaria Polymer Tile Adhesive" },
      { productId: "tile-roff-2", defaultQty: 1, role: "Roff Premium Tile Grout & Seal" },
      { productId: "hardware-tools-zailand-plaster-trowelstainless-ste-27", defaultQty: 1, role: "Stainless Steel Notched Trowel" },
    ],
  },
  {
    id: "kit-brick-plaster",
    title: "Masonry & Wall Plastering Kit",
    subtitle: "High-grade PPC cement, waterproofing & steel trowel",
    tag: "CEMENT & REPAIR",
    badge: "SITE ESSENTIAL",
    iconName: "Layers",
    accentColor: "#2D1B69",
    description: "Standard structural repair and plastering batch for masonry joints, crack patches, and brick wall rendering with integrated water resistance.",
    coverage: "Covers 80–100 sq ft wall plastering",
    estimatedTime: "M20 Grade Mix · 60-min delivery",
    keywords: ["cement", "plaster", "masonry", "brick", "concrete", "mortar", "ambuja", "trowel", "repair", "foundation"],
    items: [
      { productId: "cement-ambuja", defaultQty: 4, role: "Ambuja PPC High-Strength Cement (50kg)" },
      { productId: "waterproofing-dr-fixit-101-pidiproof-lw-1-ltr-5", defaultQty: 1, role: "Pidiproof Plaster Waterproofing Additive" },
      { productId: "hardware-tools-zailand-plaster-trowelstainless-ste-27", defaultQty: 1, role: "Plastering Finishing Trowel" },
    ],
  },
];

/** Resolve kit items against the static catalog with live prices */
export function resolveKit(kit: ProjectKit): ResolvedKit {
  const resolvedItems: ResolvedKitItem[] = [];
  let totalBundlePrice = 0;
  let totalMrp = 0;

  for (const item of kit.items) {
    const product = getProductById(item.productId);
    if (!product) continue;

    const unitPrice = product.price;
    const mrp = product.mrp > product.price ? product.mrp : Math.round(product.price * 1.15);
    const lineTotal = unitPrice * item.defaultQty;
    const mrpTotal = mrp * item.defaultQty;

    totalBundlePrice += lineTotal;
    totalMrp += mrpTotal;

    resolvedItems.push({
      product,
      quantity: item.defaultQty,
      role: item.role,
      unitPrice,
      lineTotal,
      mrpTotal,
    });
  }

  const savings = Math.max(0, totalMrp - totalBundlePrice);
  const savingsPct = totalMrp > 0 ? Math.round((savings / totalMrp) * 100) : 0;

  return {
    kit,
    resolvedItems,
    totalBundlePrice,
    totalMrp,
    savings,
    savingsPct,
  };
}

/** Natural language search for kits: matches queries like "water leakage", "bedroom paint", etc. */
export function findKitsByQuery(query: string): ProjectKit[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return PROJECT_KITS;

  const tokens = clean.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return PROJECT_KITS;

  const scored = PROJECT_KITS.map((kit) => {
    let score = 0;
    const textCorpus = `${kit.title} ${kit.subtitle} ${kit.description} ${kit.tag} ${kit.keywords.join(" ")}`.toLowerCase();

    for (const token of tokens) {
      if (textCorpus.includes(token)) score += 3;
      if (kit.keywords.some((kw) => kw.includes(token))) score += 5;
    }

    return { kit, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.kit);
}
