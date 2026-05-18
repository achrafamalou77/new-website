'use client'

import { useState } from 'react'
import {
  Plus, Search, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Building2, Landmark, CreditCard, DollarSign, PiggyBank,
  FileText, CheckCircle2, AlertTriangle, ArrowRight, Banknote, Calendar, Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createFinancialAccount, createSupplier, createSupplierPayment, recordTransaction } from '@/app/actions/finance'

export function FinanceClient({
  initialAccounts,
  initialSuppliers,
  initialSupplierPayments,
  initialTransactions,
  initialStats,
  currentUserRole,
  currentUserId
}: {
  initialAccounts: any[]
  initialSuppliers: any[]
  initialSupplierPayments: any[]
  initialTransactions: any[]
  initialStats: any
  currentUserRole: string
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isRecordTxOpen, setIsRecordTxOpen] = useState(false)
  const [txType, setTxType] = useState<'income' | 'expense' | 'transfer'>('income')
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)

  // Form states
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Finance & Money</h1>
          <p className="text-slate-500 mt-1">Manage accounts, record transactions, and track suppliers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setTxType('income'); setIsRecordTxOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs">
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Add Income
          </Button>
          <Button onClick={() => { setTxType('expense'); setIsRecordTxOpen(true) }} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Wallet },
          { id: 'accounts', label: 'Accounts & CCP', icon: Building2 },
          { id: 'transactions', label: 'Ledger', icon: FileText },
          { id: 'suppliers', label: 'Suppliers', icon: Landmark }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                isActive 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Balance</p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {formatMoney(initialAccounts.reduce((sum, acc) => sum + acc.current_balance, 0))}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Monthly Income</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatMoney(initialStats.income)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Monthly Expenses</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatMoney(initialStats.expense)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Overdue Payables</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatMoney(initialStats.overdue_payments)}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setActiveTab('transactions')}>
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Ref</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialTransactions.slice(0, 5).map((tx, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-slate-900">{formatDate(tx.transaction_date)}</div>
                        <div className="text-xs text-slate-500">{tx.reference_number || 'No Ref'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-slate-900">{tx.description}</div>
                        <Badge variant="outline" className="mt-1 bg-slate-50">{tx.category}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{tx.account_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-slate-600'}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatMoney(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {initialTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Agency Accounts</h2>
            <Button onClick={() => setIsAddAccountOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialAccounts.map(account => (
              <div key={account.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                    {account.type === 'cash' ? <DollarSign className="w-6 h-6" /> :
                     account.type === 'ccp' ? <PiggyBank className="w-6 h-6" /> :
                     <Landmark className="w-6 h-6" />}
                  </div>
                  {account.is_default && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Default</Badge>}
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type & Details</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account & Method</th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialTransactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
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
              <div key={supplier.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 text-slate-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="capitalize">{supplier.type.replace('_', ' ')}</Badge>
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

      {/* Modals */}

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
              {txType === 'transfer' ? 'Move money between your agency accounts.' : `Add a new ${txType} to your ledger.`}
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
                    <option value="booking_payment">Booking Payment</option>
                    <option value="supplier_payment">Supplier Payment</option>
                    <option value="salary">Salary</option>
                    <option value="marketing">Marketing</option>
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
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
                <Input name="reference_number" placeholder="Optional CCP reference" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsRecordTxOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className={txType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : txType === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600'}>
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
            <DialogDescription>Add a hotel, airline, or bus company to track payables.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input required name="name" placeholder="e.g. Air Algerie, Hotel Mercure" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Type</Label>
                <select name="type" className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
                  <option value="airline">Airline</option>
                  <option value="hotel">Hotel</option>
                  <option value="bus_company">Bus Company</option>
                  <option value="guide_service">Guide Service</option>
                  <option value="visa_service">Visa Agency</option>
                  <option value="other">Other</option>
                </select>
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
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Supplier'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
