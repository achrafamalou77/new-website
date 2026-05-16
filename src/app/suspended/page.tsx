export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Account Suspended</h1>
        <p className="text-slate-600">
          Your agency account has been deactivated. You no longer have access to the dashboard.
        </p>
        <div className="pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-4">If you believe this is a mistake, please contact support.</p>
          <a 
            href="mailto:support@example.com" 
            className="inline-block px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
