export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8F6FC]">
      {/* Header skeleton */}
      <div className="h-14 border-b border-[#E8E0F7] bg-white/90 backdrop-blur-xl" />
      <div className="h-10 dark-nav" />

      <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6">
        {/* Filter bar skeleton */}
        <div className="flex items-center gap-2 mb-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 rounded-full bg-[#F0ECF9] animate-pulse flex-shrink-0" />
          ))}
          <div className="h-9 w-16 rounded-full bg-[#F0ECF9] animate-pulse flex-shrink-0 ml-auto" />
        </div>

        {/* Product count skeleton */}
        <div className="h-4 w-40 rounded bg-[#F0ECF9] animate-pulse mb-4" />

        {/* Product grid skeleton — 2 columns mobile, 3 tablet, 4 desktop */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-product-card">
              {/* Image skeleton */}
              <div className="skeleton-img" />
              {/* Info skeleton */}
              <div className="p-3 space-y-2">
                <div className="skeleton-line skeleton-line-short h-[10px] rounded" />
                <div className="skeleton-line h-[12px] rounded w-full" />
                <div className="skeleton-line skeleton-line-medium h-[12px] rounded" />
                <div className="skeleton-line skeleton-line-short h-[10px] rounded" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="skeleton-line h-[16px] w-[50px] rounded" />
                  <div className="skeleton-line h-[10px] w-[30px] rounded" />
                  <div className="skeleton-line h-[10px] w-[25px] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
