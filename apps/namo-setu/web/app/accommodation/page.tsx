'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, Users, Bed, Calendar, ArrowLeft, Wifi, Car, Coffee } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { CompactPanel, SectionHeader, PageFrame, Field, inputClass, Button, Card } from '@/components/namo-ui';
import { useAccommodation, useRooms, useTemple, usePopularTemples } from '@/lib/namo-api';

function TempleSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const popularQuery = usePopularTemples();
  const temples = Array.isArray(popularQuery.data) ? popularQuery.data : [];
  return (
    <PageFrame>
      <SectionHeader title="Select a Temple" subtitle="Choose a temple to find nearby accommodation" />
      {popularQuery.isLoading && <LoadingState label="Loading temples..." />}
      {popularQuery.isError && <ErrorState message="Failed to load temples" onRetry={() => popularQuery.refetch()} />}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {temples.map((t: any) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="p-6 rounded-3xl border-2 border-stone-200 bg-white text-left transition-all hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10 group"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 mb-4 group-hover:from-orange-200 group-hover:to-amber-200 transition-all">
              <Bed className="h-7 w-7 text-orange-500" />
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

function AccommodationContent() {
  const searchParams = useSearchParams();
  const [selectedTempleId, setSelectedTempleId] = useState<string | undefined>(
    searchParams.get('temple') ?? undefined
  );
  const templeId = selectedTempleId;
  const templeQuery = useTemple(templeId);
  const accommodationQuery = useAccommodation(templeId);
  const roomsQuery = useRooms();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const temple = templeQuery.data;

  if (!templeId) {
    return <TempleSelector onSelect={(id) => setSelectedTempleId(id)} />;
  }

  if (templeQuery.isLoading) return <LoadingState label="Loading accommodation..." />;
  if (templeQuery.isError || !temple) return <ErrorState message={templeQuery.error?.message ?? 'Temple not found'} onRetry={() => templeQuery.refetch()} />;

  return (
    <PageFrame>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CompactPanel>
          <div className="flex items-center gap-6 p-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100">
              <Bed className="h-10 w-10 text-orange-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">Accommodation Near {temple.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{temple.address_line1}</p>
            </div>
          </div>
        </CompactPanel>
      </motion.div>

      {/* Date Picker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CompactPanel>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Check-in Date">
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Check-out Date">
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>
        </CompactPanel>
      </motion.div>

      {/* Available Stays */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <SectionHeader label="Stays" title="Available Stays" subtitle={`Properties near ${temple.name}`} />
        {accommodationQuery.isLoading && <LoadingState label="Loading stays..." />}
        {accommodationQuery.isError && <ErrorState message={accommodationQuery.error.message} onRetry={() => accommodationQuery.refetch()} />}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {(accommodationQuery.data ?? []).map((stay, i) => (
            <motion.div
              key={stay.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                      <Bed className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">{stay.name}</h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {stay.accommodation_type} · {stay.address_line1}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-5">
                    {[
                      { icon: Wifi, label: 'WiFi' },
                      { icon: Car, label: 'Parking' },
                      { icon: Coffee, label: 'Breakfast' },
                    ].map((amenity) => {
                      const Icon = amenity.icon;
                      return (
                        <span key={amenity.label} className="flex items-center gap-2 text-sm text-slate-400">
                          <Icon className="h-4 w-4" />
                          {amenity.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Available Rooms */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <SectionHeader label="Rooms" title="Available Rooms" subtitle="Room inventory from the platform" />
        {roomsQuery.isLoading && <LoadingState label="Loading rooms..." />}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {(roomsQuery.data ?? []).map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{room.room_type}</h3>
                      <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {room.capacity} guests
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">₹{room.price_per_night}</div>
                      <div className="text-xs text-slate-400 mt-1">per night</div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="w-full" size="lg">
                      Book Room
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="flex justify-center">
        <Link href={`/temple/${temple.id}`}>
          <Button variant="outline" size="lg">
            <ArrowLeft className="h-4 w-4" />
            Back to Temple
          </Button>
        </Link>
      </div>
    </PageFrame>
  );
}

export default function AccommodationPage() {
  return (
    <NamoShell>
      <Suspense fallback={<LoadingState label="Loading accommodation..." />}>
        <AccommodationContent />
      </Suspense>
    </NamoShell>
  );
}