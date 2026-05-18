'use client'

import { useState } from 'react'
import { Profile } from '@/lib/mock-data'
import { inviteEmployee, removeEmployee } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Trash2, Loader2, Mail, Shield, ShieldAlert, CalendarDays, Contact } from 'lucide-react'

export function TeamClient({ initialProfiles, currentUserRole, currentUserId }: { initialProfiles: Profile[], currentUserRole: string, currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await inviteEmployee(formData)

    if (result.success) {
      setIsModalOpen(false)
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        alert('Invitation sent (Demo mode)')
      } else {
        window.location.reload()
      }
    } else {
      setError(result.error || 'Failed to invite user')
    }
    setLoading(false)
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member? They will lose all access.')) return
    
    setRemovingId(id)
    const result = await removeEmployee(id)
    
    if (result.success) {
      setProfiles(profiles.filter(p => p.id !== id))
    } else {
      alert(result.error)
    }
    setRemovingId(null)
  }

  return (
    <div className="p-6 space-y-6 font-geist text-left bg-[#f8fafc] h-[calc(100vh-64px)] overflow-y-auto">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Team Management</h1>
          <p className="text-sm text-slate-500 mt-1">Add, manage, and edit collaborator permissions for your agency.</p>
        </div>
        {currentUserRole === 'superadmin' && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm transition">
            <Plus className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        )}
      </div>

      {/* Grid of Team Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile: any) => {
          const isMe = profile.id === currentUserId
          const isSuper = profile.role === 'superadmin'
          return (
            <div 
              key={profile.id} 
              className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar and Role */}
                <div className="flex justify-between items-start">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border border-slate-200/80 shadow-sm">
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-lg">
                        {profile.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                  </div>
                  
                  <Badge className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] tracking-wider uppercase border ${
                    isSuper 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100/50 hover:bg-indigo-50' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}>
                    {isSuper ? 'Admin' : 'Employee'}
                  </Badge>
                </div>

                {/* Profile Details */}
                <div className="mt-4 text-left">
                  <h3 className="font-semibold text-base text-slate-800 leading-snug flex items-center gap-1.5">
                    {profile.full_name} 
                    {isMe && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100/30">You</span>}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {profile.email || 'No email registered'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Contact className="h-3.5 w-3.5 text-slate-400" /> {profile.phone || 'No phone number'}
                  </p>
                </div>
              </div>

              {/* Card Footer: Metadata and Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
                  <span>Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>

                {currentUserRole === 'superadmin' && !isMe && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-3 transition text-xs font-semibold"
                    onClick={() => handleRemove(profile.id)}
                    disabled={removingId === profile.id}
                  >
                    {removingId === profile.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                    Remove
                  </Button>
                )}
              </div>

            </div>
          )
        })}

        {profiles.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-slate-500 text-sm">No team collaborators found.</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden font-geist">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-semibold text-slate-850">Invite Team Member</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">Send a registration link to add employees to your agency dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-4 text-left">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{error}</div>}
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Full Name</Label>
              <Input className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition" id="full_name" name="full_name" required placeholder="E.g., John Doe" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" id="email" name="email" type="email" required placeholder="john@example.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Access Role</Label>
              <select 
                id="role"
                name="role" 
                defaultValue="employee"
                className="flex h-10 w-full items-center justify-between rounded-xl border-0 bg-slate-100 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="employee">Employee (Transcripts & Live Chats only)</option>
                <option value="superadmin">Admin (Full Control Panel & Settings)</option>
              </select>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm text-xs font-semibold px-4 transition">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
