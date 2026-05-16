'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createAgency, checkSubdomainAvailability } from '@/app/actions/agency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Step 1 State
  const [companyName, setCompanyName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminName, setAdminName] = useState('')

  // Subdomain validation state
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [subdomainError, setSubdomainError] = useState('')

  // Step 2 State
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#0f172a')
  const [secondaryColor, setSecondaryColor] = useState('#3b82f6')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [phone, setPhone] = useState('')
  const [agencyEmail, setAgencyEmail] = useState('')
  const [address, setAddress] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')

  // Step 3 State
  const [chatbotEnabled, setChatbotEnabled] = useState(true)
  const [websiteEnabled, setWebsiteEnabled] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Subdomain live check effect
  useEffect(() => {
    if (!subdomain) {
      setSubdomainStatus('idle')
      setSubdomainError('')
      return
    }

    const timer = setTimeout(async () => {
      setSubdomainStatus('checking')
      const result = await checkSubdomainAvailability(subdomain)
      if (result.available) {
        setSubdomainStatus('available')
        setSubdomainError('')
      } else {
        setSubdomainStatus('taken')
        setSubdomainError(result.error || 'Subdomain taken')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [subdomain])

  // Sync company name to hero title initially
  useEffect(() => {
    if (companyName && !heroTitle) {
      setHeroTitle(`Welcome to ${companyName}`)
    }
  }, [companyName, heroTitle])

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setError('You must accept the terms and conditions')
      return
    }

    setLoading(true)
    setError('')

    const result = await createAgency({
      company_name: companyName,
      subdomain,
      admin_email: adminEmail,
      admin_password: adminPassword,
      admin_name: adminName,
      logo_url: logoUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      phone,
      agency_email: agencyEmail,
      address,
      social_links: { facebook, instagram },
      modules: { chatbot: chatbotEnabled, website: websiteEnabled }
    })

    if (result.success) {
      setSuccessMsg(`Your agency is live at ${subdomain}.yoursaas.com! Redirecting...`)
      setTimeout(() => {
        router.push(result.redirectUrl || '/dashboard')
      }, 3000)
    } else {
      setError(result.error || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center rounded-t-2xl">
          <h1 className="text-2xl font-bold">Launch Your Travel Agency</h1>
          <p className="text-blue-100 mt-1">Get your SaaS platform up and running in minutes.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex px-6 pt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 relative">
              <div className={`h-2 rounded-full mx-1 ${step >= s ? 'bg-blue-600' : 'bg-slate-100'}`} />
            </div>
          ))}
        </div>

        <div className="p-6 sm:p-10">
          {error && <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{error}</div>}
          {successMsg && <div className="mb-6 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md border border-emerald-100 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> {successMsg}</div>}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Travel" />
                </div>
                <div className="space-y-2">
                  <Label>Subdomain</Label>
                  <div className="relative">
                    <Input 
                      value={subdomain} 
                      onChange={e => setSubdomain(e.target.value.toLowerCase())} 
                      placeholder="acme" 
                      className="pr-10"
                    />
                    <div className="absolute right-3 top-2.5">
                      {subdomainStatus === 'checking' && <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />}
                      {subdomainStatus === 'available' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      {subdomainStatus === 'taken' && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                  </div>
                  {subdomainError ? (
                    <p className="text-xs text-red-500">{subdomainError}</p>
                  ) : (
                    <p className="text-xs text-slate-500">Your URL will be {subdomain || '...'}.yoursaas.com</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Admin Full Name</Label>
                <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="John Doe" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Admin Password</Label>
                  <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Min 8 characters" />
                </div>
              </div>

              <Button 
                className="w-full mt-6" 
                onClick={() => setStep(2)}
                disabled={!companyName || subdomainStatus !== 'available' || !adminEmail || adminPassword.length < 8 || !adminName}
              >
                Continue to Branding
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold mb-4">Branding (Optional)</h2>
              
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                <p className="text-xs text-slate-500">File upload will be supported in Phase 5.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1" />
                    <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-10 p-1" />
                    <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Hero Title</Label>
                <Input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="Welcome to our agency" />
              </div>
              <div className="space-y-2">
                <Label>Hero Subtitle</Label>
                <Textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="Book your next dream vacation with us." />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-slate-700">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Public Phone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+213 555 123 456" />
                  </div>
                  <div className="space-y-2">
                    <Label>Public Email</Label>
                    <Input value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)} placeholder="contact@agency.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Travel Street, Algiers" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-slate-700">Social Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facebook URL</Label>
                    <Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram URL</Label>
                    <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Back</Button>
                <Button className="w-full" onClick={() => setStep(3)}>Continue to Review</Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold mb-4">Modules & Review</h2>
              
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Chatbot Module</Label>
                    <p className="text-sm text-slate-500">Enable automated WhatsApp/social messaging.</p>
                  </div>
                  <Switch checked={chatbotEnabled} onCheckedChange={setChatbotEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Website Module</Label>
                    <p className="text-sm text-slate-500">Generate a public-facing booking portal.</p>
                  </div>
                  <Switch checked={websiteEnabled} onCheckedChange={setWebsiteEnabled} />
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border text-sm">
                <h3 className="font-semibold text-slate-700">Summary</h3>
                <p><span className="text-slate-500">Agency:</span> {companyName}</p>
                <p><span className="text-slate-500">Domain:</span> {subdomain}.yoursaas.com</p>
                <p><span className="text-slate-500">Admin:</span> {adminEmail}</p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <Label htmlFor="terms" className="text-sm font-normal">
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="w-full" onClick={() => setStep(2)} disabled={loading}>Back</Button>
                <Button className="w-full" onClick={handleSubmit} disabled={loading || !termsAccepted}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Launch Agency'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
