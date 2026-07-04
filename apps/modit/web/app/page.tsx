"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, Truck, Shield, CreditCard, MapPin, Search, Phone,
  Star, ChevronRight, Package, Users, TrendingUp, Download, CheckCircle,
  Zap, ShieldCheck, Headphones, BarChart3, Box, FileText, ShoppingCart,
  LayoutDashboard, Menu, X, Warehouse, Clock, Award, Building2, HardHat,
  Brain, Upload, MessageSquare, Bell, RefreshCw, Mic, FileBarChart,
  GitCompareArrows, TruckIcon, Store,
} from "lucide-react";

const categories = [
  { name: "Cement", desc: "OPC, PPC, Ready Mix", icon: Package, color: "from-slate-500 to-gray-600", bg: "bg-[var(--bg-subtle)]", href: "/products?category=cement" },
  { name: "Steel & TMT", desc: "Bars, Rods, Structural", icon: Zap, color: "from-blue-600 to-indigo-600", bg: "bg-blue-100", href: "/products?category=steel" },
  { name: "Sand & Aggregate", desc: "M Sand, River Sand, Gravel", icon: Building2, color: "from-amber-500 to-orange-500", bg: "bg-amber-100", href: "/products?category=sand" },
  { name: "Bricks & Blocks", desc: "Fly Ash, AAC, Red Bricks", icon: Package, color: "from-red-500 to-rose-600", bg: "bg-red-100", href: "/products?category=bricks" },
  { name: "Tiles & Ceramics", desc: "Floor, Wall, Parking", icon: CheckCircle, color: "from-emerald-500 to-green-600", bg: "bg-emerald-100", href: "/products?category=tiles" },
  { name: "Sanitary & Bath", desc: "Faucets, Toilets, Basins", icon: Shield, color: "from-cyan-500 to-blue-500", bg: "bg-cyan-100", href: "/products?category=sanitary" },
  { name: "Paint", desc: "Interior, Exterior, Primer", icon: Star, color: "from-purple-500 to-violet-600", bg: "bg-purple-100", href: "/products?category=paint" },
  { name: "Electrical", desc: "Wires, Switches, MCB", icon: Zap, color: "from-yellow-500 to-amber-500", bg: "bg-yellow-100", href: "/products?category=electrical" },
  { name: "Plumbing", desc: "Pipes, Fittings, Tanks", icon: ShieldCheck, color: "from-teal-500 to-emerald-500", bg: "bg-teal-100", href: "/products?category=plumbing" },
  { name: "Plywood & Boards", desc: "Plywood, MDF, HDHMR", icon: Package, color: "from-amber-600 to-orange-600", bg: "bg-amber-100", href: "/products?category=plywood" },
  { name: "Hardware", desc: "Hinges, Locks, Fittings", icon: Package, color: "from-slate-500 to-gray-600", bg: "bg-[var(--bg-subtle)]", href: "/products?category=hardware" },
  { name: "Glass & Windows", desc: "Float, Toughened, Mirror", icon: Shield, color: "from-sky-500 to-blue-500", bg: "bg-sky-100", href: "/products?category=glass" },
];

const deals = [
  { name: "UltraTech Cement 50kg", brand: "UltraTech", original: 410, sale: 385, discount: 6, unit: "per bag", bulk: "₹365 at 50+ bags" },
  { name: "Tata Tiscon TMT Bar 12mm", brand: "Tata Tiscon", original: 68, sale: 64, discount: 6, unit: "per kg", bulk: "₹60 at 500+ kg" },
  { name: "Asian Paints Apex 20L", brand: "Asian Paints", original: 3200, sale: 2890, discount: 10, unit: "per bucket", bulk: "₹2,750 at 10+ buckets" },
  { name: "Havells Wires 2.5sqmm", brand: "Havells", original: 2800, sale: 2520, discount: 10, unit: "per 90m coil", bulk: "₹2,400 at 20+ coils" },
  { name: "Cera Sanitary Ware", brand: "Cera", original: 8500, sale: 7650, discount: 10, unit: "per piece", bulk: "₹7,200 at 5+ pieces" },
  { name: "Finolex FR Cable 2.5sqmm", brand: "Finolex", original: 3200, sale: 2880, discount: 10, unit: "per 90m coil", bulk: "₹2,700 at 25+ coils" },
];

const brands = [
  "UltraTech", "Tata Tiscon", "Asian Paints", "Havells", "Cera", "Hindware",
  "Polycab", "Finolex", "Greenply", "Pidilite", "Sintex", "Anchor"
];

const navItems = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/suppliers", label: "Suppliers", icon: Users },
  { href: "/rfq", label: "Get Quote", icon: FileText },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Box },
  { href: "/projects", label: "Projects", icon: LayoutDashboard },
];

const aiFeatures = [
  { icon: Brain, title: "AI Material Advisor", desc: "Tell us your project type — residential, commercial, industrial — and our AI recommends the right materials, quantities, and brands.", color: "from-blue-500 to-indigo-600" },
  { icon: Upload, title: "AI BOQ/BOM Reader", desc: "Upload your bill of quantities or material requirement document. AI extracts items, suggests suppliers, and generates instant quotes.", color: "from-emerald-500 to-green-600" },
  { icon: GitCompareArrows, title: "Smart Price Comparison", desc: "Compare real-time prices across 50+ verified suppliers in Delhi NCR. AI factors in delivery distance, bulk discounts, and quality ratings.", color: "from-amber-500 to-orange-600" },
  { icon: MessageSquare, title: "AI Negotiation Assistant", desc: "Our AI negotiates bulk prices on your behalf. It analyzes market rates, supplier history, and order volume to get you the best deal.", color: "from-purple-500 to-violet-600" },
  { icon: Mic, title: "Voice Ordering", desc: "Site supervisors can order materials by voice in Hindi or English. Just speak your requirements — AI handles the rest.", color: "from-rose-500 to-pink-600" },
  { icon: RefreshCw, title: "Smart Reorder", desc: "AI monitors your consumption patterns and alerts you before materials run out. Never stop a construction site due to material shortage.", color: "from-teal-500 to-cyan-600" },
];

const howItWorks = [
  { step: "01", title: "Search Materials", desc: "Browse 5000+ products across 15 categories or tell our AI what you need.", icon: Search },
  { step: "02", title: "Compare Prices", desc: "Get real-time prices from multiple verified suppliers near your site.", icon: BarChart3 },
  { step: "03", title: "Place Order", desc: "Order with one click. Choose delivery date, payment mode, or credit.", icon: ShoppingCart },
  { step: "04", title: "Track & Receive", desc: "Real-time delivery tracking. Materials at your site in 24-48 hours.", icon: Truck },
];

const testimonials = [
  { name: "Rajesh Kumar", role: "Builder, Noida", rating: 5, text: "MODIT saved us 12% on our last project. The AI price comparison found us a better cement supplier we didn't know existed." },
  { name: "Priya Sharma", role: "Interior Designer, Gurgaon", rating: 5, text: "The BOQ reader is a game changer. I uploaded my renovation plan and got a complete material list with costs in 30 seconds." },
  { name: "Amit Patel", role: "Contractor, Delhi", rating: 5, text: "Same-day delivery for urgent orders. Credit facility makes cash flow management easy. Best platform for contractors." },
  { name: "Vikram Singh", role: "Project Manager, Faridabad", rating: 5, text: "Voice ordering from site is brilliant. My supervisors don't need to type — they just speak and materials are ordered." },
];

const supplierFeatures = [
  { icon: Store, title: "Online Storefront", desc: "List your products and reach thousands of contractors, builders, and retailers in Delhi NCR." },
  { icon: BarChart3, title: "Demand Insights", desc: "AI-powered demand prediction helps you manage inventory and pricing strategy." },
  { icon: FileBarChart, title: "Analytics Dashboard", desc: "Track sales, customer behavior, and market trends in real-time." },
  { icon: Headphones, title: "Dedicated Support", desc: "Onboarding assistance, catalog setup, and ongoing platform support." },
];

const stats = [
  { value: "5000+", label: "Products" },
  { value: "200+", label: "Verified Suppliers" },
  { value: "10,000+", label: "Happy Customers" },
  { value: "24-48hr", label: "Delivery Time" },
];

const deliveryAreas = [
  "New Delhi", "Noida", "Gurgaon", "Faridabad", "Ghaziabad",
  "Greater Noida", "Dwarka", "Rohini", "Pitampura", "Karol Bagh",
];

export default function Page() {
  const [pincode, setPincode] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const checkDelivery = () => {
    if (pincode.length === 6) {
      alert(`Delivery available to ${pincode}! Estimated time: 24-48 hours`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-card)]">
      {/* Announcement Bar */}
      <div className="bg-[var(--text-primary)] text-white text-center py-2 px-4 text-xs font-medium">
        <span className="hidden sm:inline">Delivering across Delhi NCR</span>
        <span className="mx-2 hidden sm:inline">|</span>
        <span>Free delivery on orders above ₹5,000</span>
        <span className="mx-2">|</span>
        <span>Same-day delivery available</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap">MODIT</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                <item.icon className="h-3.5 w-3.5" />{item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input type="text" placeholder="Enter pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-20 border-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none" maxLength={6} />
              <button onClick={checkDelivery} className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)]">Check</button>
            </div>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Search cement, steel, tiles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10 outline-none transition-all" />
            </div>
            <Link href="/dashboard" className="hidden items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md sm:inline-flex">
              Dashboard
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] lg:hidden">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-16 w-full border-b border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 p-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]">
                  <item.icon className="h-4 w-4" />{item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-6">
                <Truck className="h-3 w-3" /> Delhi NCR&apos;s #1 Building Material Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                Building Materials,
                <span className="block text-blue-400">Delivered Fast</span>
              </h1>

              <p className="mt-5 text-lg text-slate-300 max-w-xl leading-relaxed">
                Cement, Steel, Sand, Tiles, Paint, Plumbing, Electrical & more. Compare prices from 200+ verified suppliers. AI-powered procurement for contractors and builders.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30">
                  Browse Products <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/rfq" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10">
                  <FileText className="h-4 w-4" /> Request Bulk Quote
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" /> 100% Genuine Products</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" /> GST Invoice</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" /> Credit Available</div>
              </div>
            </div>

            <div className="hidden lg:block animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white mb-4">Quick Order</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="What do you need?" className="w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-blue-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <div className="text-2xl font-bold text-white">24-48h</div>
                      <div className="text-xs text-slate-400">Delivery Time</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">15%</div>
                      <div className="text-xs text-slate-400">Avg. Savings</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs font-medium text-slate-400 mb-2">Delivering to:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {deliveryAreas.map((area) => (
                        <span key={area} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-300">{area}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="py-6 text-center border-r border-[var(--border-subtle)] last:border-r-0 animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
                <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">{stat.value}</div>
                <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-h2 text-[var(--text-primary)]">Shop by Category</h2>
          <p className="mt-2 text-[var(--text-secondary)] max-w-lg mx-auto">Everything you need for construction, renovation, and interior projects across Delhi NCR</p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat, i) => (
            <Link key={cat.name} href={cat.href} className="group flex flex-col items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-center transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${cat.bg} text-[var(--text-secondary)] transition-all duration-300 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:scale-110`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <div className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{cat.name}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{cat.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Deals of the Week */}
      <section className="bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-h2 text-[var(--text-primary)]">Deals of the Week</h2>
              <p className="mt-2 text-[var(--text-secondary)]">Lowest prices on top-selling materials. Limited time offers.</p>
            </div>
            <Link href="/products" className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{deal.discount}% OFF</span>
                  <span className="text-xs text-[var(--text-muted)]">{deal.brand}</span>
                </div>
                <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-[var(--bg-subtle)]">
                  <Package className="h-10 w-10 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">{deal.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[var(--text-primary)]">₹{deal.sale.toLocaleString()}</span>
                  <span className="text-sm text-[var(--text-muted)] line-through">₹{deal.original.toLocaleString()}</span>
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">{deal.unit}</div>
                <div className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">{deal.bulk}</div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700">Add to Cart</button>
                  <button className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-h2 text-[var(--text-primary)]">How MODIT Works</h2>
          <p className="mt-2 text-[var(--text-secondary)]">4 simple steps to get building materials delivered to your site</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step, i) => (
            <div key={i} className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
              <div className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">{step.step}</div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Features */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-4">
              <Brain className="h-3 w-3" /> Agentic AI
            </span>
            <h2 className="text-h2">AI-Powered Procurement</h2>
            <p className="mt-2 text-slate-400 max-w-lg mx-auto">Let AI handle your material sourcing, price negotiation, and delivery coordination</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {aiFeatures.map((feat, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feat.color} shadow-lg`}>
                  <feat.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">{feat.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="mb-8 text-center text-h2 text-[var(--text-primary)]">Trusted Brands</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand, i) => (
            <Link key={brand} href={`/products?search=${brand}`} className="flex h-16 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 transition-all duration-300 hover:border-blue-200 hover:shadow-sm hover:-translate-y-0.5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}>
              <span className="text-sm font-semibold text-[var(--text-secondary)]">{brand}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* For Suppliers */}
      <section className="bg-blue-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-h2 text-[var(--text-primary)]">For Suppliers & Vendors</h2>
            <p className="mt-2 text-[var(--text-secondary)] max-w-lg mx-auto">Join 200+ suppliers already growing their business on MODIT</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supplierFeatures.map((feat, i) => (
              <div key={i} className="rounded-2xl border border-blue-100 bg-[var(--bg-card)] p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{feat.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/suppliers" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md">
              Register as Supplier <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-h2 text-[var(--text-primary)]">What Our Customers Say</h2>
          <p className="mt-2 text-[var(--text-secondary)]">Trusted by 10,000+ contractors, builders, and construction professionals</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
              <div className="mb-3 flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</div>
                <div className="text-xs text-[var(--text-secondary)]">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-12 text-center text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold">Start Building Smarter Today</h2>
            <p className="mt-3 text-blue-100 max-w-lg mx-auto">Join 10,000+ construction professionals who save time and money with MODIT</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-50 hover:shadow-lg">
                <ShoppingCart className="h-4 w-4" /> Start Shopping
              </Link>
              <Link href="/rfq" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10">
                <FileText className="h-4 w-4" /> Request Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-card)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">M</div>
                <span className="font-bold text-[var(--text-primary)]">MODIT</span>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">Delhi NCR&apos;s trusted building material procurement platform. Compare, order, and manage materials with AI-powered intelligence.</p>
              <div className="mt-4 flex items-center gap-3">
                <Phone className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">1800-123-4567</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Products</h4>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <Link href="/products?category=cement" className="block hover:text-blue-600 transition-colors">Cement</Link>
                <Link href="/products?category=steel" className="block hover:text-blue-600 transition-colors">Steel & TMT</Link>
                <Link href="/products?category=tiles" className="block hover:text-blue-600 transition-colors">Tiles</Link>
                <Link href="/products?category=paint" className="block hover:text-blue-600 transition-colors">Paint</Link>
                <Link href="/products?category=electrical" className="block hover:text-blue-600 transition-colors">Electrical</Link>
                <Link href="/products?category=plumbing" className="block hover:text-blue-600 transition-colors">Plumbing</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Services</h4>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <Link href="/rfq" className="block hover:text-blue-600 transition-colors">Request Quote</Link>
                <Link href="/orders" className="block hover:text-blue-600 transition-colors">Track Order</Link>
                <Link href="/inventory" className="block hover:text-blue-600 transition-colors">Check Stock</Link>
                <Link href="/suppliers" className="block hover:text-blue-600 transition-colors">Find Suppliers</Link>
                <Link href="/projects" className="block hover:text-blue-600 transition-colors">Project Planner</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Company</h4>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <Link href="/dashboard" className="block hover:text-blue-600 transition-colors">Dashboard</Link>
                <Link href="/analytics" className="block hover:text-blue-600 transition-colors">Analytics</Link>
                <Link href="/admin" className="block hover:text-blue-600 transition-colors">Admin</Link>
                <span className="block text-[var(--text-muted)]">About Us</span>
                <span className="block text-[var(--text-muted)]">Contact</span>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-[var(--text-muted)]">&copy; 2026 MODIT. All rights reserved.</div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="hover:text-[var(--text-secondary)] cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[var(--text-secondary)] cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
