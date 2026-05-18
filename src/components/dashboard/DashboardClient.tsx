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
  Compass, 
  ClipboardList,
  CheckCircle2,
  Circle,
  TrendingUp,
  Phone,
  Landmark,
  ListTodo,
  Globe
} from 'lucide-react'


// Custom social media SVG icons to bypass lucide-react version differences
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
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

// Animated counting number hook
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
    
    const duration = 1000 // 1s
    const startTime = performance.now()
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress * (2 - progress) // Ease out quad
      
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

// Gorgeous SVG Sparkline Line Chart
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null
  const width = 100
  const height = 30
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 8) - 4 // Padding
    return { x, y }
  })
  
  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  }, '')
  
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`
  
  let strokeColor = '#6366f1' // Indigo
  if (color === 'red') strokeColor = '#ef4444'
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
      <path
        d={areaD}
        fill={`url(#sparkGrad-${color})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Mock Data for Revenue status
const revenueData = [
  { month: 'Feb', revenue: 450000 },
  { month: 'Mar', revenue: 720000 },
  { month: 'Apr', revenue: 610000 },
  { month: 'May', revenue: 890000 },
  { month: 'Jun', revenue: 1200000 },
  { month: 'Jul', revenue: 1450000 },
  { month: 'Aug', revenue: 1300000 },
  { month: 'Sep', revenue: 950000 },
  { month: 'Oct', revenue: 1100000 },
  { month: 'Nov', revenue: 850000 },
  { month: 'Dec', revenue: 980000 },
]

// Mock Data for Leads Donut Chart
const leadsDonutData = [
  { name: 'HOT Leads', value: 45, color: '#ef4444' }, 
  { name: 'WARM Leads', value: 35, color: '#f59e0b' }, 
  { name: 'COLD Leads', value: 20, color: '#64748b' }, 
]

export function DashboardClient({
  userName,
  totalConversations,
  hotLeads,
  bookingsThisMonth,
  aiResponseRate,
  recentConversations,
  tripsCount = 0,
  invoicesCount = 0,
  accountsCount = 0,
  faqsCount = 0,
  visaApplicationsCount = 0,
  visaRevenue = 0
}: {
  userName: string
  totalConversations: number
  hotLeads: number
  bookingsThisMonth: number
  aiResponseRate: number
  recentConversations: any[]
  tripsCount?: number
  invoicesCount?: number
  accountsCount?: number
  faqsCount?: number
  visaApplicationsCount?: number
  visaRevenue?: number
}) {
  const [mounted, setMounted] = useState(false)

  // Avoid Hydration mismatch for Recharts
  useEffect(() => {
    setMounted(true)
  }, [])

  const statCards = [
    {
      title: 'Conversations',
      value: totalConversations,
      icon: MessageSquare,
      color: 'indigo',
      trend: '+12.4%',
      trendUp: true,
      sparkline: [30, 45, 35, 60, 50, 70, totalConversations || 80],
      desc: 'Weekly active chats'
    },
    {
      title: 'HOT Leads',
      value: hotLeads,
      icon: Flame,
      color: 'red',
      trend: '+18.1%',
      trendUp: true,
      sparkline: [20, 30, 45, 40, 55, 65, hotLeads || 75],
      desc: 'Immediate action needed'
    },
    {
      title: 'Paid Bookings',
      value: bookingsThisMonth,
      icon: Calendar,
      color: 'emerald',
      trend: '+8.3%',
      trendUp: true,
      sparkline: [10, 15, 8, 25, 20, 35, bookingsThisMonth || 40],
      desc: 'Successful trip signups'
    },
    {
      title: 'Visa Applications',
      value: visaApplicationsCount,
      icon: Globe,
      color: 'purple',
      trend: `+${(visaRevenue / 1000).toFixed(0)}k DZD`,
      trendUp: true,
      sparkline: [4, 8, 5, 10, 7, 12, visaApplicationsCount || 12],
      desc: 'Embassy file trackers'
    },
    {
      title: 'AI Handled Rate',
      value: `${aiResponseRate}%`,
      icon: Bot,
      color: 'indigo', // Switched indigo so colors stay curated
      trend: '+3.2%',
      trendUp: true,
      sparkline: [80, 85, 90, 88, 92, 94, aiResponseRate || 95],
      desc: 'Resolved by AI receptionist'
    }
  ]


  // Onboarding Checklist calculation
  const checklist = [
    { id: 'profile', title: 'Create Agency Profile', desc: 'Set up basic branding and company details', done: true, href: '/dashboard/settings/agency' },
    { id: 'trips', title: 'Add Your First Trip Catalog Item', desc: 'Create trip listings to start selling packages', done: tripsCount > 0, href: '/dashboard/trips' },
    { id: 'finance', title: 'Set Up Financial Accounts', desc: 'Configure CCP, Cash, or bank details to log transactions', done: accountsCount > 0, href: '/dashboard/finance' },
    { id: 'chatbot', title: 'Configure Chatbot AI Assistant', desc: 'Add FAQs so the AI receptionist answers guest queries', done: faqsCount > 0, href: '/dashboard/settings/chatbot' }
  ]
  
  const doneCount = checklist.filter(item => item.done).length
  const onboardingPercent = doneCount * 25

  const quickActions = [
    {
      title: 'Go to Inbox',
      desc: 'Manage and answer live user chats',
      icon: Inbox,
      href: '/dashboard/inbox',
      color: 'text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/20',
      counter: `${totalConversations} active chats`
    },
    {
      title: 'Add New Trip',
      desc: 'Publish or edit your local catalog',
      icon: Compass,
      href: '/dashboard/trips',
      color: 'text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/20',
      counter: `${tripsCount} active trips`
    },
    {
      title: 'View Ledger & Accounts',
      desc: 'Log cash payments & B2B supplier payables',
      icon: Landmark,
      href: '/dashboard/finance',
      color: 'text-purple-600 hover:border-purple-200 hover:bg-purple-50/20',
      counter: `${accountsCount} accounts configured`
    }
  ]

  return (
    <div className="p-6 space-y-6 font-geist bg-[#f8fafc] h-[calc(100vh-64px)] overflow-y-auto page-enter text-left">
      
      {/* Top Welcome Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Welcome back, {userName}! <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">Here is a quick snapshot of what is happening with your travel agency today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          AI Assistant Fully Active
        </div>
      </div>

      {/* Onboarding Checklist Widget for new agencies (0-100% complete) */}
      {onboardingPercent < 100 ? (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider">Onboarding Checklist</span>
                <span className="text-xs text-slate-400">Step {doneCount} of 4</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Complete your agency setup <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock the full power of your travel SaaS platform. Configure your digital catalog, AI receptionist, and Algerian ledger to replace Excel notebooks.
              </p>
              
              {/* Progress Slider */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1">
                  <span>Setup Progress</span>
                  <span className="text-indigo-400">{onboardingPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-indigo-500/30"
                    style={{ width: `${onboardingPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Steps grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
              {checklist.map((step) => (
                <Link 
                  href={step.href} 
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                    step.done 
                      ? 'bg-indigo-950/20 border-indigo-500/30 text-slate-300' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {step.done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 fill-indigo-400/20" />
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
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-500/20 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Agency Onboarding 100% Complete!</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your catalog, ledger accounts, and AI receptionists are configured and fully operational.</p>
            </div>
          </div>
          <Badge className="bg-emerald-500 text-white font-bold text-xs uppercase px-3 py-1 rounded-full">Operational</Badge>
        </div>
      )}

      {/* Metrics Row (Oura inspired layout: Label, Huge Number, Trend Pill, Sparkline) */}
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
                    card.color === 'indigo' ? 'bg-indigo-50 text-indigo-700' :
                    card.color === 'red' ? 'bg-red-50 text-red-700' :
                    card.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    <TrendingUp className="h-3 w-3" /> {card.trend}
                  </span>
                  <span className="text-[8px] font-medium text-slate-400 mt-0.5 text-center">vs last week</span>
                </div>
              </div>
            </div>

            {/* Sparkline & Details Footer row */}
            <div className="flex items-end justify-between border-t border-slate-100 pt-4 mt-6">
              <span className="text-[10px] font-semibold text-slate-400 max-w-[120px] leading-tight">{card.desc}</span>
              
              {/* Premium Area-Gradient Sparkline SVG */}
              <Sparkline data={card.sparkline} color={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Left Area: Booking Revenue Chart */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Revenue Status</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Monthly booking sales volume generated in DZD.</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">Yearly View</span>
            </div>
            
            {/* Chart Area */}
            <div className="h-64 w-full flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9', radius: 8 }}
                      contentStyle={{ background: '#0f172a', border: 0, borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#4f46e5" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Loading Revenue Chart...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Audience Quality Donut Chart */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Audience Quality</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Distribution of lead conversion scores.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">All Channels</span>
            </div>

            {/* Donut Chart */}
            <div className="relative h-48 w-full flex items-center justify-center">
              {mounted ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {leadsDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text widget */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800">80%</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hot/Warm Rate</span>
                  </div>
                </>
              ) : (
                <span className="text-xs text-slate-400">Loading Chart...</span>
              )}
            </div>

            {/* Legend Distribution grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
              {leadsDonutData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-bold text-slate-550 text-slate-500">{item.name.split(' ')[0]}</span>
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
        
        {/* Left: Recent conversations list */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Recent Activity</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Most recent incoming customer interactions.</p>
            </div>
            <Link href="/dashboard/inbox" className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
              View Inbox <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentConversations.map((conv) => {
              const isHot = conv.lead_score === 'HOT'
              const isWarm = conv.lead_score === 'WARM'
              
              // Dynamic brand color & icon based on platform
              let platformIcon = <Phone className="h-3.5 w-3.5 text-green-500" />
              let platformColor = 'bg-green-500/10 border-green-200'
              
              if (conv.platform === 'instagram') {
                platformIcon = <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />
                platformColor = 'bg-pink-500/10 border-pink-200'
              } else if (conv.platform === 'facebook') {
                platformIcon = <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />
                platformColor = 'bg-blue-500/10 border-blue-200'
              }

              // Check if activity was recent (New badge within 24h)
              const isNew = conv.last_message_at ? new Date(conv.last_message_at).getTime() > Date.now() - 1000 * 60 * 60 * 24 : false

              // Curated beautiful avatar gradient
              const names = conv.customer_name ? conv.customer_name.split(' ') : ['A']
              const initials = names.map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              const gradients = [
                'from-indigo-500 to-purple-500 text-white',
                'from-emerald-500 to-teal-500 text-white',
                'from-blue-500 to-indigo-600 text-white',
                'from-orange-400 to-amber-500 text-white',
                'from-rose-500 to-pink-500 text-white'
              ]
              const gradIndex = initials.charCodeAt(0) % gradients.length
              const selectedGradient = gradients[gradIndex]

              return (
                <Link 
                  href="/dashboard/inbox" 
                  key={conv.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100/50 transition-all duration-150 group"
                >
                  <div className="relative">
                    {/* Premium Avatar Gilded Gradient */}
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${selectedGradient} flex items-center justify-center font-bold text-xs shadow-xs tracking-tight`}>
                      {initials}
                    </div>
                    {/* Brand Platform Badge */}
                    <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-white ${platformColor} flex items-center justify-center shadow-xs`}>
                      {platformIcon}
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">
                        {conv.customer_name || conv.customer_phone || 'Anonymous Guest'}
                      </p>
                      
                      {/* Pulse "New" badge for activity within 24h */}
                      {isNew && (
                        <span className="flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                          </span>
                          <span className="text-[8px] font-black tracking-widest text-indigo-650 bg-indigo-50 text-indigo-600 border border-indigo-100/80 px-1 py-0.2 rounded uppercase scale-95">NEW</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-450 text-slate-500 font-semibold mt-0.5 truncate leading-relaxed">
                      {conv.lead_summary || 'No conversation details summarized.'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 whitespace-nowrap">
                    <span className="text-[9px] font-bold text-slate-400">
                      {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : ''}
                    </span>
                    {conv.lead_score && (
                      <Badge 
                        className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          isHot 
                            ? 'bg-red-50 text-red-650 text-red-600 hover:bg-red-50 border border-red-100/40 animate-pulse' 
                            : isWarm 
                            ? 'bg-amber-50 text-amber-650 text-amber-600 hover:bg-amber-50 border border-amber-100/40' 
                            : 'bg-slate-50 text-slate-650 text-slate-600 hover:bg-slate-50 border border-slate-100'
                        }`}
                      >
                        {conv.lead_score}
                      </Badge>
                    )}
                  </div>
                </Link>
              )
            })}
            {recentConversations.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-8">No live conversations found.</div>
            )}
          </div>
        </div>

        {/* Right: Quick actions cards with usage counters */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-1.5 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3.5">
            <ListTodo className="h-3.5 w-3.5 text-slate-400" />
            Quick Actions Checklist
          </div>
          {quickActions.map((action, i) => (
            <Link href={action.href} key={i} className="block group">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition ${action.color}`}>
                    <action.icon className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition">{action.title}</span>
                    <span className="text-[10px] text-slate-550 text-slate-500 font-semibold mt-0.5">{action.desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-slate-50 border border-slate-150 text-slate-450 text-slate-500 px-2 py-0.5 rounded-full scale-95 uppercase">
                    {action.counter}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
