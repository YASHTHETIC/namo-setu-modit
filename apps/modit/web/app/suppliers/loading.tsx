export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="h-16 border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-xl" />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-stone-100" />
        <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-stone-100" />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      </div>
    </div>
  );
}