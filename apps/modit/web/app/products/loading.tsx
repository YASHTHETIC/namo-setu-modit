export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="h-16 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl" />
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6">
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        <div className="mt-3 h-5 w-72 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[24px] bg-[var(--bg-subtle)]" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-[24px] bg-[var(--bg-subtle)]" />
          ))}
        </div>
      </div>
    </div>
  );
}