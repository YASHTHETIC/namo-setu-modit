"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { usePopularTemples } from "@/lib/namo-api";

import { Panel, PanelHeader, StatusPill } from "./namo-ui";
import { ErrorState, LoadingState } from "./async-state";

export function HomeTempleList() {
  const { data, isLoading, isError, error, refetch } = usePopularTemples();

  if (isLoading) return <LoadingState label="Loading temple catalog..." />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const temples = data ?? [];

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
