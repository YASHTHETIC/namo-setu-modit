'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, CheckCircle, IndianRupee, ArrowLeft, CreditCard, Gift } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { SectionHeader, CompactPanel, FormRow, PageFrame, Field, inputClass, Button } from '@/components/namo-ui';
import { useDonate, useTemple, usePopularTemples } from '@/lib/namo-api';

function TempleSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const popularQuery = usePopularTemples();
  const temples = Array.isArray(popularQuery.data) ? popularQuery.data : [];
  return (
    <PageFrame>
      <SectionHeader title="Select a Temple" subtitle="Choose a temple to support with your donation" />
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
              <Heart className="h-7 w-7 text-orange-500" />
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

function DonationContent() {
  const searchParams = useSearchParams();
  const [selectedTempleId, setSelectedTempleId] = useState<string | undefined>(
    searchParams.get('temple') ?? undefined
  );
  const templeId = selectedTempleId;
  const templeQuery = useTemple(templeId);
  const donateMutation = useDonate();

  const [step, setStep] = useState<'select' | 'details' | 'payment' | 'success'>('select');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('general');
  const [donorDetails, setDonorDetails] = useState({ name: '', email: '', phone: '', address: '', pan: '' });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donationReceipt, setDonationReceipt] = useState<{ receipt_number: string | null; amount: number } | null>(null);

  const presetAmounts = ['100', '500', '1000', '2500', '5000', '10000'];
  const donationPurposes = [
    { id: 'general', label: 'General Temple Fund', desc: 'Support overall temple operations' },
    { id: 'annadhanam', label: 'Annadhanam', desc: 'Free food for devotees' },
    { id: 'maintenance', label: 'Temple Maintenance', desc: 'Preserve temple structure' },
    { id: 'festival', label: 'Festival Celebrations', desc: 'Celebrate sacred festivals' },
  ];

  const temple = templeQuery.data;
  const amount = Number(selectedAmount || customAmount);

  const handleDonation = async () => {
    if (!templeId || !amount) return;
    const result = await donateMutation.mutateAsync({
      temple_id: templeId,
      donor_name: isAnonymous ? 'Anonymous Devotee' : donorDetails.name,
      purpose: donationPurpose,
      amount,
      currency: 'INR',
      provider: 'razorpay',
    });
    setDonationReceipt({ receipt_number: result.receipt_number, amount: result.amount });
    setStep('success');
  };

  if (!templeId) {
    return <TempleSelector onSelect={(id) => setSelectedTempleId(id)} />;
  }

  if (templeQuery.isLoading) return <LoadingState label="Loading temple..." />;
  if (templeQuery.isError || !temple) return <ErrorState message={templeQuery.error?.message ?? 'Temple not found'} onRetry={() => templeQuery.refetch()} />;

  if (step === 'success' && donationReceipt) {
    return (
      <PageFrame>
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-2xl shadow-orange-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <Heart className="h-12 w-12 text-white fill-white" />
            </motion.div>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900">Thank You for Your Donation!</h1>
            <p className="mt-3 text-lg text-slate-500">Your generosity supports sacred temple operations</p>
          </motion.div>
          <CompactPanel className="mb-8">
            <div className="p-8 space-y-0">
              <FormRow label="Donation ID" value={donationReceipt.receipt_number ?? '—'} />
              <FormRow label="Temple" value={temple.name} />
              <FormRow label="Amount" value={`₹${donationReceipt.amount.toLocaleString('en-IN')}`} />
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

  return (
    <PageFrame>
      {/* Temple Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CompactPanel>
          <div className="flex items-center gap-6 p-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100">
              <Heart className="h-10 w-10 text-orange-500" />
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
            <SectionHeader title="Select Donation Amount" subtitle="Choose a preset amount or enter your own" />
            
            {/* Preset Amounts */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {presetAmounts.map((value) => (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => { setSelectedAmount(value); setCustomAmount(''); }}
                  className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${
                    selectedAmount === value
                      ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IndianRupee className={`h-6 w-6 ${selectedAmount === value ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span className={`text-xl font-bold ${selectedAmount === value ? 'text-orange-700' : 'text-slate-900'}`}>
                    {Number(value).toLocaleString('en-IN')}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Custom Amount */}
            <Field label="Or enter a custom amount">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(''); }}
                  className={`${inputClass} pl-12 text-xl font-semibold`}
                  placeholder="Enter amount"
                />
              </div>
            </Field>

            {/* Donation Purpose */}
            <SectionHeader title="Donation Purpose" subtitle="Choose where your contribution goes" />
            <div className="grid md:grid-cols-2 gap-4">
              {donationPurposes.map((purpose) => (
                <motion.button
                  key={purpose.id}
                  type="button"
                  onClick={() => setDonationPurpose(purpose.id)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    donationPurpose === purpose.id
                      ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${
                      donationPurpose === purpose.id ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25' : 'bg-stone-100 text-slate-500'
                    }`}>
                      <Gift className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{purpose.label}</div>
                      <div className="text-sm text-slate-500 mt-1">{purpose.desc}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep('details')} disabled={!amount} size="lg">
                Continue
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
            <SectionHeader title="Donor Information" subtitle="Provide your details for receipt generation" />
            
            <label className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 cursor-pointer transition-all hover:shadow-md group">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
              <div>
                <span className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Make this donation anonymous</span>
                <p className="text-sm text-slate-500 mt-1">Your name will not appear in public records</p>
              </div>
            </label>

            {!isAnonymous && (
              <CompactPanel>
                <div className="space-y-5 p-8">
                  <Field label="Full Name">
                    <input type="text" value={donorDetails.name} onChange={(e) => setDonorDetails({ ...donorDetails, name: e.target.value })} className={inputClass} placeholder="Enter your full name" />
                  </Field>
                  <Field label="Email Address">
                    <input type="email" value={donorDetails.email} onChange={(e) => setDonorDetails({ ...donorDetails, email: e.target.value })} className={inputClass} placeholder="your@email.com" />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" value={donorDetails.phone} onChange={(e) => setDonorDetails({ ...donorDetails, phone: e.target.value })} className={inputClass} placeholder="+91 XXXXX XXXXX" />
                  </Field>
                </div>
              </CompactPanel>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep('payment')} disabled={!isAnonymous && (!donorDetails.name || !donorDetails.email || !donorDetails.phone)}>
                Proceed to Payment
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <SectionHeader title="Payment Details" subtitle="Review and complete your donation" />
            <CompactPanel title="Donation Summary">
              <div className="p-8 space-y-0">
                <FormRow label="Temple" value={temple.name} />
                <FormRow label="Purpose" value={donationPurposes.find(p => p.id === donationPurpose)?.label ?? donationPurpose} />
                <FormRow label="Amount" value={`₹${amount.toLocaleString('en-IN')}`} />
              </div>
            </CompactPanel>
            {donateMutation.isError && <ErrorState message={donateMutation.error.message} />}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('details')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleDonation} disabled={donateMutation.isPending} size="lg">
                <CreditCard className="h-4 w-4" />
                {donateMutation.isPending ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageFrame>
  );
}

export default function DonationPage() {
  return (
    <NamoShell>
      <Suspense fallback={<LoadingState label="Loading donation..." />}>
        <DonationContent />
      </Suspense>
    </NamoShell>
  );
}