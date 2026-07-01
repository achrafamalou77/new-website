'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { applyDirectUpgrade } from '@/app/actions/agency'
import { 
  CreditCard, CheckCircle2, ShieldAlert, XCircle, 
  Zap, Award, Loader2, Sparkles, AlertCircle, Building, Check
} from 'lucide-react'

interface Props {
  agency: any
  plans: any[]
}

export function SubscriptionSettingsClient({ agency, plans }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const activePlan = Array.isArray(agency.plan) ? agency.plan[0] : agency.plan
  const activePlanId = activePlan?.id || agency.plan || ''
  const activePlanName = activePlan?.name || 'Basic Free Plan'
  const activePlanPrice = activePlan?.price !== undefined ? activePlan.price : 0
  
  const isCar = agency.business_type_slug === 'car_showroom'
  const isEcommerce = agency.business_type_slug === 'ecommerce'

  // Resolve active features from agency active plan features
  const activeFeatures = activePlan?.features || {}

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanId || !transactionId.trim()) return
    
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const res = await applyDirectUpgrade(selectedPlanId, transactionId)
    if (res.success) {
      setSuccessMsg('✅ CCP/Bank Transfer request submitted and auto-verified! Your plan and credits have been successfully updated.')
      setTransactionId('')
      setSelectedPlanId(null)
      setTimeout(() => {
        setSuccessMsg('')
        window.location.reload()
      }, 2500)
    } else {
      setErrorMsg(res.error || 'Failed to submit request')
    }
    setLoading(false)
  }

  // Pre-configured feature list mapping to showcase locks/unlocks
  const travelFeaturesList = [
    { key: 'team', label: 'Team Directory & Management', desc: 'Manage employees and workspace permissions.' },
    { key: 'finance', label: 'Finance Ledger & Cash-Flows', desc: 'Real-time DZD parallel cash ledger tracking.' },
    { key: 'basic', label: 'Clients & Basic Bookings', desc: 'Customer files directory and booking catalog.' },
    { key: 'visa', label: 'Visa Tracking & Checklists', desc: 'Passport safe tracker and documents compiler.' },
    { key: 'website', label: 'Whitelabel Website Builder', desc: 'Instant custom subdomain & templates generator.' },
    { key: 'chatbot', label: 'Autonomous AI Chatbot', desc: 'Qualifier and Q&A Darja/Arabic chat responder.' },
    { key: 'leads_analysis', label: 'Leads Board Trend Analytics', desc: 'CRM collaborative pipelines & CRM metrics.' }
  ]

  const carFeaturesList = [
    { key: 'team', label: 'Team Directory & Management', desc: 'Manage sales agents and showroom employees.' },
    { key: 'finance', label: 'Finance Ledger & Cash-Flows', desc: 'Real-time dealership cash register logs.' },
    { key: 'inventory', label: 'Vehicle Inventory Catalog', desc: 'Track standard specs, colors, and sales stock.' },
    { key: 'import', label: 'Customs Import Container Tracker', desc: 'Vessel milestone tracking and landed costs.' },
    { key: 'rental', label: 'Car Rental Operations Fleet', desc: 'Availability dates and lease bookings.' },
    { key: 'website', label: 'Whitelabel Showroom Website', desc: 'Custom website detailing active vehicle stock.' },
    { key: 'chatbot', label: 'Automated AI Dealership Chatbot', desc: 'WhatsApp qualified lead simulation Negotiations.' },
    { key: 'leads_analysis', label: 'Leads Trend Board Analytics', desc: 'Leads scoring and agent efficiency analytics.' }
  ]

  const ecommerceFeaturesList = [
    { key: 'products', label: 'Product Catalog', desc: 'Create products, prices, variants, images, and sales status.' },
    { key: 'inventory', label: 'Inventory Control', desc: 'Track stock and receive low-stock warnings.' },
    { key: 'orders', label: 'Order Management', desc: 'Confirm, pack, ship, deliver, return, or cancel orders.' },
    { key: 'shipping', label: 'Shipping Zones', desc: 'Configure carriers, wilayas, COD, fees, and delivery times.' },
    { key: 'promotions', label: 'Promotion Codes', desc: 'Run percentage, fixed-value, and free-shipping offers.' },
    { key: 'website', label: 'Public Storefront', desc: 'Publish a branded storefront on the company subdomain.' },
    { key: 'ai_landing_pages', label: 'AI Product Landing Pages', desc: 'Generate campaign pages with public checkout links.' },
    { key: 'chatbot', label: 'AI Customer Assistant', desc: 'Automate customer qualification and product questions.' },
  ]

  const coreFeaturesList = isCar
    ? carFeaturesList
    : isEcommerce
      ? ecommerceFeaturesList
      : travelFeaturesList

  return (
    <div className="p-6 space-y-6 font-geist text-left bg-[#f4f5f7] min-h-[calc(100vh-64px)] overflow-y-auto max-w-5xl mx-auto page-enter">
      
      {/* Top Banner Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Subscription & Billing Status
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage your white-label platform gates, view active features, monitor AI usage credits, and upgrade packages.
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-150 px-3 py-1.5 rounded-full text-indigo-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
          <Award className="h-4 w-4" />
          Active: {activePlanName}
        </div>
      </div>

      {successMsg && <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 animate-pulse">{successMsg}</div>}
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">{errorMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Hand: Subscription Summary & Realtime AI Credits Circle */}
        <div className="lg:col-span-1 space-y-6">
          
          <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="border-b border-slate-100 p-6">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Plan Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800 leading-tight">{activePlanName}</h2>
                <p className="text-2xl font-extrabold text-indigo-600 tracking-tight mt-1">
                  {Number(activePlanPrice).toLocaleString()} DZD <span className="text-xs font-bold text-slate-450">/ month</span>
                </p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Monthly AI Receptionist Credits</span>
                
                {/* Visual Credits Progress Ring */}
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="absolute transform -rotate-90 h-full w-full">
                    <circle cx="64" cy="64" r="54" className="stroke-slate-100 fill-transparent" strokeWidth="8" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      className="stroke-indigo-600 fill-transparent transition-all duration-500" 
                      strokeWidth="8" 
                      strokeDasharray={339}
                      strokeDashoffset={
                        activePlan?.ai_credits_monthly
                          ? 339 - (339 * Math.min(agency.ai_credits || 0, activePlan.ai_credits_monthly)) / activePlan.ai_credits_monthly
                          : 339
                      }
                    />
                  </svg>
                  <div className="text-center flex flex-col">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {Number(agency.ai_credits || 0).toLocaleString()}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                      of {Number(activePlan?.ai_credits_monthly || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-450 font-bold text-center mt-4 leading-relaxed">
                  Credits are deducted per AI Chatbot webhook qualification or assistant call.
                </p>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Right Hand: Feature Access Gate Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Feature Lock & Unlock Gates</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">Verify which modular components of your platform vertical are unlocked.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coreFeaturesList.map((feat) => {
                  // Check if this feature is set to true in the plans.features JSON object
                  const isUnlocked = !!activeFeatures[feat.key];
                  
                  return (
                    <div 
                      key={feat.key}
                      className={`flex items-start gap-3 p-3.5 border rounded-xl transition-all duration-300 ${
                        isUnlocked 
                          ? 'border-emerald-100 bg-emerald-50/20' 
                          : 'border-slate-200/60 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isUnlocked ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <XCircle className="h-4.5 w-4.5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={`text-xs font-bold ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                          {feat.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                          {feat.desc}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          
        </div>

      </div>

      {/* Pricing Upgrade Grid Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Available Subscription Tiers</h2>
          <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
            CCP / Bank Transfer simulation
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isCurrent = p.id === activePlanId
            const isFree = p.price === 0
            
            return (
              <Card 
                key={p.id} 
                className={`relative overflow-hidden flex flex-col border shadow-sm rounded-2xl bg-white transition-all duration-300 ${
                  isCurrent 
                    ? 'border-indigo-600 ring-2 ring-indigo-50 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-indigo-650 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                    Current Plan
                  </div>
                )}
                
                <CardHeader className="pb-4 p-5 text-left border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isFree ? 'Trial Option' : 'SaaS Package'}</span>
                  <CardTitle className="text-sm font-extrabold tracking-tight text-slate-700 mt-1">{p.name}</CardTitle>
                  <CardDescription className="text-xl font-black text-slate-900 mt-2 flex items-baseline gap-1">
                    {Number(p.price).toLocaleString()} DZD
                    <span className="text-[9px] font-bold text-slate-400">/ month</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 p-5 text-left space-y-4 flex flex-col justify-between">
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed leading-relaxed min-h-[50px]">
                    {p.description}
                  </p>
                  
                  <div className="space-y-2.5 pt-3 border-t border-slate-50 text-[11px] font-bold text-slate-650 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {Number(p.ai_credits_monthly || 0).toLocaleString()} AI credits / mo
                    </div>
                    {p.features?.website && (
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        Whitelabel Website Builder
                      </div>
                    )}
                    {p.features?.chatbot && (
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        Qualified AI Chatbot Integration
                      </div>
                    )}
                    {p.features?.leads_analysis && (
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        CRM Leads Pipeline Analytics
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-5">
                    {isCurrent ? (
                      <Button disabled className="w-full bg-slate-100 text-slate-400 rounded-xl text-xs font-bold py-2 border-0 cursor-not-allowed">
                        Tier Active
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setSelectedPlanId(p.id)}
                        className="w-full bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2 transition"
                      >
                        {isFree ? 'Switch Plan' : 'Simulate CCP Upgrade'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Simulated Upgrade CCP Modal Pop-up */}
      {selectedPlanId && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <Card className="max-w-md w-full border border-indigo-100 shadow-2xl rounded-2xl bg-white overflow-hidden text-left">
            <CardHeader className="bg-indigo-55 bg-indigo-50 border-b border-indigo-100/50 p-5 flex flex-row items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 shrink-0 shadow-sm animate-pulse">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold tracking-tight text-slate-800">
                  Algerian CCP / Bank Transfer Simulator
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">
                  Bypass payment gateway verification locally
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-6 space-y-4">
              
              <div className="bg-amber-50 border border-amber-250 p-3 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5 animate-bounce-short" />
                <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
                  Algerian consumer rules require local wire transfer invoices. Enter any simulated post receipt transaction key (e.g. <code>CCP-928472-ALGER</code>) to automatically register your upgrade instantly.
                </p>
              </div>
              
              <form onSubmit={handleUpgradeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Selected Target Upgrade</Label>
                  <Input 
                    disabled 
                    value={plans.find(p => p.id === selectedPlanId)?.name || ''} 
                    className="h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-bold text-xs cursor-not-allowed" 
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CCP Transaction Reference ID</Label>
                  <Input 
                    required 
                    placeholder="e.g. CCP-847293-ALGER"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    className="h-9 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 bg-white" 
                  />
                </div>
                
                <div className="pt-3 flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedPlanId(null)}
                    className="flex-1 rounded-xl text-xs font-bold border-slate-200 text-slate-550 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm simulated payment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}
