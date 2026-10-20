"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calculator, Paintbrush, Layers, Grid3X3, Zap, Truck, ShoppingCart, CheckCircle2, Ruler, Box } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { productLink } from "@/lib/utils";
import { products } from "@/lib/product-data";
import {
  estimatePaint, estimateTiles, estimateConcrete, estimateSteel,
  type ConcreteGrade,
} from "@/lib/material-math";

type RoomType = "bedroom" | "living" | "kitchen" | "bathroom" | "hall";
type CalcTab = "paint" | "tiles" | "concrete" | "steel";

const roomPresets: Record<RoomType, { label: string; defaultArea: number; defaultHeight: number }> = {
  bedroom: { label: "Bedroom", defaultArea: 120, defaultHeight: 10 },
  living: { label: "Living Room", defaultArea: 200, defaultHeight: 10 },
  kitchen: { label: "Kitchen", defaultArea: 80, defaultHeight: 10 },
  bathroom: { label: "Bathroom", defaultArea: 50, defaultHeight: 8 },
  hall: { label: "Hall / Office", defaultArea: 300, defaultHeight: 10 },
};

interface Reco {
  name: string;
  product: typeof products[0];
  quantity: number;
  icon: string;
}

const inputCls =
  "mt-1 w-full h-10 rounded-xl border-2 border-[#DDD6EE] px-3 text-body-md font-semibold text-[#150726] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10";
const labelCls = "text-micro font-semibold text-[#9B8CB5] uppercase";
const cardCls = "rounded-2xl border border-[#DDD6EE] bg-white p-5";
const headCls = "text-body-sm font-bold text-[#150726] mb-3";

export default function CalculatorPage() {
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [tab, setTab] = useState<CalcTab>("paint");
  const [addedItems, setAddedItems] = useState<string[]>([]);

  // ---- paint (unchanged legacy inputs) ----
  const [roomType, setRoomType] = useState<RoomType>("bedroom");
  const [area, setArea] = useState(120);
  const [height, setHeight] = useState(10);
  const [coats, setCoats] = useState(2);
  const [wallOnly, setWallOnly] = useState(true);
  // ---- tiles ----
  const [tileArea, setTileArea] = useState(100);
  const [tileLen, setTileLen] = useState(24);
  const [tileWid, setTileWid] = useState(24);
  const [wastage, setWastage] = useState(10);
  // ---- concrete ----
  const [slabL, setSlabL] = useState(10);
  const [slabW, setSlabW] = useState(10);
  const [slabT, setSlabT] = useState(4);
  const [grade, setGrade] = useState<ConcreteGrade>("M20");
  // ---- steel ----
  const [steelDia, setSteelDia] = useState(12);
  const [steelLen, setSteelLen] = useState(48);

  const paint = useMemo(
    () => estimatePaint(area, height, coats, wallOnly),
    [area, height, coats, wallOnly],
  );
  const tiles = useMemo(
    () => estimateTiles(tileArea, tileLen, tileWid, wastage),
    [tileArea, tileLen, tileWid, wastage],
  );
  const concrete = useMemo(
    () => estimateConcrete(slabL, slabW, slabT, grade),
    [slabL, slabW, slabT, grade],
  );
  const steel = useMemo(() => estimateSteel(steelDia, steelLen), [steelDia, steelLen]);

  const recommendations: Reco[] = useMemo(() => {
    // Quantities are converted to purchasable packs: a 20 L primer requirement
    // means 1 twenty-litre can, not 20 cans. Pack sizes come from each
    // product's own unit; tape assumes a standard ~20 m roll.
    const packsOf = (unit: string, amount: number, assumedPack = 1) => {
      const m = /([\d.]+)/.exec(unit);
      const pack = m ? parseFloat(m[1]) : assumedPack;
      return Math.max(1, Math.ceil(amount / pack));
    };
    if (tab === "paint") {
      const items: Reco[] = [];
      const primer = products.find((p) => p.id === "paint-asian-int-primer");
      if (primer) items.push({ name: "Primer (20 L can)", product: primer, quantity: packsOf(primer.unit, paint.primerLitres), icon: "🎨" });
      const putty = products.find((p) => p.id === "paint-asian-putty");
      if (putty) items.push({ name: "Wall Putty (20 kg)", product: putty, quantity: packsOf(putty.unit, paint.puttyKg), icon: "🧱" });
      const roller = products.find((p) => p.id === "paint-asian-roller");
      if (roller) items.push({ name: "Paint Roller", product: roller, quantity: paint.rollerCount, icon: "🖌️" });
      const tape = products.find((p) => p.id === "paint-asian-masking-tape");
      if (tape) items.push({ name: "Masking Tape (~20 m roll)", product: tape, quantity: packsOf(tape.unit, paint.tapeMeters, 20), icon: "📎" });
      return items;
    }
    if (tab === "tiles") {
      const tiling = products.filter((p) => p.categorySlug === "tiling");
      const items: Reco[] = [];
      const adhesive = tiling.find((p) => /adhesive/i.test(p.name)) ?? tiling[0];
      if (adhesive) items.push({ name: "Tile Adhesive (20 kg)", product: adhesive, quantity: packsOf(adhesive.unit, tiles.adhesiveBags * 20), icon: "🧱" });
      const grout = tiling.find((p) => /grout/i.test(p.name) && p.id !== adhesive?.id)
        ?? tiling.find((p) => p.id !== adhesive?.id);
      if (grout) items.push({ name: "Tile Grout", product: grout, quantity: packsOf(grout.unit, tiles.groutKg), icon: "🪣" });
      return items;
    }
    if (tab === "concrete") {
      const cement = products
        .filter((p) => p.categorySlug === "cement")
        .sort((a, b) => a.price - b.price);
      if (cement[0]) return [{ name: "Cement (50 kg)", product: cement[0], quantity: concrete.cementBags, icon: "🏗️" }];
      return [];
    }
    return []; // steel: no TMT category yet — RFQ path instead
  }, [tab, paint, tiles, concrete]);

  const handleAddAll = () => {
    recommendations.forEach((item) => {
      addItem(item.product, item.quantity);
    });
    setAddedItems(recommendations.map((r) => r.name));
    setTimeout(() => setAddedItems([]), 3000);
  };

  const tabs: { id: CalcTab; label: string; icon: React.ReactNode }[] = [
    { id: "paint", label: "Paint", icon: <Paintbrush className="h-4 w-4" /> },
    { id: "tiles", label: "Tiles", icon: <Grid3X3 className="h-4 w-4" /> },
    { id: "concrete", label: "Concrete", icon: <Box className="h-4 w-4" /> },
    { id: "steel", label: "Steel", icon: <Ruler className="h-4 w-4" /> },
  ];

  return (
    <div className="fx-page min-h-screen bg-[#F8F6FC]">
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #150726 60%, #150726 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, rgba(124,181,24,0.5), transparent 50%)" }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/products" aria-label="Back to products" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-title-md font-extrabold text-white flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#7CB518]" /> Material Calculator
              </h1>
              <p className="text-caption text-white/50">Paint, tiles, concrete & steel estimates</p>
            </div>
            {cartCount > 0 && (
              <Link href="/cart" className="ml-auto relative rounded-xl bg-white/10 p-2.5 text-white hover:bg-white/15 transition-colors">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-[#7CB518] text-tiny font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setAddedItems([]); }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-caption font-bold border-2 transition-all flex-shrink-0 ${
                  tab === t.id
                    ? "border-[#7CB518] bg-[#7CB518] text-white"
                    : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 py-4 space-y-4 sm:px-6">
        {tab === "paint" && (
          <>
            {/* Room Type */}
            <div className={cardCls}>
              <h3 className={headCls}>Room Type</h3>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(roomPresets) as RoomType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setRoomType(type); setArea(roomPresets[type].defaultArea); setHeight(roomPresets[type].defaultHeight); }}
                    className={`rounded-xl px-4 py-2 text-caption font-semibold border-2 transition-all ${
                      roomType === type
                        ? "border-[#2D1B69] bg-[#F0ECF9] text-[#2D1B69]"
                        : "border-[#DDD6EE] text-[#9B8CB5] hover:border-[#C9B8E8]"
                    }`}
                  >
                    {roomPresets[type].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div className={cardCls}>
              <h3 className={headCls}>Dimensions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="calc-paint-area" className={labelCls}>Floor Area (sq ft)</label>
                  <input
                    id="calc-paint-area"
                    type="number"
                    value={area}
                    onChange={(e) => setArea(Math.max(1, parseInt(e.target.value) || 1))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="calc-paint-height" className={labelCls}>Ceiling Height (ft)</label>
                  <input
                    id="calc-paint-height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={wallOnly} onChange={(e) => setWallOnly(e.target.checked)} className="h-4 w-4 rounded border-[#DDD6EE] text-[#2D1B69] focus:ring-[#2D1B69]" />
                  <span className="text-caption font-medium text-[#150726]">Wall only (skip ceiling)</span>
                </label>
              </div>
            </div>

            {/* Paint Coats */}
            <div className={cardCls}>
              <h3 className={headCls}>Number of Coats</h3>
              <div className="flex gap-2">
                {[1, 2, 3].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCoats(c)}
                    className={`flex-1 h-10 rounded-xl text-body-sm font-bold border-2 transition-all ${
                      coats === c
                        ? "border-[#2D1B69] bg-[#2D1B69] text-white"
                        : "border-[#DDD6EE] text-[#9B8CB5] hover:border-[#C9B8E8]"
                    }`}
                  >
                    {c} Coat{c > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="rounded-2xl border border-[#7CB518]/30 bg-[#F0F9E8] p-5">
              <h3 className="text-body-sm font-bold text-[#150726] mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#7CB518]" /> Estimated Materials
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Paintable Area", value: `${paint.wallArea} sq ft`, icon: <Grid3X3 className="h-4 w-4 text-[#2D1B69]" /> },
                  { label: "Paint Needed", value: `${paint.paintLitres}L`, icon: <Paintbrush className="h-4 w-4 text-[#E91E63]" /> },
                  { label: "Primer Needed", value: `${paint.primerLitres}L`, icon: <Layers className="h-4 w-4 text-[#00BCD4]" /> },
                  { label: "Wall Putty", value: `${paint.puttyKg} kg`, icon: <Layers className="h-4 w-4 text-[#FF9800]" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-2 rounded-xl bg-white p-3 border border-[#7CB518]/10">
                    {icon}
                    <div>
                      <p className="text-tiny text-[#9B8CB5] font-semibold">{label}</p>
                      <p className="text-body-md font-extrabold text-[#150726]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-tiny text-[#9B8CB5]">Assumes 120 sq ft coverage per litre per coat, 0.3 kg putty per sq ft.</p>
            </div>
          </>
        )}

        {tab === "tiles" && (
          <>
            <div className={cardCls}>
              <h3 className={headCls}>Floor Area & Tile Size</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="calc-tile-area" className={labelCls}>Area (sq ft)</label>
                  <input id="calc-tile-area" type="number" value={tileArea} onChange={(e) => setTileArea(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="calc-tile-len" className={labelCls}>Tile L (inch)</label>
                  <input id="calc-tile-len" type="number" value={tileLen} onChange={(e) => setTileLen(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="calc-tile-wid" className={labelCls}>Tile W (inch)</label>
                  <input id="calc-tile-wid" type="number" value={tileWid} onChange={(e) => setTileWid(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
                </div>
              </div>
              <h3 className={`${headCls} mt-4`}>Wastage (cuts & breakage)</h3>
              <div className="flex gap-2">
                {[5, 10, 15].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWastage(w)}
                    className={`flex-1 h-10 rounded-xl text-body-sm font-bold border-2 transition-all ${
                      wastage === w
                        ? "border-[#2D1B69] bg-[#2D1B69] text-white"
                        : "border-[#DDD6EE] text-[#9B8CB5] hover:border-[#C9B8E8]"
                    }`}
                  >
                    {w}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#7CB518]/30 bg-[#F0F9E8] p-5">
              <h3 className="text-body-sm font-bold text-[#150726] mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#7CB518]" /> Estimated Materials
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Tiles", value: `${tiles.tileCount}` },
                  { label: "Adhesive", value: `${tiles.adhesiveBags} bags` },
                  { label: "Grout", value: `${tiles.groutKg} kg` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white p-3 border border-[#7CB518]/10 text-center">
                    <p className="text-tiny text-[#9B8CB5] font-semibold">{label}</p>
                    <p className="text-body-md font-extrabold text-[#150726]">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-tiny text-[#9B8CB5]">Assumes 20 kg adhesive bag covers ~55 sq ft, 1 kg grout per ~100 sq ft, rounded up to whole packs.</p>
            </div>
          </>
        )}

        {tab === "concrete" && (
          <>
            <div className={cardCls}>
              <h3 className={headCls}>Slab / Member Size</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="calc-slab-len" className={labelCls}>Length (ft)</label>
                  <input id="calc-slab-len" type="number" value={slabL} onChange={(e) => setSlabL(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="calc-slab-wid" className={labelCls}>Width (ft)</label>
                  <input id="calc-slab-wid" type="number" value={slabW} onChange={(e) => setSlabW(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="calc-slab-thick" className={labelCls}>Thick (inch)</label>
                  <input id="calc-slab-thick" type="number" value={slabT} onChange={(e) => setSlabT(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
                </div>
              </div>
              <h3 className={`${headCls} mt-4`}>Grade (cement : sand : aggregate)</h3>
              <div className="flex gap-2">
                {(["M15", "M20", "M25"] as ConcreteGrade[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`flex-1 h-10 rounded-xl text-body-sm font-bold border-2 transition-all ${
                      grade === g
                        ? "border-[#2D1B69] bg-[#2D1B69] text-white"
                        : "border-[#DDD6EE] text-[#9B8CB5] hover:border-[#C9B8E8]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#7CB518]/30 bg-[#F0F9E8] p-5">
              <h3 className="text-body-sm font-bold text-[#150726] mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#7CB518]" /> Estimated Materials
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Cement (50 kg)", value: `${concrete.cementBags} bags` },
                  { label: "Sand", value: `${concrete.sandCuft} cu ft (${concrete.sandBrass} brass)` },
                  { label: "Aggregate", value: `${concrete.aggCuft} cu ft (${concrete.aggBrass} brass)` },
                  { label: "Wet Volume", value: `${concrete.wetVolumeCuft} cu ft` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white p-3 border border-[#7CB518]/10">
                    <p className="text-tiny text-[#9B8CB5] font-semibold">{label}</p>
                    <p className="text-body-md font-extrabold text-[#150726]">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-tiny text-[#9B8CB5]">Assumes dry-volume factor 1.52, cement 1440 kg/m³, 1 brass = 100 cu ft. Sand/aggregate sold separately.</p>
            </div>
          </>
        )}

        {tab === "steel" && (
          <>
            <div className={cardCls}>
              <h3 className={headCls}>Bar Diameter</h3>
              <div className="flex flex-wrap gap-2">
                {[8, 10, 12, 16, 20].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSteelDia(d)}
                    className={`flex-1 min-w-[56px] h-10 rounded-xl text-body-sm font-bold border-2 transition-all ${
                      steelDia === d
                        ? "border-[#2D1B69] bg-[#2D1B69] text-white"
                        : "border-[#DDD6EE] text-[#9B8CB5] hover:border-[#C9B8E8]"
                    }`}
                  >
                    {d} mm
                  </button>
                ))}
              </div>
              <h3 id="calc-steel-len-label" className={`${headCls} mt-4`}>Total Running Length (meters)</h3>
              <input id="calc-steel-len" aria-labelledby="calc-steel-len-label" type="number" value={steelLen} onChange={(e) => setSteelLen(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
              <p className="mt-2 text-tiny text-[#9B8CB5]">Add up all bars, stirrups and laps in running meters.</p>
            </div>

            <div className="rounded-2xl border border-[#7CB518]/30 bg-[#F0F9E8] p-5">
              <h3 className="text-body-sm font-bold text-[#150726] mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#7CB518]" /> Estimated Materials
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Per Meter", value: `${steel.kgPerMeter} kg` },
                  { label: "Total Steel", value: `${steel.totalKg} kg` },
                  { label: "12 m Bars", value: `${steel.bars12m}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white p-3 border border-[#7CB518]/10 text-center">
                    <p className="text-tiny text-[#9B8CB5] font-semibold">{label}</p>
                    <p className="text-body-md font-extrabold text-[#150726]">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-tiny text-[#9B8CB5]">Assumes d²/162.2 kg per meter (IS 456), standard 12 m bars.</p>
            </div>

            <div className="rounded-2xl border border-dashed border-[#2D1B69]/30 bg-[#F0ECF9] p-5 text-center">
              <Zap className="h-6 w-6 text-[#2D1B69] mx-auto mb-2" />
              <p className="text-body-sm font-bold text-[#150726]">TMT steel coming soon to MODIT</p>
              <p className="text-caption text-[#9B8CB5] mt-1">Get contractor rates for {steel.totalKg} kg ({steelDia} mm) via quote</p>
              <Link href="/rfq" className="btn-shine mt-3 inline-flex items-center gap-2 bg-[#2D1B69] text-white text-caption font-bold px-5 py-2.5 rounded-full hover:bg-[#150726] transition-all">
                Request Quote <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}

        {/* Recommended Products */}
        {recommendations.length > 0 && (
          <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-body-sm font-bold text-[#150726]">Recommended Products</h3>
              <button
                onClick={handleAddAll}
                disabled={addedItems.length > 0}
                className="btn-shine flex items-center gap-1.5 rounded-xl bg-[#7CB518] text-white text-caption font-bold px-4 py-2 hover:bg-[#6A9C14] transition-all disabled:opacity-50"
              >
                {addedItems.length > 0 ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Added!</>
                ) : (
                  <><ShoppingCart className="h-3.5 w-3.5" /> Add All</>
                )}
              </button>
            </div>
            <div className="space-y-2">
              {recommendations.map((item) => (
                <Link
                  key={item.name}
                  href={productLink(item.product)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F6FC] hover:bg-[#F0ECF9] transition-colors"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-semibold text-[#150726] truncate">{item.product.name}</p>
                    <p className="text-tiny text-[#9B8CB5]">{item.product.brand} · {item.product.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-micro font-bold text-[#150726]">Qty: {item.quantity}</p>
                    <p className="text-tiny text-[#9B8CB5]">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#DDD6EE] flex justify-between">
              <span className="text-caption font-semibold text-[#9B8CB5]">Estimated Total</span>
              <span className="text-body-lg font-extrabold text-[#2D1B69]">
                ₹{recommendations.reduce((sum, r) => sum + r.product.price * r.quantity, 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}

        {/* Delivery note */}
        <div className="rounded-2xl border border-[#00BCD4]/20 bg-[#E8F9FC] p-4 flex items-center gap-3">
          <Truck className="h-5 w-5 text-[#00BCD4] flex-shrink-0" />
          <div>
            <p className="text-caption font-bold text-[#150726]">60-Minute Delivery</p>
            <p className="text-micro text-[#9B8CB5]">All materials delivered to your site within 60 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
