'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Users, QrCode, CheckCircle, 
  ChevronRight, MapPin, ArrowLeft, CreditCard, Ticket
} from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { SectionHeader, CompactPanel, FormRow, PageFrame, Field, inputClass, Button } from '@/components/namo-ui';
import { useBookDarshan, useDarshanSlots, useTemple, usePopularTemples } from '@/lib/namo-api';

const steps = [
  { id: 'select', label: 'Select Slot', icon: Calendar },
  { id: 'details', label: 'Your Details', icon: Users },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle },
  { id: 'success', label: 'Booked', icon: Ticket },
];

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
      <SectionHeader title="Select a Temple" subtitle="Choose a temple to book darshan" />
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
              <MapPin className="h-7 w-7 text-orange-500" />
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

function BookingContent() {
  const searchParams = useSearchParams();
  const [selectedTempleId, setSelectedTempleId] = useState<string | undefined>(
    searchParams.get('temple') ?? undefined
  );
  const templeId = selectedTempleId;
  const templeQuery = useTemple(templeId);
  const slotsQuery = useDarshanSlots(templeId);
  const bookMutation = useBookDarshan();

  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'success'>('select');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedSlotLabel, setSelectedSlotLabel] = useState('');
  const [visitorCount, setVisitorCount] = useState(1);
  const [bookingDetails, setBookingDetails] = useState({ name: '', email: '', phone: '' });
  const [confirmedBooking, setConfirmedBooking] = useState<{ booking_number: string; qr_ticket?: string } | null>(null);

  const temple = templeQuery.data;

  const handleBooking = async () => {
    if (!templeId || !selectedDate) return;
    const result = await bookMutation.mutateAsync({
      temple_id: templeId,
      darshan_slot_id: selectedSlotId || undefined,
      visit_date: selectedDate,
      party_size: visitorCount,
      notes: bookingDetails.name ? `Contact: ${bookingDetails.name}` : undefined,
    });
    setConfirmedBooking(result);
    setStep('success');
  };

  if (!templeId) {
    return <TempleSelector onSelect={(id) => setSelectedTempleId(id)} />;
  }

  if (templeQuery.isLoading) return <LoadingState label="Loading temple..." />;
  if (templeQuery.isError || !temple) return <ErrorState message={templeQuery.error?.message ?? 'Temple not found'} onRetry={() => templeQuery.refetch()} />;

  if (step === 'success' && confirmedBooking) {
    return (
      <PageFrame>
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-2xl shadow-emerald-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-12 w-12 text-white" />
            </motion.div>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900">Booking Confirmed!</h1>
            <p className="mt-3 text-lg text-slate-500">Your darshan has been successfully reserved</p>
          </motion.div>
          <CompactPanel className="mb-8">
            <div className="p-8 space-y-0">
              <FormRow label="Booking Reference" value={confirmedBooking.booking_number} />
              <FormRow label="Temple" value={temple.name} />
              <FormRow label="Date" value={selectedDate} />
              <FormRow label="Time Slot" value={selectedSlotLabel || 'Open darshan'} />
              <FormRow label="Visitors" value={visitorCount.toString()} />
            </div>
          </CompactPanel>
          <CompactPanel className="mb-8">
            <div className="flex flex-col items-center py-10">
              <div className="flex h-56 w-56 items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50">
                <QrCode className="h-32 w-32 text-slate-300" />
              </div>
              <p className="mt-6 text-xs text-slate-400 break-all px-4">{confirmedBooking.qr_ticket ?? 'QR generated at temple entry'}</p>
            </div>
          </CompactPanel>
          <div className="flex gap-4 justify-center">
            <Link href={`/temple/${temple.id}`}>
              <Button>View Temple</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </motion.div>
      </PageFrame>
    );
  }

  const slots = slotsQuery.data ?? [];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <PageFrame>
      {/* Progress Steps */}
      <motion.div
        className="flex items-center justify-center gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {steps.slice(0, 3).map((s, i) => {
          const Icon = s.icon;
          const isActive = i === stepIndex;
          const isCompleted = i < stepIndex;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <motion.div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' :
                  isActive ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25' :
                  'bg-stone-100 text-slate-400'
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </motion.div>
              <span className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
              {i < 2 && <div className={`w-16 h-1 mx-2 rounded-full ${i < stepIndex ? 'bg-emerald-500' : 'bg-stone-200'}`} />}
            </div>
          );
        })}
      </motion.div>

      {/* Temple Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CompactPanel>
          <div className="flex items-center gap-6 p-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100">
              <MapPin className="h-12 w-12 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{temple.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{temple.address_line1}</p>
            </div>
          </div>
        </CompactPanel>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <SectionHeader title="Select Date" subtitle="Choose your preferred darshan date" />
            <Field label="Visit Date">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={inputClass} />
            </Field>

            <SectionHeader title="Select Time Slot" subtitle="Available slots from the temple" />
            {slotsQuery.isLoading && <LoadingState label="Loading slots..." />}
            {slotsQuery.isError && <ErrorState message={slotsQuery.error.message} onRetry={() => slotsQuery.refetch()} />}
            <div className="grid md:grid-cols-2 gap-4">
              {slots.map((slot) => (
                <motion.button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    if (slot.available_count > 0) {
                      setSelectedSlotId(slot.id);
                      setSelectedSlotLabel(`${slot.start_time} - ${slot.end_time}`);
                    }
                  }}
                  disabled={slot.available_count === 0}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    selectedSlotId === slot.id
                      ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md'
                  } ${slot.available_count === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  whileHover={slot.available_count > 0 ? { scale: 1.02 } : {}}
                  whileTap={slot.available_count > 0 ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                        selectedSlotId === slot.id ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25' : 'bg-stone-100 text-slate-500'
                      }`}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{slot.start_time} - {slot.end_time}</div>
                        <div className="text-sm text-slate-500">{slot.available_count} slots available</div>
                      </div>
                    </div>
                    {selectedSlotId === slot.id && <CheckCircle className="h-6 w-6 text-orange-500" />}
                  </div>
                </motion.button>
              ))}
            </div>

            <SectionHeader title="Number of Visitors" />
            <div className="flex items-center gap-5">
              <button type="button" onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))} className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-stone-200 text-xl font-semibold text-slate-600 transition-all hover:border-stone-300 hover:bg-stone-50">-</button>
              <div className="flex h-14 w-24 items-center justify-center rounded-2xl border-2 border-stone-200 text-2xl font-bold text-slate-900">{visitorCount}</div>
              <button type="button" onClick={() => setVisitorCount(Math.min(10, visitorCount + 1))} className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-stone-200 text-xl font-semibold text-slate-600 transition-all hover:border-stone-300 hover:bg-stone-50">+</button>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep('details')} disabled={!selectedDate} size="lg">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <SectionHeader title="Visitor Details" subtitle="Provide contact information for the booking" />
            <CompactPanel>
              <div className="space-y-5 p-8">
                <Field label="Full Name">
                  <input type="text" value={bookingDetails.name} onChange={(e) => setBookingDetails({ ...bookingDetails, name: e.target.value })} className={inputClass} placeholder="Enter your full name" />
                </Field>
                <Field label="Email Address">
                  <input type="email" value={bookingDetails.email} onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })} className={inputClass} placeholder="your@email.com" />
                </Field>
                <Field label="Phone Number">
                  <input type="tel" value={bookingDetails.phone} onChange={(e) => setBookingDetails({ ...bookingDetails, phone: e.target.value })} className={inputClass} placeholder="+91 XXXXX XXXXX" />
                </Field>
              </div>
            </CompactPanel>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep('confirm')} disabled={!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone}>
                Review Booking
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <SectionHeader title="Confirm Booking" subtitle="Review your booking details before confirmation" />
            <CompactPanel title="Booking Summary">
              <div className="p-8 space-y-0">
                <FormRow label="Temple" value={temple.name} />
                <FormRow label="Date" value={selectedDate} />
                <FormRow label="Time Slot" value={selectedSlotLabel || 'Open darshan'} />
                <FormRow label="Visitors" value={visitorCount.toString()} />
                <FormRow label="Contact" value={bookingDetails.name} />
              </div>
            </CompactPanel>
            {bookMutation.isError && <ErrorState message={bookMutation.error.message} />}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('details')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleBooking} disabled={bookMutation.isPending} size="lg">
                <CreditCard className="h-4 w-4" />
                {bookMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageFrame>
  );
}

export default function BookingPage() {
  return (
    <NamoShell>
      <Suspense fallback={<LoadingState label="Loading booking..." />}>
        <BookingContent />
      </Suspense>
    </NamoShell>
  );
}