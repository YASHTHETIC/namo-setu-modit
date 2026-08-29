"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PincodeContextType {
  pincode: string | null;
  setPincode: (p: string | null) => void;
  getStock: (pincodeStock?: Record<string, number>) => number;
}

const PincodeContext = createContext<PincodeContextType>({
  pincode: null,
  setPincode: () => {},
  getStock: () => -1,
});

export function PincodeProvider({ children }: { children: ReactNode }) {
  const [pincode, setPincode] = useState<string | null>(null);

  const getStock = useCallback((pincodeStock?: Record<string, number>): number => {
    if (!pincode || !pincodeStock) return -1;
    if (!(pincode in pincodeStock)) return -1;
    return pincodeStock[pincode];
  }, [pincode]);

  return (
    <PincodeContext.Provider value={{ pincode, setPincode, getStock }}>
      {children}
    </PincodeContext.Provider>
  );
}

export const usePincode = () => useContext(PincodeContext);
