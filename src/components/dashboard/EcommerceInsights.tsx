'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BadgePercent,
  Banknote,
  PackageCheck,
  Repeat2,
  Search,
  ShoppingCart,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { EcommerceOrder, EcommerceStoreData } from '@/types/ecommerce'

function money(value: number) {
  return `${new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(value)} DZD`
}

function successful(order: EcommerceOrder) {
  return order.payment_status === 'paid' || order.fulfillment_status === 'delivered'
}

function normalizedPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function orderItems(order: EcommerceOrder) {
  return Array.isArray(order.items)
    ? order.items as Array<{ product_id?: string; name?: string; quantity?: number; unit_price?: number }>
    : []
}

function buildDailyRevenue(orders: EcommerceOrder[]) {
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (29 - index))
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' }),
      revenue: 0,
      orders: 0,
    }
  })
  const byDay = new Map(days.map((day) => [day.key, day]))

  orders.forEach((order) => {
    const day = byDay.get(order.created_at.slice(0, 10))
    if (!day) return
    day.orders += 1
    if (successful(order)) day.revenue += Number(order.total || 0)
  })

  return days
}

function Analytics({ data }: { data: EcommerceStoreData }) {
  const completedOrders = data.orders.filter(successful)
  const revenue = completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const averageOrder = completedOrders.length ? revenue / completedOrders.length : 0
  const conversionRate = data.stats.landingViews
    ? (data.stats.landingConversions / data.stats.landingViews) * 100
    : 0
  const discountTotal = data.orders.reduce((sum, order) => sum + Number(order.discount_amount || 0), 0)
  const dailyRevenue = useMemo(() => buildDailyRevenue(data.orders), [data.orders])

  const funnel = [
    { label: 'New', value: data.orders.filter((order) => order.fulfillment_status === 'new').length },
    { label: 'Confirmed', value: data.orders.filter((order) => order.fulfillment_status === 'confirmed').length },
    { label: 'Packed', value: data.orders.filter((order) => order.fulfillment_status === 'packed').length },
    { label: 'Shipped', value: data.orders.filter((order) => order.fulfillment_status === 'shipped').length },
    { label: 'Delivered', value: data.orders.filter((order) => order.fulfillment_status === 'delivered').length },
  ]

  const topProducts = Array.from(data.orders.reduce((map, order) => {
    orderItems(order).forEach((item) => {
      const key = item.product_id || item.name || 'unknown'
      const current = map.get(key) || { name: item.name || 'Product', units: 0, revenue: 0 }
      const quantity = Number(item.quantity || 0)
      current.units += quantity
      current.revenue += quantity * Number(item.unit_price || 0)
      map.set(key, current)
    })
    return map
  }, new Map<string, { name: string; units: number; revenue: number }>()).values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  const cards = [
    { label: 'Net sales', value: money(revenue), detail: `${completedOrders.length} completed orders`, icon: Banknote, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Average order', value: money(averageOrder), detail: 'Completed orders only', icon: ShoppingCart, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Landing conversion', value: `${conversionRate.toFixed(1)}%`, detail: `${data.stats.landingConversions} orders from ${data.stats.landingViews} views`, icon: TrendingUp, tone: 'bg-purple-50 text-purple-600' },
    { label: 'Discounts granted', value: money(discountTotal), detail: 'Across all recorded orders', icon: BadgePercent, tone: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#e8eaed] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-gray-900">{card.value}</p>
            <p className="mt-2 text-[11px] text-gray-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <ChartCard title="Revenue trend" subtitle="Completed sales and total orders over the last 30 days.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenue} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#eef0f3" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval={4} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order pipeline" subtitle="Current fulfillment stages.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
              <CartesianGrid stroke="#eef0f3" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
              <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={66} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="border-b border-[#f0f1f3] px-5 py-4">
          <h2 className="text-[13px] font-bold text-gray-900">Top products</h2>
          <p className="mt-0.5 text-[11px] text-gray-500">Ranked by recorded order value.</p>
        </div>
        <div className="divide-y divide-[#f0f1f3]">
          {topProducts.map((product, index) => (
            <div key={`${product.name}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-purple-50 text-xs font-black text-purple-700">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="text-[11px] text-gray-500">{product.units} units ordered</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-black text-gray-900">{money(product.revenue)}</p>
            </div>
          ))}
          {!topProducts.length && <p className="p-10 text-center text-sm text-gray-500">Product performance appears after your first orders.</p>}
        </div>
      </section>
    </div>
  )
}

function Customers({ data }: { data: EcommerceStoreData }) {
  const [query, setQuery] = useState('')
  const customers = useMemo(() => {
    const grouped = new Map<string, {
      key: string
      name: string
      phone: string
      city: string
      orders: number
      completedOrders: number
      spent: number
      lastOrderAt: string
    }>()

    data.orders.forEach((order) => {
      const key = normalizedPhone(order.customer_phone) || order.customer_phone
      const current = grouped.get(key) || {
        key,
        name: order.customer_name,
        phone: order.customer_phone,
        city: order.customer_city || 'Not provided',
        orders: 0,
        completedOrders: 0,
        spent: 0,
        lastOrderAt: order.created_at,
      }
      current.orders += 1
      if (successful(order)) {
        current.completedOrders += 1
        current.spent += Number(order.total || 0)
      }
      if (new Date(order.created_at) > new Date(current.lastOrderAt)) {
        current.name = order.customer_name
        current.city = order.customer_city || current.city
        current.lastOrderAt = order.created_at
      }
      grouped.set(key, current)
    })

    return Array.from(grouped.values()).sort((a, b) => b.spent - a.spent)
  }, [data.orders])

  const term = query.trim().toLowerCase()
  const visibleCustomers = term
    ? customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.city}`.toLowerCase().includes(term))
    : customers
  const repeatCustomers = customers.filter((customer) => customer.orders > 1).length
  const customerRevenue = customers.reduce((sum, customer) => sum + customer.spent, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <CustomerStat label="Store customers" value={String(customers.length)} detail="Unique phone numbers" icon={UserRound} />
        <CustomerStat label="Repeat customers" value={String(repeatCustomers)} detail={customers.length ? `${((repeatCustomers / customers.length) * 100).toFixed(1)}% repeat rate` : '0% repeat rate'} icon={Repeat2} />
        <CustomerStat label="Customer revenue" value={money(customerRevenue)} detail="Paid or delivered orders" icon={PackageCheck} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#f0f1f3] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-gray-900">Customer directory</h2>
            <p className="mt-0.5 text-[11px] text-gray-500">Purchase history and lifetime value from store orders.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone or city" className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#f0f1f3] bg-[#f9fafb] text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Orders</th><th className="px-5 py-3">Lifetime value</th><th className="px-5 py-3">Last order</th></tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f3]">
              {visibleCustomers.map((customer) => (
                <tr key={customer.key} className="hover:bg-[#fafafa]">
                  <td className="px-5 py-4"><p className="font-bold text-gray-900">{customer.name}</p><p className="mt-0.5 text-[11px] text-gray-500">{customer.phone}</p></td>
                  <td className="px-5 py-4 text-gray-600">{customer.city}</td>
                  <td className="px-5 py-4"><p className="font-bold text-gray-900">{customer.orders}</p><p className="text-[11px] text-gray-500">{customer.completedOrders} completed</p></td>
                  <td className="px-5 py-4 font-black text-gray-900">{money(customer.spent)}</td>
                  <td className="px-5 py-4 text-gray-600">{new Date(customer.lastOrderAt).toLocaleDateString('fr-DZ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleCustomers.length && <p className="p-10 text-center text-sm text-gray-500">No customers match this search.</p>}
        </div>
      </section>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e8eaed] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <h2 className="text-[13px] font-bold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>
      <div className="mt-5 h-72">{children}</div>
    </section>
  )
}

function CustomerStat({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof UserRound }) {
  return (
    <article className="rounded-2xl border border-[#e8eaed] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Icon className="h-5 w-5" /></div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-2 text-[11px] text-gray-500">{detail}</p>
    </article>
  )
}

export default function EcommerceInsights({ mode, data }: { mode: 'analytics' | 'customers'; data: EcommerceStoreData }) {
  return mode === 'analytics' ? <Analytics data={data} /> : <Customers data={data} />
}
