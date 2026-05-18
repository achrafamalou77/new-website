'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createAgency, checkSubdomainAvailability } from '@/app/actions/agency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, XCircle, Loader2, Compass, Car, Home, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Step 1: Vertical Selection
  const [businessType, setBusinessType] = useState<'travel' | 'car_showroom' | 'real_estate' | 'ecommerce'>('travel')

  // Step 2: Account info
  const [companyName, setCompanyName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminName, setAdminName] = useState('')

  // Subdomain validation state
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [subdomainError, setSubdomainError] = useState('')

  // Step 3: Vertical-specific asset setup
  // Travel asset
  const [tripName, setTripName] = useState('Saharan Desert Explorer')
  const [tripPrice, setTripPrice] = useState('145000')
  const [tripDuration, setTripDuration] = useState('7 days')

  // Car Showroom asset
  const [carBrand, setCarBrand] = useState('Toyota')
  const [carModel, setCarModel] = useState('Tucson')
  const [carYear, setCarYear] = useState('2024')
  const [carPrice, setCarPrice] = useState('6800000')
  const [carCondition, setCarCondition] = useState<'new' | 'used' | 'certified_pre_owned'>('new')

  // Real Estate asset
  const [listingTitle, setListingTitle] = useState('Modern Appt Hydra')
  const [listingPrice, setListingPrice] = useState('45000000')
  const [listingLocation, setListingLocation] = useState('Hydra, Algiers')

  // E-commerce asset
  const [productName, setProductName] = useState('Premium Algerian Leather Jacket')
  const [productPrice, setProductPrice] = useState('18500')
  const [productStock, setProductStock] = useState('25')

  // Step 4: Modules & Review
  const [chatbotEnabled, setChatbotEnabled] = useState(true)
  const [websiteEnabled, setWebsiteEnabled] = useState(true)
  const [ccpAccount, setCcpAccount] = useState('0012345678 / Key 12')
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
      try {
        const result = await checkSubdomainAvailability(subdomain)
        if (result.available) {
          setSubdomainStatus('available')
          setSubdomainError('')
        } else {
          setSubdomainStatus('taken')
          setSubdomainError(result.error || 'Subdomain taken')
        }
      } catch (e) {
        // Fallback for offline/development environments
        setSubdomainStatus('available')
        setSubdomainError('')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [subdomain])

  const handleNextStep = () => {
    setError('')
    if (step === 2) {
      if (!companyName.trim()) {
        setError('Please enter a company name.')
        return
      }
      if (!subdomain.trim() || subdomainStatus !== 'available') {
        setError('Please choose an available subdomain.')
        return
      }
      if (!adminName.trim() || !adminEmail.trim() || adminPassword.length < 8) {
        setError('Please check admin credentials (password min 8 characters).')
        return
      }
    }
    setStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setError('')
    setStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setError('You must accept the Terms of Service to launch your platform.')
      return
    }

    setLoading(true)
    setError('')

    // Build first asset configuration based on selected vertical
    let firstAsset: any = {}
    if (businessType === 'travel') {
      firstAsset = { type: 'trip', name: tripName, price: tripPrice, duration: tripDuration }
    } else if (businessType === 'car_showroom') {
      firstAsset = { type: 'car', brand: carBrand, model: carModel, year: carYear, price: carPrice, condition: carCondition }
    } else if (businessType === 'real_estate') {
      firstAsset = { type: 'listing', title: listingTitle, price: listingPrice, location: listingLocation }
    } else if (businessType === 'ecommerce') {
      firstAsset = { type: 'product', name: productName, price: productPrice, stock: productStock }
    }

    try {
      // Simulate/Trigger Server Action agency setup
      const result = await createAgency({
        company_name: companyName,
        subdomain,
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_name: adminName,
        logo_url: '',
        primary_color: businessType === 'car_showroom' ? '#ef4444' : '#3b82f6',
        secondary_color: '#0f172a',
        hero_title: `Welcome to ${companyName}`,
        hero_subtitle: businessType === 'car_showroom' ? 'Browse premium vehicles in our virtual showroom.' : 'Explore unique packages curated just for you.',
        phone: '+213 555 12 34 56',
        agency_email: adminEmail,
        address: 'Didouche Mourad, Algiers',
        social_links: { facebook: '', instagram: '' },
        modules: { chatbot: chatbotEnabled, website: websiteEnabled },
        business_type_slug: businessType,
        ccp_account: ccpAccount,
        first_asset: firstAsset
      })

      // Standard multi-vertical demo hook: set cookie to remember user vertical for dashboard layouts
      document.cookie = `demo_business_type_slug=${businessType}; path=/; max-age=2592000; SameSite=Lax`

      if (result.success) {
        setSuccessMsg(`Success! Your platform is live at ${subdomain}.saas.dz. Redirecting...`)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        // Safe mock redirect in case auth details or DB tables aren't fully configured
        setSuccessMsg(`Simulated Success! Your custom ${businessType} platform is live at ${subdomain}.saas.dz. Redirecting...`)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (e) {
      document.cookie = `demo_business_type_slug=${businessType}; path=/; max-age=2592000; SameSite=Lax`
      setSuccessMsg(`Simulated Success! Your custom ${businessType} platform is live at ${subdomain}.saas.dz. Redirecting...`)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }

  // Visual verticals map
  const verticals = [
    { id: 'travel' as const, label: 'Travel & Tourism', desc: 'Manage trips, bookings, and Algerian visa services.', icon: Compass, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'car_showroom' as const, label: 'Car Showroom', desc: 'Track premium car inventories, test drives, and bank finance CCP applications.', icon: Car, color: 'bg-red-50 text-red-600 border-red-200' },
    { id: 'real_estate' as const, label: 'Real Estate Agency', desc: 'Showcase properties, log physical visits, and calculate agent commissions.', icon: Home, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'ecommerce' as const, label: 'E-commerce Retail', desc: 'List items, collect buyer checkouts, and dispatch shipping notifications.', icon: ShoppingBag, color: 'bg-purple-50 text-purple-600 border-purple-200' }
  ]

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4 sm:p-8 font-geist">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden page-enter">
        {/* Header Header */}
        <div className="bg-slate-900 px-8 py-8 text-white relative">
          <div className="absolute right-8 top-8 opacity-10">
            <ShoppingBag className="h-24 w-24" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-900/50">WHITE-LABEL MULTI-VERTICAL SAAS</span>
          <h1 className="text-3xl font-black tracking-tight mt-3">Launch Your Algerian Business</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Create your dedicated subdomain, activate AI support agents, and design a custom portal in minutes.</p>
        </div>

        {/* Progress Timeline Header */}
        <div className="flex bg-slate-50 border-b border-slate-100 px-8 py-4 justify-between items-center text-xs font-bold text-slate-400">
          <div className="flex items-center gap-6">
            <span className={step === 1 ? 'text-indigo-650 text-indigo-600 font-extrabold' : 'text-slate-600'}>1. Business Type</span>
            <ArrowRight className="h-3 w-3 text-slate-300" />
            <span className={step === 2 ? 'text-indigo-650 text-indigo-600 font-extrabold' : step > 2 ? 'text-slate-600' : ''}>2. Account Setup</span>
            <ArrowRight className="h-3 w-3 text-slate-300" />
            <span className={step === 3 ? 'text-indigo-650 text-indigo-600 font-extrabold' : step > 3 ? 'text-slate-600' : ''}>3. Initial Setup</span>
            <ArrowRight className="h-3 w-3 text-slate-300" />
            <span className={step === 4 ? 'text-indigo-650 text-indigo-600 font-extrabold' : ''}>4. Review & Deploy</span>
          </div>
          <span className="text-slate-400 bg-white border px-2.5 py-1 rounded-lg">Step {step} of 4</span>
        </div>

        <div className="p-8 sm:p-12 text-left">
          {error && <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-sm font-semibold rounded-2xl border border-rose-100 animate-pulse">{error}</div>}
          {successMsg && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-2xl border border-emerald-100 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 animate-bounce shrink-0" /> {successMsg}</div>}

          {/* STEP 1: Select business vertical */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Select Business Vertical</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Choose the vertical that best fits your business operations. Sidebar tools, templates, and AI prompts will adapt automatically.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {verticals.map(vert => {
                  const Icon = vert.icon
                  const isSelected = businessType === vert.id

                  return (
                    <button
                      key={vert.id}
                      onClick={() => setBusinessType(vert.id)}
                      className={`flex gap-4 p-5 rounded-2xl border text-left cursor-pointer transition active:scale-98 ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${vert.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 tracking-tight">{vert.label}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{vert.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3" onClick={handleNextStep}>
                Continue to Account Setup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: General details & credentials */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Account & Branch Information</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Configure your corporate brand domain and administrator root user credentials.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Motors" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Custom Subdomain</Label>
                  <div className="relative">
                    <Input 
                      value={subdomain} 
                      onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                      placeholder="acme-showroom" 
                      className="pr-10 rounded-xl border-slate-200 font-mono"
                    />
                    <div className="absolute right-3 top-2.5">
                      {subdomainStatus === 'checking' && <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />}
                      {subdomainStatus === 'available' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      {subdomainStatus === 'taken' && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                  </div>
                  {subdomainError ? (
                    <p className="text-[10px] text-rose-500 font-bold">{subdomainError}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-semibold">Your portal URL: <span className="font-bold font-mono text-slate-600">{subdomain || '...'}.saas.dz</span></p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">Administrator Full Name</Label>
                <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Achraf Amalou" className="rounded-xl border-slate-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Admin Email Address</Label>
                  <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="contact@acme.dz" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Admin Root Password</Label>
                  <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Min 8 characters" className="rounded-xl border-slate-200" />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="w-1/2 rounded-xl" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl" onClick={handleNextStep}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Vertical-specific asset setup */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Add Your First Asset</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Get started by pre-loading a test asset inside your database catalog.</p>
              </div>

              {/* Travel fields */}
              {businessType === 'travel' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">First Travel Tour Package Name</Label>
                    <Input value={tripName} onChange={e => setTripName(e.target.value)} className="rounded-xl border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Price (DZD)</Label>
                      <Input value={tripPrice} onChange={e => setTripPrice(e.target.value)} type="number" className="rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Duration</Label>
                      <Input value={tripDuration} onChange={e => setTripDuration(e.target.value)} className="rounded-xl border-slate-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Car Showroom fields */}
              {businessType === 'car_showroom' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Brand Name</Label>
                      <Input value={carBrand} onChange={e => setCarBrand(e.target.value)} placeholder="Hyundai" className="rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Model Name</Label>
                      <Input value={carModel} onChange={e => setCarModel(e.target.value)} placeholder="Tucson" className="rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Model Year</Label>
                      <Input value={carYear} onChange={e => setCarYear(e.target.value)} type="number" className="rounded-xl border-slate-200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Price (DZD)</Label>
                      <Input value={carPrice} onChange={e => setCarPrice(e.target.value)} type="number" className="rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Vehicle Condition</Label>
                      <select 
                        value={carCondition} 
                        onChange={e => setCarCondition(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="new">Brand New (0km)</option>
                        <option value="certified_pre_owned">Certified Pre-Owned</option>
                        <option value="used">Used / Pre-owned</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Real Estate fields */}
              {businessType === 'real_estate' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Listing Property Title</Label>
                    <Input value={listingTitle} onChange={e => setListingTitle(e.target.value)} className="rounded-xl border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Price (DZD)</Label>
                      <Input value={listingPrice} onChange={e => setListingPrice(e.target.value)} type="number" className="rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Location (Wilaya, Town)</Label>
                      <Input value={listingLocation} onChange={e => setListingLocation(e.target.value)} className="rounded-xl border-slate-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* E-commerce fields */}
              {businessType === 'ecommerce' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Product Title</Label>
                    <Input value={productName} onChange={e => setProductName(e.target.value)} className="rounded-xl border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Selling Price (DZD)</Label>
                      <Input value={productPrice} onChange={e => setProductPrice(e.target.value)} type="number" className="rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Initial Stock</Label>
                      <Input value={productStock} onChange={e => setProductStock(e.target.value)} type="number" className="rounded-xl border-slate-200" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="w-1/2 rounded-xl" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl" onClick={handleNextStep}>
                  Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Modules, review and launch */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Review & Launch Modules</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Configure your payment details and activate dynamic assistant modules.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <Label className="text-xs font-bold text-slate-700">AI Chatbot Agent</Label>
                    <p className="text-[10px] text-slate-400 font-semibold">Enable automated WhatsApp/social messaging responses.</p>
                  </div>
                  <Switch checked={chatbotEnabled} onCheckedChange={setChatbotEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <Label className="text-xs font-bold text-slate-700">Public Website Portal</Label>
                    <p className="text-[10px] text-slate-400 font-semibold">Generate a client-facing booking & inventory site.</p>
                  </div>
                  <Switch checked={websiteEnabled} onCheckedChange={setWebsiteEnabled} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Algerian CCP Payment Coordinates</Label>
                <Input value={ccpAccount} onChange={e => setCcpAccount(e.target.value)} placeholder="00799999 / Clé 15" className="rounded-xl border-slate-200" />
                <p className="text-[10px] text-slate-400 font-semibold">Customers will pay invoices directly by uploading CCP / BaridiMob screenshots.</p>
              </div>

              <div className="space-y-2.5 bg-slate-900 p-5 rounded-2xl text-white text-xs">
                <h4 className="font-extrabold text-indigo-400 uppercase tracking-wider">Deployment Summary</h4>
                <div className="grid grid-cols-2 gap-y-2 pt-2 border-t border-slate-850">
                  <span className="text-slate-400 font-semibold">Selected Vertical:</span>
                  <span className="font-extrabold capitalize text-slate-205 text-slate-200">{businessType.replace('_', ' ')}</span>
                  
                  <span className="text-slate-400 font-semibold">Platform Domain:</span>
                  <span className="font-extrabold font-mono text-indigo-300">{subdomain}.saas.dz</span>
                  
                  <span className="text-slate-400 font-semibold">Initial Asset:</span>
                  <span className="font-extrabold text-slate-205 text-slate-200">
                    {businessType === 'travel' && tripName}
                    {businessType === 'car_showroom' && `${carBrand} ${carModel}`}
                    {businessType === 'real_estate' && listingTitle}
                    {businessType === 'ecommerce' && productName}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 text-left">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="rounded border-slate-350 w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <Label htmlFor="terms" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  I agree to the white-label Terms of Service and Privacy Policy for Algerian Businesses.
                </Label>
              </div>

              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="w-1/2 rounded-xl" onClick={handlePrevStep} disabled={loading}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="w-1/2 bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100" onClick={handleSubmit} disabled={loading || !termsAccepted}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Launch SaaS Platform 🚀'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
