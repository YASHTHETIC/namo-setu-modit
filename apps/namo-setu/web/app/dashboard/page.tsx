'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Calendar, Heart, MapPin, 
  Star, ChevronRight, BarChart3,
  Download, Clock
} from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { DashboardAnalytics } from '@/components/dashboard-analytics';
import { CompactPanel, PageFrame, Button, MetricTile, Skeleton } from '@/components/namo-ui';
import { usePopularTemples, useAnalyticsSummary } from '@/lib/namo-api';
import { ErrorState, LoadingState } from '@/components/async-state';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const popular = usePopularTemples();
  const analytics = useAnalyticsSummary();

  const recentActivity = [
    { type: 'booking', temple: 'Live feed', user: 'Platform', time: 'Realtime' },
  ];

  return (
    <NamoShell>
      <PageFrame>
        {/* Header */}
        <motion.div
          className="flex flex-wrap items-end justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Analytics</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">Dashboard</h1>
            <p className="mt-3 text-base text-[var(--text-secondary)]">Overview of Namo Setu platform performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-secondary)] outline-none transition-all focus:border-[var(--brand-color,#F97316)] focus:ring-2 focus:ring-[var(--brand-color,#F97316)]/10"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Analytics */}
        <DashboardAnalytics />

        {/* Main Grid */}
        <motion.div
          className="grid lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Chart Placeholder */}
          <CompactPanel className="lg:col-span-2">
            <div className="p-8">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Booking Trends</h3>
              <div className="mt-5 h-72 flex items-center justify-center rounded-2xl bg-[var(--bg-subtle)]">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-16 w-16 text-[var(--text-muted)] opacity-40" />
                  <p className="mt-4 text-base font-semibold text-[var(--text-secondary)]">Booking analytics visualization</p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Shows booking trends over time</p>
                </div>
              </div>
            </div>
          </CompactPanel>

          {/* Recent Activity */}
          <CompactPanel>
            <div className="p-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Recent Activity</h3>
                <Clock className="h-5 w-5 text-[var(--text-muted)]" />
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[var(--text-primary)] truncate">{activity.user}</div>
                      <div className="text-sm text-[var(--text-secondary)] truncate">
                        {activity.type === 'booking' ? 'Booked ' : 'Donated to '}{activity.temple}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] whitespace-nowrap">{activity.time}</div>
                  </motion.div>
                ))}
                <Link href="/booking" className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-semibold text-orange-600 transition-all hover:bg-orange-50">
                  View all bookings
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CompactPanel>
        </motion.div>

        {/* Top Temples */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <CompactPanel>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Top Performing Temples</h3>
                <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {popular.isLoading && <LoadingState label="Loading temples..." />}
              {popular.isError && <ErrorState message={popular.error.message} onRetry={() => popular.refetch()} />}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(popular.data ?? []).slice(0, 6).map((temple, i) => (
                  <motion.div
                    key={temple.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/temple/${temple.id}`}>
                      <div className="flex items-center gap-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 font-bold text-lg group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white group-hover:shadow-sm group-hover:shadow-orange-500/25 transition-all duration-300">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[var(--text-primary)] truncate group-hover:text-orange-600 transition-colors">{temple.name}</div>
                          <div className="text-xs text-[var(--text-muted)] truncate mt-1">{temple.address_line1}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span className="text-sm font-bold text-[var(--text-primary)]">{temple.rating_avg}</span>
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-1">{temple.review_count} reviews</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </CompactPanel>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <CompactPanel>
            <div className="p-8">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'Find Temples', desc: 'Search temple catalog', icon: MapPin, href: '/search' },
                  { label: 'My Bookings', desc: 'View darshan bookings', icon: Calendar, href: '/booking' },
                  { label: 'Donations', desc: 'View donation receipts', icon: Heart, href: '/donation' },
                  { label: 'Travel Planner', desc: 'Plan pilgrimage routes', icon: TrendingUp, href: '/travel' },
                ].map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        href={action.href}
                        className="group flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-orange-200"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600 transition-all duration-300 group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white group-hover:shadow-sm group-hover:shadow-orange-500/25">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)] group-hover:text-orange-600 transition-colors">{action.label}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-1">{action.desc}</div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </CompactPanel>
        </motion.div>
      </PageFrame>
    </NamoShell>
  );
}
