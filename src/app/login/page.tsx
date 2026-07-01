'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, resetPassword } from '@/app/actions/auth'
import { Loader2, Zap, CheckCircle2, ArrowRight, Globe, Shield, Bot } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  const [retryAfter, setRetryAfter] = useState(0)
  const submittingRef = useRef(false)

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get('message')
    if (message) setMsg(message)
  }, [])

  useEffect(() => {
    if (retryAfter <= 0) return
    const timer = window.setInterval(() => {
      setRetryAfter((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [retryAfter])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submittingRef.current || retryAfter > 0) return
    submittingRef.current = true
    setLoading(true)
    setError('')
    setMsg('')

    const formData = new FormData(e.currentTarget)

    if (isResetMode) {
      const result = await resetPassword(formData)
      if (result.success) {
        setMsg(result.message || 'Check your email')
      } else {
        setError(result.error || 'Failed to send reset link')
      }
    } else {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
        if ('code' in result && result.code === 'rate_limited') {
          setRetryAfter('retryAfterSeconds' in result ? result.retryAfterSeconds : 60)
        }
      } else if (result?.success) {
        router.push('/dashboard')
        return
      }
    }

    submittingRef.current = false
    setLoading(false)
  }

  const features = [
    { icon: Bot, text: 'AI WhatsApp Chatbot (understands Darja)', color: '#3b82f6' },
    { icon: Globe, text: 'Professional website builder', color: '#8b5cf6' },
    { icon: CheckCircle2, text: 'CRM, bookings & invoices in DZD', color: '#10b981' },
    { icon: Shield, text: 'Visa tracking & finance ledger', color: '#f59e0b' },
  ]

  return (
    <div className="min-h-screen flex bg-[#f4f5f7]">

      {/* Left Decorative Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1a2744 50%, #0f172a 100%)' }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
          <div className="absolute bottom-[-60px] left-[-40px] w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        {/* Top: Logo */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 bg-blue-600 rounded-[12px] flex items-center justify-center shadow-lg" style={{ boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
              <Zap className="h-5 w-5 text-white fill-current" />
            </div>
            <span className="text-[22px] font-black text-white tracking-tight">
              Snipe<span className="text-blue-400">.dz</span>
            </span>
          </div>

          <div className="space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              SaaS Platform for Algeria
            </div>
            <h1 className="text-[34px] font-black text-white leading-[1.1] tracking-tight">
              The future of<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>Algerian business</span><br />
              <span className="text-blue-400">management.</span>
            </h1>
            <p className="text-gray-400 text-[13.5px] font-medium leading-relaxed">
              Travel agencies, showrooms & online stores — all in one platform, in DZD.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-[30px] w-[30px] rounded-[9px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${feature.color}18`, border: `1px solid ${feature.color}30` }}
                >
                  <feature.icon className="h-[14px] w-[14px]" style={{ color: feature.color }} />
                </div>
                <span className="text-[13px] text-gray-300 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10 p-10">
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="h-3.5 w-3.5 fill-amber-400" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-300 text-[12.5px] leading-relaxed font-medium mb-3">
              &ldquo;Le chatbot comprend vraiment le Darja. Mes clients écrivent en arabe dialectal et il répond parfaitement.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                RB
              </div>
              <div>
                <p className="text-white text-[12px] font-semibold leading-none">Rachid Benali</p>
                <p className="text-gray-500 text-[10.5px] font-medium mt-0.5">Agence Horizons, Alger</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[360px]">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="h-9 w-9 bg-blue-600 rounded-[11px] flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Zap className="h-[18px] w-[18px] text-white fill-current" />
            </div>
            <span className="text-[19px] font-black text-gray-900 tracking-tight">
              Snipe<span className="text-blue-600">.dz</span>
            </span>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-7">
            <div className="mb-6">
              <h2 className="text-[22px] font-black text-gray-900 tracking-tight">
                {isResetMode ? 'Reset password' : 'Sign in'}
              </h2>
              <p className="text-[13px] text-gray-500 mt-1 font-medium">
                {isResetMode ? 'Enter your email to receive a reset link' : 'Welcome back! Sign in to your dashboard'}
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-[12.5px] rounded-xl font-medium">
                <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-[1px]">
                  <span className="text-red-600 text-[9px] font-black">!</span>
                </div>
                {error}
              </div>
            )}
            {msg && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12.5px] rounded-xl font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-[1px]" />
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[11.5px] font-semibold text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@agency.dz"
                  className="w-full h-[42px] px-3.5 text-[13.5px] text-gray-800 bg-[#f4f5f7] border border-[#e5e7eb] rounded-[11px] placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {!isResetMode && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-[11.5px] font-semibold text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-[11.5px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full h-[42px] px-3.5 text-[13.5px] text-gray-800 bg-[#f4f5f7] border border-[#e5e7eb] rounded-[11px] placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || retryAfter > 0}
                className="w-full h-[42px] mt-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[13.5px] font-bold rounded-[11px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {retryAfter > 0
                      ? `Try again in ${retryAfter}s`
                      : isResetMode ? 'Send Reset Link' : 'Sign in'}
                    <ArrowRight className="h-[15px] w-[15px]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-5 text-center text-[12.5px] text-gray-500">
            {isResetMode ? (
              <button
                onClick={() => { setIsResetMode(false); setError(''); setMsg('') }}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                ← Back to sign in
              </button>
            ) : (
              <p className="font-medium">
                Don&apos;t have an account?{' '}
                <Link href="/onboarding" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Register your agency
                </Link>
              </p>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-5 text-[11px] font-semibold text-gray-400">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              SSL Secured
            </span>
            <span className="h-3 w-px bg-gray-200" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              RLS Protected
            </span>
            <span className="h-3 w-px bg-gray-200" />
            <span className="flex items-center gap-1.5">
              🇩🇿 Made in Algeria
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
