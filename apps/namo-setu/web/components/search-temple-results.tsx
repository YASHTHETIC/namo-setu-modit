"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, LocateFixed, Search, Star, MapPin, ChevronRight, Sparkles, Compass } from "lucide-react";

import { useNearbyTemples, useTempleSearch } from "@/lib/namo-api";

import { Field, Panel, PanelHeader, StatusPill, inputClass, Card, Button } from "./namo-ui";
import { ErrorState, LoadingState } from "./async-state";

export function SearchTempleResults() {
  const [query, setQuery] = useState("Shiva");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("25.3109");
  const [longitude, setLongitude] = useState("83.0107");
  const [nearbyEnabled, setNearbyEnabled] = useState(false);

  const search = useTempleSearch({ q: query, category: category || undefined });
  const nearby = useNearbyTemples(Number(latitude), Number(longitude), nearbyEnabled);

  const temples = nearbyEnabled ? (nearby.data ?? []) : (search.data?.items ?? []);
  const loading = nearbyEnabled ? nearby.isLoading : search.isLoading;
  const error = nearbyEnabled ? nearby.error : search.error;
  const refetch = nearbyEnabled ? nearby.refetch : search.refetch;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Panel className="p-6">
          <div className="grid gap-5 md:grid-cols-[1.3fr_0.8fr_auto]">
            <Field label="Search Temples">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClass} pl-11`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Temple name, deity, or city..."
                />
              </div>
            </Field>
            <Field label="Category">
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Jyotirlinga">Jyotirlinga</option>
                <option value="Shakti">Shakti Peeth</option>
                <option value="Heritage">Heritage</option>
              </select>
            </Field>
            <Button
              onClick={() => {
                setNearbyEnabled(false);
                search.refetch();
              }}
              className="mt-6"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </Panel>
      </motion.div>

      <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingState label="Searching temples..." />
              </motion.div>
            )}
          </AnimatePresence>
          
          {error && <ErrorState message={error.message} onRetry={() => refetch()} />}
          
          <AnimatePresence>
            {temples.map((temple, i) => (
              <motion.div
                key={temple.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/temple/${temple.id}`}>
                  <Card className="overflow-hidden group">
                    <div className="grid gap-0 md:grid-cols-[260px_1fr]">
                      <div className="h-56 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 md:h-full" />
                      <div className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                              {temple.name}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                              <MapPin className="h-4 w-4" />
                              {temple.deity_name ?? "Temple"} · {temple.address_line1}
                            </div>
                          </div>
                          <StatusPill tone="teal">{temple.temple_type}</StatusPill>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-2">{temple.description}</p>
                        <div className="mt-5 flex items-center gap-4">
                          <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            <span className="text-sm font-bold text-amber-700">{temple.rating_avg}</span>
                          </div>
                          <span className="text-sm text-slate-400">{temple.review_count.toLocaleString()} reviews</span>
                          <ChevronRight className="ml-auto h-5 w-5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!loading && !error && temples.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Compass className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-6 text-lg font-semibold text-slate-500">No temples found</p>
              <p className="mt-2 text-sm text-slate-400">Try a different search or category</p>
            </motion.div>
          )}
        </div>

        <aside className="grid gap-5 self-start">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Panel className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm shadow-teal-500/25">
                    <LocateFixed className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Nearby Search</h3>
                    <p className="text-xs text-slate-500">Find temples within a radius</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  <Field label="Latitude">
                    <input className={inputClass} value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                  </Field>
                  <Field label="Longitude">
                    <input className={inputClass} value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                  </Field>
                  <Button onClick={() => setNearbyEnabled(true)} className="w-full">
                    <LocateFixed className="h-4 w-4" />
                    Find Nearby
                  </Button>
                </div>
              </div>
            </Panel>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Panel className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm shadow-orange-500/25">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Popular Filters</h3>
                    <p className="text-xs text-slate-500">Quick access to popular searches</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Popular temples", icon: Star },
                    { label: "Festival active", icon: Sparkles },
                    { label: "Senior support", icon: Compass },
                    { label: "AI recommended", icon: Sparkles },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="inline-flex h-12 items-center justify-between rounded-xl border border-stone-200 bg-white px-4 text-left text-sm font-medium text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-sm group"
                      >
                        <span>{item.label}</span>
                        <Icon className="h-4 w-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </Panel>
          </motion.div>
        </aside>
      </section>
    </>
  );
}