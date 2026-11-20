"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bot, MessageCircle, Send, X, Sparkles } from "lucide-react";

import {
  useCreateSupportConversation,
  usePostSupportMessage,
  useSupportConversation,
  useSupportConversations,
} from "@/lib/modit-api";
import { useAuthReady } from "@/lib/use-auth";
import { useCartStore } from "@/lib/cart-store";

const QUICK_TOPICS = [
  "Track my order",
  "Refund or replacement",
  "GST invoice",
  "60-min delivery",
  "Talk to human agent",
];

export function SupportChat() {
  const pathname = usePathname();
  const loggedIn = useAuthReady();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  // Lift above the floating View-Cart bar whenever the cart is non-empty.
  const docked = cartCount > 0;
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");

  const { data: conversations, isLoading: listLoading } = useSupportConversations(open && loggedIn);
  const { data: detail } = useSupportConversation(open && activeId ? activeId : undefined);
  const createConv = useCreateSupportConversation();
  const postMsg = usePostSupportMessage();

  const startConversation = (customSubject?: string) => {
    const clean = (customSubject ?? subject).trim();
    if (!clean) return;
    createConv.mutate(
      { subject: clean },
      {
        onSuccess: (conv) => {
          setSubject("");
          setActiveId(conv.id);
        },
      },
    );
  };

  const sendMessage = (customBody?: string) => {
    const clean = (customBody ?? draft).trim();
    if (!clean || !activeId) return;
    if (!customBody) setDraft("");
    postMsg.mutate({ conversationId: activeId, body: clean });
  };

  // Buyer chat stays on the buyer platform — never inside ops surfaces.
  const currentPath = pathname ?? "";
  if (currentPath.startsWith("/admin") || currentPath.startsWith("/supplier")) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Support chat"
        className={`fixed right-4 z-float flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#150726] to-[#2D1B69] text-white shadow-cyber-purple border border-white/20 transition-all hover:scale-105 active:scale-95 ${docked ? "dock-bubble-docked" : "dock-bubble"}`}
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7CB518] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#7CB518]"></span>
        </span>
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6 text-[#00BCD4]" />}
      </button>

      {open && (
        <div className={`fixed right-4 z-float flex h-[460px] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/95 backdrop-blur-2xl shadow-glass-elevated transition-all ${docked ? "dock-chat-open" : "dock-chat"}`}>
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#0b0318] via-[#150726] to-[#2D1B69] px-4 py-3.5 text-white border-b border-white/10">
            {activeId && (
              <button onClick={() => setActiveId(null)} aria-label="Back to threads" className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/15">
              <Bot className="h-4 w-4 text-[#00BCD4]" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#7CB518]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-extrabold flex items-center gap-1.5">
                <span>MODIT AI Concierge</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-pulse"></span>
              </p>
              <p className="text-micro text-white/70 truncate">Instant resolution · 24/7 Agent handoff</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 text-white/70 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!loggedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3.5 p-6 text-center">
              <div className="rounded-2xl bg-[#F8F6FC] border border-[#DDD6EE] p-4 text-left w-full space-y-2 shadow-xs">
                <p className="text-micro font-black uppercase text-[#7CB518] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#7CB518]" />
                  <span>Instant Concierge Assistance</span>
                </p>
                <p className="text-caption font-semibold text-[#150726]">· 60-Minute express dispatch queries</p>
                <p className="text-caption font-semibold text-[#150726]">· Real-time GST invoices &amp; ITC credit</p>
                <p className="text-caption font-semibold text-[#150726]">· 7-Day verified material replacement</p>
              </div>
              <div>
                <p className="text-body-sm font-bold text-[#2D1B69]">Log in to chat with support</p>
                <p className="text-micro text-[#9B8CB5] mt-0.5">Your conversation stays linked to your account.</p>
              </div>
              <a
                href="/auth"
                className="btn-shine specular-sheen rounded-xl bg-gradient-to-r from-[#2D1B69] to-[#150726] hover:opacity-95 px-6 py-2.5 text-caption font-extrabold text-white transition-all shadow-cyber-purple"
              >
                Log In to Chat →
              </a>
            </div>
          ) : !activeId ? (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex gap-2">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startConversation()}
                  placeholder="What do you need help with?"
                  className="flex-1 rounded-xl border border-[#DDD6EE] px-3.5 py-2 text-body-sm outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all"
                />
                <button
                  onClick={() => startConversation()}
                  disabled={createConv.isPending || !subject.trim()}
                  className="rounded-xl bg-[#2D1B69] px-4 py-2 text-body-sm font-bold text-white disabled:opacity-40 transition-all shadow-xs"
                >
                  New
                </button>
              </div>
              {/* Quick AI Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => startConversation(topic)}
                    className="rounded-full bg-[#F0ECF9] hover:bg-[#2D1B69] hover:text-white text-[#2D1B69] px-3 py-1 text-tiny font-bold transition-all border border-[#DDD6EE] active:scale-95 cursor-pointer shadow-xs"
                  >
                    {topic}
                  </button>
                ))}
              </div>
              {listLoading ? (
                <p className="text-center text-caption text-[#9B8CB5] py-4">Connecting to support…</p>
              ) : (
                (conversations ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className="card-2028 rounded-xl border border-[#DDD6EE] bg-white p-3.5 text-left hover:border-[#2D1B69] transition-all shadow-xs"
                  >
                    <p className="text-body-sm font-bold text-[#2D1B69]">{c.subject}</p>
                    <p className="text-micro capitalize text-[#9B8CB5] mt-1 font-medium">
                      {c.status} · {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </button>
                ))
              )}
              {(conversations ?? []).length === 0 && !listLoading && (
                <div className="py-6 text-center text-caption text-[#9B8CB5]">
                  <p>No active tickets yet.</p>
                  <p className="text-micro text-[#9B8CB5] mt-1">Tap a quick topic above or type a question to begin.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4 bg-[#F8F6FC]/60">
                {(detail?.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-body-sm ${
                      m.sender === "user"
                        ? "self-end bg-gradient-to-br from-[#2D1B69] to-[#150726] text-white shadow-xs"
                        : "self-start bg-white text-[#150726] border border-[#DDD6EE]/70 shadow-xs"
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
                {postMsg.isPending && (
                  <div className="self-start rounded-2xl bg-white border border-[#DDD6EE]/70 px-3.5 py-2 text-micro text-[#9B8CB5] flex items-center gap-1.5 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] animate-ping"></span>
                    <span>AI Concierge is typing…</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-[#DDD6EE]/60 bg-white p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message…"
                  maxLength={4000}
                  className="flex-1 rounded-xl border border-[#DDD6EE] px-3.5 py-2 text-body-sm outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/10 transition-all"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={postMsg.isPending || !draft.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7CB518] to-[#5A8010] text-white disabled:opacity-40 transition-all shadow-cyber-green flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
