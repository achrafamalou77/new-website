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
  CheckCircle2,
  Circle,
  TrendingUp,
  Phone,
  Landmark,
  ListTodo,
  Globe
} from 'lucide-react'

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
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { canAccessPath } from '@/lib/permissions'

// Animated counting number hook
function AnimatedNumber({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const [current, setCurrent] = useState(0)
  const numValue = typeof value === 'number' ? value : parseInt(value.replace(/[^0-9]/g, ''), 10) || 0

  useEffect(() => {
    let start = 0
    const end = numValue
    if (start === end) { setCurrent(end); return }
    const duration = 900
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
  visaRevenue = 0,
  leadBreakdown,
  revenueData = [],
  currentUserRole = 'superadmin'
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
  leadBreakdown?: { hot: number; warm: number; cold: number }
  revenueData?: Array<{ month: string; revenue?: number }>
  currentUserRole?: string
}) {
  const { t, language } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const leadCounts = leadBreakdown || { hot: hotLeads, warm: 0, cold: 0 }
  const leadTotal = Math.max(leadCounts.hot + leadCounts.warm + leadCounts.cold, 1)
  const hotWarmRate = Math.round(((leadCounts.hot + leadCounts.warm) / leadTotal) * 100)
  const leadsDonutData = [
    { name: 'HOT Leads', value: leadCounts.hot, percent: Math.round((leadCounts.hot / leadTotal) * 100), color: '#ef4444' },
    { name: 'WARM Leads', value: leadCounts.warm, percent: Math.round((leadCounts.warm / leadTotal) * 100), color: '#f59e0b' },
    { name: 'COLD Leads', value: leadCounts.cold, percent: Math.round((leadCounts.cold / leadTotal) * 100), color: '#e5e7eb' },
  ]
  const chartRevenue = revenueData.length ? revenueData : [{ month: 'No data', revenue: 0 }]

  const statCards = [
    {
      title: t('nav.inbox', 'Conversations'),
      value: totalConversations,
      icon: MessageSquare,
      accentColor: '#2563eb',
      bgColor: '#eff6ff',
      textColor: '#2563eb',
      trend: '+12%',
      trendUp: true,
      desc: t('dashboard.weekly_chats', 'Active chats this week')
    },
    {
      title: t('dashboard.lead_score', 'HOT Leads'),
      value: hotLeads,
      icon: Flame,
      accentColor: '#ef4444',
      bgColor: '#fef2f2',
      textColor: '#ef4444',
      trend: 'Live',
      trendUp: true,
      desc: t('dashboard.hot_leads_desc', 'Need immediate action')
    },
    {
      title: t('nav.bookings', 'Paid Bookings'),
      value: bookingsThisMonth,
      icon: Calendar,
      accentColor: '#10b981',
      bgColor: '#ecfdf5',
      textColor: '#10b981',
      trend: 'This month',
      trendUp: true,
      desc: t('dashboard.paid_bookings_desc', 'Successful signups')
    },
    {
      title: t('nav.visa', 'Visa Applications'),
      value: visaApplicationsCount,
      icon: Globe,
      accentColor: '#8b5cf6',
      bgColor: '#f5f3ff',
      textColor: '#8b5cf6',
      trend: `${(visaRevenue / 1000).toFixed(0)}k DZD`,
      trendUp: true,
      desc: t('dashboard.visa_apps_desc', 'Embassy trackers')
    },
    {
      title: t('dashboard.ai_handled', 'AI Handle Rate'),
      value: `${aiResponseRate}%`,
      icon: Bot,
      accentColor: '#2563eb',
      bgColor: '#eff6ff',
      textColor: '#2563eb',
      trend: '30 days',
      trendUp: true,
      desc: t('dashboard.ai_handled_desc', 'Resolved by AI')
    }
  ]

  const checklist = [
    { id: 'profile', title: t('nav.profile', 'Create Agency Profile'), desc: language === 'ar' ? 'قم بإعداد الهوية التجارية وتفاصيل الشركة' : language === 'fr' ? "Configurez l'identité visuelle et les détails de l'entreprise" : 'Set up basic branding and company details', done: true, href: '/dashboard/settings/agency' },
    { id: 'trips', title: language === 'ar' ? 'إضافة أول رحلة في الكتالوج' : language === 'fr' ? 'Ajoutez votre premier voyage au catalogue' : 'Add Your First Trip Catalog Item', desc: language === 'ar' ? 'قم بإنشاء رحلة لتبدأ في بيع الباقات السياحية' : language === 'fr' ? 'Créez des voyages pour commencer à vendre des packages' : 'Create trip listings to start selling packages', done: tripsCount > 0, href: '/dashboard/trips' },
    { id: 'finance', title: language === 'ar' ? 'إعداد الحسابات المالية و CCP' : language === 'fr' ? 'Configurez vos comptes financiers & CCP' : 'Set Up Financial Accounts', desc: language === 'ar' ? 'قم بإعداد حساب CCP أو الخزينة لتسجيل المعاملات' : language === 'fr' ? 'Configurez votre CCP, Caisse ou banque pour enregistrer les flux' : 'Configure CCP, Cash, or bank details to log transactions', done: accountsCount > 0, href: '/dashboard/finance' },
    { id: 'chatbot', title: language === 'ar' ? 'تكوين مساعد الذكاء الاصطناعي' : language === 'fr' ? "Configurez l'assistant IA Chatbot" : 'Configure Chatbot AI Assistant', desc: language === 'ar' ? 'أضف الأسئلة الشائعة ليجيب عليها العميل الآلي' : language === 'fr' ? "Ajoutez des FAQ pour que l'assistant IA réponde aux clients" : 'Add FAQs so the AI receptionist answers guest queries', done: faqsCount > 0, href: '/dashboard/settings/chatbot' }
  ].filter(item => canAccessPath(currentUserRole, item.href))

  const doneCount = checklist.filter(item => item.done).length
  const onboardingPercent = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 100

  const quickActions = [
    {
      title: t('dashboard.view_all', 'Go to Inbox'),
      desc: language === 'ar' ? 'إدارة والرد على محادثات العملاء مباشرة' : language === 'fr' ? 'Gérez et répondez aux messages clients en direct' : 'Manage and answer live user chats',
      icon: Inbox,
      href: '/dashboard/inbox',
      accentColor: '#2563eb',
      bgColor: '#eff6ff',
      counter: `${totalConversations}`
    },
    {
      title: language === 'ar' ? 'إضافة رحلة جديدة' : language === 'fr' ? 'Ajouter un Voyage' : 'Add New Trip',
      desc: language === 'ar' ? 'قم بنشر أو تعديل الكتالوج الخاص بك' : language === 'fr' ? 'Publiez ou modifiez votre catalogue local' : 'Publish or edit your local catalog',
      icon: Compass,
      href: '/dashboard/trips',
      accentColor: '#10b981',
      bgColor: '#ecfdf5',
      counter: `${tripsCount}`
    },
    {
      title: t('finance.ccp_slip', 'View Ledger & Accounts'),
      desc: language === 'ar' ? 'تسجيل المدفوعات النقدية ومستحقات الموردين' : language === 'fr' ? 'Enregistrez les paiements & factures fournisseurs' : 'Log cash payments & B2B supplier payables',
      icon: Landmark,
      href: '/dashboard/finance',
      accentColor: '#8b5cf6',
      bgColor: '#f5f3ff',
      counter: `${accountsCount}`
    }
  ].filter(action => canAccessPath(currentUserRole, action.href))

  return (
    <div className="p-6 bg-[#f4f5f7] h-[calc(100vh-56px)] overflow-y-auto page-enter scrollbar-thin">

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-[#e8eaed] rounded-2xl px-6 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {t('dashboard.welcome', 'Welcome back')}, {userName}!
            <Sparkles className="h-4 w-4 text-blue-500" />
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'ar' ? 'إليك نظرة سريعة على ما يحدث في وكالتك اليوم.' : language === 'fr' ? "Voici un aperçu rapide de ce qui se passe dans votre agence aujourd'hui." : "Here's a quick snapshot of your travel agency today."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          {language === 'ar' ? 'مساعد الذكاء الاصطناعي نشط' : language === 'fr' ? 'Assistant IA Actif' : 'AI Assistant Active'}
        </div>
      </div>

      {/* Onboarding Checklist */}
      {onboardingPercent < 100 ? (
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {t('dashboard.checklist_title', 'Onboarding')}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {language === 'ar' ? `الخطوة ${doneCount} من 4` : language === 'fr' ? `Étape ${doneCount} sur 4` : `Step ${doneCount} of 4`}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-900">
                {language === 'ar' ? 'أكمل إعداد وكالتك' : language === 'fr' ? 'Complétez la configuration' : 'Complete your agency setup'}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'ar' ? 'استفد من القوة الكاملة لمنصتك.' : language === 'fr' ? 'Libérez toute la puissance de votre plateforme.' : 'Unlock the full power of your SaaS platform.'}
              </p>
              <div className="pt-1">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-500 mb-2">
                  <span>{language === 'ar' ? 'التقدم' : language === 'fr' ? 'Progression' : 'Progress'}</span>
                  <span className="text-blue-600 font-bold">{onboardingPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${onboardingPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:max-w-lg">
              {checklist.map((step) => (
                <Link
                  href={step.href}
                  key={step.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                    step.done
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold leading-tight">{step.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{step.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {language === 'ar' ? 'اكتمل الإعداد 100%!' : language === 'fr' ? 'Configuration complétée à 100% !' : 'Agency Onboarding 100% Complete!'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'ar' ? 'تم تكوين كل شيء وهو جاهز للعمل.' : language === 'fr' ? 'Tout est configuré et opérationnel.' : 'Your catalog, accounts, and AI are fully operational.'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-full uppercase tracking-wide shrink-0">
            {language === 'ar' ? 'جاهز' : language === 'fr' ? 'Opérationnel' : 'Live'}
          </span>
        </div>
      )}

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: card.bgColor }}
              >
                <card.icon className="h-5 w-5" style={{ color: card.accentColor }} strokeWidth={2} />
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}
              >
                <TrendingUp className="h-2.5 w-2.5" />
                {card.trend}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-2">{card.title}</p>
              <p className="text-[28px] font-black leading-none tracking-tight" style={{ color: card.textColor }}>
                <AnimatedNumber value={card.value} />
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-5">

        {/* Revenue Bar Chart */}
        <div className="lg:col-span-4 bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {language === 'ar' ? 'حالة الإيرادات' : language === 'fr' ? 'État des revenus' : 'Revenue Overview'}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {language === 'ar' ? 'حجم المبيعات الشهرية بالدينار الجزائري.' : language === 'fr' ? 'Volume de vente mensuel en DZD.' : 'Monthly booking sales volume (DZD)'}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              {language === 'ar' ? 'عرض سنوي' : language === 'fr' ? 'Aperçu annuel' : 'Yearly View'}
            </span>
          </div>
          <div className="h-56 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRevenue} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6', radius: 6 }}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      color: '#111827',
                      fontSize: '11px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={24}
                    opacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-gray-400">{language === 'fr' ? 'Chargement...' : 'Loading...'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Leads Donut Chart */}
        <div className="lg:col-span-3 bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {t('dashboard.lead_quality', 'Lead Quality')}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {language === 'ar' ? 'توزيع درجات تحويل العملاء.' : language === 'fr' ? 'Distribution des scores de conversion.' : 'Lead conversion score distribution'}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {language === 'ar' ? 'كل القنوات' : language === 'fr' ? 'Tous' : 'All Channels'}
            </span>
          </div>

          <div className="relative h-40 w-full flex items-center justify-center">
            {mounted ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leadsDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-gray-900">{hotWarmRate}%</span>
                  <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Hot/Warm</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-400">Loading...</span>
            )}
          </div>

          {/* Horizontal pill legend */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
            {leadsDonutData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold"
                style={{ backgroundColor: `${item.color}12`, borderColor: `${item.color}30`, color: item.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name.split(' ')[0]}
                <span className="font-black ml-0.5">{item.value}</span>
                <span className="opacity-60">· {item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">

        {/* Recent Conversations */}
        <div className="lg:col-span-4 bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-3.5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {t('dashboard.recent_convs', 'Recent Conversations')}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {language === 'ar' ? 'أحدث تفاعلات العملاء الواردة.' : language === 'fr' ? 'Interactions clients les plus récentes.' : 'Most recent customer interactions'}
              </p>
            </div>
            <Link href="/dashboard/inbox" className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              {language === 'ar' ? 'عرض الكل' : language === 'fr' ? 'Voir tout' : 'View all'}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-0.5">
            {recentConversations.map((conv) => {
              const isHot = conv.lead_score === 'HOT'
              const isWarm = conv.lead_score === 'WARM'

              let platformIcon = <Phone className="h-3 w-3 text-green-500" />
              let platformBg = 'bg-green-100'

              if (conv.platform === 'instagram') {
                platformIcon = <InstagramIcon className="h-3 w-3 text-pink-500" />
                platformBg = 'bg-pink-100'
              } else if (conv.platform === 'facebook') {
                platformIcon = <FacebookIcon className="h-3 w-3 text-blue-600" />
                platformBg = 'bg-blue-100'
              }

              const isNew = conv.last_message_at ? new Date(conv.last_message_at).getTime() > Date.now() - 1000 * 60 * 60 * 24 : false
              const names = conv.customer_name ? conv.customer_name.split(' ') : ['A']
              const initials = names.map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              const palettes = [
                ['#eff6ff', '#2563eb'],
                ['#ecfdf5', '#10b981'],
                ['#f5f3ff', '#8b5cf6'],
                ['#fff7ed', '#ea580c'],
                ['#fef2f2', '#ef4444'],
              ]
              const [avatarBg, avatarText] = palettes[initials.charCodeAt(0) % palettes.length]

              return (
                <Link
                  href="/dashboard/inbox"
                  key={conv.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f4f5f7] transition-colors duration-150 group"
                >
                  {/* Avatar with platform badge */}
                  <div className="relative shrink-0">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: avatarBg, color: avatarText }}
                    >
                      {initials}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${platformBg} border-2 border-white flex items-center justify-center`}>
                      {platformIcon}
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                        {conv.customer_name || conv.customer_phone || 'Anonymous'}
                      </p>
                      {isNew && (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full uppercase shrink-0">New</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                      {conv.lead_summary || 'No summary available.'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : ''}
                    </span>
                    {conv.lead_score && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        isHot ? 'bg-red-50 text-red-600 border border-red-100' :
                        isWarm ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {conv.lead_score}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
            {recentConversations.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-10">No conversations yet.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <ListTodo className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</span>
          </div>
          {quickActions.map((action, i) => (
            <Link href={action.href} key={i} className="block group">
              <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: action.bgColor }}
                  >
                    <action.icon className="h-5 w-5" style={{ color: action.accentColor }} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">{action.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{action.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[11px] font-black px-2.5 py-0.5 rounded-full min-w-[28px] text-center"
                    style={{ backgroundColor: action.bgColor, color: action.accentColor }}
                  >
                    {action.counter}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
