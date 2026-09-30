"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isServiceablePin } from "./serviceability";

const STORAGE_KEY = "modit_pincode";

interface PincodeContextType {
  pincode: string | null;
  serviceable: boolean;
  setPincode: (p: string | null) => void;
  getStock: (pincodeStock?: Record<string, number>) => number;
  locating: boolean;
  useLiveLocation: () => Promise<string | null>;
}

const PincodeContext = createContext<PincodeContextType>({
  pincode: null,
  serviceable: false,
  setPincode: () => {},
  getStock: () => -1,
  locating: false,
  useLiveLocation: async () => null,
});

function readStored(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && /^\d{6}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Browser geolocation → pincode via free reverse-geocode (OpenStreetMap).
 * No API key needed. Returns the 6-digit pincode or null.
 */
export function fetchLivePincode(timeoutMs = 10000): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    let done = false;
    const finish = (v: string | null) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    const timer = setTimeout(() => finish(null), timeoutMs + 8000);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { Accept: "application/json" } }
          );
          if (!res.ok) {
            finish(null);
            return;
          }
          const data = await res.json();
          const pin = String(data?.address?.postcode ?? "").replace(/\D/g, "").slice(0, 6);
          finish(pin.length === 6 ? pin : null);
        } catch {
          finish(null);
        } finally {
          clearTimeout(timer);
        }
      },
      () => {
        clearTimeout(timer);
        finish(null);
      },
      { timeout: timeoutMs, maximumAge: 600000 }
    );
  });
}

export function PincodeProvider({ children }: { children: ReactNode }) {
  const [pincode, setPincodeState] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setPincodeState(readStored());
  }, []);

  const setPincode = useCallback((p: string | null) => {
    const clean = p && /^\d{6}$/.test(p.replace(/\D/g, "")) ? p.replace(/\D/g, "") : null;
    setPincodeState(clean);
    try {
      if (clean) localStorage.setItem(STORAGE_KEY, clean);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const useLiveLocation = useCallback(async () => {
    setLocating(true);
    try {
      const pin = await fetchLivePincode();
      if (pin) {
        setPincodeState(pin);
        try {
          localStorage.setItem(STORAGE_KEY, pin);
        } catch {
          /* ignore */
        }
      }
      return pin;
    } finally {
      setLocating(false);
    }
  }, []);

  const getStock = useCallback(
    (pincodeStock?: Record<string, number>): number => {
      if (!pincode || !pincodeStock) return -1;
      if (!(pincode in pincodeStock)) return -1;
      return pincodeStock[pincode];
    },
    [pincode]
  );

  return (
    <PincodeContext.Provider
      value={{ pincode, serviceable: isServiceablePin(pincode), setPincode, getStock, locating, useLiveLocation }}
    >
      {children}
    </PincodeContext.Provider>
  );
}

export const usePincode = () => useContext(PincodeContext);
