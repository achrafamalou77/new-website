'use client'

import { useEffect, useState } from 'react'
import { updateAgencyInfo } from '@/app/actions/agency'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Check, Copy, Building2, Contact2, Share2, Clock, Globe } from 'lucide-react'
import { defaultBusinessHours, defaultSocialMedia } from '@/lib/settings-defaults'

export function AgencySettingsClient() {
  const { agencyInfo, businessHours, socialMedia, businessTypeSlug, isLoaded, setAgencyInfo, setBusinessHours, setSocialMedia } = useSettingsStore()
  
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    email: '',
    address: '',
    business_hours: defaultBusinessHours,
    social_media: defaultSocialMedia,
    bank_integrations: {
      cpa: true,
      agb: true,
      badr: false,
      bdl: false,
      bna: false,
      albaraka: false
    }
  })

  const [hasInitialized, setHasInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Sync store data to state once loaded from Server / local Storage
  useEffect(() => {
    if (isLoaded && agencyInfo && !hasInitialized) {
      setFormData({
        company_name: agencyInfo.company_name || '',
        phone: agencyInfo.phone || '',
        email: agencyInfo.email || '',
        address: agencyInfo.address || '',
        business_hours: businessHours || defaultBusinessHours,
        social_media: socialMedia || defaultSocialMedia,
        bank_integrations: (agencyInfo as any).bank_integrations || {
          cpa: true,
          agb: true,
          badr: false,
          bdl: false,
          bna: false,
          albaraka: false
        }
      })
      setHasInitialized(true)
    }
  }, [isLoaded, agencyInfo, businessHours, socialMedia, hasInitialized])

  // Auto-save debounced logic (500ms) - only after initialization
  useEffect(() => {
    if (!hasInitialized) return

    const timer = setTimeout(() => {
      saveSettings(formData)
    }, 500)
    return () => clearTimeout(timer)
  }, [formData, hasInitialized])

  const saveSettings = async (data: typeof formData) => {
    setLoading(true)
    setError('')
    
    const result = await updateAgencyInfo(data)
    
    if (result.success) {
      setSaved(true)
      setAgencyInfo({ 
        company_name: data.company_name, 
        phone: data.phone, 
        email: data.email, 
        address: data.address,
        bank_integrations: data.bank_integrations
      })
      setBusinessHours(data.business_hours)
      setSocialMedia(data.social_media)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error || 'Failed to update settings')
    }
    setLoading(false)
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${agencyInfo?.subdomain || 'agency'}.localhost:3000`)
  }

  // Premium loading state skeleton
  if (!isLoaded || !agencyInfo) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto text-left animate-pulse">
        <div className="h-24 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-2/3 mt-2" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-10 bg-slate-100 rounded-xl w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 font-geist text-left bg-[#f4f5f7] h-[calc(100vh-64px)] overflow-y-auto max-w-4xl mx-auto page-enter">
      
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">
            {businessTypeSlug === 'car_showroom' ? 'Showroom Settings' : 'Agency Settings'}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {businessTypeSlug === 'car_showroom'
              ? 'Configure your vehicle showroom details, contact lines, active hours, and bank partner integrations.'
              : 'Configure your primary business card details, contact lines, and active hours.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-650 text-indigo-600" />}
          {saved && <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full"><Check className="h-3.5 w-3.5 mr-1" /> Saved</span>}
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{error}</div>}

      <div className="space-y-6">
        
        {/* Basic Identity Card */}
        <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-650 text-indigo-600 shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-800">
                {businessTypeSlug === 'car_showroom' ? 'Showroom Basic Information' : 'Basic Information'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">
                {businessTypeSlug === 'car_showroom'
                  ? 'Set your vehicle showroom title and portal details.'
                  : 'Set your agency business title and portal details.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-650 text-slate-600" htmlFor="company_name">Company Name</Label>
              <Input 
                id="company_name" 
                className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
                value={formData.company_name} 
                onChange={e => setFormData({...formData, company_name: e.target.value})} 
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Subdomain Prefix</Label>
                <Input value={agencyInfo?.subdomain || ''} disabled className="rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-400 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Live URL</Label>
                <div className="flex gap-2">
                  <Input value={`https://${agencyInfo?.subdomain || 'agency'}.localhost:3000`} disabled className="rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-400 flex-1 cursor-not-allowed" />
                  <Button variant="outline" size="icon" className="rounded-xl border-slate-200 hover:bg-slate-50 shadow-sm" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center gap-3">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
              <Contact2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-800">
                {businessTypeSlug === 'car_showroom' ? 'Showroom Contact Details' : 'Contact Information'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">
                {businessTypeSlug === 'car_showroom'
                  ? 'Establish support channels for your prospective car buyers.'
                  : 'Establish support channels for your customer queries.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600" htmlFor="phone">WhatsApp Business Number (+213)</Label>
                <Input 
                  id="phone" 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
                  placeholder="+213XXXXXXXXX"
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600" htmlFor="email">Business Support Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600" htmlFor="address">
                {businessTypeSlug === 'car_showroom' ? 'Showroom Physical Address' : 'Physical Headquarters Address'}
              </Label>
              <Textarea 
                id="address" 
                className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition min-h-[70px]"
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Accounts Card */}
        <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center gap-3">
            <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Social Networks</CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">Link your active digital social platform handles.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600" htmlFor="facebook">Facebook URL</Label>
                <Input 
                  id="facebook" 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
                  value={formData.social_media.facebook} 
                  onChange={e => setFormData({...formData, social_media: {...formData.social_media, facebook: e.target.value}})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600" htmlFor="instagram">Instagram URL</Label>
                <Input 
                  id="instagram" 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
                  value={formData.social_media.instagram} 
                  onChange={e => setFormData({...formData, social_media: {...formData.social_media, instagram: e.target.value}})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600" htmlFor="tiktok">TikTok URL</Label>
                <Input 
                  id="tiktok" 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
                  value={formData.social_media.tiktok} 
                  onChange={e => setFormData({...formData, social_media: {...formData.social_media, tiktok: e.target.value}})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600" htmlFor="youtube">YouTube URL</Label>
                <Input 
                  id="youtube" 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
                  value={formData.social_media.youtube} 
                  onChange={e => setFormData({...formData, social_media: {...formData.social_media, youtube: e.target.value}})} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours Card */}
        <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center gap-3">
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Business Hours</CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">Configure public weekly office hours schedules.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
              <div key={day} className="flex items-center gap-4 py-1.5 border-b border-slate-100 last:border-0">
                <Label className="w-24 capitalize text-xs font-semibold text-slate-600">{day}</Label>
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition max-w-sm"
                  value={(formData.business_hours as any)[day]} 
                  onChange={e => setFormData({...formData, business_hours: {...formData.business_hours, [day]: e.target.value}})} 
                  placeholder="09:00 - 18:00 or Closed"
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-700">Display Hours</span>
                <span className="text-[10px] text-slate-400">Show weekly business hours in website footer listings.</span>
              </div>
              <Switch 
                checked={formData.business_hours.show_on_website}
                onCheckedChange={c => setFormData({...formData, business_hours: {...formData.business_hours, show_on_website: c}})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Partner Integrations Card (Car Showroom only) */}
        {businessTypeSlug === 'car_showroom' && (
          <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center gap-3">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Bank Partner Integrations</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">Activate financing simulation calculators for partnered Algerian banks.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { id: 'cpa', name: "Crédit Populaire d'Algérie (CPA)", desc: 'Direct API integrations for automotive lease applications.' },
                  { id: 'agb', name: 'Gulf Bank Algeria (AGB)', desc: 'Islamic financing modules support.' },
                  { id: 'badr', name: "Banque de l'Agriculture et du D.R. (BADR)", desc: 'Rural and multi-brand financing packages.' },
                  { id: 'bdl', name: "Banque du Développement Local (BDL)", desc: 'Fast-track retail financing models.' },
                  { id: 'bna', name: "Banque Nationale d'Algérie (BNA)", desc: 'State-backed automotive financing schemes.' },
                  { id: 'albaraka', name: 'Al Baraka Bank Algeria', desc: '100% Murabaha-compliant financing structures.' }
                ].map((bank) => (
                  <div key={bank.id} className="flex items-start justify-between p-3 border border-slate-150 bg-slate-50/30 rounded-xl">
                    <div className="flex flex-col text-left pr-4">
                      <span className="text-xs font-bold text-slate-700">{bank.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{bank.desc}</span>
                    </div>
                    <Switch 
                      checked={!!(formData.bank_integrations as any)?.[bank.id]}
                      onCheckedChange={c => setFormData({
                        ...formData,
                        bank_integrations: {
                          ...((formData.bank_integrations as any) || {}),
                          [bank.id]: c
                        }
                      })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tactical Manual Save Settings Action Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="text-xs text-slate-400 font-semibold">
            {loading ? "Saving settings..." : "All changes automatically sync, or you can commit them manually."}
          </div>
          <Button 
            onClick={() => saveSettings(formData)} 
            disabled={loading}
            className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-6 py-2 shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>Save Settings</span>
          </Button>
        </div>

      </div>
    </div>
  )
}
