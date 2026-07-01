export default function StoreLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f5f7] p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="rounded-2xl bg-white border border-[#e8eaed] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-gray-200" />
              <div className="h-7 w-64 rounded-xl bg-gray-200" />
              <div className="h-3 w-80 rounded-full bg-gray-100" />
            </div>
            <div className="h-9 w-32 rounded-xl bg-gray-200" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-4 h-11 w-11 rounded-xl bg-gray-100" />
              <div className="h-7 w-20 rounded-lg bg-gray-200" />
              <div className="mt-2 h-3 w-16 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f0f1f3]">
              <div className="h-4 w-32 rounded bg-gray-200" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-[#f9fafb] px-4 py-3">
                  <div className="space-y-1.5">
                    <div className="h-3 w-48 rounded bg-gray-200" />
                    <div className="h-2.5 w-32 rounded bg-gray-100" />
                  </div>
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f0f1f3]">
              <div className="h-4 w-40 rounded bg-gray-200" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl border border-[#f0f1f3] bg-[#f9fafb]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
