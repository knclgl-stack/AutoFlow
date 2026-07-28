export default function AracLoading() {
  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
        <div className="w-32 h-4 rounded-full bg-slate-200 animate-pulse" />
        <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
      </div>

      <div className="max-w-lg mx-auto px-5 pt-4">
        {/* Photo skeleton */}
        <div className="w-full rounded-2xl bg-slate-200 animate-pulse" style={{ aspectRatio: "16/10" }} />

        {/* Content skeletons */}
        <div className="mt-5 space-y-3">
          <div className="w-20 h-6 rounded-full bg-slate-200 animate-pulse" />
          <div className="w-48 h-8 rounded-lg bg-slate-200 animate-pulse" />
          <div className="w-36 h-4 rounded-lg bg-slate-100 animate-pulse" />
        </div>

        {/* Price skeleton */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-100 animate-pulse h-20" />

        {/* Chips skeleton */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
