"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, LocateFixed, Check, Store } from "lucide-react";
import { usePincode } from "@/lib/pincode-context";
import { useNearestWarehouse } from "@/lib/modit-api";
import { onlyDigits } from "@/lib/utils";

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
    const clean = onlyDigits(manual, 6);
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
        className="flex flex-col items-start leading-tight px-1 py-1 text-left"
        aria-label="Delivery location"
      >
        <span className="text-body-sm font-extrabold text-[var(--text)]">Delivery in 60 min</span>
        <span className="flex items-center gap-1 text-caption font-semibold text-[var(--text-secondary)]">
          <span className={`h-1.5 w-1.5 rounded-full ${pincode ? (serviceable ? "bg-[#7CB518]" : "bg-[#E91E63]") : "bg-[var(--brand)]"}`} />
          <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="max-w-[180px] truncate tabular-nums">{pincode ?? "Set location"}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 w-72 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xl)] animate-[fadeIn_0.2s_ease-out]">
          <p className="text-caption font-bold text-[#150726]">Delivery location</p>
          <p className="text-micro text-[#9B8CB5] mt-0.5">Set after login automatically, or pick here.</p>

          <button
            onClick={handleLive}
            disabled={locating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D1B69] py-2.5 text-caption font-bold text-white hover:bg-[#1E1245] disabled:opacity-50 transition-all"
          >
            <LocateFixed className="h-4 w-4" /> {locating ? "Detecting..." : "Use my current location"}
          </button>

          <div className="my-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#F0ECF9]" />
            <span className="text-tiny font-bold text-[#9B8CB5]">OR</span>
            <div className="h-px flex-1 bg-[#F0ECF9]" />
          </div>

          <div className="flex gap-2 items-stretch">
            <input
              value={manual}
              onChange={(e) => { setManual(onlyDigits(e.target.value, 6)); setError(""); }}
              inputMode="numeric"
              placeholder="Pincode"
              aria-label="Enter pincode manually"
              className="flex-1 min-w-0 rounded-xl border border-[#DDD6EE] px-3 h-11 text-body-lg font-bold tabular-nums focus:outline-none focus:border-[#2D1B69]"
            />
            <button onClick={handleManual} className="rounded-xl bg-[#F0ECF9] px-4 h-11 inline-flex items-center justify-center text-caption font-bold text-[#2D1B69] hover:bg-[#E8E0F7] flex-shrink-0">
              Set
            </button>
          </div>

          {error && <p className="mt-2 text-micro font-semibold text-red-500">{error}</p>}
          {saved && (
            <p className="mt-2 flex items-center gap-1 text-micro font-bold text-[#7CB518]">
              <Check className="h-3.5 w-3.5" /> Location saved{pincode && !serviceable ? " — not serving this area yet" : ""}
            </p>
          )}
          {pincode && (
            <p className="mt-2 text-micro text-[#9B8CB5]">
              Current: <span className="font-bold text-[#150726] tabular-nums">{pincode}</span>{" "}
              <span className={`font-bold ${serviceable ? "text-[#7CB518]" : "text-[#E91E63]"}`}>
                {serviceable ? "· Serviceable" : "· Not serviceable"}
              </span>
            </p>
          )}
          {nearest && (
            <p className="mt-2 flex items-center gap-1 text-micro font-bold text-[#2D1B69]">
              <Store className="h-3.5 w-3.5" />
              Ships from {nearest.name} · {nearest.distance_km} km away
            </p>
          )}
        </div>
      )}
    </div>
  );
}
