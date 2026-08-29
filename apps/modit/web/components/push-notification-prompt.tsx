"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, X, Check } from "lucide-react";

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        const dismissed = localStorage.getItem("modit_push_dismissed");
        if (!dismissed) {
          const timer = setTimeout(() => setShow(true), 10000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const handleAllow = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShow(false);
      if (result === "granted") {
        new Notification("MODIT Notifications Enabled", {
          body: "You'll receive updates on orders, deals, and delivery status.",
          icon: "/modit-logo.png",
        });
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("modit_push_dismissed", "true");
  };

  if (!show || permission !== "default") return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] max-w-[400px] mx-auto">
      <div className="bg-[#150726] rounded-2xl border border-white/10 p-4 shadow-2xl shadow-black/40">
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-white/30 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-[#E91E63]/20 flex items-center justify-center flex-shrink-0">
            <BellRing className="h-5 w-5 text-[#E91E63]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-white">Stay Updated</p>
            <p className="text-[11px] text-white/50 mt-0.5">Get notified about order status, flash deals, and delivery updates</p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleAllow} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7CB518] text-white text-[11px] font-bold hover:bg-[#6A9C14] transition-all">
                <Check className="h-3 w-3" /> Enable
              </button>
              <button onClick={handleDismiss} className="px-4 py-2 rounded-full bg-white/10 text-white/50 text-[11px] font-semibold hover:bg-white/15 transition-all">
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
