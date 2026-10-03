"use client";

import { useState } from "react";
import { ArrowLeft, Bot, MessageCircle, Send, X } from "lucide-react";

import {
  useCreateSupportConversation,
  usePostSupportMessage,
  useSupportConversation,
  useSupportConversations,
} from "@/lib/modit-api";
import { useAuthReady } from "@/lib/use-auth";

export function SupportChat() {
  const loggedIn = useAuthReady();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");

  const { data: conversations, isLoading: listLoading } = useSupportConversations(open && loggedIn);
  const { data: detail } = useSupportConversation(open && activeId ? activeId : undefined);
  const createConv = useCreateSupportConversation();
  const postMsg = usePostSupportMessage();

  const startConversation = () => {
    const clean = subject.trim();
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

  const sendMessage = () => {
    const clean = draft.trim();
    if (!clean || !activeId) return;
    setDraft("");
    postMsg.mutate({ conversationId: activeId, body: clean });
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Support chat"
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#2D1B69] text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex h-[420px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[#DDD6EE] bg-white shadow-2xl">
          <div className="flex items-center gap-2 bg-[#2D1B69] px-4 py-3 text-white">
            {activeId && (
              <button onClick={() => setActiveId(null)} aria-label="Back to threads">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Bot className="h-5 w-5" />
            <div>
              <p className="text-sm font-extrabold">MODIT Support</p>
              <p className="text-[11px] opacity-80">Instant answers · agent handoff available</p>
            </div>
          </div>

          {!loggedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm font-bold text-[#2D1B69]">Log in to chat with support</p>
              <p className="text-xs text-[#9B8CB5]">Your threads stay linked to your orders.</p>
              <a
                href="/auth"
                className="mt-2 rounded-full bg-[#2D1B69] px-5 py-2 text-sm font-bold text-white"
              >
                Log in
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
                  className="flex-1 rounded-full border border-[#DDD6EE] px-3 py-2 text-sm outline-none focus:border-[#2D1B69]"
                />
                <button
                  onClick={startConversation}
                  disabled={createConv.isPending || !subject.trim()}
                  className="rounded-full bg-[#2D1B69] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  New
                </button>
              </div>
              {listLoading ? (
                <p className="text-center text-xs text-[#9B8CB5]">Loading threads…</p>
              ) : (
                (conversations ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className="rounded-xl border border-[#EDE9F5] p-3 text-left hover:border-[#2D1B69]"
                  >
                    <p className="text-sm font-bold text-[#2D1B69]">{c.subject}</p>
                    <p className="text-[11px] capitalize text-[#9B8CB5]">
                      {c.status} · {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </button>
                ))
              )}
              {(conversations ?? []).length === 0 && !listLoading && (
                <p className="text-center text-xs text-[#9B8CB5]">
                  No threads yet — start one above. Ask about tracking, refunds, payments.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                {(detail?.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.sender === "user"
                        ? "self-end bg-[#2D1B69] text-white"
                        : "self-start bg-[#F4F1FA] text-[#2D1B69]"
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
                {postMsg.isPending && (
                  <div className="self-start rounded-2xl bg-[#F4F1FA] px-3 py-2 text-sm text-[#9B8CB5]">
                    Typing…
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-[#EDE9F5] p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message…"
                  maxLength={4000}
                  className="flex-1 rounded-full border border-[#DDD6EE] px-3 py-2 text-sm outline-none focus:border-[#2D1B69]"
                />
                <button
                  onClick={sendMessage}
                  disabled={postMsg.isPending || !draft.trim()}
                  aria-label="Send message"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D1B69] text-white disabled:opacity-50"
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
