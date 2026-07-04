"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { usePopularTemples } from "@/lib/namo-api";

import { Panel, PanelHeader, StatusPill } from "./namo-ui";

const fallbackTemples = [
  { id: "t1", name: "Kashi Vishwanath", temple_type: "Jyotirlinga", description: "One of the twelve Jyotirlingas of Lord Shiva, located in Varanasi", deity_name: "Lord Shiva", rating_avg: 4.8, review_count: 2340 },
  { id: "t2", name: "Tirupati Balaji", temple_type: "Vaishnavite", description: "The most visited temple in the world, situated in Andhra Pradesh", deity_name: "Lord Venkateswara", rating_avg: 4.9, review_count: 5120 },
  { id: "t3", name: "Golden Temple", temple_type: "Sikh", description: "The holiest Gurdwara of Sikhism, located in Amritsar", deity_name: "Guru Granth Sahib", rating_avg: 4.9, review_count: 4800 },
  { id: "t4", name: "Kedarnath Temple", temple_type: "Jyotirlinga", description: "One of the Chota Char Dham, situated in Uttarakhand", deity_name: "Lord Shiva", rating_avg: 4.7, review_count: 1890 },
  { id: "t5", name: "Meenakshi Amman Temple", temple_type: "Shakti Peeth", description: "Historic Hindu temple in Madurai with stunning Dravidian architecture", deity_name: "Goddess Meenakshi", rating_avg: 4.8, review_count: 3200 },
];

export function HomeTempleList() {
  const { data, isLoading } = usePopularTemples();

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader title="Priority Temple Flow" detail="Live catalog from Namo Setu API with availability and ratings." />
        <div className="grid gap-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 p-3 md:grid-cols-[160px_1fr_auto] grid gap-4">
              <div className="h-28 rounded-lg bg-slate-100" />
              <div className="space-y-2">
                <div className="h-5 w-48 rounded bg-slate-100" />
                <div className="h-4 w-64 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  const temples = data?.length ? data : fallbackTemples;

  return (
    <Panel>
      <PanelHeader title="Priority Temple Flow" detail="Live catalog from Namo Setu API with availability and ratings." />
      <div className="grid gap-4 p-4">
        {temples.map((temple) => (
          <Link
            key={temple.id}
            href={`/temple/${temple.id}`}
            className="grid gap-4 rounded-lg border border-slate-200 p-3 transition hover:border-orange-300 hover:bg-orange-50/40 md:grid-cols-[160px_1fr_auto]"
          >
            <div className="h-28 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950">{temple.name}</h2>
                <StatusPill tone="teal">{temple.temple_type}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-slate-600">{temple.description ?? temple.deity_name}</p>
            </div>
            <div className="grid content-between gap-3 text-sm text-slate-600 md:justify-items-end">
              <span>{temple.rating_avg} rating</span>
              <span>{temple.review_count} reviews</span>
              <ArrowRight className="h-5 w-5 text-orange-700" />
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
