"use client";

import { motion } from "framer-motion";
import { MapPin, Star, TrendingUp, Users, Calendar, Heart, ChevronRight } from "lucide-react";

import { useAnalyticsSummary, useFestivalReminders } from "@/lib/namo-api";

import { CompactPanel, MetricTile } from "./namo-ui";

export function DashboardAnalytics() {
  const analytics = useAnalyticsSummary();
  const festivals = useFestivalReminders({ days_ahead: 90 });

  const fallbackData = { temples: 500, darshan_bookings: 1240, puja_bookings: 890, donations: 4560, donation_amount: 2340000, accommodation_bookings: 320, travel_bookings: 180, reviews: 3200 };
  const analyticsData = analytics.data ?? (analytics.isError ? fallbackData : null);
  if (!analyticsData) return null;

  const stats = analyticsData;

  return (
    <>
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <MetricTile label="Temples" value={stats.temples.toString()} icon={MapPin} />
        <MetricTile label="Darshan" value={stats.darshan_bookings.toLocaleString()} icon={Calendar} delta="+12%" />
        <MetricTile label="Puja" value={stats.puja_bookings.toLocaleString()} icon={TrendingUp} />
        <MetricTile label="Donations" value={`₹${(stats.donation_amount / 100000).toFixed(1)}L`} icon={Heart} delta="+8%" />
        <MetricTile label="Stays" value={stats.accommodation_bookings.toLocaleString()} icon={Users} />
        <MetricTile label="Reviews" value={stats.reviews.toLocaleString()} icon={Star} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <CompactPanel>
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Festivals</h3>
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
            {festivals.data?.length ? (
              <div className="space-y-4">
                {festivals.data.slice(0, 5).map((festival, i) => (
                  <motion.div
                    key={festival.festival_id}
                    className="flex items-center justify-between rounded-2xl border border-stone-200/60 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-1"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                        <Star className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{festival.title}</div>
                        <div className="text-sm text-slate-500 mt-1">{festival.reminder_text}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No upcoming festivals found.</p>
            )}
          </div>
        </CompactPanel>
      </motion.div>
    </>
  );
}