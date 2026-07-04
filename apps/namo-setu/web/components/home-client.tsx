"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Compass, Menu, ShieldCheck } from "lucide-react";

import { Button, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@foundation/ui";

import { api } from "../lib/api";
import { product } from "../lib/product";
import { useShellStore } from "../lib/store";
import { LeadForm } from "./lead-form";

const featureCards = [
  {
    title: "Foundation ready",
    description: "FastAPI, Next.js, PostgreSQL, Redis, Celery, and shared packages are wired together.",
  },
  {
    title: "Auth ready",
    description: "JWT, refresh tokens, RBAC, and user management live in the backend foundation.",
  },
  {
    title: "AI-ready architecture",
    description: "LangChain, LangGraph, OpenAI, FAISS, and ChromaDB are prepared for future product flows.",
  },
];

export function HomeClient() {
  const viewMode = useShellStore((state) => state.viewMode);
  const toggleViewMode = useShellStore((state) => state.setViewMode);
  const { data, isLoading } = useQuery({ queryKey: ["health"], queryFn: () => api.getHealth() });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-glow backdrop-blur xl:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Badge className="bg-[rgb(var(--brand))] text-[rgb(var(--brand-foreground))]">{product.name}</Badge>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {product.tagline}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">{product.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => toggleViewMode(viewMode === "overview" ? "operations" : "overview")}>
              <Menu className="h-4 w-4" />
              {viewMode === "overview" ? "Switch to operations" : "Switch to overview"}
            </Button>
            <Button>
              Explore foundation <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-slate-200/80 bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-white">System health</CardTitle>
              <CardDescription className="text-slate-300">Backend readiness from the shared FastAPI service.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{isLoading ? "Checking dependencies..." : data?.status ?? "unknown"}</span>
              </div>
              <div className="grid gap-2 text-sm text-slate-300">
                <span>Database: {data?.dependencies.database ? "connected" : "pending"}</span>
                <span>Redis: {data?.dependencies.redis ? "connected" : "pending"}</span>
              </div>
            </CardContent>
          </Card>

          {featureCards.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Shared engineering foundation</CardTitle>
            <CardDescription>
              Monorepo structure, shared UI primitives, API client, backend core, and deployment scaffolding.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              "Next.js 15 with React 19",
              "FastAPI with SQLAlchemy 2.0 and Alembic",
              "JWT auth, RBAC, Redis, and Celery",
              "OpenAI, LangChain, LangGraph, FAISS, and ChromaDB",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <LeadForm title="Foundation intake form" />
      </section>

      <section className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <Compass className="mb-3 h-5 w-5 text-[rgb(var(--brand))]" />
          Namo Setu stays focused on pilgrimage, travel, and devotional support.
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <ShieldCheck className="mb-3 h-5 w-5 text-[rgb(var(--brand))]" />
          The backend foundation is product-agnostic and ready for secure domain expansion.
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <ArrowRight className="mb-3 h-5 w-5 text-[rgb(var(--brand))]" />
          MODIT will reuse the same engineering base with separate business modules.
        </div>
      </section>
    </main>
  );
}
