'use client'

import { useState } from 'react'
import { updateAgencySettings } from '@/app/actions/agency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Check } from 'lucide-react'

export function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState({
    company_name: initialSettings.company_name || '',
    subdomain: initialSettings.subdomain || '',
    logo_url: initialSettings.website_settings?.logo_url || '',
    primary_color: initialSettings.website_settings?.primary_color || '#0f172a',
    secondary_color: initialSettings.website_settings?.secondary_color || '#3b82f6',
    hero_title: initialSettings.website_settings?.hero_title || '',
    hero_subtitle: initialSettings.website_settings?.hero_subtitle || '',
    phone: initialSettings.website_settings?.phone || '',
    agency_email: initialSettings.website_settings?.email || '',
    address: initialSettings.website_settings?.address || '',
    facebook: initialSettings.website_settings?.social_links?.facebook || '',
    instagram: initialSettings.website_settings?.social_links?.instagram || '',
    modules: initialSettings.active_modules || { chatbot: true, website: true }
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleModuleToggle = (moduleName: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleName]: checked
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const payload = {
      ...formData,
      social_links: {
        facebook: formData.facebook,
        instagram: formData.instagram
      }
    }

    const result = await updateAgencySettings(payload)

    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error || 'Failed to update settings')
    }
    
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your agency preferences and public website.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}
        
        <Card>
          <CardHeader>
            <CardTitle>Agency Profile</CardTitle>
            <CardDescription>Basic information about your travel agency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input 
                  id="company_name" 
                  value={formData.company_name} 
                  onChange={e => setFormData({...formData, company_name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain (Read-only)</Label>
                <Input 
                  id="subdomain" 
                  value={formData.subdomain + '.localhost:3000'} 
                  disabled 
                  className="bg-slate-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input 
                id="logo_url" 
                value={formData.logo_url} 
                onChange={e => setFormData({...formData, logo_url: e.target.value})} 
                placeholder="https://example.com/logo.png" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website Branding</CardTitle>
            <CardDescription>Customize the look and feel of your customer-facing landing page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-3">
                  <Input 
                    type="color" 
                    id="primary_color" 
                    value={formData.primary_color} 
                    onChange={e => setFormData({...formData, primary_color: e.target.value})} 
                    className="w-16 h-10 p-1"
                  />
                  <Input 
                    value={formData.primary_color} 
                    onChange={e => setFormData({...formData, primary_color: e.target.value})} 
                    className="flex-1 font-mono uppercase"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-3">
                  <Input 
                    type="color" 
                    id="secondary_color" 
                    value={formData.secondary_color} 
                    onChange={e => setFormData({...formData, secondary_color: e.target.value})} 
                    className="w-16 h-10 p-1"
                  />
                  <Input 
                    value={formData.secondary_color} 
                    onChange={e => setFormData({...formData, secondary_color: e.target.value})} 
                    className="flex-1 font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_title">Hero Title</Label>
              <Input 
                id="hero_title" 
                value={formData.hero_title} 
                onChange={e => setFormData({...formData, hero_title: e.target.value})} 
                placeholder={`Welcome to ${formData.company_name}`} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
              <Textarea 
                id="hero_subtitle" 
                value={formData.hero_subtitle} 
                onChange={e => setFormData({...formData, hero_subtitle: e.target.value})} 
                placeholder="Book your next dream vacation with us today." 
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="phone">Public Phone (WhatsApp)</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+213 555 123 456" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency_email">Public Email</Label>
                <Input 
                  id="agency_email" 
                  value={formData.agency_email} 
                  onChange={e => setFormData({...formData, agency_email: e.target.value})} 
                  placeholder="contact@agency.com" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="123 Travel Street, Algiers" 
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input 
                  id="facebook" 
                  value={formData.facebook} 
                  onChange={e => setFormData({...formData, facebook: e.target.value})} 
                  placeholder="https://facebook.com/..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input 
                  id="instagram" 
                  value={formData.instagram} 
                  onChange={e => setFormData({...formData, instagram: e.target.value})} 
                  placeholder="https://instagram.com/..." 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Modules</CardTitle>
            <CardDescription>Enable or disable platform features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">AI Chatbot Agent</Label>
                <p className="text-sm text-slate-500">Automatically respond to Instagram & WhatsApp leads.</p>
              </div>
              <Switch 
                checked={!!formData.modules?.chatbot}
                onCheckedChange={(c) => handleModuleToggle('chatbot', c)}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-6">
              <div className="space-y-0.5">
                <Label className="text-base">Public Website</Label>
                <p className="text-sm text-slate-500">Enable the customer-facing landing page for your trips.</p>
              </div>
              <Switch 
                checked={!!formData.modules?.website}
                onCheckedChange={(c) => handleModuleToggle('website', c)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[140px]">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
             saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : 
             'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
