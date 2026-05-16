'use client'

import { useState } from 'react'
import { savePlan } from '@/app/actions/admin-plans'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit2, Loader2, CheckCircle2 } from 'lucide-react'

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
      max_trips: 0, max_employees: 0, ai_credits_monthly: 0,
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
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pricing Plans</h1>
          <p className="text-slate-500 mt-1">Manage subscription tiers and limits.</p>
        </div>
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <Card key={plan.id} className="relative overflow-hidden flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {plan.name}
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-xl font-bold text-slate-900">
                    {plan.price} DZD <span className="text-sm font-normal text-slate-500">/ mo</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-slate-500 mb-4 h-10">{plan.description}</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> {plan.max_trips === 9999 ? 'Unlimited' : plan.max_trips} Trips</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> {plan.max_employees === 9999 ? 'Unlimited' : plan.max_employees} Employees</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> {plan.ai_credits_monthly} AI Credits</li>
                    {plan.features?.chatbot && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> AI Chatbot</li>}
                    {plan.features?.website && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Agency Website</li>}
                    {plan.features?.priority_support && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Priority Support</li>}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          {editingPlan && (
            <Card className="sticky top-8 border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
                <CardTitle>{isNew ? 'Create New Plan' : `Edit ${editingPlan.name}`}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isNew && (
                    <div className="space-y-2">
                      <Label>Plan ID (e.g., enterprise)</Label>
                      <Input name="id" required defaultValue={editingPlan.id} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input name="name" required defaultValue={editingPlan.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (DZD)</Label>
                    <Input name="price" type="number" required defaultValue={editingPlan.price} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" required defaultValue={editingPlan.description} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Trips</Label>
                      <Input name="max_trips" type="number" required defaultValue={editingPlan.max_trips} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Employees</Label>
                      <Input name="max_employees" type="number" required defaultValue={editingPlan.max_employees} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>AI Credits / mo</Label>
                    <Input name="ai_credits_monthly" type="number" required defaultValue={editingPlan.ai_credits_monthly} />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <Label>Features</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="feat_chatbot" name="feat_chatbot" defaultChecked={editingPlan.features?.chatbot} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="feat_chatbot" className="font-normal cursor-pointer">AI Chatbot Module</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="feat_website" name="feat_website" defaultChecked={editingPlan.features?.website} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="feat_website" className="font-normal cursor-pointer">Website Builder Module</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="feat_priority" name="feat_priority" defaultChecked={editingPlan.features?.priority_support} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="feat_priority" className="font-normal cursor-pointer">Priority Support</Label>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingPlan(null)}>Cancel</Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Plan'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
