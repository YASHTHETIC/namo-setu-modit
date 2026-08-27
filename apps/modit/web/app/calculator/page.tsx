"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, Paintbrush, Layers, Grid3X3, Zap, Truck, ShoppingCart, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { products } from "@/lib/product-data";

type RoomType = "bedroom" | "living" | "kitchen" | "bathroom" | "hall";

const roomPresets: Record<RoomType, { label: string; defaultArea: number; defaultHeight: number }> = {
  bedroom: { label: "Bedroom", defaultArea: 120, defaultHeight: 10 },
  living: { label: "Living Room", defaultArea: 200, defaultHeight: 10 },
  kitchen: { label: "Kitchen", defaultArea: 80, defaultHeight: 10 },
  bathroom: { label: "Bathroom", defaultArea: 50, defaultHeight: 8 },
  hall: { label: "Hall / Office", defaultArea: 300, defaultHeight: 10 },
};

export default function CalculatorPage() {
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [roomType, setRoomType] = useState<RoomType>("bedroom");
  const [area, setArea] = useState(120);
  const [height, setHeight] = useState(10);
  const [coats, setCoats] = useState(2);
  const [wallOnly, setWallOnly] = useState(true);
  const [addedItems, setAddedItems] = useState<string[]>([]);

  const estimate = useMemo(() => {
    const wallArea = wallOnly ? area * 2 * height : area * 2 * height + area;
    const coveragePerLitre = 120;
    const paintLitres = Math.ceil((wallArea * coats) / coveragePerLitre);
    const primerLitres = Math.ceil(wallArea / coveragePerLitre);
    const puttyKg = Math.ceil(wallArea * 0.3);
    const tapeMeters = Math.ceil((wallArea / 100) * 4);
    const rollerCount = Math.max(1, Math.ceil(wallArea / 200));

    return { wallArea, paintLitres, primerLitres, puttyKg, tapeMeters, rollerCount };
  }, [area, height, coats, wallOnly]);

  const recommendations = useMemo(() => {
    const items: { name: string; product: typeof products[0]; quantity: number; icon: string }[] = [];

    const primer = products.find((p) => p.id === "paint-asian-primer");
    if (primer) items.push({ name: "Primer", product: primer, quantity: estimate.primerLitres, icon: "🎨" });

    const putty = products.find((p) => p.id === "paint-asian-putty");
    if (putty) items.push({ name: "Wall Putty", product: putty, quantity: Math.ceil(estimate.puttyKg / 20), icon: "🧱" });

    const roller = products.find((p) => p.id === "paint-roller");
    if (roller) items.push({ name: "Paint Roller", product: roller, quantity: estimate.rollerCount, icon: "🖌️" });

    const tape = products.find((p) => p.id === "paint-masking-tape");
    if (tape) items.push({ name: "Masking Tape", product: tape, quantity: estimate.tapeMeters, icon: "📎" });

    return items;
  }, [estimate]);

  const handleAddAll = () => {
    recommendations.forEach((item) => {
      addItem(item.product, item.quantity);
    });
    setAddedItems(recommendations.map((r) => r.name));
    setTimeout(() => setAddedItems([]), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #1E0F4A 60%, #150726 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, rgba(124,181,24,0.5), transparent 50%)" }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-4 pt-4 pb-6 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/products" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-[18px] font-extrabold text-white flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#7CB518]" /> Material Calculator
              </h1>
              <p className="text-[12px] text-white/50">Estimate materials for your project</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 py-4 space-y-4 sm:px-6">
        {/* Room Type */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h3 className="text-[13px] font-bold text-[#150726] mb-3">Room Type</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(roomPresets) as RoomType[]).map((type) => (
              <button
                key={type}
                onClick={() => { setRoomType(type); setArea(roomPresets[type].defaultArea); setHeight(roomPresets[type].defaultHeight); }}
                className={`rounded-xl px-4 py-2 text-[12px] font-semibold border-2 transition-all ${
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
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h3 className="text-[13px] font-bold text-[#150726] mb-3">Dimensions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#9B8CB5] uppercase">Floor Area (sq ft)</label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 w-full h-10 rounded-xl border-2 border-[#DDD6EE] px-3 text-[14px] font-semibold text-[#150726] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#9B8CB5] uppercase">Ceiling Height (ft)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 w-full h-10 rounded-xl border-2 border-[#DDD6EE] px-3 text-[14px] font-semibold text-[#150726] focus:outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={wallOnly} onChange={(e) => setWallOnly(e.target.checked)} className="h-4 w-4 rounded border-[#DDD6EE] text-[#2D1B69] focus:ring-[#2D1B69]" />
              <span className="text-[12px] font-medium text-[#150726]">Wall only (skip ceiling)</span>
            </label>
          </div>
        </div>

        {/* Paint Coats */}
        <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
          <h3 className="text-[13px] font-bold text-[#150726] mb-3">Number of Coats</h3>
          <div className="flex gap-2">
            {[1, 2, 3].map((c) => (
              <button
                key={c}
                onClick={() => setCoats(c)}
                className={`flex-1 h-10 rounded-xl text-[13px] font-bold border-2 transition-all ${
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
          <h3 className="text-[13px] font-bold text-[#150726] mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#7CB518]" /> Estimated Materials
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Paintable Area", value: `${estimate.wallArea} sq ft`, icon: <Grid3X3 className="h-4 w-4 text-[#2D1B69]" /> },
              { label: "Paint Needed", value: `${estimate.paintLitres}L`, icon: <Paintbrush className="h-4 w-4 text-[#E91E63]" /> },
              { label: "Primer Needed", value: `${estimate.primerLitres}L`, icon: <Layers className="h-4 w-4 text-[#00BCD4]" /> },
              { label: "Wall Putty", value: `${estimate.puttyKg} kg`, icon: <Layers className="h-4 w-4 text-[#FF9800]" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-white p-3 border border-[#7CB518]/10">
                {icon}
                <div>
                  <p className="text-[10px] text-[#9B8CB5] font-semibold">{label}</p>
                  <p className="text-[14px] font-extrabold text-[#150726]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Products */}
        {recommendations.length > 0 && (
          <div className="rounded-2xl border border-[#DDD6EE] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-[#150726]">Recommended Products</h3>
              <button
                onClick={handleAddAll}
                disabled={addedItems.length > 0}
                className="flex items-center gap-1.5 rounded-xl bg-[#7CB518] text-white text-[12px] font-bold px-4 py-2 hover:bg-[#6A9C14] transition-all disabled:opacity-50"
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
                  href={`/products/${item.product.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F6FC] hover:bg-[#F0ECF9] transition-colors"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#150726] truncate">{item.product.name}</p>
                    <p className="text-[10px] text-[#9B8CB5]">{item.product.brand} · {item.product.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-[#150726]">Qty: {item.quantity}</p>
                    <p className="text-[10px] text-[#9B8CB5]">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#DDD6EE] flex justify-between">
              <span className="text-[12px] font-semibold text-[#9B8CB5]">Estimated Total</span>
              <span className="text-[16px] font-extrabold text-[#2D1B69]">
                ₹{recommendations.reduce((sum, r) => sum + r.product.price * r.quantity, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Delivery note */}
        <div className="rounded-2xl border border-[#00BCD4]/20 bg-[#E8F9FC] p-4 flex items-center gap-3">
          <Truck className="h-5 w-5 text-[#00BCD4] flex-shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-[#150726]">60-Minute Delivery</p>
            <p className="text-[11px] text-[#9B8CB5]">All materials delivered to your site within 60 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
