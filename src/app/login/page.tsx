'use client'

import { useState } from 'react'
import { login, resetPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
      }
      // If successful, login() will redirect to /dashboard
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              TA
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isResetMode ? 'Reset Password' : 'Welcome back'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isResetMode ? 'Enter your email to receive a reset link' : 'Sign in to manage your travel agency'}
          </p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{error}</div>}
        {msg && <div className="mb-6 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md border border-emerald-100">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" required placeholder="name@agency.com" />
          </div>

          {!isResetMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button 
                  type="button" 
                  onClick={() => setIsResetMode(true)} 
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
          )}

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isResetMode ? 'Send Reset Link' : 'Sign in')}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          {isResetMode ? (
            <button onClick={() => { setIsResetMode(false); setError(''); setMsg('') }} className="text-blue-600 hover:underline">
              Back to login
            </button>
          ) : (
            <p>
              Don't have an account?{' '}
              <Link href="/onboarding" className="text-blue-600 font-medium hover:underline">
                Register your agency
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
