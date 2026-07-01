'use client'

import { useState } from 'react'
import { savePlan } from '@/app/actions/admin-plans'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit2, Loader2, CheckCircle2, Star, ShieldAlert } from 'lucide-react'

export function AdminPlansClient({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEdit = (plan: any) => {
    setEditingPlan(plan)
    setIsNew(false)
  }

  const handleNew = () => {
    setEditingPlan({
      id: '', name: '', description: '', price: 0, 
      max_trips: 9999, max_employees: 9999, ai_credits_monthly: 0,
      business_type: 'travel',
      features: { chatbot: false, website: false, priority_support: false }
    })
    setIsNew(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('isNew', isNew.toString())
    
    if (!isNew && editingPlan) {
      formData.append('id', editingPlan.id)
    }

    const res = await savePlan(formData)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8 select-none text-left">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-heading">SaaS Subscription Plans</h1>
          <p className="text-slate-450 text-xs font-semibold uppercase tracking-wider mt-1">Platform Owner Command Portal — Whitelabel Feature & Pricing Gates</p>
        </div>
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition duration-200">
          <Plus className="h-4 w-4 mr-2" /> Add New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Dynamic Grouped Plans Grid */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Group 1: Travel Agency Vertical Plans */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Travel Agency Plans</h2>
              <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Travel Vertical
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.filter(p => p.business_type !== 'car_showroom').map(plan => (
                <Card key={plan.id} className="relative overflow-hidden flex flex-col border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-300 rounded-2xl bg-white/50 backdrop-blur-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center text-sm font-extrabold tracking-tight text-slate-700">
                      {plan.name}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)} className="hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                      {Number(plan.price).toLocaleString()} DZD
                      <span className="text-[10px] font-bold text-slate-400">/ month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <p className="text-[11px] text-slate-500 mb-4 h-12 leading-relaxed font-semibold">{plan.description}</p>
                    <ul className="space-y-2 text-[11px] font-bold text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> 
                        {plan.max_trips === 9999 ? 'Unlimited' : plan.max_trips} Core Modules
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> 
                        {plan.max_employees === 9999 ? 'Unlimited' : plan.max_employees} Staff Accounts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> 
                        {plan.ai_credits_monthly === 0 ? 'No AI credits' : `${Number(plan.ai_credits_monthly).toLocaleString()} AI Credits / mo`}
                      </li>
                      {plan.features?.website && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> Whitelabel Web Builder</li>}
                      {plan.features?.chatbot && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> Automated AI Receptionist</li>}
                      {plan.features?.priority_support && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> Priority Core Support</li>}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Group 2: Car Showroom Vertical Plans */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm animate-pulse" />
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Car Showroom Plans</h2>
              <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Automotive Vertical
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.filter(p => p.business_type === 'car_showroom').map(plan => (
                <Card key={plan.id} className="relative overflow-hidden flex flex-col border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-300 rounded-2xl bg-white/50 backdrop-blur-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center text-sm font-extrabold tracking-tight text-slate-700">
                      {plan.name}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)} className="hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                      {Number(plan.price).toLocaleString()} DZD
                      <span className="text-[10px] font-bold text-slate-400">/ month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <p className="text-[11px] text-slate-500 mb-4 h-12 leading-relaxed font-semibold">{plan.description}</p>
                    <ul className="space-y-2 text-[11px] font-bold text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> 
                        {plan.max_trips === 9999 ? 'Unlimited' : plan.max_trips} Vehicle Records
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> 
                        {plan.max_employees === 9999 ? 'Unlimited' : plan.max_employees} Staff Accounts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> 
                        {plan.ai_credits_monthly === 0 ? 'No AI credits' : `${Number(plan.ai_credits_monthly).toLocaleString()} AI Credits / mo`}
                      </li>
                      {plan.features?.website && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> Whitelabel Web Builder</li>}
                      {plan.features?.chatbot && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> Automated AI Receptionist</li>}
                      {plan.features?.priority_support && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/> Priority Core Support</li>}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Reusable Creator Form Editor */}
        <div>
          {editingPlan ? (
            <Card className="sticky top-8 border-blue-200/80 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100/50 pb-4">
                <CardTitle className="text-base font-extrabold tracking-tight text-slate-800 flex items-center gap-1.5">
                  <Star className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                  {isNew ? 'Create Pricing Tier' : `Edit: ${editingPlan.name}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {isNew && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan ID (Unique Slug)</Label>
                      <Input name="id" required defaultValue={editingPlan.id} placeholder="e.g. car-agency-premium" className="h-9 font-semibold text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</Label>
                      <Input name="name" required defaultValue={editingPlan.name} className="h-9 font-semibold text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (DZD/DA)</Label>
                      <Input name="price" type="number" required defaultValue={editingPlan.price} className="h-9 font-semibold text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Vertical Target</Label>
                    <select
                      name="business_type"
                      defaultValue={editingPlan.business_type || 'travel'}
                      className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition"
                    >
                      <option value="travel">Travel Agency Vertical</option>
                      <option value="car_showroom">Car Showroom Vertical</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Description</Label>
                    <Textarea name="description" required defaultValue={editingPlan.description} className="font-semibold text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl min-h-[70px] leading-relaxed" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Max Trips/Cars</Label>
                      <Input name="max_trips" type="number" required defaultValue={editingPlan.max_trips} className="h-9 font-semibold text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Max Employees</Label>
                      <Input name="max_employees" type="number" required defaultValue={editingPlan.max_employees} className="h-9 font-semibold text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">AI Credits / month</Label>
                    <Input name="ai_credits_monthly" type="number" required defaultValue={editingPlan.ai_credits_monthly} className="h-9 font-semibold text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  
                  {/* Gate Module Checkboxes */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <Label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Module Access Gates</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="feat_chatbot" name="feat_chatbot" defaultChecked={editingPlan.features?.chatbot} className="h-4 w-4 rounded border-slate-200 cursor-pointer" />
                      <Label htmlFor="feat_chatbot" className="text-xs font-bold text-slate-650 cursor-pointer">AI Chatbot Module</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="feat_website" name="feat_website" defaultChecked={editingPlan.features?.website} className="h-4 w-4 rounded border-slate-200 cursor-pointer" />
                      <Label htmlFor="feat_website" className="text-xs font-bold text-slate-650 cursor-pointer">Whitelabel Website Module</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="feat_priority" name="feat_priority" defaultChecked={editingPlan.features?.priority_support} className="h-4 w-4 rounded border-slate-200 cursor-pointer" />
                      <Label htmlFor="feat_priority" className="text-xs font-bold text-slate-650 cursor-pointer">Priority System Support</Label>
                    </div>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl text-xs font-bold border-slate-200 text-slate-550 hover:bg-slate-50 cursor-pointer" onClick={() => setEditingPlan(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Setup'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="sticky top-8 border-dashed border-2 p-8 text-center flex flex-col items-center justify-center rounded-2xl text-slate-400 min-h-[300px]">
              <ShieldAlert className="h-8 w-8 text-slate-300 mb-2 animate-bounce-short" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">No Plan Selected</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-relaxed mx-auto">
                Click on the edit pencil <Edit2 className="h-3 w-3 inline-block" /> icon inside any pricing tier card to edit features, or click "Add New Plan" to configure a new subscription.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
