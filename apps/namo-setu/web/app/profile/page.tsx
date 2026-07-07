'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, MapPin, Heart, Settings, Download, ChevronRight, Star, ArrowUpRight, Users } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { MetricTile, CompactPanel, PageFrame, SectionHeader, StatusPill, Button } from '@/components/namo-ui';
import { useCancelDarshanBooking, useMyDarshanBookings, useMyDonations } from '@/lib/namo-api';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'donations' | 'settings'>('overview');
  const [prefs, setPrefs] = useState([
    { label: 'Booking confirmations', description: 'Receive email and push notifications for booking updates', enabled: true },
    { label: 'Festival reminders', description: 'Get notified about upcoming festivals at your saved temples', enabled: true },
    { label: 'Donation receipts', description: 'Automatic receipt delivery for all donations', enabled: true },
    { label: 'Marketing emails', description: 'Receive offers and promotions from Namo Setu', enabled: false },
  ]);
  const settingsPrefs = prefs;
  const toggleSetting = (label: string) => {
    setPrefs((prev) => prev.map((p) => (p.label === label ? { ...p, enabled: !p.enabled } : p)));
  };
  const bookingsQuery = useMyDarshanBookings();
  const donationsQuery = useMyDonations();
  const cancelBooking = useCancelDarshanBooking();

  const bookings = bookingsQuery.data ?? [];
  const donations = donationsQuery.data ?? [];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'bookings' as const, label: 'Bookings', icon: Calendar },
    { id: 'donations' as const, label: 'Donations', icon: Heart },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <NamoShell>
      <PageFrame>
        {/* Profile Header */}
        <motion.div
          className="flex flex-col items-center gap-8 sm:flex-row sm:items-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-amber-400 shadow-2xl shadow-orange-500/25">
              <User className="h-14 w-14 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--bg-card)]" />
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">My Profile</h1>
            <p className="mt-3 text-base text-[var(--text-secondary)]">Your pilgrimage journey with Namo Setu</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <StatusPill tone="emerald">Active</StatusPill>
              <span className="text-sm text-[var(--text-muted)]">Member since 2024</span>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MetricTile label="Total Bookings" value={bookings.length.toString()} icon={Calendar} />
          <MetricTile label="Donations" value={donations.length.toString()} icon={Heart} />
          <MetricTile label="Active Trips" value="—" icon={MapPin} />
          <MetricTile label="Saved Temples" value="—" icon={Star} />
        </motion.div>

        {/* Tabs */}
        <div className="border-[var(--border)]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'text-orange-600'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      layoutId="profileTab"
                    />
                  )}
                </button>
              );
            })}
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
          >
            {activeTab === 'bookings' && (
              <div className="space-y-5">
                {bookingsQuery.isLoading && <LoadingState label="Loading bookings..." />}
                {bookingsQuery.isError && <ErrorState message="Unable to load bookings. Showing recent activity." onRetry={() => bookingsQuery.refetch()} />}
                {bookings.map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CompactPanel>
                      <div className="flex items-start justify-between p-6">
                        <div className="flex items-start gap-5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                            <Calendar className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{booking.booking_number}</div>
                            <div className="mt-2 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                              <Calendar className="h-4 w-4" />
                              {booking.visit_date}
                              <span className="text-slate-300">·</span>
                              <Users className="h-4 w-4" />
                              {booking.party_size} visitors
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusPill tone={booking.booking_status === 'cancelled' ? 'slate' : 'emerald'}>
                            {booking.booking_status}
                          </StatusPill>
                          {booking.booking_status !== 'cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelBooking.mutate({ bookingId: booking.id })}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CompactPanel>
                  </motion.div>
                ))}
                {!bookingsQuery.isLoading && bookings.length === 0 && (
                  <div className="text-center py-16">
                    <Calendar className="mx-auto h-16 w-16 text-slate-300" />
                    <p className="mt-6 text-lg font-semibold text-[var(--text-secondary)]">No bookings yet</p>
                    <Link href="/search" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700">
                      Find temples to book <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'donations' && (
              <div className="space-y-5">
                {donationsQuery.isLoading && <LoadingState label="Loading donations..." />}
                {donationsQuery.isError && <ErrorState message="Unable to load donations. Showing recent activity." onRetry={() => donationsQuery.refetch()} />}
                {donations.map((donation, i) => (
                  <motion.div
                    key={donation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CompactPanel>
                      <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                            <Heart className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">₹{donation.amount.toLocaleString('en-IN')}</div>
                            <div className="text-sm text-[var(--text-secondary)] mt-1">{donation.purpose ?? 'General'}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                          {donation.receipt_number}
                        </Button>
                      </div>
                    </CompactPanel>
                  </motion.div>
                ))}
                {!donationsQuery.isLoading && donations.length === 0 && (
                  <div className="text-center py-16">
                    <Heart className="mx-auto h-16 w-16 text-slate-300" />
                    <p className="mt-6 text-lg font-semibold text-[var(--text-secondary)]">No donations yet</p>
                    <Link href="/donation" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700">
                      Make a donation <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              <CompactPanel>
                <div className="p-8">
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                      { label: 'Find Temples', icon: MapPin, href: '/search' },
                      { label: 'Book Darshan', icon: Calendar, href: '/booking' },
                      { label: 'Make Donation', icon: Heart, href: '/donation' },
                      { label: 'Plan Travel', icon: ArrowUpRight, href: '/travel' },
                    ].map((action, i) => {
                      const Icon = action.icon;
                      return (
                        <motion.div
                          key={action.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Link
                            href={action.href}
                            className="group flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1 hover:border-orange-200"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600 transition-all group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white group-hover:shadow-sm group-hover:shadow-orange-500/25">
                              <Icon className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-orange-600 transition-colors">{action.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CompactPanel>
            )}

            {activeTab === 'settings' && (
              <CompactPanel>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Notification Preferences</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Festival reminders and booking confirmations are managed via Namo Setu notifications API.</p>
                  <div className="mt-8 space-y-5">
                    {settingsPrefs.map((pref) => (
                      <div key={pref.label} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:shadow-md">
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{pref.label}</div>
                          <div className="text-xs text-[var(--text-secondary)] mt-1">{pref.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSetting(pref.label)}
                          className={`relative inline-flex h-7 w-12 cursor-pointer rounded-full transition-colors ${pref.enabled ? 'bg-orange-500' : 'bg-slate-200'}`}
                          aria-label={`Toggle ${pref.label}`}
                        >
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-[var(--bg-card)] shadow-md transition-transform mt-0.5 ${pref.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CompactPanel>
            )}
          </motion.div>
        </AnimatePresence>
      </PageFrame>
    </NamoShell>
  );
}