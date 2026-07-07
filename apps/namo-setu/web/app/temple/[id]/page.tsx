'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Calendar, Star, Heart, Share2, 
  ChevronRight, Image as ImageIcon, Users, UserRound,
  ArrowLeft, Phone, Bookmark
} from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { AiAssistantPanel } from '@/components/ai-assistant';
import { ErrorState, LoadingState } from '@/components/async-state';
import { MetricTile, CompactPanel, FormRow, PageFrame, SectionHeader, StatusPill, Card, Button } from '@/components/namo-ui';
import { useTemple } from '@/lib/namo-api';

export default function TempleDetailsPage() {
  const params = useParams<{ id: string }>();
  const templeId = params.id;
  const { data: temple, isLoading, isError, error, refetch } = useTemple(templeId);
  const [activeTab, setActiveTab] = useState<'overview' | 'timings' | 'festivals' | 'events' | 'attractions' | 'reviews'>('overview');
  const [liked, setLiked] = useState(false);

  if (isLoading) {
    return (
      <NamoShell>
        <div className="max-w-7xl mx-auto px-4 py-8"><LoadingState label="Loading temple details..." /></div>
      </NamoShell>
    );
  }

  const fallbackTemple = {
    id: templeId ?? "",
    name: "Kashi Vishwanath",
    temple_type: "Jyotirlinga",
    deity_name: "Lord Shiva",
    address_line1: "Vishwanath Gali, Varanasi",
    city_id: "",
    state_id: "",
    country_id: "",
    slug: "kashi-vishwanath",
    pincode: "221001",
    latitude: 25.3109,
    longitude: 83.0107,
    description: "One of the twelve Jyotirlingas of Lord Shiva, located in Varanasi, Uttar Pradesh. It is one of the most revered Hindu temples and a major pilgrimage site.",
    dress_code: "Traditional Indian attire",
    website_url: null,
    phone_number: null,
    is_active: true,
    rating_avg: 4.8,
    review_count: 2340,
    images: [],
    timings: [],
    festivals: [],
    events: [],
    attractions: [],
    reviews: [],
  };
  
  const templeData = temple ?? fallbackTemple;

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'timings' as const, label: 'Timings' },
    { id: 'festivals' as const, label: 'Festivals' },
    { id: 'events' as const, label: 'Events' },
    { id: 'attractions' as const, label: 'Nearby' },
    { id: 'reviews' as const, label: 'Reviews' },
  ];

  return (
    <NamoShell>
      <PageFrame>
        {/* Breadcrumb */}
        <motion.div
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/" className="transition-colors hover:text-orange-600">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/search" className="transition-colors hover:text-orange-600">Temples</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-[var(--text-primary)]">{templeData.name}</span>
        </motion.div>

        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-[16/10] bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 lg:aspect-auto lg:h-full">
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-20 w-20 text-orange-300" />
                </div>
              </div>
              <div className="absolute left-6 top-6">
                <StatusPill tone="orange">{templeData.temple_type}</StatusPill>
              </div>
            </div>

            {/* Info Panel */}
            <div className="flex flex-col p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{templeData.name}</h1>
                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <MapPin className="h-4 w-4" />
                    {templeData.address_line1}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLiked(!liked)}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                      liked ? 'border-red-300 bg-red-50 text-red-500' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-slate-600'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  </button>
                  <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-all hover:text-slate-600">
                    <Bookmark className="h-5 w-5" />
                  </button>
                  <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-all hover:text-slate-600">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-amber-700">{templeData.rating_avg}</span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">({templeData.review_count} reviews)</span>
              </div>

              <p className="mt-6 text-base leading-relaxed text-slate-600">{templeData.description}</p>

              <div className="mt-auto flex flex-wrap gap-4 pt-8">
                <Link href={`/booking?temple=${templeData.id}`}>
                  <Button size="lg">
                    Book Darshan
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </Link>
                <Link href={`/donation?temple=${templeData.id}`}>
                  <Button variant="outline" size="lg">
                    Donate
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Metrics Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MetricTile label="Reviews" value={templeData.review_count.toLocaleString()} icon={Users} />
          <MetricTile label="Deity" value={templeData.deity_name ?? '—'} icon={UserRound} />
          <MetricTile label="Dress Code" value={templeData.dress_code ?? 'Traditional'} icon={Clock} />
          <MetricTile label="Type" value={templeData.temple_type} icon={Calendar} />
        </motion.div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-orange-600'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    layoutId="activeTab"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                <CompactPanel title="Contact Information">
                  <div className="space-y-0">
                    <FormRow label="Address" value={templeData.address_line1} />
                    <FormRow label="Phone" value={templeData.phone_number ?? '—'} />
                    <FormRow label="Website" value={templeData.website_url ?? '—'} />
                    <FormRow label="Pincode" value={templeData.pincode} />
                  </div>
                </CompactPanel>
                <CompactPanel title="Quick Information">
                  <div className="space-y-0">
                    <FormRow label="Deity" value={templeData.deity_name ?? '—'} />
                    <FormRow label="Dress Code" value={templeData.dress_code ?? '—'} />
                    <FormRow label="Slug" value={templeData.slug} />
                  </div>
                </CompactPanel>
              </div>
            )}

            {activeTab === 'timings' && (
              <CompactPanel title="Daily Timings">
                <div className="grid md:grid-cols-2 gap-4">
                  {templeData.timings.map((timing) => (
                    <motion.div
                      key={timing.id}
                      className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:shadow-md hover:-translate-y-1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="font-semibold text-[var(--text-primary)]">Day {timing.day_of_week}</span>
                      <span className="text-sm font-semibold text-orange-600">{timing.opens_at} - {timing.closes_at}</span>
                    </motion.div>
                  ))}
                </div>
              </CompactPanel>
            )}

            {activeTab === 'festivals' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {templeData.festivals.map((festival) => (
                  <motion.div
                    key={festival.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CompactPanel title={festival.name}>
                      <p className="text-sm text-slate-600 leading-relaxed">{festival.description}</p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(festival.starts_on).toLocaleDateString()}
                      </div>
                    </CompactPanel>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {templeData.events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CompactPanel title={event.title}>
                      <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
                    </CompactPanel>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'attractions' && (
              <div className="space-y-4">
                {templeData.attractions.map((attraction) => (
                  <motion.div
                    key={attraction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CompactPanel title={attraction.name}>
                      <p className="text-sm text-slate-600 leading-relaxed">{attraction.description}</p>
                    </CompactPanel>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid gap-5">
                {templeData.reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CompactPanel>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 shadow-sm shadow-orange-500/20">
                          <span className="text-sm font-bold text-white">{review.rating}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                    </CompactPanel>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* AI Assistant */}
        <motion.section
          className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <AiAssistantPanel templeId={templeData.id} />
        </motion.section>
      </PageFrame>
    </NamoShell>
  );
}