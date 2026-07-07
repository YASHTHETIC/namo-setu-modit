"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LocateFixed, Search, Star, MapPin, ChevronRight, Sparkles, Compass } from "lucide-react";

import { useNearbyTemples, useTempleSearch } from "@/lib/namo-api";

import { Field, Panel, StatusPill, inputClass, Card, Button } from "./namo-ui";

const fallbackTemples = [
  { id: "t1", name: "Kashi Vishwanath", temple_type: "Jyotirlinga", deity_name: "Lord Shiva", address_line1: "Vishwanath Gali, Varanasi", description: "One of the twelve Jyotirlingas and most sacred Hindu temples on the western bank of the Ganges.", rating_avg: 4.9, review_count: 2340 },
  { id: "t2", name: "Tirupati Balaji", temple_type: "Vaishnavite", deity_name: "Lord Venkateswara", address_line1: "Tirumala, Tirupati", description: "The richest and most visited temple in the world, dedicated to Lord Venkateswara.", rating_avg: 4.9, review_count: 5120 },
  { id: "t3", name: "Golden Temple", temple_type: "Sikh", deity_name: "Guru Granth Sahib", address_line1: "Amritsar, Punjab", description: "The holiest Gurdwara of Sikhism, famous for its stunning gold-plated architecture.", rating_avg: 4.9, review_count: 4800 },
  { id: "t4", name: "Kedarnath Temple", temple_type: "Char Dham", deity_name: "Lord Shiva", address_line1: "Kedarnath, Uttarakhand", description: "One of the Panch Kedar and Char Dham temples at 3,583 meters altitude.", rating_avg: 4.7, review_count: 1890 },
  { id: "t5", name: "Meenakshi Amman Temple", temple_type: "Shakti Peeth", deity_name: "Goddess Meenakshi", address_line1: "Madurai, Tamil Nadu", description: "Historic Hindu temple with stunning Dravidian architecture and 14 colorful gopurams.", rating_avg: 4.8, review_count: 3200 },
  { id: "t6", name: "Somnath Temple", temple_type: "Jyotirlinga", deity_name: "Lord Shiva", address_line1: "Somnath, Gujarat", description: "First among the twelve Jyotirlingas. The eternal shrine has been rebuilt multiple times.", rating_avg: 4.8, review_count: 2100 },
  { id: "t7", name: "Dwarkadhish Temple", temple_type: "Char Dham", deity_name: "Lord Krishna", address_line1: "Dwarka, Gujarat", description: "One of the Char Dham pilgrimage sites, believed to be the original residence of Lord Krishna.", rating_avg: 4.7, review_count: 1950 },
  { id: "t8", name: "Badrinath Temple", temple_type: "Char Dham", deity_name: "Lord Vishnu", address_line1: "Badrinath, Uttarakhand", description: "One of the four Char Dham pilgrimage sites at 3,133 meters altitude.", rating_avg: 4.8, review_count: 2400 },
  { id: "t9", name: "Jagannath Temple", temple_type: "Heritage", deity_name: "Lord Jagannath", address_line1: "Puri, Odisha", description: "One of the Char Dham sites, famous for the annual Rath Yatra chariot festival.", rating_avg: 4.8, review_count: 3100 },
  { id: "t10", name: "Mahakaleshwar Jyotirlinga", temple_type: "Jyotirlinga", deity_name: "Lord Shiva", address_line1: "Ujjain, Madhya Pradesh", description: "One of the twelve Jyotirlingas where the lingam is believed to be self-manifested.", rating_avg: 4.8, review_count: 2800 },
  { id: "t11", name: "Siddhivinayak Temple", temple_type: "Hindu", deity_name: "Lord Ganesha", address_line1: "Prabhadevi, Mumbai", description: "One of the most famous Ganesha temples in Mumbai, visited by millions annually.", rating_avg: 4.7, review_count: 3500 },
  { id: "t12", name: "Vaishno Devi", temple_type: "Shakti Peeth", deity_name: "Goddess Vaishno Devi", address_line1: "Katra, Jammu & Kashmir", description: "One of the most visited religious sites in India, nestled in the Trikuta Mountains.", rating_avg: 4.8, review_count: 4200 },
  { id: "t13", name: "Brihadeeswarar Temple", temple_type: "Heritage", deity_name: "Lord Shiva", address_line1: "Thanjavur, Tamil Nadu", description: "UNESCO World Heritage Site, masterpiece of Chola dynasty Dravidian architecture.", rating_avg: 4.7, review_count: 1600 },
  { id: "t14", name: "Konark Sun Temple", temple_type: "Heritage", deity_name: "Sun God", address_line1: "Konark, Odisha", description: "UNESCO World Heritage Site shaped as a giant chariot with 24 wheels.", rating_avg: 4.7, review_count: 2200 },
  { id: "t15", name: "Ram Mandir", temple_type: "Hindu", deity_name: "Lord Rama", address_line1: "Ayodhya, Uttar Pradesh", description: "The newly constructed grand temple at the birthplace of Lord Rama, inaugurated in 2024.", rating_avg: 4.9, review_count: 5000 },
  { id: "t16", name: "Amarnath Cave", temple_type: "Hindu", deity_name: "Lord Shiva", address_line1: "Amarnath, Jammu & Kashmir", description: "Sacred cave shrine with a natural ice lingam, one of the most important pilgrimage sites.", rating_avg: 4.8, review_count: 1800 },
  { id: "t17", name: "Khajuraho Temples", temple_type: "Heritage", deity_name: "Various deities", address_line1: "Khajuraho, Madhya Pradesh", description: "UNESCO World Heritage Site famous for Nagara-style architecture and intricate sculptures.", rating_avg: 4.6, review_count: 1500 },
  { id: "t18", name: "Basilica of Bom Jesus", temple_type: "Church", deity_name: "St. Francis Xavier", address_line1: "Old Goa, Goa", description: "UNESCO World Heritage Site housing the mortal remains of St. Francis Xavier.", rating_avg: 4.6, review_count: 1700 },
  { id: "t19", name: "Lakshmi Narayan Temple", temple_type: "Hindu", deity_name: "Goddess Lakshmi", address_line1: "Jaipur, Rajasthan", description: "Beautiful marble temple built by the Birla family, known for stunning architecture.", rating_avg: 4.5, review_count: 1200 },
  { id: "t20", name: "Chamundeshwari Temple", temple_type: "Hindu", deity_name: "Goddess Chamundeshwari", address_line1: "Chamundi Hills, Mysore", description: "Historic temple atop Chamundi Hills, patron deity of the Mysore royal family.", rating_avg: 4.6, review_count: 1400 },
];

export function SearchTempleResults() {
  const [query, setQuery] = useState("Shiva");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("25.3109");
  const [longitude, setLongitude] = useState("83.0107");
  const [nearbyEnabled, setNearbyEnabled] = useState(false);

  const search = useTempleSearch({ q: query, category: category || undefined });
  const nearby = useNearbyTemples(Number(latitude), Number(longitude), nearbyEnabled);

  const apiTemples = nearbyEnabled ? (nearby.data ?? []) : (search.data?.items ?? []);
  const hasApiData = apiTemples.length > 0;

  const filteredFallback = useMemo(() => {
    let result = fallbackTemples;
    if (category) {
      result = result.filter((t) => t.temple_type.toLowerCase().includes(category.toLowerCase()));
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.deity_name.toLowerCase().includes(q) ||
          t.address_line1.toLowerCase().includes(q) ||
          t.temple_type.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [query, category]);

  const temples = hasApiData ? apiTemples : filteredFallback;
  const loading = nearbyEnabled ? nearby.isLoading : search.isLoading;

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
                <option value="Char Dham">Char Dham</option>
                <option value="Heritage">Heritage</option>
                <option value="Hindu">Hindu</option>
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
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
              <p className="mt-3 text-sm text-slate-500">Searching temples...</p>
            </div>
          )}

          {!loading && temples.length === 0 && (
            <div className="text-center py-20">
              <Compass className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-6 text-lg font-semibold text-slate-500">No temples found</p>
              <p className="mt-2 text-sm text-slate-400">Try a different search or category</p>
            </div>
          )}

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
                    { label: "Jyotirlinga temples", filter: () => { setCategory("Jyotirlinga"); setQuery(""); } },
                    { label: "Char Dham circuit", filter: () => { setCategory("Char Dham"); setQuery(""); } },
                    { label: "Heritage sites", filter: () => { setCategory("Heritage"); setQuery(""); } },
                    { label: "Show all temples", filter: () => { setCategory(""); setQuery(""); } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.filter}
                      className="inline-flex h-12 items-center justify-between rounded-xl border border-stone-200 bg-white px-4 text-left text-sm font-medium text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-sm group"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          </motion.div>
        </aside>
      </section>
    </>
  );
}
