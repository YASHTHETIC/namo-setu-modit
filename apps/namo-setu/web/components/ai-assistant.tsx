"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Sparkles, Send, Calendar, MessageCircle, MapPin, Search, HelpCircle } from "lucide-react";

import { useAiAssistant, useFestivalReminders, useTripPlanner } from "@/lib/namo-api";

import { CompactPanel, Field, inputClass, Button } from "./namo-ui";
import { ErrorState, LoadingState } from "./async-state";

type AiMode = "recommendation" | "spiritual" | "voice" | "faq" | "nearby";

const modes: Array<{ id: AiMode; label: string; placeholder: string; icon: typeof Bot }> = [
  { id: "recommendation", label: "Temple Recommendation", placeholder: "Suggest Shiva temples near Varanasi for elders", icon: Search },
  { id: "spiritual", label: "Spiritual Guide", placeholder: "What dress code should I follow for darshan?", icon: Sparkles },
  { id: "voice", label: "Voice Assistant", placeholder: "Transcript or spoken question", icon: Mic },
  { id: "faq", label: "FAQ Assistant", placeholder: "Can I carry mobile phones inside?", icon: HelpCircle },
  { id: "nearby", label: "Personalized Suggestions", placeholder: "Show nearby temples with low crowd", icon: MapPin },
];

export function AiAssistantPanel({ templeId }: { templeId?: string }) {
  const [mode, setMode] = useState<AiMode>("recommendation");
  const [message, setMessage] = useState("");
  const ai = useAiAssistant(mode);
  const reminders = useFestivalReminders({ temple_id: templeId, days_ahead: 60 });
  const planner = useTripPlanner();

  const active = modes.find((item) => item.id === mode)!;

  return (
    <div className="grid gap-8">
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">AI Pilgrimage Assistants</h3>
            <p className="text-sm text-slate-500 mt-1">Powered by intelligent algorithms</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-5">
          {modes.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  mode === item.id
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25"
                    : "bg-stone-100 text-slate-600 hover:bg-stone-200"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </motion.button>
            );
          })}
        </div>

        <Field label="Ask a question">
          <textarea
            className={`${inputClass} min-h-[120px] py-4 resize-none`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={active.placeholder}
          />
        </Field>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={() => ai.mutate({ message, templeId })}
            disabled={!message.trim() || ai.isPending}
          >
            {mode === "voice" ? <Mic className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            Ask
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              planner.mutate({
                start_date: new Date().toISOString().slice(0, 10),
                days: 3,
                travelers: 2,
                temple_ids: templeId ? [templeId] : [],
                interests: ["darshan", "heritage"],
                pace: "balanced",
              })
            }
            disabled={planner.isPending}
          >
            <Bot className="h-4 w-4" />
            AI Trip Planner
          </Button>
        </div>

        <AnimatePresence>
          {ai.isPending && (
            <motion.div
              className="mt-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <LoadingState label="Consulting pilgrimage guide..." />
            </motion.div>
          )}
        </AnimatePresence>
        
        {ai.isError && (
          <div className="mt-5">
            <ErrorState message={ai.error.message} onRetry={() => ai.mutate({ message, templeId })} />
          </div>
        )}
        
        <AnimatePresence>
          {ai.data && (
            <motion.div
              className="mt-5 rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-emerald-50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-bold text-teal-700">AI Response</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{ai.data.answer}</p>
              {ai.data.suggested_actions.length > 0 && (
                <div className="mt-5 space-y-2">
                  {ai.data.suggested_actions.map((action) => (
                    <div key={action} className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                      <div className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                      {action}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {planner.data && (
            <motion.div
              className="mt-5 rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-bold text-orange-700">Trip Plan</span>
              </div>
              <p className="text-sm font-medium text-slate-800">{planner.data.summary}</p>
              <p className="mt-3 text-sm text-slate-600">Estimated budget: ₹{planner.data.estimated_budget.toLocaleString("en-IN")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm shadow-orange-500/25">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Festival Reminders</h3>
            <p className="text-xs text-slate-500">Upcoming celebrations</p>
          </div>
        </div>
        {reminders.isLoading && <LoadingState label="Loading festival reminders..." />}
        {reminders.isError && <ErrorState message={reminders.error.message} onRetry={() => reminders.refetch()} />}
        {reminders.data?.length ? (
          <div className="space-y-3">
            {reminders.data.slice(0, 5).map((item, i) => (
              <motion.div
                key={item.festival_id}
                className="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-1"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">{item.reminder_text}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : reminders.isSuccess ? (
          <p className="text-sm text-slate-500">No upcoming festivals in the selected window.</p>
        ) : null}
      </div>
    </div>
  );
}