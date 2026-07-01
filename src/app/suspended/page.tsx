import Link from 'next/link'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-100 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Account Waiting For Approval</h1>
        <p className="text-slate-600">
          This workspace is not active yet. The platform owner must approve or reactivate it before the dashboard and public portal are available.
        </p>
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-sm text-slate-500">If you are the platform owner, open the admin panel and activate this agency.</p>
          <div className="flex justify-center gap-2">
            <Link
              href="/admin"
              className="inline-block px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-semibold"
            >
              Admin Panel
            </Link>
            <a
              href="mailto:support@example.com"
              className="inline-block px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
