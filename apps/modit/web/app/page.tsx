"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, User, ChevronRight, ChevronLeft, Star, Zap, Shield, Truck,
  ArrowRight, Package, BarChart3, Brain, Layers, Sparkles, MapPin, Clock,
  Heart, GitCompare, Bell, Eye, Award, TrendingUp, CheckCircle, Users,
  Building2, Timer, Flame, X, Menu, Home, LayoutGrid, Wallet, Lock, RotateCcw, Headphones, CircleCheck
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { searchProducts, products as allProducts, type Product as ProductType } from "@/lib/product-data";
import { ModitLogo } from "@/components/modit-logo";

const PRODUCTS = [
  { id: "cement-1", name: "UltraTech Cement OPC 53 Grade 50kg", brand: "UltraTech", price: 385, mrp: 410, discount: 6, rating: 4.7, reviews: 2340, img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Bestseller", category: "Cement", supplier: "BuildMart India", delivery: "Tomorrow" },
  { id: "steel-1", name: "Tata Tiscon TMT 500D 12mm Bars", brand: "Tata", price: 58500, mrp: 67000, discount: 13, rating: 4.8, reviews: 1890, img: "https://images.unsplash.com/photo-1745909247906-123b53b70e06?w=400&h=400&fit=crop", badge: "Top Rated", category: "Steel", supplier: "SteelSupply Co.", delivery: "2 days" },
  { id: "paint-1", name: "Asian Paints Apex 20L Exterior Emulsion", brand: "Asian Paints", price: 2400, mrp: 3100, discount: 23, rating: 4.6, reviews: 4230, img: "https://images.unsplash.com/photo-1550002233-59d811d29b95?w=400&h=400&fit=crop", badge: "Popular", category: "Paint", supplier: "PaintWorld", delivery: "Tomorrow" },
  { id: "tiles-1", name: "Kajaria Wall Tiles 2x2ft Glossy Finish", brand: "Kajaria", price: 42, mrp: 55, discount: 24, rating: 4.5, reviews: 3120, img: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=400&h=400&fit=crop", badge: "New", category: "Tiles", supplier: "TileHub", delivery: "3 days" },
  { id: "electrical-1", name: "Havells LifeLine Plus 2.5sqmm Wire 90m", brand: "Havells", price: 2520, mrp: 2800, discount: 10, rating: 4.8, reviews: 534, img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop", badge: "Trusted", category: "Electrical", supplier: "ElectroBazaar", delivery: "Tomorrow" },
  { id: "plumbing-1", name: "Jaquar CP Valve 1/2 Inch Full Flow", brand: "Jaquar", price: 890, mrp: 1200, discount: 26, rating: 4.4, reviews: 876, img: "https://images.unsplash.com/photo-1737505599025-836fce14b071?w=400&h=400&fit=crop", badge: "Deal", category: "Plumbing", supplier: "PlumbPro", delivery: "2 days" },
  { id: "cement-2", name: "ACC Cement PPC 43 Grade 50kg", brand: "ACC", price: 360, mrp: 395, discount: 9, rating: 4.6, reviews: 1890, img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=400&h=400&fit=crop", badge: "Value", category: "Cement", supplier: "BuildMart India", delivery: "Tomorrow" },
  { id: "steel-2", name: "JSW Neosteel TMT 500D 10mm Premium", brand: "JSW", price: 54200, mrp: 62000, discount: 12, rating: 4.7, reviews: 1245, img: "https://images.unsplash.com/photo-1745909247906-123b53b70e06?w=400&h=400&fit=crop", badge: "Premium", category: "Steel", supplier: "SteelSupply Co.", delivery: "2 days" },
  { id: "tiles-13", name: "Kajaria Digital Wall Tiles 2x3 ft", brand: "Kajaria", price: 65, mrp: 85, discount: 24, rating: 4.6, reviews: 278, img: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=400&h=400&fit=crop", badge: "New", category: "Tiles", supplier: "Kajaria Premium", delivery: "3 days" },
  { id: "tiles-14", name: "Somany Marble Look Floor Tiles 2x2 ft", brand: "Somany", price: 104, mrp: 120, discount: 13, rating: 4.7, reviews: 204, img: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=400&h=400&fit=crop", badge: "Premium", category: "Tiles", supplier: "Somany Marble Series", delivery: "4 days" },
  { id: "tiles-15", name: "Johnson Subway Wall Tiles 3x9 in", brand: "Johnson", price: 52, mrp: 61, discount: 15, rating: 4.4, reviews: 97, img: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=400&h=400&fit=crop", badge: "New", category: "Tiles", supplier: "Johnson Design Studio", delivery: "3 days" },
  { id: "paint-4", name: "Asian Paints Royale Luxury 20L", brand: "Asian Paints", price: 5200, mrp: 5800, discount: 10, rating: 4.8, reviews: 567, img: "https://images.unsplash.com/photo-1550002233-59d811d29b95?w=400&h=400&fit=crop", badge: "Premium", category: "Paint", supplier: "Color World", delivery: "Tomorrow" },
  { id: "sanitary-1", name: "Cera EWC Sanitary Ware", brand: "Cera", price: 7650, mrp: 8500, discount: 10, rating: 4.5, reviews: 156, img: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop", badge: "Deal", category: "Sanitary", supplier: "Cera Showroom", delivery: "3 days" },
  { id: "plywood-1", name: "Greenply BWR Plywood 19mm 8x4 ft", brand: "Greenply", price: 3200, mrp: 3800, discount: 16, rating: 4.6, reviews: 287, img: "https://images.unsplash.com/photo-1611600700192-d87eaeed4f81?w=400&h=400&fit=crop", badge: "Trusted", category: "Plywood", supplier: "Greenply Dealer", delivery: "3 days" },
];

const APP_CATEGORIES = [
  { name: "Cement", slug: "cement", img: "https://images.unsplash.com/photo-1680357680725-f350480aee35?w=200&h=200&fit=crop" },
  { name: "Tiling", slug: "tiles-ceramics", img: "https://images.unsplash.com/photo-1562825642-4afada44b540?w=200&h=200&fit=crop" },
  { name: "Painting", slug: "paint", img: "https://images.unsplash.com/photo-1550002233-59d811d29b95?w=200&h=200&fit=crop" },
  { name: "Water Proofing", slug: "waterproofing", img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop" },
  { name: "Plywood, MDF & HDHMR", slug: "plywood-boards", img: "https://images.unsplash.com/photo-1611600700192-d87eaeed4f81?w=200&h=200&fit=crop" },
  { name: "Fevicol", slug: "fevicol", img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop" },
  { name: "Wires", slug: "electrical", img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop" },
  { name: "Switches & Sockets", slug: "switches", img: "https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=200&h=200&fit=crop" },
  { name: "Hinges, Channels & Handles", slug: "hardware", img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop" },
  { name: "Kitchen Systems & Accessories", slug: "kitchen", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop" },
  { name: "Wardrobe & Bed Fittings", slug: "bedroom", img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&h=200&fit=crop" },
  { name: "Door Locks & Hardware", slug: "door-locks", img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop" },
];

const ASSURED_FEATURES = [
  { icon: RotateCcw, title: "7 Day Replacement", desc: "Over & Above Brand Warranty", color: "#E91E63" },
  { icon: Clock, title: "4 Hour Resolution", desc: "On Any Quality Issues", color: "#7CB518" },
  { icon: CircleCheck, title: "100% Genuine Guarantee", desc: "QR Code & Batch Number Verified", color: "#7CB518" },
  { icon: Package, title: "Easy Returns", desc: "No Questions Asked", color: "#E91E63" },
];

function ProductCard({ p }: { p: typeof PRODUCTS[0] }) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    const fullProduct = allProducts.find(ap => ap.id === p.id);
    if (fullProduct) { addItem(fullProduct); setAdded(true); setTimeout(() => setAdded(false), 1500); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden group hover:shadow-lg transition-all">
      <div className="relative aspect-square bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)] overflow-hidden">
        <Link href={`/products/${p.id}`}>
          <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </Link>
        {p.discount >= 20 && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-[var(--pink)] to-[var(--pink-hover)] text-white text-[10px] font-bold px-2 py-1 rounded-lg">{p.discount}% OFF</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] font-bold text-[var(--green)] uppercase tracking-wider">{p.brand}</p>
        <Link href={`/products/${p.id}`}><h3 className="text-[12px] font-semibold text-[var(--text)] mt-0.5 line-clamp-2 leading-tight">{p.name}</h3></Link>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="inline-flex items-center gap-0.5 bg-[var(--brand)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{p.rating} <Star className="h-2 w-2 fill-white" /></span>
          <span className="text-[10px] text-[var(--text-muted)]">({p.reviews.toLocaleString()})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-[16px] font-extrabold text-[var(--text)]">₹{p.price.toLocaleString()}</span>
          <span className="text-[11px] text-[var(--text-muted)] line-through">₹{p.mrp.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-[var(--pink)]">{p.discount}% off</span>
        </div>
        <p className="text-[10px] text-[var(--green)] font-semibold mt-1 flex items-center gap-1">
          <Truck className="h-3 w-3" /> Free delivery · {p.delivery}
        </p>
        <button onClick={handleAddToCart} className={`w-full mt-2.5 py-2 rounded-xl text-[11px] font-bold transition-all ${added ? 'bg-[var(--green)] text-white' : 'bg-gradient-to-r from-[var(--green)] to-[var(--green-hover)] text-white hover:shadow-lg'}`}>
          {added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function ModitHomePage() {
  const [slide, setSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductType[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    if (searchQuery.length > 1) {
      setSearchResults(searchProducts(searchQuery).slice(0, 8));
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % 3), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6FC]">

      {/* ═══ HEADER — Dark Purple App Style ═══ */}
      <header className="sticky top-0 z-50 bg-[#150726] border-b border-white/10">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/" className="shrink-0">
            <ModitLogo className="h-[38px] w-auto" dark={false} />
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/cart" className="relative p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] rounded-full bg-[var(--green)] text-[9px] font-black text-white flex items-center justify-center px-1">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ DELIVERY BAR ═══ */}
      <div className="bg-[#150726] border-b border-white/5 px-4 pb-3">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--green)]/20 border border-[var(--green)]/30 rounded-xl px-3 py-1.5">
            <span className="text-[18px] font-black text-[var(--green)]">60</span>
            <span className="text-[9px] font-bold text-[var(--green)] uppercase leading-tight">Mins</span>
          </div>
          <div className="flex items-center gap-1.5 text-white">
            <MapPin className="h-3.5 w-3.5 text-[var(--green)]" />
            <span className="text-[11px] font-semibold">Deliver To</span>
            <ChevronRight className="h-3 w-3 text-white/50" />
          </div>
          <span className="text-[12px] font-bold text-[var(--green)]">201301</span>
        </div>
      </div>

      {/* ═══ DISPATCH ANNOUNCEMENT ═══ */}
      <div className="bg-[#1E0A3C] px-4 py-2.5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-[var(--green)]" />
          </div>
          <p className="text-[12px] text-white/80">
            Your order will be dispatched at <span className="font-bold text-[var(--green)]">8 AM</span> on <span className="font-bold text-[var(--green)]">13 July 2026</span>
          </p>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4">

        {/* ═══ FREE DELIVERY BANNER ═══ */}
        <div className="mt-3 rounded-2xl overflow-hidden bg-gradient-to-r from-[#2D1B69] to-[#4A2D8A] relative">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Truck className="h-8 w-8 text-[var(--green)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-[var(--green)]">FREE</span>
                  <span className="text-[14px] font-black text-white">DELIVERY</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-bold text-white">Free Delivery</p>
              <p className="text-[11px] text-white/70">on next 5 orders</p>
              <span className="inline-block mt-1 bg-[var(--pink)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">(Valid till 31-Jul)</span>
            </div>
          </div>
        </div>

        {/* ═══ MODIT ASSURED ═══ */}
        <div className="mt-3 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E0A3C] to-[#150726] border border-white/10 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--green)] via-[var(--pink)] to-[var(--cyan)]" />
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-[var(--pink)]/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-[var(--green)]/20 rounded-full blur-2xl" />
          <div className="p-4 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h3 className="text-[14px] font-bold text-white">Modit <span className="text-[var(--green)]">Assured</span></h3>
              <Shield className="h-4 w-4 text-[var(--green)]" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ASSURED_FEATURES.map((f) => (
                <div key={f.title} className="text-center">
                  <div className="h-10 w-10 rounded-full mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${f.color}18`, border: `1.5px solid ${f.color}40` }}>
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <p className="text-[10px] font-bold text-white leading-tight">{f.title}</p>
                  <p className="text-[8px] text-white/50 mt-0.5 leading-tight">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ CATEGORY GRID ═══ */}
        <section className="mt-4">
          <div className="grid grid-cols-4 gap-3">
            {APP_CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-2 group">
                <div className="w-full aspect-square rounded-2xl bg-white border border-[var(--border)] overflow-hidden flex items-center justify-center group-hover:border-[var(--brand)] group-hover:shadow-md transition-all">
                  <img src={cat.img} alt={cat.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-semibold text-[var(--text)] text-center leading-tight">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ BOTTOM FEATURES BAR ═══ */}
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#150726] to-[#2D1B69] p-3 grid grid-cols-3 gap-2">
          {[
            { icon: TrendingUp, title: "LOWEST\nPRICES", desc: "Best quality at\nbest prices", color: "#E91E63" },
            { icon: Timer, title: "60 MINS\nDELIVERY", desc: "Superfast delivery\nat your site", color: "#00BCD4" },
            { icon: Lock, title: "SECURE\nPAYMENTS", desc: "100% safe\n& secure", color: "#7CB518" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}20` }}>
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <div>
                <p className="text-[9px] font-black text-white leading-tight whitespace-pre-line">{f.title}</p>
                <p className="text-[8px] text-white/50 leading-tight whitespace-pre-line">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ FEATURED PRODUCTS ═══ */}
        <section className="mt-5 mb-20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text)]">Featured Products</h2>
            <Link href="/products" className="text-[12px] font-bold text-[var(--brand)] flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PRODUCTS.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      </main>

      {/* ═══ BOTTOM NAVIGATION — Mobile App Style ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#150726] border-t border-white/10 safe-area-bottom">
        <div className="max-w-[1440px] mx-auto grid grid-cols-5 gap-0">
          {[
            { icon: Home, label: "Home", href: "/", active: true },
            { icon: LayoutGrid, label: "Category", href: "/products" },
            { icon: Package, label: "Orders", href: "/orders" },
            { icon: User, label: "Account", href: "/auth" },
            { icon: Wallet, label: "My Wallet", href: "/payment/history", highlight: true },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${item.highlight ? 'bg-[var(--green)]/15 border-t-2 border-[var(--green)]' : item.active ? 'text-[var(--green)]' : 'text-white/50 hover:text-white/80'}`}>
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
