"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Bot, CalendarCheck, HeartHandshake, MapPin, Search, TicketCheck,
  Clock, Star, Users, Compass, Shield, Download, Phone, MessageCircle,
  ChevronRight, Sparkles, Map, Hotel, Car, Utensils, AlertCircle,
  Flame, Mountain, Flower2, CircleDot, Circle, Landmark
} from "lucide-react";

import { AiAssistantPanel } from "../components/ai-assistant";
import { HomeTempleList } from "../components/home-temple-list";
import { NamoShell } from "../components/namo-shell";
import { MetricTile, PageFrame, Panel, PanelHeader, SectionHeader, StatusPill, inputClass, Button, Card } from "../components/namo-ui";
import { dashboardStats, heroImage } from "../lib/namo-data";

const yatraCategories = [
  { name: "Jyotirlinga Yatra", desc: "12 sacred Shiva temples", icon: Flame, color: "from-orange-500 to-red-500", count: "12 Temples", href: "/search?q=jyotirlinga" },
  { name: "Char Dham Yatra", desc: "Four divine abodes", icon: Mountain, color: "from-blue-500 to-indigo-500", count: "4 Dhams", href: "/search?q=char+dham" },
  { name: "Shakti Peeth", desc: "Divine feminine power", icon: Flower2, color: "from-pink-500 to-rose-500", count: "51 Peeths", href: "/search?q=shakti+peeth" },
  { name: "Ashtavinayak", desc: "8 Ganesha temples", icon: CircleDot, color: "from-yellow-500 to-orange-500", count: "8 Temples", href: "/search?q=ashtavinayak" },
  { name: "Panch Kedar", desc: "Five Kedar temples", icon: Circle, color: "from-green-500 to-emerald-500", count: "5 Temples", href: "/search?q=panch+kedar" },
  { name: "South India Temples", desc: "Dravidian architecture", icon: Landmark, color: "from-purple-500 to-violet-500", count: "100+ Temples", href: "/search?q=south+india" },
];

const journeyModules = [
  { title: "Temple Search", desc: "Find temples by state, city, deity, category, popularity, and nearby radius.", icon: MapPin, href: "/search", color: "bg-orange-100 text-orange-600" },
  { title: "Darshan Booking", desc: "Reserve slots, manage availability, cancellations, and QR tickets.", icon: TicketCheck, href: "/booking", color: "bg-teal-100 text-teal-600" },
  { title: "Puja & Chadhava", desc: "Book pujas, order chadhava, and receive digital prasad receipts.", icon: HeartHandshake, href: "/donation", color: "bg-red-100 text-red-600" },
  { title: "Travel Planner", desc: "Build routes with transport, guides, stays, and festival reminders.", icon: Compass, href: "/travel", color: "bg-blue-100 text-blue-600" },
];

const aiFeatures = [
  { title: "AI Pilgrimage Planner", desc: "Get personalized itinerary based on your time, budget, and spiritual goals.", icon: Sparkles },
  { title: "Voice Assistant", desc: "Multilingual voice support for elderly pilgrims - ask anything in Hindi, Tamil, Telugu.", icon: MessageCircle },
  { title: "Smart Recommendations", desc: "AI suggests temples, pujas, and stays based on your preferences and history.", icon: Bot },
  { title: "Real-time Support", desc: "Live crowd levels, weather, darshan timings, and emergency assistance.", icon: AlertCircle },
];

const trustBadges = [
  { label: "Verified Temples", value: "500+", icon: Shield },
  { label: "Happy Devotees", value: "10,000+", icon: Users },
  { label: "AI Accuracy", value: "98%", icon: Bot },
  { label: "24/7 Support", value: "Always", icon: Phone },
];

export default function Page() {
  const [searchQ, setSearchQ] = useState("");
  const [searchState, setSearchState] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const searchHref = `/search?q=${encodeURIComponent(searchQ)}&state=${encodeURIComponent(searchState)}&date=${encodeURIComponent(searchDate)}`;

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 1.1]);

  return (
    <NamoShell>
      {/* Immersive Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with parallax */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y, scale }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent" />
        </motion.div>

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[128px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <StatusPill tone="orange">Namo Setu</StatusPill>
              </motion.div>

              <motion.h1
                className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Your Divine Journey
                <span className="block text-gradient-brand mt-2" style={{ WebkitTextFillColor: 'transparent', background: 'linear-gradient(135deg, #FF7A00, #FFB347)', WebkitBackgroundClip: 'text' }}>
                  Starts Here
                </span>
              </motion.h1>

              <motion.p
                className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Temple discovery, darshan booking, puja scheduling, donation receipts, stays, routes, guides, and AI pilgrimage support — all in one beautiful platform.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                className="mt-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all"
                      placeholder="Temple, deity, city"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                    />
                  </div>
                  <input
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all"
                    placeholder="State"
                    value={searchState}
                    onChange={(e) => setSearchState(e.target.value)}
                  />
                  <input
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all"
                    type="date"
                    placeholder="Visit date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                  <Link
                    href={searchHref}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </Link>
                </div>
              </motion.div>

              {/* Trust Metrics */}
              <motion.div
                className="mt-8 flex flex-wrap gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { value: "500+", label: "Temples" },
                  { value: "10K+", label: "Devotees" },
                  { value: "98%", label: "AI Accuracy" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                  >
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Floating AI Card */}
            <motion.div
              className="hidden lg:block relative"
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <motion.div
                className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-2xl"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Pilgrimage Assistant</h3>
                    <p className="text-xs text-slate-400">Always here to help</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-slate-200">Planning a pilgrimage to Varanasi? I recommend visiting Kashi Vishwanath at dawn for a serene darshan experience.</p>
                  </div>
                  <div className="rounded-2xl bg-orange-500/20 p-4 ml-8">
                    <p className="text-sm text-slate-200">What are the dress code requirements?</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-slate-200">Traditional attire is recommended. For men: dhoti or pyjama with upper cloth. For women: saree or churidar with upper cloth.</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating badges */}
              <motion.div
                className="absolute -top-4 -right-4 rounded-2xl bg-white p-3 shadow-xl"
                animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Verified</div>
                    <div className="text-[10px] text-slate-500">All temples</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 rounded-2xl bg-white p-3 shadow-xl"
                animate={{ y: [0, 8, 0], rotate: [0, -2, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                    <Bot className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">AI Powered</div>
                    <div className="text-[10px] text-slate-500">98% accuracy</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Scroll to explore</span>
            <ChevronRight className="h-5 w-5 text-slate-400 rotate-90" />
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <PageFrame>
        {/* Trust Badges */}
        <motion.section
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                className="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{badge.value}</div>
                  <div className="text-xs font-medium text-slate-500">{badge.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Yatra Categories */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader label="Yatra Categories" title="Choose Your Pilgrimage" subtitle="Discover sacred temples across India with our curated pilgrimage routes" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {yatraCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={cat.href}>
                    <Card className="overflow-hidden group">
                      <div className={`h-2 bg-gradient-to-r ${cat.color}`} />
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600 group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white transition-all duration-300">
                            <Icon className="h-7 w-7" />
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-slate-900">{cat.name}</h3>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{cat.desc}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-slate-700">{cat.count}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <motion.section
          className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <HomeTempleList />

          <div className="space-y-6">
            <Panel className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm shadow-teal-500/25">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">AI Assistance</h3>
                    <p className="text-xs text-slate-500">Live assistants wired to backend</p>
                  </div>
                </div>
                <AiAssistantPanel />
                <Link href="/travel" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 text-sm font-semibold text-white shadow-sm shadow-teal-500/25 transition-all hover:shadow-md w-full">
                  <Bot className="h-4 w-4" />
                  Open AI Planner
                </Link>
              </div>
            </Panel>

            {/* Quick Services */}
            <Panel className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm shadow-orange-500/25">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Quick Services</h3>
                    <p className="text-xs text-slate-500">Essential pilgrimage support</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Hotels", icon: Hotel, href: "/accommodation" },
                    { label: "Transport", icon: Car, href: "/travel" },
                    { label: "Food Guide", icon: Utensils, href: "/search?q=food" },
                    { label: "Live Map", icon: Map, href: "/search" },
                  ].map((service) => {
                    const Icon = service.icon;
                    return (
                      <Link key={service.label} href={service.href} className="flex items-center gap-3 rounded-xl border border-stone-200 p-4 text-sm font-medium text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50 hover:shadow-sm group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition-all">
                          <Icon className="h-5 w-5" />
                        </div>
                        {service.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Panel>
          </div>
        </motion.section>

        {/* AI Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader label="Agentic AI" title="Intelligent Pilgrimage Support" subtitle="Powered by advanced AI algorithms for personalized spiritual guidance" />
          <div className="grid gap-6 md:grid-cols-2 mt-8">
            {aiFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full">
                    <div className="p-6">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
                      <p className="mt-3 text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Journey Modules */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader label="Workflows" title="Pilgrim Journey Modules" subtitle="Every step of your spiritual journey, beautifully designed" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mt-8">
            {journeyModules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={mod.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full">
                    <div className="p-6">
                      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${mod.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{mod.title}</h3>
                      <p className="mt-3 text-sm text-slate-500 leading-relaxed">{mod.desc}</p>
                      <Link href={mod.href} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-slate-900 transition-all hover:bg-stone-50 hover:border-stone-300">
                        Explore
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Download CTA */}
        <motion.section
          className="relative overflow-hidden rounded-3xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 p-12 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-slate-900">Download Namo Setu App</h2>
            <p className="mt-3 text-slate-600 max-w-lg mx-auto">Get exclusive offers, live darshan updates, and AI-powered pilgrimage planning on your phone.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button variant="secondary" size="lg">
                <Download className="h-5 w-5" />
                Google Play
              </Button>
              <Button variant="secondary" size="lg">
                <Download className="h-5 w-5" />
                App Store
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Footer Trust */}
        <motion.section
          className="grid gap-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {[
            { icon: Shield, title: "Verified & Secure", desc: "All temples and pujas verified. Secure payments with receipt." },
            { icon: Bot, title: "AI-Powered", desc: "Smart recommendations, voice support, and real-time guidance." },
            { icon: Clock, title: "24/7 Support", desc: "Round-the-clock assistance for your pilgrimage journey." },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-stone-200/60 bg-white p-8 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-5 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.section>
      </PageFrame>
    </NamoShell>
  );
}