'use client'

import { useState } from 'react'
import { Profile } from '@/lib/mock-data'
import { inviteEmployee, removeEmployee } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Trash2, Loader2, Mail } from 'lucide-react'

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
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Management</h1>
          <p className="text-sm text-slate-500">Manage your agency employees and their access.</p>
        </div>
        {currentUserRole === 'superadmin' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                        {profile.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{profile.full_name} {profile.id === currentUserId && '(You)'}</span>
                      <span className="text-xs text-slate-500">{profile.phone || 'No phone'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={profile.role === 'superadmin' ? 'default' : 'secondary'} className={profile.role === 'superadmin' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : ''}>
                    {profile.role === 'superadmin' ? 'Admin' : 'Employee'}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {currentUserRole === 'superadmin' && profile.id !== currentUserId && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemove(profile.id)}
                      disabled={removingId === profile.id}
                    >
                      {removingId === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  No team members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required placeholder="John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="email" name="email" type="email" required placeholder="john@example.com" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select 
                id="role"
                name="role" 
                defaultValue="employee"
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="employee">Employee</option>
                <option value="superadmin">Admin</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
