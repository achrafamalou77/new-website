'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setupOwnerAccount } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function AdminSetup() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await setupOwnerAccount(formData)

    if (result.success) {
      router.push('/admin/login')
    } else {
      setError(result.error || 'Setup failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Platform Owner Setup</h1>
          <p className="text-slate-400 text-sm">Initialize your master admin account.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Full Name</Label>
            <Input 
              name="fullName" 
              required 
              placeholder="Admin Name" 
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Owner Email</Label>
            <Input 
              name="email" 
              type="email" 
              required 
              placeholder="Matches OWNER_EMAIL" 
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Password</Label>
            <Input 
              name="password" 
              type="password" 
              required 
              minLength={8}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  )
}
