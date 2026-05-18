'use client'

import { useState, useEffect } from 'react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'
import { 
  MessageSquare, 
  Flame, 
  Calendar, 
  Bot, 
  ChevronRight, 
  Inbox, 
  ArrowUpRight, 
  Sparkles, 
  Car, 
  ClipboardList,
  CheckCircle2,
  Circle,
  TrendingUp,
  Landmark,
  ListTodo,
  Globe,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

// Custom SVGs
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function AnimatedNumber({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const [current, setCurrent] = useState(0)
  const numValue = typeof value === 'number' ? value : parseInt(value.replace(/[^0-9]/g, ''), 10) || 0

  useEffect(() => {
    let start = 0
    const end = numValue
    if (start === end) {
      setCurrent(end)
      return
    }
    
    const duration = 1000
    const startTime = performance.now()
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress * (2 - progress)
      
      setCurrent(Math.floor(easeProgress * end))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCurrent(end)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [numValue])

  if (typeof value === 'string' && value.includes('%')) {
    return <span>{current}%</span>
  }
  return <span>{current.toLocaleString()}{suffix}</span>
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null
  const width = 100
  const height = 30
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 8) - 4
    return { x, y }
  })
  
  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  }, '')
  
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`
  
  let strokeColor = '#ef4444' // Red
  if (color === 'indigo') strokeColor = '#6366f1'
  if (color === 'emerald') strokeColor = '#10b981'
  if (color === 'purple') strokeColor = '#a855f7'

  return (
    <svg className="w-20 h-7 overflow-visible opacity-80 group-hover:opacity-100 transition-opacity" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkGrad-${color})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const salesVolumeData = [
  { month: 'Jan', sales: 12500000 },
  { month: 'Feb', sales: 18000000 },
  { month: 'Mar', sales: 24500000 },
  { month: 'Apr', sales: 19800000 },
  { month: 'May', sales: 34000000 },
  { month: 'Jun', sales: 42500000 },
  { month: 'Jul', sales: 39000000 },
]

const leadQualityData = [
  { name: 'HOT Leads', value: 50, color: '#ef4444' }, 
  { name: 'WARM Leads', value: 35, color: '#f59e0b' }, 
  { name: 'COLD Leads', value: 15, color: '#64748b' }, 
]

export function CarShowroomDashboard({
  userName,
  totalConversations,
  hotLeads,
  carsCount = 4,
  testDrivesScheduled = 8,
  financingApps = 3,
  salesVolume = 76500000,
  recentLeads = []
}: {
  userName: string
  totalConversations: number
  hotLeads: number
  carsCount?: number
  testDrivesScheduled?: number
  financingApps?: number
  salesVolume?: number
  recentLeads?: any[]
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const statCards = [
    {
      title: 'Conversations',
      value: totalConversations,
      icon: MessageSquare,
      color: 'indigo',
      trend: '+15.2%',
      trendUp: true,
      sparkline: [22, 38, 30, 48, 40, 55, totalConversations || 60],
      desc: 'Active client messaging'
    },
    {
      title: 'HOT Leads',
      value: hotLeads,
      icon: Flame,
      color: 'red',
      trend: '+22.4%',
      trendUp: true,
      sparkline: [12, 18, 28, 24, 32, 40, hotLeads || 45],
      desc: 'High intent buyers'
    },
    {
      title: 'Cars in Stock',
      value: carsCount,
      icon: Car,
      color: 'emerald',
      trend: '+2 vehicles',
      trendUp: true,
      sparkline: [2, 3, 2, 4, 3, 4, carsCount || 5],
      desc: 'Active inventory list'
    },
    {
      title: 'Test Drives Scheduled',
      value: testDrivesScheduled,
      icon: Calendar,
      color: 'purple',
      trend: '+12.5%',
      trendUp: true,
      sparkline: [3, 5, 4, 8, 6, 9, testDrivesScheduled || 10],
      desc: 'Scheduled test runs'
    },
    {
      title: 'Financing Submissions',
      value: financingApps,
      icon: Landmark,
      color: 'red',
      trend: '3 Approved',
      trendUp: true,
      sparkline: [1, 2, 1, 3, 2, 3, financingApps || 4],
      desc: 'CCP loan calculator apps'
    }
  ]

  const checklist = [
    { id: 'profile', title: 'Complete Showroom Profile', desc: 'Set up business hours and contact info', done: true, href: '/dashboard/settings/agency' },
    { id: 'inventory', title: 'Add First Showroom Car', desc: 'List your vehicles with photos, condition, & pricing', done: carsCount > 0, href: '/dashboard/management' },
    { id: 'payment', title: 'Set CCP BaridiMob Details', desc: 'Allow deposit pre-payments through CPP/Edahabia', done: true, href: '/dashboard/settings/agency' },
    { id: 'chatbot', title: 'Train AI Salesperson', desc: 'Pre-load vehicle specifications so AI captures leads', done: true, href: '/dashboard/settings/chatbot' }
  ]

  const doneCount = checklist.filter(item => item.done).length
  const onboardingPercent = doneCount * 25

  const quickActions = [
    {
      title: 'Unified Inbox',
      desc: 'Answer vehicle and booking questions',
      icon: Inbox,
      href: '/dashboard/inbox',
      color: 'text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/20',
      counter: `${totalConversations} active chats`
    },
    {
      title: 'Inventory & Lots',
      desc: 'Add/Edit vehicle specifications',
      icon: Car,
      href: '/dashboard/management',
      color: 'text-red-600 hover:border-red-200 hover:bg-red-50/20',
      counter: `${carsCount} active cars`
    },
    {
      title: 'Leads Kanban',
      desc: 'Drag leads from contacted to deal closed',
      icon: Flame,
      href: '/dashboard/leads',
      color: 'text-amber-600 hover:border-amber-200 hover:bg-amber-50/20',
      counter: `${hotLeads} HOT leads`
    }
  ]

  return (
    <div className="p-6 space-y-6 font-geist bg-[#f8fafc] h-[calc(100vh-64px)] overflow-y-auto page-enter text-left">
      
      {/* Top Welcome Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Welcome back, {userName}! <Sparkles className="h-5 w-5 text-red-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">Here is a quick snapshot of what is happening with your car showroom today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100/50 px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          AI Car Salesperson Active
        </div>
      </div>

      {/* Onboarding Checklist Widget */}
      {onboardingPercent < 100 ? (
        <div className="bg-gradient-to-br from-slate-900 via-red-950 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-650/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full uppercase tracking-wider">Showroom Setup Checklist</span>
                <span className="text-xs text-slate-400">Step {doneCount} of 4</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Complete your showroom setup <Sparkles className="h-4.5 w-4.5 text-red-450 text-red-400" />
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure your digital inventory, schedule test drives, and hook up AI chatbots to qualify leads 24/7 on WhatsApp.
              </p>
              
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1">
                  <span>Setup Progress</span>
                  <span className="text-red-450 text-red-400">{onboardingPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-400 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${onboardingPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
              {checklist.map((step) => (
                <Link 
                  href={step.href} 
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                    step.done 
                      ? 'bg-red-950/20 border-red-500/30 text-slate-350 text-slate-300' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {step.done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-red-400 fill-red-400/20" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-slate-600 hover:text-slate-400 transition" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight">{step.title}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{step.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-red-500/10 via-amber-500/5 to-slate-50 border border-red-500/20 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-655 text-red-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Showroom Setup Complete!</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your virtual showroom, test drive schedulers, and AI salesperson are fully active.</p>
            </div>
          </div>
          <Badge className="bg-red-500 text-white font-bold text-xs uppercase px-3 py-1 rounded-full">Active</Badge>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card, i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between relative overflow-hidden group"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.title}</span>
                <card.icon className="h-5 w-5 text-slate-350" />
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                  <AnimatedNumber value={card.value} />
                </span>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    card.color === 'indigo' ? 'bg-indigo-50 text-indigo-755 text-indigo-600' :
                    card.color === 'red' ? 'bg-red-50 text-red-755 text-red-600' :
                    card.color === 'emerald' ? 'bg-emerald-50 text-emerald-755 text-emerald-600' :
                    'bg-purple-50 text-purple-755 text-purple-600'
                  }`}>
                    <TrendingUp className="h-3 w-3" /> {card.trend}
                  </span>
                  <span className="text-[8px] font-medium text-slate-400 mt-0.5 text-center">vs last week</span>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-slate-100 pt-4 mt-6">
              <span className="text-[10px] font-semibold text-slate-400 max-w-[120px] leading-tight">{card.desc}</span>
              <Sparkline data={card.sparkline} color={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Left Area: Sales volume */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Sales Value & Projections</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Showroom sales revenue realized in DZD.</p>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-xl">Realtime</span>
            </div>
            
            <div className="h-64 w-full flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesVolumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 650 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 650 }}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9', radius: 8 }}
                      contentStyle={{ background: '#0f172a', border: 0, borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="#ef4444" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Loading Sales Chart...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Lead Quality */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Showroom Lead Quality</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Distribution of auto lead metrics.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">Showroom</span>
            </div>

            <div className="relative h-48 w-full flex items-center justify-center">
              {mounted ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadQualityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {leadQualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800">85%</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hot/Warm Rate</span>
                  </div>
                </>
              ) : (
                <span className="text-xs text-slate-400">Loading Chart...</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
              {leadQualityData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-bold text-slate-500">{item.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 mt-1">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Recent Activity & Quick Navigation Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Left: Recent leads list */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Active Pipeline Deals</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Most recent incoming showroom leads.</p>
            </div>
            <Link href="/dashboard/leads" className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
              View Kanban Board <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentLeads.map((conv: any) => {
              const isHot = conv.lead_score === 'HOT'
              const isWarm = conv.lead_score === 'WARM'
              
              let platformIcon = <Inbox className="h-3.5 w-3.5 text-indigo-500" />
              let platformColor = 'bg-indigo-500/10 border-indigo-200'
              
              if (conv.platform === 'instagram') {
                platformIcon = <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />
                platformColor = 'bg-pink-500/10 border-pink-200'
              } else if (conv.platform === 'facebook') {
                platformIcon = <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />
                platformColor = 'bg-blue-500/10 border-blue-200'
              }

              const isNew = conv.last_message_at ? new Date(conv.last_message_at).getTime() > Date.now() - 1000 * 60 * 60 * 24 : false

              const names = conv.customer_name ? conv.customer_name.split(' ') : ['C']
              const initials = names.map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              const gradients = [
                'from-red-500 to-amber-500 text-white',
                'from-slate-700 to-slate-900 text-white',
                'from-indigo-500 to-purple-500 text-white',
                'from-blue-600 to-cyan-500 text-white',
              ]
              const gradIndex = initials.charCodeAt(0) % gradients.length
              const selectedGradient = gradients[gradIndex]

              return (
                <Link 
                  href="/dashboard/leads" 
                  key={conv.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100/50 transition-all duration-150 group"
                >
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${selectedGradient} flex items-center justify-center font-bold text-xs tracking-tight`}>
                      {initials}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-white ${platformColor} flex items-center justify-center shadow-xs`}>
                      {platformIcon}
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-red-655 group-hover:text-red-650 transition truncate">
                        {conv.customer_name || conv.customer_phone || 'Anonymous Showroom Lead'}
                      </p>
                      {isNew && (
                        <span className="flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                          </span>
                          <span className="text-[8px] font-black tracking-widest text-red-600 bg-red-50 border border-red-100 px-1 py-0.2 rounded uppercase scale-95">NEW</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-550 text-slate-500 font-semibold mt-0.5 truncate leading-relaxed">
                      {conv.lead_summary || `Inquired about vehicle.`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 whitespace-nowrap">
                    <span className="text-[9px] font-bold text-slate-400">
                      {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'Recently'}
                    </span>
                    {conv.lead_score && (
                      <Badge 
                        className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          isHot 
                            ? 'bg-red-50 text-red-600 hover:bg-red-50 border border-red-100/40 animate-pulse' 
                            : isWarm 
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-50 border border-amber-100/40' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-50 border border-slate-100'
                        }`}
                      >
                        {conv.lead_score}
                      </Badge>
                    )}
                  </div>
                </Link>
              )
            })}
            {recentLeads.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-8">No active leads found. Check your inbox for messages.</div>
            )}
          </div>
        </div>

        {/* Right: Quick actions cards */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-1.5 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3.5">
            <ListTodo className="h-3.5 w-3.5 text-slate-400" />
            Showroom Utilities
          </div>
          {quickActions.map((action, i) => (
            <Link href={action.href} key={i} className="block group">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-red-50 transition ${action.color}`}>
                    <action.icon className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-red-600 transition">{action.title}</span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-0.5">{action.desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-slate-50 border border-slate-150 text-slate-500 px-2 py-0.5 rounded-full scale-95 uppercase">
                    {action.counter}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-red-550 group-hover:text-red-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
