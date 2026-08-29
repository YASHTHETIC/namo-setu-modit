"use client";

import { useState } from "react";
import { Gift, Copy, Check, Share2, Users, X } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";

interface ReferralModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReferralModal({ open, onClose }: ReferralModalProps) {
  const { referralCode } = useWalletStore();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join MODIT",
        text: `Use my referral code ${referralCode} on MODIT and get ₹200 off your first order!`,
        url: `https://modit-web-prod.vercel.app/auth/register?ref=${referralCode}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-[360px] bg-white rounded-3xl overflow-hidden animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative p-6 text-center" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #4A2D8C 100%)" }}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
            <X className="h-4 w-4" />
          </button>
          <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <Gift className="h-7 w-7 text-[#FFD700]" />
          </div>
          <h2 className="text-[18px] font-extrabold text-white">Invite Friends, Earn ₹200</h2>
          <p className="text-[12px] text-white/60 mt-1">Share your code with friends. Both get ₹200 off!</p>
        </div>

        {/* Referral code */}
        <div className="p-6">
          <p className="text-[11px] font-bold text-[#9B8CB5] uppercase text-center mb-2">Your Referral Code</p>
          <div className="bg-[#F8F6FC] border-2 border-dashed border-[#2D1B69] rounded-xl p-4 text-center">
            <p className="text-[24px] font-extrabold text-[#2D1B69] tracking-widest">{referralCode}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-[18px] font-extrabold text-[#2D1B69]">0</p>
              <p className="text-[10px] text-[#9B8CB5] font-semibold">Friends Invited</p>
            </div>
            <div className="h-8 w-px bg-[#DDD6EE]" />
            <div className="text-center">
              <p className="text-[18px] font-extrabold text-[#7CB518]">₹0</p>
              <p className="text-[10px] text-[#9B8CB5] font-semibold">Earned</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2D1B69] text-white text-[13px] font-bold hover:bg-[#1a0f3d] transition-all">
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Code</>}
            </button>
            <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7CB518] text-white text-[13px] font-bold hover:bg-[#6A9C14] transition-all">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          {/* How it works */}
          <div className="mt-5 bg-[#F8F6FC] rounded-xl p-4">
            <p className="text-[11px] font-bold text-[#150726] mb-2">How it works</p>
            <div className="space-y-2">
              {[
                { step: "1", text: "Share your referral code" },
                { step: "2", text: "Friend signs up with your code" },
                { step: "3", text: "Both get ₹200 off on first order" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#2D1B69] flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{item.step}</span>
                  </div>
                  <p className="text-[11px] text-[#6B5B8A]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
