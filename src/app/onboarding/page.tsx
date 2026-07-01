'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAgency, checkSubdomainAvailability } from '@/app/actions/agency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EcommerceCategoryId, EcommerceTemplateId } from '@/lib/ecommerce-storefront'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Car,
  CheckCircle2,
  Compass,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShoppingBag,
  Sparkles,
  UserRound,
  XCircle,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

type ActiveBusinessType = 'travel_agency' | 'car_showroom' | 'ecommerce'
type SubdomainStatus = 'idle' | 'checking' | 'available' | 'taken'

const businessTypes = [
  {
    id: 'travel_agency' as const,
    title: 'Travel agency',
    subtitle: 'Trips, Omra/Hajj, visas, bookings and invoices.',
    icon: Compass,
    color: '#3b82f6',
    bg: 'bg-blue-50',
  },
  {
    id: 'car_showroom' as const,
    title: 'Car showroom',
    subtitle: 'Sales, rental, imports, leads and finance.',
    icon: Car,
    color: '#ef4444',
    bg: 'bg-red-50',
  },
  {
    id: 'ecommerce' as const,
    title: 'Online store',
    subtitle: 'Products, orders, stock, delivery and promos.',
    icon: ShoppingBag,
    color: '#8b5cf6',
    bg: 'bg-violet-50',
  },
]

function normalizeSubdomain(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [businessType, setBusinessType] = useState<ActiveBusinessType>('travel_agency')
  const selectedBusiness = businessTypes.find(item => item.id === businessType) || businessTypes[0]

  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [agencyEmail, setAgencyEmail] = useState('')
  const [city, setCity] = useState('Alger')
  const [subdomain, setSubdomain] = useState('')
  const [subdomainTouched, setSubdomainTouched] = useState(false)

  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const submittingRef = useRef(false)

  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>('idle')
  const [subdomainError, setSubdomainError] = useState('')

  const totalSteps = 3
  const progress = useMemo(() => Math.round((step / totalSteps) * 100), [step])
  const stepLabels = ['Business', 'Account', 'Launch']
  const accountStepReady =
    companyName.trim().length > 0 &&
    city.trim().length > 0 &&
    phone.trim().length > 0 &&
    isValidEmail(agencyEmail) &&
    subdomain.trim().length > 0 &&
    subdomainStatus === 'available' &&
    adminName.trim().length > 0 &&
    isValidEmail(adminEmail) &&
    adminPassword.length >= 8

  useEffect(() => {
    if (!subdomainTouched && companyName.trim()) {
      setSubdomain(normalizeSubdomain(companyName))
    }
  }, [companyName, subdomainTouched])

  useEffect(() => {
    if (!subdomain) {
      setSubdomainStatus('idle')
      setSubdomainError('')
      return
    }

    const timer = window.setTimeout(async () => {
      setSubdomainStatus('checking')
      try {
        const result = await checkSubdomainAvailability(subdomain)
        if (result.available) {
          setSubdomainStatus('available')
          setSubdomainError('')
        } else {
          setSubdomainStatus('taken')
          setSubdomainError(result.error || 'This link is already taken.')
        }
      } catch {
        setSubdomainStatus('taken')
        setSubdomainError('Could not check this link right now.')
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [subdomain])

  const validateStep = () => {
    setError('')

    if (step === 1) return true

    if (step === 2) {
      if (!companyName.trim()) return setError('Add the business name.'), false
      if (!city.trim()) return setError('Add the main city or wilaya.'), false
      if (!phone.trim()) return setError('Add a business phone number.'), false
      if (!isValidEmail(agencyEmail)) return setError('Add a valid business email.'), false
      if (!subdomain.trim() || subdomainStatus !== 'available') return setError('Choose an available portal link.'), false
      if (!adminName.trim()) return setError('Add the owner name.'), false
      if (!isValidEmail(adminEmail)) return setError('Add a valid owner email.'), false
      if (adminPassword.length < 8) return setError('Password must contain at least 8 characters.'), false
    }

    if (step === 3 && !termsAccepted) {
      return setError('Confirm the information before creating the account.'), false
    }

    return true
  }

  const nextStep = () => {
    if (validateStep()) setStep(prev => Math.min(prev + 1, totalSteps))
  }

  const prevStep = () => {
    setError('')
    setStep(prev => Math.max(prev - 1, 1))
  }

  const getBusinessFocus = () => {
    if (businessType === 'car_showroom') return ['Vente voitures', 'Import sur commande']
    if (businessType === 'ecommerce') return ['Clothing / Mode', 'Paiement a la livraison']
    return ['Voyages organises', 'Omra / Hajj']
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    if (!validateStep()) return

    submittingRef.current = true
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const storeCategory: EcommerceCategoryId = 'shoes'
      const storeTemplateId: EcommerceTemplateId = 'sole-district'
      const result = await createAgency({
        company_name: companyName.trim(),
        legal_name: '',
        registration_number: '',
        subdomain,
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
        admin_name: adminName.trim(),
        logo_url: '',
        primary_color: businessType === 'car_showroom' ? '#111827' : businessType === 'ecommerce' ? '#7c3aed' : '#2563eb',
        secondary_color: '#0f172a',
        hero_title: companyName.trim(),
        hero_subtitle: businessType === 'car_showroom'
          ? 'Votre showroom automobile digital en Algerie.'
          : businessType === 'ecommerce'
            ? 'Votre boutique en ligne digitale avec commandes, stock et livraison en Algerie.'
            : 'Votre agence de voyage digitale en Algerie.',
        phone: phone.trim(),
        whatsapp_phone: phone.trim(),
        agency_email: agencyEmail.trim(),
        address: '',
        city: city.trim(),
        business_focus: getBusinessFocus(),
        ccp_account: '',
        social_links: { facebook: '', instagram: '' },
        modules: { chatbot: true, website: true },
        business_type_slug: businessType,
        store_category: businessType === 'ecommerce' ? storeCategory : undefined,
        store_template_id: businessType === 'ecommerce' ? storeTemplateId : undefined,
      })

      if (!result.success) {
        setError(result.error || 'Account creation failed.')
        submittingRef.current = false
        setLoading(false)
        return
      }

      document.cookie = `demo_business_type_slug=${businessType}; path=/; max-age=2592000; SameSite=Lax`
      setSuccessMsg(
        (result as any).pendingApproval
          ? 'Account created. It is now waiting for platform owner approval.'
          : 'Account created. Opening your dashboard...'
      )
      window.setTimeout(() => router.push(result.redirectUrl || '/dashboard'), 1200)
    } catch (err: any) {
      setError(err?.message || 'Unexpected error while creating the account.')
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="relative hidden w-[440px] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between" style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1a2744 52%, #0f172a 100%)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-[-90px] top-[-90px] h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
            <div className="absolute bottom-[-70px] left-[-70px] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          </div>

          <div className="relative z-10 p-10">
            <Link href="/" className="mb-12 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-blue-600 shadow-lg shadow-blue-600/30">
                <Zap className="h-5 w-5 fill-current text-white" />
              </div>
              <span className="text-[22px] font-black tracking-tight text-white">Snipe<span className="text-blue-400">.dz</span></span>
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              New Business Setup
            </div>
            <h1 className="mt-5 text-[34px] font-black leading-[1.1] tracking-tight text-white">
              Create your workspace in under two minutes.
            </h1>
            <p className="mt-4 text-[13.5px] font-medium leading-7 text-gray-400">
              Keep signup clean. Add only the essentials now, then complete legal details, payments, Meta and website settings inside the dashboard.
            </p>

            <div className="mt-9 space-y-3">
              {[
                { icon: Bot, text: 'AI and website enabled by default', color: '#3b82f6' },
                { icon: Shield, text: 'Separate data for every business', color: '#10b981' },
                { icon: Globe, text: 'Public portal created automatically', color: '#8b5cf6' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]" style={{ backgroundColor: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                    <item.icon className="h-[14px] w-[14px]" style={{ color: item.color }} />
                  </div>
                  <span className="text-[13px] font-medium text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 p-10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <p className="text-[12.5px] font-medium leading-relaxed text-gray-300">
                One simple registration. The rest of the setup happens after login, where the owner has full control.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex flex-1 items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-[760px]">
            <div className="mb-7 flex items-center justify-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-blue-600 shadow-lg shadow-blue-600/20">
                <Zap className="h-[18px] w-[18px] fill-current text-white" />
              </div>
              <span className="text-[19px] font-black tracking-tight text-gray-900">Snipe<span className="text-blue-600">.dz</span></span>
            </div>

            <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Register your business</p>
                  <h2 className="mt-2 text-[26px] font-black tracking-tight text-gray-900">Start with the essentials</h2>
                  <p className="mt-1 text-[13px] font-medium text-gray-500">No heavy legal setup now. Create the account first.</p>
                </div>
                <div className="min-w-[140px] rounded-2xl bg-[#f4f5f7] px-4 py-3">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase text-gray-500">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {stepLabels.map((label, idx) => {
                  const active = step === idx + 1
                  const done = step > idx + 1
                  return (
                    <div key={label} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f4f5f7] text-gray-500'}`}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{idx + 1}</span>}
                      {label}
                    </div>
                  )
                })}
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-[12.5px] font-medium text-red-700">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 text-[12.5px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {successMsg}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    {businessTypes.map(item => {
                      const Icon = item.icon
                      const selected = businessType === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBusinessType(item.id)}
                          className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${selected ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-500/10' : 'border-[#e5e7eb] bg-white hover:border-gray-300'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                              <Icon className="h-5 w-5" style={{ color: item.color }} />
                            </div>
                            {selected && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                          </div>
                          <h3 className="mt-4 text-[15px] font-black text-gray-900">{item.title}</h3>
                          <p className="mt-1 text-[12.5px] font-medium leading-5 text-gray-500">{item.subtitle}</p>
                        </button>
                      )
                    })}
                  </div>

                  <Button onClick={nextStep} className="h-[44px] w-full rounded-xl bg-blue-600 text-[13.5px] font-bold text-white hover:bg-blue-700">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Business name" icon={Building2} required>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="GoldenBird Travel Agency" className="h-[44px] rounded-xl bg-[#f4f5f7]" />
                    </Field>
                    <Field label="City / Wilaya" icon={MapPin} required>
                      <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Alger" className="h-[44px] rounded-xl bg-[#f4f5f7]" />
                    </Field>
                    <Field label="Business phone" icon={Phone} required>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+213..." className="h-[44px] rounded-xl bg-[#f4f5f7]" />
                    </Field>
                    <Field label="Business email" icon={Mail} required>
                      <Input type="email" value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)} placeholder="contact@company.dz" className="h-[44px] rounded-xl bg-[#f4f5f7]" />
                    </Field>
                    <Field label="Portal link" icon={Sparkles} required>
                      <div className="relative">
                        <Input
                          value={subdomain}
                          onChange={e => {
                            setSubdomainTouched(true)
                            setSubdomain(normalizeSubdomain(e.target.value))
                          }}
                          placeholder="goldenbird"
                          className="h-[44px] rounded-xl bg-[#f4f5f7] pr-11 font-mono"
                        />
                        <div className="absolute right-3 top-3">
                          {subdomainStatus === 'checking' && <Loader2 className="h-4.5 w-4.5 animate-spin text-gray-400" />}
                          {subdomainStatus === 'available' && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />}
                          {subdomainStatus === 'taken' && <XCircle className="h-4.5 w-4.5 text-red-500" />}
                        </div>
                      </div>
                      <p className={`mt-1.5 text-[11px] font-semibold ${subdomainError ? 'text-red-500' : 'text-gray-400'}`}>
                        {subdomainError || `${subdomain || 'your-business'}.lvh.me`}
                      </p>
                    </Field>
                    <div className="rounded-2xl border border-[#e5e7eb] bg-[#f4f5f7] p-4">
                      <div className="mb-3 flex items-center gap-2 text-[12px] font-black text-gray-800">
                        <UserRound className="h-4 w-4 text-blue-600" />
                        Owner login
                      </div>
                      <div className="space-y-3">
                        <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Full name" className="h-[42px] rounded-xl bg-white" />
                        <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Owner email" className="h-[42px] rounded-xl bg-white" />
                        <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Password min 8 characters" className="h-[42px] rounded-xl bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={prevStep} className="h-[44px] flex-1 rounded-xl">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={nextStep} disabled={!accountStepReady} className="h-[44px] flex-1 rounded-xl bg-blue-600 text-[13.5px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-55">
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-slate-950 p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Ready to create</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Summary label="Business type" value={selectedBusiness.title} />
                      <Summary label="Business" value={companyName || '-'} />
                      <Summary label="Portal" value={`${subdomain || 'your-business'}.lvh.me`} />
                      <Summary label="Owner" value={adminEmail || '-'} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[12.5px] font-medium leading-6 text-blue-800">
                    After registration, you can complete legal company info, WhatsApp, Meta ads, payment accounts, website design and AI training from the dashboard settings.
                  </div>

                  <label htmlFor="confirm-workspace" className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e5e7eb] bg-[#f4f5f7] p-4">
                    <input
                      id="confirm-workspace"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[12px] font-semibold leading-5 text-gray-600">
                      I confirm this information is correct and I want to create this business workspace.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={prevStep} disabled={loading} className="h-[44px] flex-1 rounded-xl">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !termsAccepted} className="h-[44px] flex-1 rounded-xl bg-blue-600 text-[13.5px] font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Create account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-1.5 flex items-center gap-2 text-[11.5px] font-semibold text-gray-700">
        <Icon className="h-4 w-4 text-gray-400" />
        {label}
        {required && <span className="text-blue-600">*</span>}
      </Label>
      {children}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[13px] font-bold text-white">{value}</p>
    </div>
  )
}
