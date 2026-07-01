'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Search, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Building2, Landmark, CreditCard, DollarSign, PiggyBank,
  FileText, CheckCircle2, AlertTriangle, ArrowRight, Banknote, Calendar, Receipt, TrendingUp, Shield,
  Calculator, FileCheck, Scale, Globe, ArrowLeftRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createFinancialAccount, createSupplier, createSupplierPayment, recordTransaction } from '@/app/actions/finance'
import { useLanguage } from '@/lib/contexts/LanguageContext'

// ==========================================
// ALGERIAN DINARS NUMBERS-TO-WORDS TRANSLATOR (FRENCH & ARABIC)
// ==========================================

function numberToWordsFr(num: number): string {
  if (num === 0) return 'Zéro'
  
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf']
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-Sept', 'Dix-Huit', 'Dix-Neuf']
  const tens = ['', '', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-Dix', 'Quatre-Vingt', 'Quatre-Vingt-Dix']
  
  function convertLessThanThousand(n: number): string {
    let word = ''
    if (n >= 100) {
      const hundred = Math.floor(n / 100)
      word += (hundred === 1 ? '' : units[hundred] + ' ') + 'Cent' + (hundred > 1 && n % 100 === 0 ? 's' : '') + ' '
      n %= 100
    }
    if (n >= 20) {
      const ten = Math.floor(n / 10)
      const unit = n % 10
      if (ten === 7 && unit > 0) {
        word += 'Soixante et ' + teens[unit]
      } else if (ten === 9 && unit > 0) {
        word += 'Quatre-Vingt-' + teens[unit]
      } else {
        word += tens[ten] + (unit === 1 ? ' et Un' : unit > 0 ? '-' + units[unit].toLowerCase() : '')
      }
    } else if (n >= 10) {
      word += teens[n - 10]
    } else if (n > 0) {
      word += units[n]
    }
    return word.trim()
  }

  let words = ''
  if (num >= 1000000) {
    const million = Math.floor(num / 1000000)
    words += convertLessThanThousand(million) + ' Million' + (million > 1 ? 's' : '') + ' '
    num %= 1000000
  }
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000)
    words += (thousand === 1 ? '' : convertLessThanThousand(thousand) + ' ') + 'Mille '
    num %= 1000
  }
  if (num > 0) {
    words += convertLessThanThousand(num)
  }
  
  return words.trim()
}

function numberToWordsAr(num: number): string {
  if (num === 0) return 'صفر'
  
  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر']
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']
  
  function convertLessThanThousand(n: number): string {
    let parts: string[] = []
    if (n >= 100) {
      parts.push(hundreds[Math.floor(n / 100)])
      n %= 100
    }
    if (n >= 20) {
      const unit = n % 10
      const ten = Math.floor(n / 10)
      if (unit > 0) parts.push(units[unit])
      parts.push(tens[ten])
    } else if (n >= 10) {
      parts.push(teens[n - 10])
    } else if (n > 0) {
      parts.push(units[n])
    }
    return parts.join(' و ')
  }

  let words: string[] = []
  if (num >= 1000000) {
    const million = Math.floor(num / 1000000)
    if (million === 1) words.push('مليون')
    else if (million === 2) words.push('مليونان')
    else if (million >= 3 && million <= 10) words.push(convertLessThanThousand(million) + ' ملايين')
    else words.push(convertLessThanThousand(million) + ' مليون')
    num %= 1000000
  }
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000)
    if (thousand === 1) words.push('ألف')
    else if (thousand === 2) words.push('ألفان')
    else if (thousand >= 3 && thousand <= 10) words.push(convertLessThanThousand(thousand) + ' آلاف')
    else words.push(convertLessThanThousand(thousand) + ' ألف')
    num %= 1000
  }
  if (num > 0) {
    words.push(convertLessThanThousand(num))
  }
  
  return words.join(' و ')
}

function dzdToWordsFr(amount: number): string {
  const dinars = Math.floor(amount)
  const centimes = Math.round((amount - dinars) * 100)
  
  let result = numberToWordsFr(dinars) + ' Dinar' + (dinars > 1 ? 's' : '') + ' Algérien' + (dinars > 1 ? 's' : '')
  if (centimes > 0) {
    result += ' et ' + numberToWordsFr(centimes) + ' Centime' + (centimes > 1 ? 's' : '')
  } else {
    result += ' et Zéro Centimes'
  }
  return result
}

function dzdToWordsAr(amount: number): string {
  const dinars = Math.floor(amount)
  return numberToWordsAr(dinars) + ' دينار جزائري لا غير'
}

export function FinanceClient({
  initialAccounts,
  initialSuppliers,
  initialSupplierPayments,
  initialTransactions,
  initialStats,
  currentUserRole,
  currentUserId,
  businessTypeSlug = 'travel_agency'
}: {
  initialAccounts: any[]
  initialSuppliers: any[]
  initialSupplierPayments: any[]
  initialTransactions: any[]
  initialStats: any
  currentUserRole: string
  currentUserId: string
  businessTypeSlug?: string
}) {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isRecordTxOpen, setIsRecordTxOpen] = useState(false)
  const [txType, setTxType] = useState<'income' | 'expense' | 'transfer'>('income')
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)

  // Algerian CCP Slip Generator State
  const [isCcpSlipOpen, setIsCcpSlipOpen] = useState(false)
  const [ccpBeneficiary, setCcpBeneficiary] = useState('SARL Elite Motors')
  const [ccpAmount, setCcpAmount] = useState(250000)
  const [ccpAccountNo, setCcpAccountNo] = useState('0012345678')
  const [ccpKey, setCcpKey] = useState('94')
  
  // Auto Translation Hook on Slip amount changes
  const [ccpAmountWordsFr, setCcpAmountWordsFr] = useState('')
  const [ccpAmountWordsAr, setCcpAmountWordsAr] = useState('')
  
  // Depositor Slips Fields
  const [ccpDepositor, setCcpDepositor] = useState('Amine Rahmouni')
  const [ccpDepositorId, setCcpDepositorId] = useState('109876543')
  const [ccpDepositorAddress, setCcpDepositorAddress] = useState('12 Rue Didouche Mourad, Alger')

  // Billetage Cash Counting State
  const [isBilletageOpen, setIsBilletageOpen] = useState(false)
  const [b2000, setB2000] = useState(0)
  const [b1000, setB1000] = useState(0)
  const [b500, setB500] = useState(0)
  const [b200, setB200] = useState(0)
  const [c200, setC200] = useState(0)
  const [c100, setC100] = useState(0)
  const [c50, setC50] = useState(0)
  const [selectedBilletageAccount, setSelectedBilletageAccount] = useState(initialAccounts[0]?.id || '')

  // Square Port-Saïd Exchange Rate & Converter State
  const [eurSquareRate, setEurSquareRate] = useState(245)
  const [usdSquareRate, setUsdSquareRate] = useState(224)
  const [converterMode, setConverterMode] = useState<'dzd_to_curr' | 'curr_to_dzd'>('dzd_to_curr')
  const [convertDzd, setConvertDzd] = useState('100000')
  const [convertEur, setConvertEur] = useState('')
  const [convertUsd, setConvertUsd] = useState('')

  // Financial Forecast State
  const [forecastGrowth, setForecastGrowth] = useState(10) // 10% expected growth
  const [isLoading, setIsLoading] = useState(false)

  // Dynamic automatic translation inside ccp slip
  useEffect(() => {
    if (ccpAmount > 0) {
      setCcpAmountWordsFr(dzdToWordsFr(ccpAmount))
      setCcpAmountWordsAr(dzdToWordsAr(ccpAmount))
    } else {
      setCcpAmountWordsFr('Zéro Dinars')
      setCcpAmountWordsAr('صفر دينار')
    }
  }, [ccpAmount])

  // Dynamic Convert calculation
  useEffect(() => {
    if (converterMode === 'dzd_to_curr') {
      const dzd = Number(convertDzd) || 0
      setConvertEur((dzd / eurSquareRate).toFixed(2))
      setConvertUsd((dzd / usdSquareRate).toFixed(2))
    }
  }, [convertDzd, eurSquareRate, usdSquareRate, converterMode])

  const handleEurChange = (val: string) => {
    setConvertEur(val)
    if (converterMode === 'curr_to_dzd') {
      const eur = Number(val) || 0
      setConvertDzd((eur * eurSquareRate).toFixed(0))
      setConvertUsd(((eur * eurSquareRate) / usdSquareRate).toFixed(2))
    }
  }

  const handleUsdChange = (val: string) => {
    setConvertUsd(val)
    if (converterMode === 'curr_to_dzd') {
      const usd = Number(val) || 0
      setConvertDzd((usd * usdSquareRate).toFixed(0))
      setConvertEur(((usd * usdSquareRate) / eurSquareRate).toFixed(2))
    }
  }

  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      type: formData.get('type'),
      account_number: formData.get('account_number'),
      bank_name: formData.get('bank_name'),
      opening_balance: Number(formData.get('opening_balance')),
      current_balance: Number(formData.get('opening_balance')),
      currency: 'DZD',
      is_default: formData.get('is_default') === 'on'
    }
    await createFinancialAccount(payload)
    setIsLoading(false)
    setIsAddAccountOpen(false)
  }

  const handleRecordTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const payload = {
      account_id: formData.get('account_id'),
      type: txType,
      category: formData.get('category') || 'other',
      amount: Number(formData.get('amount')),
      description: formData.get('description'),
      reference_number: formData.get('reference_number'),
      payment_method: formData.get('payment_method'),
      transaction_date: formData.get('transaction_date'),
      transfer_to_account_id: txType === 'transfer' ? formData.get('transfer_to_account_id') : null
    }
    await recordTransaction(payload)
    setIsLoading(false)
    setIsRecordTxOpen(false)
  }

  const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      type: formData.get('type'),
      contact_name: formData.get('contact_name'),
      phone: formData.get('phone'),
      country: formData.get('country')
    }
    await createSupplier(payload)
    setIsLoading(false)
    setIsAddSupplierOpen(false)
  }

  // Formatting helpers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount)
  }
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Calculate billetage cash counting totals
  const billetageTotal = 
    (b2000 * 2000) + 
    (b1000 * 1000) + 
    (b500 * 500) + 
    (b200 * 200) + 
    (c200 * 200) + 
    (c100 * 100) + 
    (c50 * 50)

  const selectedAccountBalance = initialAccounts.find(a => a.id === selectedBilletageAccount)?.current_balance || 0
  const billetageDifference = billetageTotal - selectedAccountBalance

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-7 bg-[#f4f5f7] min-h-[calc(100vh-54px)] overflow-y-auto select-none text-slate-800">
      
      {/* Localized Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#e5e7eb] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 flex items-center justify-center text-white">
              <Landmark className="h-5 w-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{t('finance.title', 'Finance & Treasury')}</h1>
          </div>
          <p className="text-slate-500 mt-1.5 text-xs font-semibold">{t('finance.subtitle', 'Algerian Treasury Hub: Manage bank and CCP accounts, generate slips, count safely, and convert parallel markets.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setIsBilletageOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-black py-2.5 h-auto">
            <Calculator className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'حساب الخزينة (Billetage)' : 'PV Billetage Caisse'}
          </Button>
          <Button onClick={() => setIsCcpSlipOpen(true)} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-black py-2.5 h-auto">
            <Receipt className="w-4.5 h-4.5 mr-2" />
            {t('finance.ccp_slip', 'Algérie Poste Slip CH7')}
          </Button>
          <Button onClick={() => { setTxType('income'); setIsRecordTxOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-950/10 text-xs font-black py-2.5 h-auto">
            <ArrowDownRight className="w-4 h-4 mr-2" />
            {t('finance.add_income', 'Record Income')}
          </Button>
          <Button onClick={() => { setTxType('expense'); setIsRecordTxOpen(true) }} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-black py-2.5 h-auto">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            {t('finance.add_expense', 'Record Expense')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-[#e5e7eb]">
        {[
          { id: 'overview', label: language === 'ar' ? 'لوحة القيادة' : language === 'fr' ? 'Tableau de bord' : 'Dashboard', icon: Wallet },
          { id: 'accounts', label: language === 'ar' ? 'الحسابات و CCP' : language === 'fr' ? 'Comptes & CCP' : 'Accounts & CCP', icon: Building2 },
          { id: 'transactions', label: language === 'ar' ? 'دفتر اليومية الكبير' : language === 'fr' ? 'Grand Livre de Caisse' : 'General Ledger', icon: FileText },
          { id: 'suppliers', label: language === 'ar' ? 'دليل الموردين' : language === 'fr' ? 'Fournisseurs & Payables' : 'Suppliers', icon: Landmark }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 pb-4 text-xs font-black uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                isActive 
                  ? 'border-emerald-600 text-emerald-700' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('finance.total_balance', 'Total Balance')}</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {formatMoney(initialAccounts.reduce((sum, acc) => sum + acc.current_balance, 0))}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('finance.monthly_income', 'Monthly Income')}</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{formatMoney(initialStats.income)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('finance.monthly_expense', 'Monthly Expenses')}</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{formatMoney(initialStats.expense)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('finance.overdue_payables', 'Overdue Payables')}</p>
                  <h3 className="text-xl font-black text-rose-650 mt-1">{formatMoney(initialStats.overdue_payments)}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Localized Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Upgraded Recent Transactions (col-span-2) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
                <h2 className="text-sm font-black uppercase text-slate-900 tracking-wide">{t('finance.recent_ledger', 'Recent Cash Ledger')}</h2>
                <Button variant="ghost" className="text-emerald-650 hover:text-emerald-700 hover:bg-emerald-50 text-[11px] font-black uppercase tracking-wider" onClick={() => setActiveTab('transactions')}>
                  {t('finance.view_all_ledger', 'View All Ledger')} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f9fafb]">
                    <tr className="border-b border-[#f4f5f7]">
                      <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">Date & Ref</th>
                      <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">Description</th>
                      <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">Account</th>
                      <th className="py-3 px-6 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {initialTransactions.slice(0, 5).map((tx, i) => (
                      <tr key={i} className="hover:bg-[#fafbfc] border-b border-[#f4f5f7] transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold text-slate-950">{formatDate(tx.transaction_date)}</div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">{tx.reference_number || 'No Ref'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800 leading-snug">{tx.description}</div>
                          <Badge variant="outline" className="mt-1.5 bg-slate-50/50 text-[9.5px] uppercase font-black text-slate-500 tracking-wide border-slate-200/60">{tx.category?.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-600">{tx.account_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <span className={`font-black text-sm ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-slate-600'}`}>
                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatMoney(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {initialTransactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500">No transactions recorded yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 2: Algerian Markets, Converters & Advisory Hub */}
            <div className="space-y-6">
              
              {/* Square Port-Said Parallel Market Converter Panel */}
              <div className="bg-white rounded-2xl border border-[#e8eaed] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-30 pointer-events-none" />
                
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5 mb-4 tracking-wider">
                  <Globe className="w-4.5 h-4.5 text-emerald-600 animate-pulse" /> 
                  Square Port-Saïd Market Rates
                </h3>

                <div className="space-y-4">
                  
                  {/* Rates settings inputs */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-200/60">
                    <div className="space-y-1">
                      <Label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wide">1 EUR (€) Parallel</Label>
                      <Input 
                        type="number" 
                        value={eurSquareRate} 
                        onChange={e => setEurSquareRate(Number(e.target.value))} 
                        className="h-8 text-xs font-black text-slate-800 rounded-lg text-center" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wide">1 USD ($) Parallel</Label>
                      <Input 
                        type="number" 
                        value={usdSquareRate} 
                        onChange={e => setUsdSquareRate(Number(e.target.value))} 
                        className="h-8 text-xs font-black text-slate-800 rounded-lg text-center" 
                      />
                    </div>
                  </div>

                  {/* Calculator conversions */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parallel Currency Converter</Label>
                      <button 
                        onClick={() => {
                          setConverterMode(prev => prev === 'dzd_to_curr' ? 'curr_to_dzd' : 'dzd_to_curr')
                        }}
                        className="text-[9px] font-black text-emerald-650 hover:text-emerald-700 flex items-center gap-1 cursor-pointer uppercase"
                      >
                        <ArrowLeftRight className="w-3 h-3" /> Toggle Mode
                      </button>
                    </div>

                    {converterMode === 'dzd_to_curr' ? (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[9.5px] font-bold text-slate-500">Montant en Dinars (DZD)</Label>
                          <Input 
                            type="number" 
                            value={convertDzd} 
                            onChange={e => setConvertDzd(e.target.value)} 
                            placeholder="e.g. 100000" 
                            className="text-xs font-bold text-slate-800 rounded-lg"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Euro (€) Equivalent</p>
                            <p className="text-sm font-black text-emerald-700 mt-0.5">{convertEur} €</p>
                          </div>
                          <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Dollar ($) Equivalent</p>
                            <p className="text-sm font-black text-blue-700 mt-0.5">{convertUsd} $</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-bold text-slate-500">Saisir Euros (€)</Label>
                            <Input 
                              type="number" 
                              value={convertEur} 
                              onChange={e => handleEurChange(e.target.value)} 
                              placeholder="1000" 
                              className="text-xs font-bold text-slate-800 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-bold text-slate-500">Saisir Dollars ($)</Label>
                            <Input 
                              type="number" 
                              value={convertUsd} 
                              onChange={e => handleUsdChange(e.target.value)} 
                              placeholder="1000" 
                              className="text-xs font-bold text-slate-800 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center pt-2">
                          <p className="text-[8.5px] text-slate-400 font-bold uppercase">Square Port-Said Value</p>
                          <p className="text-base font-black text-indigo-900 mt-0.5">{Number(convertDzd).toLocaleString()} DA</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Algerian Cash Stamp Duty Indicator */}
              <div className="bg-white rounded-2xl border border-[#e8eaed] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5 mb-3 tracking-wider">
                  <Scale className="w-4.5 h-4.5 text-blue-600" />
                  Algerian Cash Stamp Tax ("Droit de Timbre")
                </h3>
                <div className="space-y-3 text-xs leading-relaxed text-slate-500">
                  <p>In Algeria, direct cash transactions require a progressive legal stamp tax of <strong>1.0%</strong> on invoices, with a regulatory cap at <strong>10,000 DZD</strong>.</p>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-700 block text-xs">Dynamic Stamp Duty Tax</span>
                      <span className="text-[9.5px] text-slate-400 font-medium">Auto-applied for cash booking receipt checkouts</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 font-bold border-0 hover:bg-blue-100">1.0% (Max 10k DA)</Badge>
                  </div>
                </div>
              </div>

              {/* Cash Advisory & Port Warnings */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-3 top-3 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center pointer-events-none">
                  <Shield className="w-5 h-5 text-emerald-450" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">🛡️ Cash Advisory & Warnings</h4>
                
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  {businessTypeSlug === 'car_showroom' ? (
                    <>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-bold text-white mb-1">Customs Clearance Buffer</p>
                        <p className="text-[11px] text-slate-400">Algerian ports log d&eacute;douanement charges. Retain at least <strong>4,500,000 DA</strong> inside default CCP/Bank accounts to avoid container demurrages.</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-bold text-white mb-1">Purchasing Power Analysis</p>
                        <p className="text-[11px] text-slate-400">Your available cash reserves can import up to <strong>{Math.floor(initialAccounts.reduce((sum, acc) => sum + acc.current_balance, 0) / 3200000)} vehicles</strong> (estimated at 3,200,000 DA purchase price + shipping).</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-bold text-white mb-1">Airline Block Allocations</p>
                        <p className="text-[11px] text-slate-400">High travel season incoming. Allocate at least 25% of cash flow to secure advance blocks on summer charter flights to Turkey & Tunisia.</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-bold text-white mb-1">Supplier Payments Threshold</p>
                        <p className="text-[11px] text-slate-400">You have <strong>{formatMoney(initialStats.overdue_payments)}</strong> in overdue/pending hotels payables. Secure default CCP account to settle before hotel vouchers get cancelled.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">
              {businessTypeSlug === 'car_showroom' ? 'Showroom Accounts' : 'Agency Accounts'}
            </h2>
            <Button onClick={() => setIsAddAccountOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialAccounts.map(account => (
              <div key={account.id} className="bg-white rounded-2xl border border-[#e8eaed] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                    {account.type === 'cash' ? <DollarSign className="w-6 h-6" /> :
                     account.type === 'ccp' ? <PiggyBank className="w-6 h-6" /> :
                     <Landmark className="w-6 h-6" />}
                  </div>
                  {account.is_default && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Default</Badge>}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{account.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{account.account_number || 'No account number'}</p>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-slate-900">{formatMoney(account.current_balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="px-6 py-5 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Ledger</h2>
              <div className="flex items-center gap-3">
                <Button onClick={() => { setTxType('transfer'); setIsRecordTxOpen(true) }} variant="outline" className="rounded-xl">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Transfer
                </Button>
                <Button onClick={() => { setTxType('income'); setIsRecordTxOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Income
                </Button>
                <Button onClick={() => { setTxType('expense'); setIsRecordTxOpen(true) }} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Expense
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f9fafb]">
                  <tr>
                    <th className="text-left py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">Date</th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">Type & Details</th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">Account & Method</th>
                    <th className="text-right py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialTransactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-[#fafbfc] border-b border-[#f4f5f7] transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{formatDate(tx.transaction_date)}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> {new Date(tx.created_at).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 mb-1">
                          {tx.type === 'income' ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">INCOME</Badge> : 
                           tx.type === 'expense' ? <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0">EXPENSE</Badge> :
                           <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">TRANSFER</Badge>}
                          <span className="text-sm font-medium text-slate-900">{tx.description}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full">{tx.category}</span>
                          {tx.reference_number && <span>Ref: {tx.reference_number}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-slate-900 flex items-center gap-2 mb-1">
                          <Wallet className="w-4 h-4 text-slate-400" />
                          {tx.account_name}
                        </div>
                        <div className="text-xs text-slate-500 uppercase">{tx.payment_method}</div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span className={`text-base font-bold ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-slate-600'}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatMoney(tx.amount)}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">By: {tx.recorded_by_name}</div>
                      </td>
                    </tr>
                  ))}
                  {initialTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Receipt className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 mb-1">No transactions yet</h3>
                        <p className="text-sm text-slate-500">Record your first income or expense to see it here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Suppliers Directory</h2>
            <Button onClick={() => setIsAddSupplierOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialSuppliers.map(supplier => (
              <div key={supplier.id} className="bg-white rounded-2xl border border-[#e8eaed] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 text-slate-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="capitalize border-0">{supplier.type.replace('_', ' ')}</Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{supplier.name}</h3>
                <p className="text-sm text-slate-500 mb-2">{supplier.contact_name || 'No contact specified'}</p>
                <div className="text-sm text-slate-500 space-y-1">
                  {supplier.phone && <p>📞 {supplier.phone}</p>}
                  {supplier.email && <p>✉️ {supplier.email}</p>}
                  {supplier.country && <p>🌍 {supplier.country}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* 1. Add Account Modal */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Financial Account</DialogTitle>
            <DialogDescription>Create a new Cash Office, CCP, or Bank account to track funds.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input required name="name" placeholder="e.g. Caisse Principale, CCP Agence" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <select name="type" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                  <option value="cash">Cash Office</option>
                  <option value="ccp">CCP</option>
                  <option value="bank">Bank Account</option>
                  <option value="edahabia">Edahabia</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Opening Balance (DZD)</Label>
                <Input required type="number" name="opening_balance" defaultValue="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account / RIP Number (Optional)</Label>
              <Input name="account_number" placeholder="e.g. 007 99999 99" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="is_default" name="is_default" className="rounded text-blue-600 focus:ring-blue-500" />
              <Label htmlFor="is_default" className="text-sm font-normal">Set as default account</Label>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAddAccountOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Account'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Record Transaction Modal */}
      <Dialog open={isRecordTxOpen} onOpenChange={setIsRecordTxOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {txType === 'income' ? 'Record Income' : txType === 'expense' ? 'Record Expense' : 'Transfer Funds'}
            </DialogTitle>
            <DialogDescription>
              {txType === 'transfer' 
                ? (businessTypeSlug === 'car_showroom' ? 'Move money between your showroom accounts.' : 'Move money between your agency accounts.') 
                : `Add a new ${txType} to your ledger.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordTransaction} className="space-y-4 pt-4">
            
            {/* Account Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{txType === 'transfer' ? 'From Account' : 'Account'}</Label>
                <select required name="account_id" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                  {initialAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.current_balance)})</option>)}
                </select>
              </div>
              {txType === 'transfer' ? (
                <div className="space-y-2">
                  <Label>To Account</Label>
                  <select required name="transfer_to_account_id" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                    {initialAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select required name="category" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                    {businessTypeSlug === 'car_showroom' ? (
                      <>
                        <option value="client_car_sale">Client Car Sale</option>
                        <option value="vehicle_purchase">Vehicle Purchase</option>
                        <option value="customs_clearance">Customs Clearance Fee</option>
                        <option value="shipping_logistics">Shipping & Logistics</option>
                        <option value="showroom_maintenance">Showroom Maintenance</option>
                        <option value="payroll">Employee Payroll</option>
                        <option value="marketing">Marketing</option>
                        <option value="rent">Showroom Rent</option>
                        <option value="other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="booking_payment">Booking Payment</option>
                        <option value="supplier_payment">Supplier Payment</option>
                        <option value="salary">Salary</option>
                        <option value="marketing">Marketing</option>
                        <option value="rent">Rent</option>
                        <option value="utilities">Utilities</option>
                        <option value="other">Other</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (DZD)</Label>
                <Input required type="number" min="1" name="amount" placeholder="50000" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input required type="date" name="transaction_date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input required name="description" placeholder="What was this for?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select required name="payment_method" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                  <option value="cash">Cash</option>
                  <option value="ccp">CCP</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="edahabia">Edahabia</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ref / Receipt No.</Label>
                <Input name="reference_number" placeholder="Optional reference" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsRecordTxOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className={txType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : txType === 'expense' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-blue-600 text-white'}>
                {isLoading ? 'Saving...' : `Save ${txType}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Add Supplier Modal */}
      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>
              {businessTypeSlug === 'car_showroom' 
                ? 'Add a dealership, shipping line, or transit agent to track payables.' 
                : 'Add a hotel, airline, or bus company to track payables.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                required 
                name="name" 
                placeholder={businessTypeSlug === 'car_showroom' ? 'e.g. Port of Algiers Transit, Marseille Shipping' : 'e.g. Air Algerie, Hotel Mercure'} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Type</Label>
                {businessTypeSlug === 'car_showroom' ? (
                  <select name="type" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                    <option value="dealership">Dealer / Auction House</option>
                    <option value="shipping_line">Shipping Line</option>
                    <option value="transit_agent">Transit Agent</option>
                    <option value="spare_parts">Spare Parts Supplier</option>
                    <option value="logistics">Logistics Provider</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <select name="type" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                    <option value="airline">Airline</option>
                    <option value="hotel">Hotel</option>
                    <option value="bus_company">Bus Company</option>
                    <option value="guide_service">Guide Service</option>
                    <option value="visa_service">Visa Agency</option>
                    <option value="other">Other</option>
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input name="country" placeholder="e.g. Algeria, Turkey" defaultValue="Algeria" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input name="phone" placeholder="+213..." />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input name="contact_name" placeholder="Contact person" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAddSupplierOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>Save Supplier</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. ALGERIAN CCP SLIP CH7 GENERATOR DIALOG */}
      <Dialog open={isCcpSlipOpen} onOpenChange={setIsCcpSlipOpen}>
        <DialogContent className="sm:max-w-[950px] rounded-3xl overflow-hidden border border-slate-200">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Algérie Poste CH7 Green CCP Slip Generator
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Fill, translate to letters automatically, and print official-looking green CCP transfer slips.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 text-left">
            {/* Form side (col-span-2) */}
            <div className="md:col-span-2 space-y-4 pr-3 border-r border-slate-100 max-h-[550px] overflow-y-auto">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Slip Specifications</h4>
              
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-650">Beneficiary / Destinataire</Label>
                <Input value={ccpBeneficiary} onChange={e => setCcpBeneficiary(e.target.value)} className="rounded-xl text-xs bg-slate-50 font-bold" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-650">Compte CCP</Label>
                  <Input maxLength={10} value={ccpAccountNo} onChange={e => setCcpAccountNo(e.target.value)} className="rounded-xl text-xs font-mono font-bold bg-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-650">Clé</Label>
                  <Input maxLength={2} value={ccpKey} onChange={e => setCcpKey(e.target.value)} className="rounded-xl text-xs font-mono font-bold bg-slate-50 text-center" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-650">Montant en chiffres (DA)</Label>
                <Input type="number" value={ccpAmount} onChange={e => setCcpAmount(Number(e.target.value))} className="rounded-xl text-xs font-black text-emerald-600 bg-slate-50" />
              </div>

              <div className="border-t border-slate-100 my-2" />
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Depositor Details ("المهيئ / المودع")</h4>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-650">Nom & Prénom / Full Name</Label>
                <Input value={ccpDepositor} onChange={e => setCcpDepositor(e.target.value)} className="rounded-xl text-xs bg-slate-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-650">NIN / National ID No</Label>
                  <Input value={ccpDepositorId} onChange={e => setCcpDepositorId(e.target.value)} className="rounded-xl text-xs bg-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-650">Adresse / Location</Label>
                  <Input value={ccpDepositorAddress} onChange={e => setCcpDepositorAddress(e.target.value)} className="rounded-xl text-xs bg-slate-50" />
                </div>
              </div>

              <Button onClick={() => window.print()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black py-2.5 shadow-md shadow-emerald-950/10 mt-4 cursor-pointer">
                📟 Print & Download Slip
              </Button>
            </div>

            {/* Slip Visual side (col-span-3) */}
            <div className="md:col-span-3 flex flex-col justify-start items-center bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200 max-h-[550px] overflow-y-auto">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Green Bordereau CH7 Preview</p>
              
              {/* CH7 Double green slip design */}
              <div id="printable-ccp-slip" className="w-full bg-[#fdfdf5] border-2 border-emerald-600 rounded-lg p-4 font-mono text-[9px] text-emerald-950 relative overflow-hidden shadow-md select-none">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-emerald-600 pb-2 mb-3">
                  <div>
                    <h5 className="font-sans font-black text-emerald-800 text-[10px] tracking-wide">بريد الجزائر - Algérie Poste</h5>
                    <p className="font-sans font-bold text-emerald-700 text-[8px] uppercase">Bordereau de Versement CCP - صك ورقة بريدية</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-md uppercase border border-emerald-250">CH7 SLIP</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Account Grid info */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-500 w-16">Compte CCP:</span>
                    <div className="flex gap-0.5">
                      {ccpAccountNo.padStart(10, '0').split('').map((digit, i) => (
                        <span key={i} className="border border-emerald-600 bg-white w-4.5 h-6 flex items-center justify-center font-bold text-xs rounded-sm shadow-xs">{digit}</span>
                      ))}
                    </div>
                    <span className="font-bold text-slate-500 ml-1">Clé:</span>
                    <span className="border-2 border-dashed border-emerald-600 bg-emerald-50 w-5 h-6 flex items-center justify-center font-bold text-xs rounded-sm">{ccpKey}</span>
                  </div>

                  {/* Beneficiary and Depositor details */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2 border-b border-dashed border-emerald-600/30 pb-1">
                      <span className="font-bold text-slate-500 w-24">Crédité au profit de:</span>
                      <span className="font-sans font-black text-emerald-900 text-xs">{ccpBeneficiary}</span>
                    </div>

                    <div className="flex items-baseline gap-2 border-b border-dashed border-emerald-600/30 pb-1">
                      <span className="font-bold text-slate-500 w-24">Déposé par (Tireur):</span>
                      <span className="font-sans font-bold text-emerald-850">{ccpDepositor}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-dashed border-emerald-600/30 pb-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-500 w-24">ID/NIN:</span>
                        <span className="font-sans font-bold text-emerald-800">{ccpDepositorId}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-500">Adresse:</span>
                        <span className="font-sans font-bold text-emerald-800 truncate max-w-[120px]">{ccpDepositorAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic translations auto-loaded */}
                  <div className="p-3 bg-emerald-50/20 border border-emerald-250/30 rounded-lg space-y-1.5 text-[8.5px]">
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-slate-400 shrink-0">Montant en Lettres (FR):</span>
                      <span className="font-sans font-bold text-emerald-800 italic">{ccpAmountWordsFr}</span>
                    </div>
                    <div className="flex items-baseline gap-1 dir-rtl text-right">
                      <span className="font-bold text-slate-400 shrink-0">المبلغ بالحروف (AR):</span>
                      <span className="font-sans font-black text-emerald-900">{ccpAmountWordsAr}</span>
                    </div>
                  </div>

                  {/* Amount Box and Signature grids */}
                  <div className="flex justify-between items-end pt-2 border-t border-emerald-250/40">
                    <div className="text-left text-[8px] text-slate-400">
                      <p>Date & Signature du déposant</p>
                      <p className="font-sans font-bold text-slate-800 text-[9.5px] mt-1">{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="border-2 border-emerald-600 bg-[#f4f7f4] rounded-md px-4 py-1.5 flex items-baseline gap-1.5 shadow-sm">
                      <span className="text-[8px] font-black text-emerald-700 uppercase">Montant Net (DA):</span>
                      <span className="text-sm font-black text-emerald-950">{ccpAmount.toLocaleString()} DA</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. ALGERIAN DINARS BILLETAGE SAFE COUNT DIALOG */}
      <Dialog open={isBilletageOpen} onOpenChange={setIsBilletageOpen}>
        <DialogContent className="sm:max-w-[900px] rounded-3xl border border-slate-200">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              Algerian Dinars safe count sheet (Billetage)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Input the physical cash notes inside your safe to calculate totals, print closing statement, and match with system ledgers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 text-left">
            {/* Input safe inventory fields (col-span-3) */}
            <div className="md:col-span-3 space-y-4 max-h-[500px] overflow-y-auto pr-2">
              
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Physical Banknotes Count</h4>
                
                {/* Account matcher select */}
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Match Ledger:</Label>
                  <select 
                    value={selectedBilletageAccount} 
                    onChange={e => setSelectedBilletageAccount(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-[11px] px-2 py-1 outline-none font-bold"
                  >
                    {initialAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Banknote grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 2000 DA note */}
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-10 py-1 rounded bg-indigo-950 text-white font-black text-[9px] text-center shrink-0">2000 DA</span>
                    <span className="text-xs font-bold text-slate-600">x</span>
                  </div>
                  <Input 
                    type="number" 
                    min="0"
                    value={b2000 || ''} 
                    onChange={e => setB2000(Number(e.target.value))} 
                    className="w-20 text-xs font-black text-center h-8 bg-white" 
                  />
                </div>

                {/* 1000 DA note */}
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-10 py-1 rounded bg-emerald-900 text-white font-black text-[9px] text-center shrink-0">1000 DA</span>
                    <span className="text-xs font-bold text-slate-600">x</span>
                  </div>
                  <Input 
                    type="number" 
                    min="0"
                    value={b1000 || ''} 
                    onChange={e => setB1000(Number(e.target.value))} 
                    className="w-20 text-xs font-black text-center h-8 bg-white" 
                  />
                </div>

                {/* 500 DA note */}
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-10 py-1 rounded bg-rose-900 text-white font-black text-[9px] text-center shrink-0">500 DA</span>
                    <span className="text-xs font-bold text-slate-600">x</span>
                  </div>
                  <Input 
                    type="number" 
                    min="0"
                    value={b500 || ''} 
                    onChange={e => setB500(Number(e.target.value))} 
                    className="w-20 text-xs font-black text-center h-8 bg-white" 
                  />
                </div>

                {/* 200 DA note */}
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-10 py-1 rounded bg-slate-700 text-white font-black text-[9px] text-center shrink-0">200 DA</span>
                    <span className="text-xs font-bold text-slate-600">x</span>
                  </div>
                  <Input 
                    type="number" 
                    min="0"
                    value={b200 || ''} 
                    onChange={e => setB200(Number(e.target.value))} 
                    className="w-20 text-xs font-black text-center h-8 bg-white" 
                  />
                </div>

              </div>

              {/* Coins counting divider */}
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-2 pt-2">Physical Coins Count</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-50/30 border border-slate-200/60 rounded-xl">
                  <span className="text-[10px] font-black text-slate-500">200 DA coin</span>
                  <Input type="number" min="0" value={c200 || ''} onChange={e => setC200(Number(e.target.value))} className="w-14 text-xs font-bold text-center h-7 bg-white" />
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50/30 border border-slate-200/60 rounded-xl">
                  <span className="text-[10px] font-black text-slate-500">100 DA coin</span>
                  <Input type="number" min="0" value={c100 || ''} onChange={e => setC100(Number(e.target.value))} className="w-14 text-xs font-bold text-center h-7 bg-white" />
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50/30 border border-slate-200/60 rounded-xl">
                  <span className="text-[10px] font-black text-slate-500">50 DA coin</span>
                  <Input type="number" min="0" value={c50 || ''} onChange={e => setC50(Number(e.target.value))} className="w-14 text-xs font-bold text-center h-7 bg-white" />
                </div>
              </div>

            </div>

            {/* Calculations and comparisons panel (col-span-2) */}
            <div className="md:col-span-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-2">Safe closure audit</h4>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Physical Cash counted:</span>
                    <span className="text-slate-900 font-black">{formatMoney(billetageTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Ledger Cash Account:</span>
                    <span className="text-slate-900 font-black">{formatMoney(selectedAccountBalance)}</span>
                  </div>

                  <div className="border-t border-slate-200/60 my-2 pt-2.5 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-700">Audit Discrepancy:</span>
                    <span className={`text-base font-black ${billetageDifference === 0 ? 'text-emerald-600' : billetageDifference > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {billetageDifference > 0 ? '+' : ''}{formatMoney(billetageDifference)}
                    </span>
                  </div>
                </div>

                {/* Visual health alerts */}
                <div className="pt-2">
                  {billetageDifference === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10.5px] leading-relaxed flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p><strong>Caisse Parfaite</strong>: Cash counted matches system records exactly. Ready to download the PV cash closure.</p>
                    </div>
                  ) : billetageDifference > 0 ? (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-[10.5px] leading-relaxed flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <p><strong>Excédent de Caisse</strong>: Positive variance detected. Review if a cash booking payment was not registered in the system ledger.</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[10.5px] leading-relaxed flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p><strong>Déficit de Caisse</strong>: Safe shortage. Cash counted is less than database records. Verify payouts or record an expense slip.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200/60 mt-4">
                <Button onClick={() => window.print()} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs py-2.5 shadow-sm">
                  📟 Download PV safe closing
                </Button>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
