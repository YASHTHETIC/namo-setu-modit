"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  Camera,
  Upload,
  Check,
  ShoppingCart,
  Sliders,
  RefreshCw,
  Sun,
  Layers,
  ChevronRight,
  Maximize2,
  Share2,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@foundation/ui";
import { formatINR2 } from "@/lib/utils";
import type { DisplayProduct } from "@/lib/pricing";

interface AiRoomVisualizerProps {
  open: boolean;
  onClose: () => void;
  product: DisplayProduct;
  initialShade?: string | null;
  initialShadeColor?: string | null;
  selectedVariantId?: string | null;
}

interface RoomScene {
  id: string;
  name: string;
  category: "interior" | "exterior";
  wallColor: string; // Base wall mask fill
  wallPath: string; // SVG path for the wall polygon
  furnitureImage?: string;
  ambientLight: number; // 0.8 - 1.2
}

const SAMPLE_ROOMS: RoomScene[] = [
  {
    id: "living-room",
    name: "Modern Living Room",
    category: "interior",
    wallColor: "#E8E4DF",
    wallPath: "M 0 0 L 1000 0 L 1000 650 L 750 650 L 750 520 L 250 520 L 250 650 L 0 650 Z",
    ambientLight: 1.0,
  },
  {
    id: "exterior-facade",
    name: "Exterior House Facade",
    category: "exterior",
    wallColor: "#DED9D2",
    wallPath: "M 50 120 L 500 20 L 950 120 L 950 700 L 50 700 Z",
    ambientLight: 1.15,
  },
  {
    id: "master-bedroom",
    name: "Master Bedroom Accent",
    category: "interior",
    wallColor: "#EDE8E1",
    wallPath: "M 0 0 L 1000 0 L 1000 580 L 800 580 L 800 500 L 200 500 L 200 580 L 0 580 Z",
    ambientLight: 0.95,
  },
  {
    id: "modern-kitchen",
    name: "Dining & Kitchen Wall",
    category: "interior",
    wallColor: "#F2EFEB",
    wallPath: "M 0 0 L 1000 0 L 1000 600 L 600 600 L 600 480 L 0 480 Z",
    ambientLight: 1.05,
  },
];

export function AiRoomVisualizer({
  open,
  onClose,
  product,
  initialShade,
  initialShadeColor,
  selectedVariantId,
}: AiRoomVisualizerProps) {
  const [activeRoom, setActiveRoom] = useState<RoomScene>(SAMPLE_ROOMS[0]);
  const [selectedShadeName, setSelectedShadeName] = useState<string>(
    initialShade || product.shades?.[0]?.name || "Soft Lilac"
  );
  const [selectedShadeHex, setSelectedShadeHex] = useState<string>(
    initialShadeColor ||
      product.shades?.find((s) => s.name === (initialShade || "Soft Lilac"))?.code ||
      "#8A6FA0"
  );
  const [finish, setFinish] = useState<"matte" | "silk" | "gloss">("silk");
  const [coats, setCoats] = useState<1 | 2>(2);
  const [lightMode, setLightMode] = useState<"day" | "warm">("day");
  const [showOriginal, setShowOriginal] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  const fileInputId = useId();

  // Sync when initial shade changes
  useEffect(() => {
    if (initialShade) {
      setSelectedShadeName(initialShade);
      const match = product.shades?.find((s) => s.name === initialShade);
      if (match) setSelectedShadeHex(match.code);
    }
  }, [initialShade, product.shades]);

  if (!open) return null;

  const handleSelectShade = (name: string, hex: string) => {
    setSelectedShadeName(name);
    setSelectedShadeHex(hex);
  };

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomImage(event.target?.result as string);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    const variantId = selectedVariantId || product.variants?.[0]?.id;
    addItem(product, 1, variantId, selectedShadeName);
    setAddedSuccess(true);
    toast.success(
      "Paint Shade Added to Cart",
      `${product.name} in ${selectedShadeName} added with 60-min delivery.`
    );
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1200);
  };

  // Compute realistic wall opacity and specular shine
  const wallOpacity = coats === 2 ? 0.88 : 0.65;
  const finishSheen =
    finish === "gloss" ? "brightness-110 contrast-105" : finish === "silk" ? "brightness-105" : "brightness-95";

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 animate-[fadeIn_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-[#150726] border border-white/15 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0C0313]/90">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#7CB518] to-[#2D1B69] flex items-center justify-center text-white shadow-md">
              <Sparkles className="h-4 w-4 text-[#F8CB46] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-micro font-black uppercase tracking-wider text-[#7CB518]">
                  AI Wall & Room Visualizer
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-tiny font-bold text-white/80">
                  Real-Time Tint
                </span>
              </div>
              <h2 className="text-body-md sm:text-title-sm font-extrabold text-white leading-tight">
                Preview <span className="text-[#F8CB46]">{selectedShadeName}</span> on Real Walls
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              aria-label="Close visualizer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Workspace (Split Grid: Canvas Stage on Left, Controls on Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: The Room Preview Stage (Col 1-8) */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between bg-radial from-[#1E0D36] to-[#0A0210] relative min-h-[340px] sm:min-h-[460px]">
            {/* Room Canvas Container */}
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl flex items-center justify-center select-none">
              {isProcessing && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                  <RefreshCw className="h-8 w-8 text-[#7CB518] animate-spin mb-2" />
                  <p className="text-caption font-bold text-white">AI Analyzing Room Lighting...</p>
                </div>
              )}

              {/* Base Room Illustration with Realistic Wall & Furniture Layers */}
              {customImage ? (
                // User uploaded custom room
                <div className="relative h-full w-full">
                  <Image
                    src={customImage}
                    alt="Custom Room"
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-contain"
                  />
                  {/* Tint overlay applied to custom room */}
                  {!showOriginal && (
                    <div
                      className={`pointer-events-none absolute inset-0 mix-blend-multiply transition-all duration-500 ${finishSheen}`}
                      style={{
                        backgroundColor: selectedShadeHex,
                        opacity: wallOpacity * 0.75,
                      }}
                    />
                  )}
                </div>
              ) : (
                // SVG Photorealistic Architectural Scene
                <div className="relative h-full w-full min-h-[300px] flex items-center justify-center">
                  <svg viewBox="0 0 1000 700" className="w-full h-full object-cover">
                    <defs>
                      {/* Gradient for realistic room lighting and sunlight shadow */}
                      <linearGradient id="sunlight" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={lightMode === "warm" ? "#FFF3E0" : "#ffffff"} stopOpacity={lightMode === "warm" ? "0.55" : "0.4"} />
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
                      </linearGradient>
                      <radialGradient id="ceilingLight" cx="50%" cy="10%" r="70%">
                        <stop offset="0%" stopColor={lightMode === "warm" ? "#FF9800" : "#FFF9E6"} stopOpacity={lightMode === "warm" ? "0.4" : "0.5"} />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
                      </radialGradient>
                    </defs>

                    {/* Ceiling */}
                    <polygon points="0,0 1000,0 850,140 150,140" fill="#EAE5DF" />

                    {/* Left Side Wall */}
                    <polygon points="0,0 150,140 150,600 0,700" fill="#D3CCC4" />

                    {/* Right Side Wall */}
                    <polygon points="1000,0 850,140 850,600 1000,700" fill="#BDB5AC" />

                    {/* Flooring (Hardwood Oak Planks) */}
                    <polygon points="0,700 150,600 850,600 1000,700" fill="#8B5A2B" opacity="0.9" />

                    {/* Back Main Accent Wall (The Tinted Surface) */}
                    <rect
                      x="150"
                      y="140"
                      width="700"
                      height="460"
                      fill={showOriginal ? activeRoom.wallColor : selectedShadeHex}
                      className="transition-colors duration-500"
                      style={{ opacity: showOriginal ? 1 : wallOpacity }}
                    />

                    {/* Ambient Wall Lighting & Specular Texture */}
                    <rect
                      x="150"
                      y="140"
                      width="700"
                      height="460"
                      fill="url(#sunlight)"
                      style={{ mixBlendMode: "overlay" }}
                    />

                    {/* Room Furniture Overlay (Couch, Plant, Art Frame, Floor Lamp) */}
                    {activeRoom.id === "living-room" && (
                      <g>
                        {/* Designer Wall Art Frame */}
                        <rect x="420" y="200" width="160" height="120" fill="#FFFFFF" stroke="#222" strokeWidth="6" rx="4" />
                        <rect x="435" y="215" width="130" height="90" fill="#2D1B69" opacity="0.75" />
                        <circle cx="500" cy="260" r="24" fill="#F8CB46" />

                        {/* Modern Sofa */}
                        <path d="M 260 480 Q 260 430 320 430 L 680 430 Q 740 430 740 480 L 750 560 L 250 560 Z" fill="#2C3E50" />
                        <rect x="280" y="520" width="440" height="40" rx="8" fill="#34495E" />
                        <rect x="290" y="560" width="12" height="24" fill="#111" />
                        <rect x="698" y="560" width="12" height="24" fill="#111" />

                        {/* Fiddle Leaf Fig Plant on Left */}
                        <ellipse cx="200" cy="540" rx="20" ry="8" fill="#5D4037" />
                        <path d="M 195 540 L 190 440" stroke="#2E7D32" strokeWidth="4" />
                        <ellipse cx="180" cy="420" rx="22" ry="14" fill="#4CAF50" />
                        <ellipse cx="210" cy="440" rx="20" ry="12" fill="#388E3C" />
                      </g>
                    )}

                    {/* Bedroom Headboard Scene */}
                    {activeRoom.id === "master-bedroom" && (
                      <g>
                        <rect x="300" y="380" width="400" height="140" rx="16" fill="#3E2723" />
                        <path d="M 280 500 L 720 500 L 700 620 L 300 620 Z" fill="#ECEFF1" />
                        <rect x="340" y="470" width="140" height="40" rx="6" fill="#CFD8DC" />
                        <rect x="520" y="470" width="140" height="40" rx="6" fill="#CFD8DC" />
                      </g>
                    )}

                    {/* Ambient light glow over scene */}
                    <rect x="0" y="0" width="1000" height="700" fill="url(#ceilingLight)" style={{ mixBlendMode: "screen", pointerEvents: "none" }} />
                  </svg>
                </div>
              )}

              {/* Floating Live Badge: Active Shade + Code */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/20 text-tiny font-bold text-white shadow-lg">
                <span
                  className="h-3 w-3 rounded-full border border-white/40 ring-2 ring-black/40 shadow-xs"
                  style={{ backgroundColor: selectedShadeHex }}
                />
                <span>{selectedShadeName}</span>
                <span className="font-mono text-white/60 text-micro">({selectedShadeHex})</span>
              </div>

              {/* Lighting Ambient Switcher (Daylight vs Warm Glow) */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20">
                <button
                  type="button"
                  onClick={() => setLightMode("day")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-tiny font-bold transition-all cursor-pointer ${
                    lightMode === "day" ? "bg-white text-black shadow-xs" : "text-white/70 hover:text-white"
                  }`}
                >
                  <Sun className="h-3 w-3 text-amber-500" />
                  Daylight
                </button>
                <button
                  type="button"
                  onClick={() => setLightMode("warm")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-tiny font-bold transition-all cursor-pointer ${
                    lightMode === "warm" ? "bg-amber-400 text-black shadow-xs" : "text-white/70 hover:text-white"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-amber-800" />
                  Warm Light
                </button>
              </div>

              {/* Before/After Toggle Floating Button */}
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                <button
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                  className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3.5 py-1.5 border border-white/25 text-tiny font-extrabold text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  {showOriginal ? "Showing Original" : "Hold to See Original"}
                </button>
              </div>
            </div>

            {/* Room Scene Selector Bar */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              {SAMPLE_ROOMS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setCustomImage(null);
                    setActiveRoom(room);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-tiny font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeRoom.id === room.id && !customImage
                      ? "bg-[#7CB518] text-white shadow-md shadow-green-600/30 ring-1 ring-white/30"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  }`}
                >
                  <span>{room.name}</span>
                </button>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-tiny font-bold whitespace-nowrap transition-all cursor-pointer ${
                  customImage
                    ? "bg-[#7CB518] text-white shadow-md"
                    : "bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:opacity-90"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Upload Room Photo</span>
              </button>
              <label htmlFor={fileInputId} className="sr-only">
                Upload Room Photo
              </label>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomPhotoUpload}
              />
            </div>
          </div>

          {/* Right: Shade Selection & Coating Controls (Col 9-12) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-[#120521] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Finish & Coating Controls */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-tiny font-black uppercase text-white/60 tracking-wider">
                    Paint Finish
                  </span>
                  <span className="text-tiny font-bold text-[#7CB518] capitalize">
                    {finish} Sheen
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
                  {(["matte", "silk", "gloss"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFinish(f)}
                      className={`py-1.5 rounded-lg text-tiny font-bold capitalize transition-all cursor-pointer ${
                        finish === f
                          ? "bg-[#2D1B69] text-white shadow-sm ring-1 ring-[#7CB518]"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-tiny font-black uppercase text-white/60 tracking-wider">
                    Coat Coverage
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCoats(1)}
                      className={`px-2.5 py-1 rounded-lg text-tiny font-bold cursor-pointer ${
                        coats === 1 ? "bg-[#7CB518] text-white" : "bg-white/10 text-white/60"
                      }`}
                    >
                      1 Coat
                    </button>
                    <button
                      onClick={() => setCoats(2)}
                      className={`px-2.5 py-1 rounded-lg text-tiny font-bold cursor-pointer ${
                        coats === 2 ? "bg-[#7CB518] text-white" : "bg-white/10 text-white/60"
                      }`}
                    >
                      2 Coats (IS Recom.)
                    </button>
                  </div>
                </div>
              </div>

              {/* Shade Fan-Deck Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-extrabold text-white">
                    Choose Colour Shade
                  </span>
                  <span className="text-micro font-bold text-[#7CB518]">
                    {product.shades?.length || 20} Colours Available
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 max-h-[180px] overflow-y-auto thin-scroll p-1">
                  {(product.shades ?? []).map((sh) => {
                    const active = selectedShadeName === sh.name;
                    return (
                      <button
                        key={sh.name}
                        onClick={() => handleSelectShade(sh.name, sh.code)}
                        className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${
                          active
                            ? "bg-white/20 ring-2 ring-[#7CB518] scale-105"
                            : "hover:bg-white/10 opacity-80 hover:opacity-100"
                        }`}
                        title={`${sh.name} (${sh.code})`}
                      >
                        <span
                          className="h-8 w-8 rounded-full border border-black/20 shadow-sm"
                          style={{ backgroundColor: sh.code }}
                        />
                        <span className="text-tiny font-semibold text-white/90 text-center truncate w-full">
                          {sh.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom 1-Tap Add to Cart Bar */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-tiny text-white/60">Selected Paint & Shade</p>
                  <p className="text-caption font-bold text-white truncate max-w-[200px]">
                    {product.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-black text-[#7CB518]">
                    {formatINR2(product.price)}
                  </p>
                  <p className="text-tiny text-white/50">60-Min Express Dispatch</p>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addedSuccess}
                className={`w-full py-3.5 rounded-2xl text-body-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                  addedSuccess
                    ? "bg-[#7CB518] text-white"
                    : "bg-gradient-to-r from-[#7CB518] to-[#689E13] hover:from-[#6EA414] hover:to-[#5E8E11] text-white shadow-green-500/25"
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="h-4 w-4" /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" /> Order {selectedShadeName} Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
