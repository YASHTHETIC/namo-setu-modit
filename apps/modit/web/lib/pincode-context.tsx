"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PincodeContextType {
  pincode: string | null;
  setPincode: (p: string | null) => void;
  getStock: (pincodeStock?: Record<string, number>) => number;
}

const PincodeContext = createContext<PincodeContextType>({
  pincode: null,
  setPincode: () => {},
  getStock: () => 100,
});

export function PincodeProvider({ children }: { children: ReactNode }) {
  const [pincode, setPincode] = useState<string | null>(null);

  const getStock = (pincodeStock?: Record<string, number>): number => {
    if (!pincode || !pincodeStock) return 100;
    return pincodeStock[pincode] ?? 0;
  };

  return (
    <PincodeContext.Provider value={{ pincode, setPincode, getStock }}>
      {children}
    </PincodeContext.Provider>
  );
}

export const usePincode = () => useContext(PincodeContext);
