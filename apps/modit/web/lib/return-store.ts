"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReturnStatus = "requested" | "approved" | "picked_up" | "refunded" | "rejected";

export interface ReturnItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  items: ReturnItem[];
  reason: string;
  detail: string;
  refundMethod: "source" | "bank" | "upi";
  refundTarget: string;
  phone: string;
  status: ReturnStatus;
  statusHistory: Array<{ status: ReturnStatus; at: number; note: string }>;
  createdAt: number;
}

interface ReturnState {
  returns: ReturnRequest[];
  createReturn: (input: Omit<ReturnRequest, "id" | "status" | "statusHistory" | "createdAt">) => ReturnRequest;
  getReturnForOrder: (orderId: string) => ReturnRequest | undefined;
}

export const RETURN_REASONS = [
  "Damaged in transit",
  "Wrong item delivered",
  "Quantity mismatch",
  "Quality not as specified",
  "Ordered by mistake",
  "Delayed delivery",
  "Other",
];

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Return requested",
  approved: "Approved — pickup scheduled",
  picked_up: "Picked up from site",
  refunded: "Refund completed",
  rejected: "Return rejected",
};

export const useReturnStore = create<ReturnState>()(
  persist(
    (set, get) => ({
      returns: [],
      createReturn: (input) => {
        const req: ReturnRequest = {
          ...input,
          id: `RTN-${Date.now().toString(36).toUpperCase()}`,
          status: "requested",
          statusHistory: [{ status: "requested", at: Date.now(), note: "Request received. Our team will review within 24 hours." }],
          createdAt: Date.now(),
        };
        set((state) => ({ returns: [req, ...state.returns] }));
        return req;
      },
      getReturnForOrder: (orderId) => get().returns.find((r) => r.orderId === orderId),
    }),
    { name: "modit-returns" }
  )
);

export function refundAmount(req: ReturnRequest): number {
  return req.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}