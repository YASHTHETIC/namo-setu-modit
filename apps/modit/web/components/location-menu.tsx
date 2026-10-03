"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, LocateFixed, Check, Store } from "lucide-react";
import { usePincode } from "@/lib/pincode-context";
import { useNearestWarehouse } from "@/lib/modit-api";

/** Header delivery-location picker: live GPS fix + manual pincode. */
export function LocationMenu() {
  const { pincode, serviceable, setPincode, locating, coords, useLiveLocation: fetchLocation } = usePincode();
  const { data: nearest } = useNearestWarehouse(coords?.lat, coords?.lng);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleLive = async () => {
    setError("");
    const pin = await fetchLocation();
    if (pin) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1200);
    } else {
      setError("Couldn't detect location. Enter pincode manually.");
    }
  };

  const handleManual = () => {
    const clean = manual.replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }
    setError("");
    setPincode(clean);
    setManual("");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1200);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border-r border-[var(--border-subtle)] px-4 text-sm font-semibold text-[var(--text)]"
      >
        <MapPin className={`h-4 w-4 ${pincode ? (serviceable ? "text-[#7CB518]" : "text-[#E91E63]") : "text-[var(--brand)]"}`} />
        <span className="hidden 2xl:inline tabular-nums">{pincode ?? "Delhi NCR"}</span>
        <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 w-72 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xl)] animate-[fadeIn_0.2s_ease-out]">
          <p className="text-[12px] font-bold text-[#150726]">Delivery location</p>
          <p className="text-[11px] text-[#9B8CB5] mt-0.5">Set after login automatically, or pick here.</p>

          <button
            onClick={handleLive}
            disabled={locating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D1B69] py-2.5 text-[12px] font-bold text-white hover:bg-[#1E1245] disabled:opacity-50 transition-all"
          >
            <LocateFixed className="h-4 w-4" /> {locating ? "Detecting..." : "Use my current location"}
          </button>

          <div className="my-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#F0ECF9]" />
            <span className="text-[10px] font-bold text-[#9B8CB5]">OR</span>
            <div className="h-px flex-1 bg-[#F0ECF9]" />
          </div>

          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => { setManual(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              inputMode="numeric"
              placeholder="Pincode"
              className="flex-1 rounded-xl border border-[#DDD6EE] px-3 py-2 text-[13px] font-bold tabular-nums focus:outline-none focus:border-[#2D1B69]"
            />
            <button onClick={handleManual} className="rounded-xl bg-[#F0ECF9] px-4 py-2 text-[12px] font-bold text-[#2D1B69] hover:bg-[#E4D8F7]">
              Set
            </button>
          </div>

          {error && <p className="mt-2 text-[11px] font-semibold text-red-500">{error}</p>}
          {saved && (
            <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#7CB518]">
              <Check className="h-3.5 w-3.5" /> Location saved{pincode && !serviceable ? " — not serving this area yet" : ""}
            </p>
          )}
          {pincode && (
            <p className="mt-2 text-[11px] text-[#9B8CB5]">
              Current: <span className="font-bold text-[#150726] tabular-nums">{pincode}</span>{" "}
              <span className={`font-bold ${serviceable ? "text-[#7CB518]" : "text-[#E91E63]"}`}>
                {serviceable ? "· Serviceable" : "· Not serviceable"}
              </span>
            </p>
          )}
          {nearest && (
            <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#2D1B69]">
              <Store className="h-3.5 w-3.5" />
              Ships from {nearest.name} · {nearest.distance_km} km away
            </p>
          )}
        </div>
      )}
    </div>
  );
}
