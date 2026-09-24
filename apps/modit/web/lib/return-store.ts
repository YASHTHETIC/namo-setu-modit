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
  advanceReturn: (id: string, status: ReturnStatus, note: string) => void;
}

export const RETURN_NEXT: Record<ReturnStatus, { status: ReturnStatus; label: string; note: string }[]> = {
  requested: [
    { status: "approved", label: "Approve & schedule pickup", note: "Approved. Pickup agent will call before arriving." },
    { status: "rejected", label: "Reject", note: "Return rejected after review. Contact support for help." },
  ],
  approved: [
    { status: "picked_up", label: "Mark picked up", note: "Items picked up from site. Quality check in progress." },
  ],
  picked_up: [
    { status: "refunded", label: "Complete refund", note: "Refund processed. Amount reaches in 3–5 working days." },
  ],
  refunded: [],
  rejected: [],
};

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
      advanceReturn: (id, status, note) =>
        set((state) => ({
          returns: state.returns.map((r) =>
            r.id === id
              ? { ...r, status, statusHistory: [...r.statusHistory, { status, at: Date.now(), note }] }
              : r
          ),
        })),
    }),
    { name: "modit-returns" }
  )
);

export function refundAmount(req: ReturnRequest): number {
  return req.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}