'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Users, Star, Route, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { AiAssistantPanel } from '@/components/ai-assistant';
import { ErrorState, LoadingState } from '@/components/async-state';
import { CompactPanel, SectionHeader, PageFrame, Field, inputClass, Button, Card } from '@/components/namo-ui';
import { useGuides, useTemple, useTravelPackages, useTripPlanner, usePopularTemples } from '@/lib/namo-api';

function TempleSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const popularQuery = usePopularTemples();
  const fallbackTemples = [
    { id: "t1", name: "Kashi Vishwanath", address_line1: "Vishwanath Gali, Varanasi, UP" },
    { id: "t2", name: "Tirupati Balaji", address_line1: "Tirumala, Tirupati, AP" },
    { id: "t3", name: "Golden Temple", address_line1: "Golden Temple Road, Amritsar, Punjab" },
    { id: "t4", name: "Kedarnath Temple", address_line1: "Kedarnath, Uttarakhand" },
    { id: "t5", name: "Meenakshi Temple", address_line1: "Madurai, Tamil Nadu" },
    { id: "t6", name: "Somnath Jyotirlinga", address_line1: "Prabhas Patan, Veraval, Gujarat" },
  ];
  const temples = Array.isArray(popularQuery.data) ? popularQuery.data : (popularQuery.isError ? fallbackTemples : []);
  return (
    <PageFrame>
      <SectionHeader title="Select a Temple" subtitle="Choose a temple to plan your pilgrimage" />
      {popularQuery.isLoading && <LoadingState label="Loading temples..." />}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {temples.map((t: any) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="p-6 rounded-3xl border-2 border-stone-200 bg-white text-left transition-all hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10 group"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 mb-4 group-hover:from-orange-200 group-hover:to-amber-200 transition-all">
              <Route className="h-7 w-7 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{t.address_line1 || t.city || 'Sacred temple'}</p>
          </button>
        ))}
      </div>
      {temples.length === 0 && !popularQuery.isLoading && (
        <div className="text-center py-12 text-slate-400">No temples available</div>
      )}
    </PageFrame>
  );
}

function TravelContent() {
  const searchParams = useSearchParams();
  const [selectedTempleId, setSelectedTempleId] = useState<string | undefined>(
    searchParams.get('temple') ?? undefined
  );
  const templeId = selectedTempleId;
  const templeQuery = useTemple(templeId);
  const packagesQuery = useTravelPackages(templeId);
  const guidesQuery = useGuides();
  const planner = useTripPlanner();
  const [travelDate, setTravelDate] = useState(new Date().toISOString().slice(0, 10));
  const [travelers, setTravelers] = useState(2);

  const fallbackTemple = { id: templeId ?? "", name: "Kashi Vishwanath", address_line1: "Varanasi, UP" };
  const temple = templeQuery.data ?? fallbackTemple;

  if (!templeId) {
    return <TempleSelector onSelect={(id) => setSelectedTempleId(id)} />;
  }

  if (templeQuery.isLoading) return <LoadingState label="Loading travel planner..." />;

  return (
    <PageFrame>
      {/* AI Trip Planner */}
      <div className="animate-[fadeIn_0.6s_ease-out]">
        <CompactPanel className="overflow-hidden">
          <div className="relative p-8 lg:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50/50" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
                  <Route className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Plan Your Pilgrimage</h2>
                  <p className="text-sm text-slate-500 mt-1">AI-powered trip planning for {temple.name}</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-4">
                <Field label="Travel Date">
                  <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Travelers">
                  <select value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} className={inputClass}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} Travelers</option>)}
                  </select>
                </Field>
                <div className="flex items-end">
                  <Button
                    onClick={() => planner.mutate({ start_date: travelDate, days: 3, travelers, temple_ids: [temple.id], interests: ['darshan'], pace: 'balanced' })}
                    disabled={planner.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {planner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate AI Plan
                  </Button>
                </div>
              </div>
              {planner.data && (
                <div className="mt-8 rounded-2xl border border-orange-200/60 bg-white p-6 animate-[fadeIn_0.4s_ease-out]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-bold text-orange-700">AI Generated Plan</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{planner.data.summary}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
                    Budget: ₹{planner.data.estimated_budget.toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CompactPanel>
      </div>

      {/* Travel Packages */}
      <section className="animate-[fadeIn_0.6s_ease-out_0.1s_both]">
        <SectionHeader label="Packages" title="Travel Packages" subtitle={`Curated packages for ${temple.name}`} />
        {packagesQuery.isLoading && <LoadingState label="Loading packages..." />}
        {packagesQuery.isError && <ErrorState message="Unable to load packages from server. Showing popular routes." onRetry={() => packagesQuery.refetch()} />}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {(packagesQuery.data ?? []).map((pkg, i) => (
            <div key={pkg.id} className="animate-[fadeIn_0.4s_ease-out]">
              <Card className="overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{pkg.title}</h3>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">₹{pkg.price}</div>
                      <div className="text-xs text-slate-400 mt-1">per person</div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="w-full">
                      Book Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Local Guides */}
      <section className="animate-[fadeIn_0.6s_ease-out_0.2s_both]">
        <SectionHeader label="Guides" title="Local Guides" subtitle="Expert guides from the platform" />
        {guidesQuery.isLoading && <LoadingState label="Loading guides..." />}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {(guidesQuery.data ?? []).map((guide, i) => (
            <div key={guide.id} className="animate-[fadeIn_0.4s_ease-out]">
              <Card className="overflow-hidden">
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100">
                    <Users className="h-10 w-10 text-orange-500" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{guide.name}</h3>
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-bold text-amber-700">{guide.rating_avg}</span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* AI Assistant */}
      <section className="rounded-3xl border border-stone-200/60 bg-white p-8 shadow-sm animate-[fadeIn_0.6s_ease-out_0.3s_both]">
        <AiAssistantPanel templeId={temple.id} />
      </section>
    </PageFrame>
  );
}

export default function TravelPage() {
  return (
    <NamoShell>
      <Suspense fallback={<LoadingState label="Loading travel..." />}>
        <TravelContent />
      </Suspense>
    </NamoShell>
  );
}
