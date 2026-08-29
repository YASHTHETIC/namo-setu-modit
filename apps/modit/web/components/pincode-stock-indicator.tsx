"use client";

import { MapPin, AlertTriangle } from "lucide-react";
import { usePincode } from "@/lib/pincode-context";

interface PincodeStockIndicatorProps {
  pincodeStock?: Record<string, number>;
}

export function PincodeStockIndicator({ pincodeStock }: PincodeStockIndicatorProps) {
  const { pincode, getStock } = usePincode();

  if (!pincode || !pincodeStock) return null;

  const stock = getStock(pincodeStock);

  if (stock === 0) {
    return (
      <div className="flex items-center gap-1 text-[9px] font-bold text-[#E91E63] bg-[#E91E63]/10 px-1.5 py-0.5 rounded-full">
        <AlertTriangle className="h-2.5 w-2.5" />
        <span>Out of stock in {pincode}</span>
      </div>
    );
  }

  if (stock <= 10) {
    return (
      <div className="flex items-center gap-1 text-[9px] font-bold text-[#FF9800] bg-[#FF9800]/10 px-1.5 py-0.5 rounded-full">
        <MapPin className="h-2.5 w-2.5" />
        <span>Only {stock} left in {pincode}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[9px] font-bold text-[#7CB518] bg-[#7CB518]/10 px-1.5 py-0.5 rounded-full">
      <MapPin className="h-2.5 w-2.5" />
      <span>In stock at {pincode}</span>
    </div>
  );
}
