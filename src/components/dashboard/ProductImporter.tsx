'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  ImagePlus,
  Info,
  Loader2,
  Package,
  PackageCheck,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  X,
  Zap,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  bulkImportEcommerceProducts,
  seedTestOrders,
  deleteTestOrders,
} from '@/app/actions/ecommerce-import'
import { uploadEcommerceImage } from '@/app/actions/ecommerce'
import type { EcommerceOrder, EcommerceProduct } from '@/types/ecommerce'

/* ══════════════════════════════════════════════════════════════════════════ */
/*  CONSTANTS & CONFIG                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */

const FIELD_DEFS = [
  { key: 'name', label: 'Product Name', required: true, type: 'text', hint: 'Full product name' },
  { key: 'sku', label: 'SKU', required: true, type: 'text', hint: 'Unique identifier' },
  { key: 'price', label: 'Price (DZD)', required: true, type: 'number', hint: 'Sale price' },
  { key: 'stock_quantity', label: 'Stock Qty', required: true, type: 'number', hint: 'Units available' },
  { key: 'category', label: 'Category', required: false, type: 'text', hint: 'e.g. Sneakers' },
  { key: 'brand', label: 'Brand', required: false, type: 'text', hint: 'e.g. Nike' },
  { key: 'compare_at_price', label: 'Compare-at Price', required: false, type: 'number', hint: 'Original price before discount' },
  { key: 'cost_price', label: 'Cost Price', required: false, type: 'number', hint: 'Your cost per unit' },
  { key: 'description', label: 'Description', required: false, type: 'text', hint: 'Product details' },
  { key: 'status', label: 'Status', required: false, type: 'select', hint: 'active / draft / archived' },
  { key: 'is_featured', label: 'Featured', required: false, type: 'boolean', hint: 'true / false' },
] as const

type FieldKey = typeof FIELD_DEFS[number]['key']

/* Smart column name aliases for auto-detection */
const COLUMN_ALIASES: Record<FieldKey, string[]> = {
  name: ['name', 'product name', 'product_name', 'title', 'item', 'nom', 'produit', 'article'],
  sku: ['sku', 'sku_id', 'product_id', 'ref', 'reference', 'code', 'barcode', 'upc'],
  price: ['price', 'prix', 'sale_price', 'selling_price', 'unit_price', 'tarif'],
  stock_quantity: ['stock', 'qty', 'quantity', 'stock_quantity', 'qte', 'quantite', 'available', 'units'],
  category: ['category', 'categorie', 'type', 'department', 'section', 'family'],
  brand: ['brand', 'marque', 'manufacturer', 'make', 'vendor', 'supplier'],
  compare_at_price: ['compare_at_price', 'compare_price', 'original_price', 'msrp', 'was_price', 'before'],
  cost_price: ['cost', 'cost_price', 'purchase_price', 'buying_price', 'cout'],
  description: ['description', 'desc', 'details', 'about', 'info', 'notes'],
  status: ['status', 'statut', 'state', 'active', 'published'],
  is_featured: ['featured', 'is_featured', 'highlight', 'star', 'bestseller'],
}

type ParsedRow = {
  _id: string
  _rowNum: number
  _status: 'valid' | 'error' | 'warning' | 'duplicate'
  _errors: string[]
  _warnings: string[]
  _isDuplicate: boolean
  [key: string]: unknown
}

type ColumnMap = Partial<Record<FieldKey, string>>

type ImportHistoryEntry = {
  id: string
  date: string
  count: number
  success: number
  failed: number
  filename: string
}

type UploadedImage = {
  id: string
  file: File
  preview: string
  url: string
  uploading: boolean
  error?: string
  assignedSku?: string
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  HELPERS                                                                   */
/* ══════════════════════════════════════════════════════════════════════════ */

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function formatMoney(v: number) {
  return `${new Intl.NumberFormat('fr-DZ').format(Number(v) || 0)} DZD`
}

/** Auto-detect which spreadsheet column maps to which field */
function autoDetectMapping(headers: string[]): ColumnMap {
  const map: ColumnMap = {}
  for (const def of FIELD_DEFS) {
    const aliases = COLUMN_ALIASES[def.key]
    for (const header of headers) {
      const normalized = header.toLowerCase().trim().replace(/\s+/g, '_')
      if (aliases.some((a) => a === normalized || normalized.includes(a) || a.includes(normalized))) {
        map[def.key] = header
        break
      }
    }
  }
  return map
}

/** Parse raw row data through column map → typed record */
function applyMapping(rawRow: Record<string, string>, colMap: ColumnMap): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [field, col] of Object.entries(colMap)) {
    if (col && rawRow[col] !== undefined) {
      result[field] = String(rawRow[col] ?? '').trim()
    }
  }
  return result
}

/** Validate a mapped row, return ParsedRow */
function validateRow(mapped: Record<string, string>, rowNum: number, existingSkus: Set<string>): ParsedRow {
  const errors: string[] = []
  const warnings: string[] = []

  if (!mapped.name || mapped.name.trim().length < 2) errors.push('Name is required (min 2 chars)')
  if (!mapped.sku || mapped.sku.trim().length < 2) errors.push('SKU is required')
  if (!mapped.price || isNaN(Number(mapped.price))) errors.push('Price must be a number')
  else if (Number(mapped.price) <= 0) warnings.push('Price is 0 — is this intentional?')
  if (mapped.stock_quantity && isNaN(Number(mapped.stock_quantity))) errors.push('Stock must be a number')
  if (mapped.status && !['active', 'draft', 'archived'].includes(mapped.status.toLowerCase())) {
    warnings.push(`Status "${mapped.status}" is unknown — will default to "active"`)
  }

  const isDuplicate = mapped.sku ? existingSkus.has(mapped.sku.trim().toUpperCase()) : false
  if (isDuplicate) warnings.push(`SKU "${mapped.sku}" already exists — will overwrite`)

  return {
    _id: uid(),
    _rowNum: rowNum,
    _status: errors.length ? 'error' : isDuplicate ? 'duplicate' : warnings.length ? 'warning' : 'valid',
    _errors: errors,
    _warnings: warnings,
    _isDuplicate: isDuplicate,
    ...mapped,
  }
}

/** Parse XLSX/CSV binary → headers + raw rows */
async function parseSpreadsheet(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })
  if (!json.length) return { headers: [], rows: [] }
  const headers = Object.keys(json[0])
  const rows = json.map((r) => {
    const obj: Record<string, string> = {}
    for (const h of headers) obj[h] = String(r[h] ?? '').trim()
    return obj
  })
  return { headers, rows }
}

function parseCSVText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = parseCsvLine(line)
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim() })
      return obj
    })
  return { headers, rows }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"' && !inQ) { inQ = true; continue }
    if (c === '"' && inQ && line[i + 1] === '"') { cur += '"'; i++; continue }
    if (c === '"' && inQ) { inQ = false; continue }
    if (c === ',' && !inQ) { result.push(cur); cur = ''; continue }
    cur += c
  }
  result.push(cur)
  return result
}

async function downloadTemplate() {
  const XLSX = await import('xlsx')
  const headers = FIELD_DEFS.map((f) => f.label)
  const examples = [
    ['Nike Air Max 97', 'NK-AM97-WHT-42', 12500, 24, 'Sneakers', 'Nike', 15000, 8000, 'Classic Air Max 97 in white.', 'active', 'true'],
    ['Adidas Ultraboost 22', 'AD-UB22-BLK-41', 9800, 15, 'Running', 'Adidas', 11500, 6500, 'Responsive cushioning for long runs.', 'active', 'false'],
    ['Jordan 1 Retro High OG', 'JD-1RH-RED-43', 18000, 8, 'Basketball', 'Jordan', 22000, 12000, 'Original retro colorway.', 'active', 'true'],
    ['Puma RS-X', 'PM-RSX-GRY-40', 7200, 30, 'Lifestyle', 'Puma', '', 4500, 'Chunky retro running shoe.', 'active', 'false'],
    ['New Balance 574', 'NB-574-NVY-42', 8500, 20, 'Lifestyle', 'New Balance', 9500, 5200, 'Timeless silhouette.', 'draft', 'false'],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples])
  ws['!cols'] = headers.map(() => ({ wch: 18 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  XLSX.writeFile(wb, 'product-import-template.xlsx')
}

function downloadOrdersCSV(orders: EcommerceOrder[]) {
  const headers = ['Order #', 'Customer', 'Phone', 'City', 'Total', 'Payment', 'Fulfillment', 'Date']
  const rows = orders.map((o) => [o.order_number, o.customer_name, o.customer_phone, o.customer_city || '', o.total, o.payment_status, o.fulfillment_status, o.created_at])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function ProductImporter({
  products,
  orders,
}: {
  products: EcommerceProduct[]
  orders: EcommerceOrder[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'import' | 'images' | 'orders' | 'invoices' | 'history'>('import')
  const [history, setHistory] = useState<ImportHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('importer-history') ?? '[]') } catch { return [] }
  })

  function addHistory(entry: Omit<ImportHistoryEntry, 'id' | 'date'>) {
    const next = [{ ...entry, id: uid(), date: new Date().toISOString() }, ...history].slice(0, 20)
    setHistory(next)
    try { localStorage.setItem('importer-history', JSON.stringify(next)) } catch {}
  }

  const existingSkus = useMemo(
    () => new Set(products.map((p) => p.sku.trim().toUpperCase())),
    [products]
  )

  const tabs = [
    { id: 'import' as const, label: 'Product Import', icon: FileSpreadsheet, badge: '' },
    { id: 'images' as const, label: 'Bulk Images', icon: ImagePlus, badge: '' },
    { id: 'orders' as const, label: 'Orders & Test', icon: ShoppingBag, badge: orders.filter(o => o.fulfillment_status === 'new').length || '' },
    { id: 'invoices' as const, label: 'Invoices', icon: ReceiptText, badge: '' },
    { id: 'history' as const, label: 'Import History', icon: History, badge: history.length || '' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Master header ── */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Store Tools</p>
                <h1 className="text-xl font-black text-white tracking-tight">Product Importer Studio</h1>
                <p className="text-[11px] text-white/60 mt-0.5">CSV · Excel · Bulk images · PDF invoices · Test data</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { v: products.length, label: 'Products', color: 'bg-white/15' },
                { v: products.filter(p => p.status === 'active').length, label: 'Active', color: 'bg-emerald-400/20 border border-emerald-400/30' },
                { v: orders.length, label: 'Orders', color: 'bg-white/15' },
                { v: formatMoney(orders.reduce((s, o) => s + o.total, 0)), label: 'Revenue', color: 'bg-white/15' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl px-3 py-1.5 ${s.color}`}>
                  <div className="text-[14px] font-black text-white leading-none">{s.v}</div>
                  <div className="text-[9px] font-bold text-white/60 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border-t border-[#f0f1f3] scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.badge ? (
                <span className={`h-4 min-w-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ${
                  activeTab === tab.id ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab panels ── */}
      {activeTab === 'import' && (
        <ImportWizard
          existingSkus={existingSkus}
          existingProducts={products}
          onComplete={(result) => {
            addHistory(result)
            router.refresh()
          }}
        />
      )}
      {activeTab === 'images' && (
        <BulkImageManager products={products} />
      )}
      {activeTab === 'orders' && (
        <OrdersPanel orders={orders} products={products} onRefresh={() => router.refresh()} />
      )}
      {activeTab === 'invoices' && (
        <InvoiceStudio orders={orders} />
      )}
      {activeTab === 'history' && (
        <ImportHistory entries={history} onClear={() => {
          setHistory([])
          localStorage.removeItem('importer-history')
        }} />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  IMPORT WIZARD  (5 steps)                                                  */
/* ══════════════════════════════════════════════════════════════════════════ */

type WizardStep = 'upload' | 'map' | 'review' | 'import' | 'done'

function ImportWizard({
  existingSkus,
  existingProducts,
  onComplete,
}: {
  existingSkus: Set<string>
  existingProducts: EcommerceProduct[]
  onComplete: (result: Omit<ImportHistoryEntry, 'id' | 'date'>) => void
}) {
  const [step, setStep] = useState<WizardStep>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [colMap, setColMap] = useState<ColumnMap>({})
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [filter, setFilter] = useState<'all' | 'valid' | 'error' | 'warning' | 'duplicate'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite'>('skip')
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{ success: number; failed: number; skipped: number }>({ success: 0, failed: 0, skipped: 0 })
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const STEPS: { id: WizardStep; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'map', label: 'Map Columns', icon: Link2 },
    { id: 'review', label: 'Review & Fix', icon: CheckCircle2 },
    { id: 'import', label: 'Import', icon: Zap },
    { id: 'done', label: 'Done', icon: PackageCheck },
  ]
  const stepIdx = STEPS.findIndex((s) => s.id === step)

  async function handleFile(file: File) {
    setFileName(file.name)
    try {
      const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv'
      let parsed: { headers: string[]; rows: Record<string, string>[] }
      if (isCsv) {
        const text = await file.text()
        parsed = parseCSVText(text)
      } else {
        parsed = await parseSpreadsheet(file)
      }
      setHeaders(parsed.headers)
      setRawRows(parsed.rows)
      setColMap(autoDetectMapping(parsed.headers))
      setStep('map')
    } catch (err) {
      alert('Failed to parse file. Make sure it is a valid CSV or Excel file.')
    }
  }

  function handlePaste(text: string) {
    const parsed = parseCSVText(text)
    if (!parsed.rows.length) return
    setFileName('Pasted data')
    setHeaders(parsed.headers)
    setRawRows(parsed.rows)
    setColMap(autoDetectMapping(parsed.headers))
    setStep('map')
  }

  function buildParsedRows() {
    const rows = rawRows.map((raw, i) => {
      const mapped = applyMapping(raw, colMap)
      return validateRow(mapped, i + 2, existingSkus)
    })
    setParsedRows(rows)
    setStep('review')
  }

  const requiredMapped = FIELD_DEFS.filter((f) => f.required).every((f) => colMap[f.key])

  const filteredRows = useMemo(() => {
    let rows = parsedRows
    if (filter !== 'all') rows = rows.filter((r) => r._status === filter)
    if (searchQuery) rows = rows.filter((r) =>
      String(r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    return rows
  }, [parsedRows, filter, searchQuery])

  const stats = useMemo(() => ({
    valid: parsedRows.filter(r => r._status === 'valid').length,
    error: parsedRows.filter(r => r._status === 'error').length,
    warning: parsedRows.filter(r => r._status === 'warning').length,
    duplicate: parsedRows.filter(r => r._status === 'duplicate').length,
  }), [parsedRows])

  async function runImport() {
    setStep('import')
    setImportProgress(0)

    const toImport = parsedRows.filter((r) => {
      if (r._status === 'error') return false
      if (r._isDuplicate && duplicateAction === 'skip') return false
      return true
    })

    // Simulate batch progress
    const batchSize = 10
    let successCount = 0
    let failCount = 0
    const skippedCount = parsedRows.filter(r => r._isDuplicate && duplicateAction === 'skip').length

    for (let i = 0; i < toImport.length; i += batchSize) {
      const batch = toImport.slice(i, i + batchSize)
      const records = batch.map((r) => ({
        name: String(r.name || ''),
        sku: String(r.sku || ''),
        category: String(r.category || 'general'),
        brand: String(r.brand || ''),
        price: parseFloat(String(r.price)) || 0,
        compare_at_price: r.compare_at_price ? parseFloat(String(r.compare_at_price)) : null,
        cost_price: r.cost_price ? parseFloat(String(r.cost_price)) : null,
        stock_quantity: parseInt(String(r.stock_quantity)) || 0,
        description: String(r.description || ''),
        status: (['active', 'draft', 'archived'].includes(String(r.status)) ? String(r.status) : 'active') as 'active' | 'draft' | 'archived',
        is_featured: ['true', '1', 'yes'].includes(String(r.is_featured).toLowerCase()),
      }))

      await new Promise<void>((resolve) => {
        startTransition(async () => {
          const result = await bulkImportEcommerceProducts(records)
          if (result.success) successCount += records.length
          else failCount += records.length
          setImportProgress(Math.round(((i + batch.length) / toImport.length) * 100))
          resolve()
        })
      })

      await new Promise(r => setTimeout(r, 120)) // small delay for UX
    }

    setImportResults({ success: successCount, failed: failCount, skipped: skippedCount })
    onComplete({
      count: toImport.length,
      success: successCount,
      failed: failCount,
      filename: fileName,
    })
    setStep('done')
  }

  function reset() {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRawRows([])
    setColMap({})
    setParsedRows([])
    setFilter('all')
    setSearchQuery('')
    setImportProgress(0)
  }

  return (
    <div className="space-y-4">
      {/* Step progress */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < stepIdx ? 'bg-violet-600 border-violet-600' :
                  i === stepIdx ? 'bg-white border-violet-600 shadow-[0_0_0_3px_rgba(124,58,237,0.15)]' :
                  'bg-white border-[#e8eaed]'
                }`}>
                  {i < stepIdx ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <s.icon className={`h-3.5 w-3.5 ${i === stepIdx ? 'text-violet-600' : 'text-gray-300'}`} />
                  )}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${i === stepIdx ? 'text-violet-700' : i < stepIdx ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${i < stepIdx ? 'bg-violet-600' : 'bg-[#f0f1f3]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Upload ── */}
      {step === 'upload' && <UploadStep onFile={handleFile} onPaste={handlePaste} />}

      {/* ── STEP 2: Column Map ── */}
      {step === 'map' && (
        <ColumnMapStep
          headers={headers}
          rawRows={rawRows}
          colMap={colMap}
          setColMap={setColMap}
          fileName={fileName}
          onBack={() => setStep('upload')}
          onNext={buildParsedRows}
          requiredMapped={requiredMapped}
        />
      )}

      {/* ── STEP 3: Review ── */}
      {step === 'review' && (
        <ReviewStep
          rows={filteredRows}
          allRows={parsedRows}
          stats={stats}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          duplicateAction={duplicateAction}
          setDuplicateAction={setDuplicateAction}
          onUpdateRow={(id, field, value) => {
            setParsedRows(prev => prev.map(r => r._id === id ? validateRow({ ...r, [field]: value } as any, r._rowNum, existingSkus) : r))
          }}
          onDeleteRow={(id) => setParsedRows(prev => prev.filter(r => r._id !== id))}
          onBack={() => setStep('map')}
          onImport={runImport}
          pending={isPending}
        />
      )}

      {/* ── STEP 4: Importing ── */}
      {step === 'import' && (
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-10 shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 mb-5">
            <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-1">Importing products…</h2>
          <p className="text-sm text-gray-500 mb-6">Please wait while we import your catalog.</p>
          <div className="max-w-sm mx-auto">
            <div className="h-2.5 rounded-full bg-[#f0f1f3] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-sm font-black text-violet-700 mt-2">{importProgress}%</p>
          </div>
        </div>
      )}

      {/* ── STEP 5: Done ── */}
      {step === 'done' && (
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-10 shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mb-5">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">Import Complete! 🎉</h2>
          <p className="text-sm text-gray-500 mb-6">Your products are now live in the catalog.</p>
          <div className="flex justify-center gap-4 mb-8">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-6 py-4">
              <div className="text-3xl font-black text-emerald-700">{importResults.success}</div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Imported</div>
            </div>
            {importResults.skipped > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 px-6 py-4">
                <div className="text-3xl font-black text-amber-700">{importResults.skipped}</div>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wide">Skipped</div>
              </div>
            )}
            {importResults.failed > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-100 px-6 py-4">
                <div className="text-3xl font-black text-red-700">{importResults.failed}</div>
                <div className="text-xs font-bold text-red-600 uppercase tracking-wide">Failed</div>
              </div>
            )}
          </div>
          <Button onClick={reset} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <Upload className="h-4 w-4" /> Import Another File
          </Button>
        </div>
      )}
    </div>
  )
}

/* ── Upload Step ── */
function UploadStep({ onFile, onPaste }: { onFile: (f: File) => void; onPaste: (t: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pasteText, setPasteText] = useState('')

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[14px] font-black text-gray-900">Upload Your Product Sheet</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Supports Excel (.xlsx), CSV (.csv), or paste data directly</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 text-xs font-bold">
            <Download className="h-3.5 w-3.5" /> Excel Template
          </Button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) onFile(f)
          }}
          onClick={() => fileRef.current?.click()}
          className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
            dragOver
              ? 'border-violet-500 bg-violet-50 scale-[1.01]'
              : 'border-[#e0e0e8] bg-[#f9fafb] hover:border-violet-400 hover:bg-violet-50/40'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
          />
          <div className={`mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${dragOver ? 'bg-violet-100' : 'bg-white border border-[#e8eaed] group-hover:border-violet-200'}`}>
            <FileSpreadsheet className={`h-7 w-7 transition-colors ${dragOver ? 'text-violet-600' : 'text-gray-400 group-hover:text-violet-500'}`} />
          </div>
          <p className="text-base font-black text-gray-800 mb-1">
            {dragOver ? 'Drop it!' : 'Drag & drop your file here'}
          </p>
          <p className="text-sm text-gray-500">or <span className="text-violet-600 font-bold underline">click to browse</span></p>
          <div className="mt-4 flex justify-center gap-3">
            {['Excel .xlsx', 'CSV .csv', 'Google Sheets'].map((f) => (
              <span key={f} className="px-2.5 py-1 rounded-lg bg-white border border-[#e8eaed] text-[10px] font-bold text-gray-500">{f}</span>
            ))}
          </div>
        </div>

        {/* Paste area */}
        <div className="mt-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-[#f0f1f3]" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">or paste CSV data</span>
            <div className="flex-1 h-px bg-[#f0f1f3]" />
          </div>
          <div className="relative">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`name,sku,price,stock_quantity\nNike Air Max 97,SKU-001,12500,24\nAdidas UB22,SKU-002,9800,15`}
              rows={5}
              className="w-full rounded-xl border border-[#e8eaed] bg-[#f9fafb] px-4 py-3 text-xs font-mono text-gray-700 resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
            {pasteText.trim() && (
              <Button
                size="sm"
                onClick={() => onPaste(pasteText)}
                className="absolute bottom-3 right-3 gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white"
              >
                <ArrowRight className="h-3.5 w-3.5" /> Parse Data
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* What's needed */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h3 className="text-[12px] font-black text-gray-900 mb-3">Supported columns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {FIELD_DEFS.map((f) => (
            <div key={f.key} className="flex items-center gap-2.5 py-1.5">
              <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${f.required ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>
                {f.required ? <span className="text-[9px] font-black">R</span> : <span className="text-[9px]">O</span>}
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-800">{f.label}</span>
                <span className="text-[10px] text-gray-400 ml-1.5">— {f.hint}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-gray-400"><span className="font-bold text-violet-600">R</span> = Required &nbsp; <span className="font-bold text-gray-500">O</span> = Optional</p>
      </div>
    </div>
  )
}

/* ── Column Map Step ── */
function ColumnMapStep({
  headers, rawRows, colMap, setColMap, fileName,
  onBack, onNext, requiredMapped,
}: {
  headers: string[]
  rawRows: Record<string, string>[]
  colMap: ColumnMap
  setColMap: (m: ColumnMap) => void
  fileName: string
  onBack: () => void
  onNext: () => void
  requiredMapped: boolean
}) {
  const preview = rawRows.slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f1f3] flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-black text-gray-900">Map Your Columns</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              <span className="text-violet-600 font-bold">{headers.length} columns</span> detected in <span className="font-bold">{fileName}</span> · {rawRows.length} rows
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-1 text-xs"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
            <Button size="sm" disabled={!requiredMapped} onClick={onNext} className="gap-1 text-xs bg-violet-600 hover:bg-violet-700 text-white">
              Validate {rawRows.length} Rows <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-5">
          {!requiredMapped && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span><strong>Map all required fields</strong> (Name, SKU, Price, Stock) before continuing.</span>
            </div>
          )}

          <div className="grid gap-3">
            {FIELD_DEFS.map((field) => {
              const mapped = colMap[field.key]
              const autoDetected = mapped && rawRows.length > 0
              return (
                <div key={field.key} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                  mapped ? 'border-violet-200 bg-violet-50/40' : field.required ? 'border-red-200 bg-red-50/40' : 'border-[#f0f1f3] bg-[#f9fafb]'
                }`}>
                  {/* Field label */}
                  <div className="w-44 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-black text-gray-900">{field.label}</span>
                      {field.required && <span className="text-[9px] font-black text-red-500">*REQ</span>}
                    </div>
                    <span className="text-[10px] text-gray-400">{field.hint}</span>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />

                  {/* Column selector */}
                  <select
                    value={mapped || ''}
                    onChange={(e) => setColMap({ ...colMap, [field.key]: e.target.value || undefined })}
                    className={`flex-1 h-9 rounded-lg border px-3 text-sm font-semibold transition-all ${
                      mapped ? 'border-violet-300 bg-white text-violet-900' : 'border-[#e8eaed] text-gray-400 bg-white'
                    }`}
                  >
                    <option value="">— Not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>

                  {/* Preview value */}
                  {mapped && preview[0]?.[mapped] && (
                    <div className="w-36 shrink-0 rounded-lg bg-white border border-[#e8eaed] px-2.5 py-1.5 text-[11px] text-gray-600 font-mono truncate">
                      {preview[0][mapped]}
                    </div>
                  )}

                  {/* Auto-detected badge */}
                  {autoDetected && (
                    <span className="shrink-0 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">AUTO</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Data preview */}
      {rawRows.length > 0 && (
        <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f0f1f3]">
            <p className="text-[12px] font-black text-gray-900">Raw data preview (first 3 rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#f9fafb] border-b border-[#f0f1f3]">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className={`px-4 py-2.5 text-left font-bold whitespace-nowrap ${
                      Object.values(colMap).includes(h) ? 'text-violet-700 bg-violet-50' : 'text-gray-500'
                    }`}>
                      {h}
                      {Object.values(colMap).includes(h) && <span className="ml-1 text-[8px] text-violet-400">✓</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-[#fafafa]">
                    {headers.map((h) => (
                      <td key={h} className={`px-4 py-2 font-mono whitespace-nowrap ${Object.values(colMap).includes(h) ? 'text-violet-900 font-semibold' : 'text-gray-400'}`}>
                        {row[h] || <span className="text-gray-200">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Review Step ── */
function ReviewStep({
  rows, allRows, stats, filter, setFilter, searchQuery, setSearchQuery,
  duplicateAction, setDuplicateAction,
  onUpdateRow, onDeleteRow, onBack, onImport, pending,
}: {
  rows: ParsedRow[]
  allRows: ParsedRow[]
  stats: { valid: number; error: number; warning: number; duplicate: number }
  filter: string
  setFilter: (f: any) => void
  searchQuery: string
  setSearchQuery: (s: string) => void
  duplicateAction: 'skip' | 'overwrite'
  setDuplicateAction: (a: 'skip' | 'overwrite') => void
  onUpdateRow: (id: string, field: string, value: string) => void
  onDeleteRow: (id: string) => void
  onBack: () => void
  onImport: () => void
  pending: boolean
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const importableCount = allRows.filter(r => {
    if (r._status === 'error') return false
    if (r._isDuplicate && duplicateAction === 'skip') return false
    return true
  }).length

  const statusConfig = {
    valid: { label: 'Valid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
    warning: { label: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    error: { label: 'Error', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    duplicate: { label: 'Duplicate', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
  }

  return (
    <div className="space-y-4">
      {/* Summary + actions */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[14px] font-black text-gray-900">Review & Fix — {allRows.length} rows</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Fix errors before importing. Warnings are safe to import.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-1 text-xs"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
            <Button
              size="sm"
              disabled={pending || importableCount === 0}
              onClick={onImport}
              className="gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white min-w-[140px]"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Import {importableCount} Products
            </Button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ['all', `All (${allRows.length})`, 'border-[#e8eaed] text-gray-700', 'bg-gray-100 text-gray-600'],
            ['valid', `✓ Valid (${stats.valid})`, 'border-emerald-200 text-emerald-700 bg-emerald-50', ''],
            ['warning', `⚠ Warning (${stats.warning})`, 'border-amber-200 text-amber-700 bg-amber-50', ''],
            ['error', `✗ Error (${stats.error})`, 'border-red-200 text-red-700 bg-red-50', ''],
            ['duplicate', `⊙ Duplicate (${stats.duplicate})`, 'border-blue-200 text-blue-700 bg-blue-50', ''],
          ] as [string, string, string, string][]).map(([id, label, activeStyle, _]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                filter === id ? activeStyle + ' shadow-sm' : 'border-[#e8eaed] text-gray-500 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Duplicate action */}
        {stats.duplicate > 0 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 flex items-center gap-4">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-[11px] font-semibold text-blue-800">{stats.duplicate} duplicate SKU(s) found.</span>
            <div className="flex gap-2 ml-auto">
              {(['skip', 'overwrite'] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => setDuplicateAction(action)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    duplicateAction === action ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  {action === 'skip' ? '⏭ Skip duplicates' : '✏ Overwrite'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row table */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#f0f1f3] flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or SKU…"
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-[#e8eaed] text-xs focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            />
          </div>
          <span className="text-[11px] text-gray-400 font-semibold">{rows.length} shown</span>
        </div>

        <div className="divide-y divide-[#f8f8f8] max-h-[500px] overflow-y-auto">
          {rows.map((row) => {
            const cfg = statusConfig[row._status]
            const expanded = expandedId === row._id
            return (
              <div key={row._id}>
                <div className={`flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] transition ${row._status === 'error' ? 'bg-red-50/30' : ''}`}>
                  {/* Row number */}
                  <span className="text-[10px] font-mono text-gray-300 w-7 shrink-0">#{row._rowNum}</span>

                  {/* Status dot */}
                  <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />

                  {/* Name + SKU */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {expandedId === row._id ? (
                      <input
                        defaultValue={String(row.name || '')}
                        onBlur={(e) => onUpdateRow(row._id, 'name', e.target.value)}
                        className="flex-1 h-7 rounded border border-violet-300 px-2 text-sm font-bold text-gray-900 min-w-0 bg-white"
                        autoFocus
                      />
                    ) : (
                      <span className="font-bold text-[13px] text-gray-900 truncate">{row.name ? String(row.name) : <span className="text-red-400 italic">No name</span>}</span>
                    )}
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">{String(row.sku || '—')}</span>
                    <span className="text-[12px] font-black text-gray-700 shrink-0">{row.price ? `${row.price} DZD` : '—'}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">Qty: {String(row.stock_quantity || 0)}</span>
                  </div>

                  {/* Status badge */}
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.color}`}>{cfg.label}</span>

                  {/* Errors/warnings summary */}
                  {(row._errors.length > 0 || row._warnings.length > 0) && (
                    <div className="flex flex-col gap-0.5 shrink-0 max-w-[200px]">
                      {row._errors.slice(0, 1).map((e, i) => (
                        <span key={i} className="text-[10px] text-red-600 font-semibold truncate">{e}</span>
                      ))}
                      {row._warnings.slice(0, 1).map((w, i) => (
                        <span key={i} className="text-[10px] text-amber-600 font-semibold truncate">{w}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(expanded ? null : row._id)}
                      className="text-[10px] font-bold text-violet-600 hover:text-violet-800 px-2 py-1 rounded-lg hover:bg-violet-50 transition"
                    >
                      {expanded ? 'Close' : 'Edit'}
                    </button>
                    <button
                      onClick={() => onDeleteRow(row._id)}
                      className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded inline editor */}
                {expanded && (
                  <div className="px-5 pb-4 bg-violet-50/50 border-t border-violet-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
                    {(['name', 'sku', 'price', 'stock_quantity', 'category', 'brand', 'compare_at_price', 'status'] as FieldKey[]).map((field) => (
                      <div key={field}>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                          {FIELD_DEFS.find(f => f.key === field)?.label || field}
                        </label>
                        <input
                          defaultValue={String(row[field] || '')}
                          onBlur={(e) => onUpdateRow(row._id, field, e.target.value)}
                          className="w-full h-7 rounded-lg border border-[#e8eaed] px-2 text-xs bg-white focus:border-violet-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {rows.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm font-semibold">No rows match this filter</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  BULK IMAGE MANAGER                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */

function BulkImageManager({ products }: { products: EcommerceProduct[] }) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploadingAll, setUploadingAll] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function extractSkuFromName(filename: string) {
    // Try to match a SKU from filename, e.g. "NK-001-white.jpg" → "NK-001"
    const noExt = filename.replace(/\.[^.]+$/, '')
    const product = products.find((p) => noExt.toLowerCase().includes(p.sku.toLowerCase()))
    return product?.sku || null
  }

  async function uploadImage(img: UploadedImage) {
    setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, uploading: true } : i))
    const fd = new FormData()
    fd.set('file', img.file)
    startTransition(async () => {
      try {
        const result: any = await uploadEcommerceImage(fd)
        setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, url: result?.url || '', uploading: false, error: result?.url ? undefined : 'Upload failed' } : i))
      } catch {
        setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, uploading: false, error: 'Upload failed' } : i))
      }
    })
  }

  function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith('image/')).map((f) => ({
      id: uid(),
      file: f,
      preview: URL.createObjectURL(f),
      url: '',
      uploading: false,
      assignedSku: extractSkuFromName(f.name) || undefined,
    }))
    setImages((prev) => [...prev, ...imgs])
  }

  async function uploadAll() {
    setUploadingAll(true)
    const pending = images.filter((i) => !i.url && !i.uploading)
    for (const img of pending) await uploadImage(img)
    setUploadingAll(false)
  }

  const uploaded = images.filter((i) => i.url)
  const notUploaded = images.filter((i) => !i.url && !i.uploading)

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-black text-gray-900">Bulk Image Upload</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Upload multiple photos at once. Name files with SKU for auto-matching.</p>
          </div>
          <div className="flex gap-2">
            {notUploaded.length > 0 && (
              <Button size="sm" onClick={uploadAll} disabled={uploadingAll} className="gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white">
                {uploadingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload All ({notUploaded.length})
              </Button>
            )}
            {uploaded.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => {
                const text = uploaded.map((i) => `${i.assignedSku || i.file.name}\t${i.url}`).join('\n')
                navigator.clipboard.writeText(text)
              }} className="gap-1.5 text-xs">
                <ClipboardList className="h-3.5 w-3.5" /> Copy All URLs
              </Button>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)) }}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${dragOver ? 'border-violet-500 bg-violet-50 scale-[1.01]' : 'border-[#e0e0e8] bg-[#f9fafb] hover:border-violet-400 hover:bg-violet-50/40'}`}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(Array.from(e.target.files || []))} />
          <ImagePlus className={`mx-auto h-10 w-10 mb-3 transition-colors ${dragOver ? 'text-violet-500' : 'text-gray-300'}`} />
          <p className="text-sm font-black text-gray-700">Drop photos here</p>
          <p className="text-xs text-gray-400 mt-1">Tip: name files like <code className="bg-gray-100 px-1 rounded">NK-001-front.jpg</code> to auto-match SKUs</p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[13px] font-black text-gray-900">{images.length} files</h2>
              <p className="text-[11px] text-gray-400">{uploaded.length} uploaded · {notUploaded.length} pending</p>
            </div>
            <button onClick={() => setImages([])} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition">Clear all</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((img) => (
              <div key={img.id} className="group relative">
                <div className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${img.url ? 'border-emerald-300' : img.error ? 'border-red-300' : 'border-[#e8eaed]'}`}>
                  <img src={img.preview} alt={img.file.name} className="h-full w-full object-cover" />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  {img.url && (
                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  {img.url && (
                    <button
                      onClick={() => navigator.clipboard.writeText(img.url)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-xl transition text-white text-[10px] font-bold gap-1"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />Copy
                    </button>
                  )}
                  {!img.url && !img.uploading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); uploadImage(img) }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition text-white text-[10px] font-bold gap-1"
                    >
                      <Upload className="h-3.5 w-3.5" />Upload
                    </button>
                  )}
                </div>
                {/* SKU match badge */}
                {img.assignedSku && (
                  <div className="mt-1 text-[9px] font-bold text-violet-700 bg-violet-50 rounded-md px-1.5 py-0.5 truncate">{img.assignedSku}</div>
                )}
                <p className="text-[9px] text-gray-400 truncate mt-0.5">{img.file.name}</p>
                <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center shadow transition">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* URL list */}
          {uploaded.length > 0 && (
            <div className="mt-5 rounded-xl border border-[#e8eaed] bg-[#f9fafb] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Uploaded URLs</p>
                <button onClick={() => { const t = uploaded.map(i => i.url).join('\n'); navigator.clipboard.writeText(t) }} className="text-[10px] font-bold text-violet-600 hover:underline">Copy all</button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {uploaded.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 group">
                    <img src={img.preview} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                    {img.assignedSku && <span className="text-[10px] font-bold text-violet-700 shrink-0 w-20 truncate">{img.assignedSku}</span>}
                    <button
                      onClick={() => navigator.clipboard.writeText(img.url)}
                      className="flex-1 min-w-0 text-left text-[11px] font-mono text-blue-600 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1 transition truncate"
                    >
                      {img.url}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  ORDERS PANEL                                                              */
/* ══════════════════════════════════════════════════════════════════════════ */

function OrdersPanel({ orders, products, onRefresh }: { orders: EcommerceOrder[]; products: EcommerceProduct[]; onRefresh: () => void }) {
  const [seedCount, setSeedCount] = useState(5)
  const [isPending, startTransition] = useTransition()
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const testOrders = orders.filter(o => o.source === 'test_import')
  const realOrders = orders.filter(o => o.source !== 'test_import')

  const filtered = useMemo(() => orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.fulfillment_status === statusFilter
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.order_number.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  }), [orders, statusFilter, search])

  function run(task: () => Promise<any>, msg: string) {
    setNotice(null)
    startTransition(async () => {
      const r = await task()
      setNotice(r?.success ? msg : `Error: ${r?.error}`)
      if (r?.success) onRefresh()
    })
  }

  const pipelineStats = {
    new: orders.filter(o => o.fulfillment_status === 'new').length,
    confirmed: orders.filter(o => o.fulfillment_status === 'confirmed').length,
    packed: orders.filter(o => o.fulfillment_status === 'packed').length,
    shipped: orders.filter(o => o.fulfillment_status === 'shipped').length,
    delivered: orders.filter(o => o.fulfillment_status === 'delivered').length,
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold flex items-center gap-2 ${notice.startsWith('Error') ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {notice.startsWith('Error') ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {notice}
        </div>
      )}

      {/* Pipeline stats */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(pipelineStats).map(([status, count]) => {
          const colors: Record<string, string> = {
            new: 'bg-blue-50 border-blue-100 text-blue-700',
            confirmed: 'bg-violet-50 border-violet-100 text-violet-700',
            packed: 'bg-amber-50 border-amber-100 text-amber-700',
            shipped: 'bg-indigo-50 border-indigo-100 text-indigo-700',
            delivered: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          }
          return (
            <div key={status} className={`rounded-2xl border p-4 text-center cursor-pointer transition-all hover:shadow-sm ${colors[status]} ${statusFilter === status ? 'ring-2 ring-current/30' : ''}`} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}>
              <div className="text-2xl font-black">{count}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5 capitalize">{status}</div>
            </div>
          )
        })}
      </div>

      {/* Seed & cleanup */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center"><Zap className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-[12px] font-black text-gray-900">Test Order Seeder</p>
              <p className="text-[10px] text-gray-500">Realistic Algerian customer orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <input type="range" min={1} max={20} value={seedCount} onChange={e => setSeedCount(Number(e.target.value))} className="flex-1 accent-blue-600" />
            <span className="text-xl font-black text-gray-900 w-8">{seedCount}</span>
          </div>
          <div className="flex gap-1.5 mb-3">
            {[1, 3, 5, 10, 20].map(n => (
              <button key={n} onClick={() => setSeedCount(n)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition ${seedCount === n ? 'bg-blue-600 text-white border-blue-600' : 'border-[#e8eaed] text-gray-600 hover:border-blue-300'}`}>{n}</button>
            ))}
          </div>
          <Button disabled={isPending} onClick={() => run(() => seedTestOrders(seedCount), `✅ ${seedCount} test orders created`)} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs" size="sm">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Seed {seedCount} Orders
          </Button>
        </div>
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 className="h-4 w-4 text-red-500" /></div>
            <div>
              <p className="text-[12px] font-black text-gray-900">Cleanup Test Data</p>
              <p className="text-[10px] text-gray-500">{testOrders.length} test · {realOrders.length} real orders</p>
            </div>
          </div>
          <div className="rounded-xl bg-[#f9fafb] border border-[#f0f1f3] p-3 mb-3 text-[11px] text-gray-600">
            <p>Total revenue (real): <strong className="text-gray-900">{formatMoney(realOrders.reduce((s, o) => s + o.total, 0))}</strong></p>
            <p className="mt-1">Test orders are tagged <code className="bg-gray-200 px-1 rounded text-[10px]">source=test_import</code> and never affect real data.</p>
          </div>
          <Button disabled={isPending || testOrders.length === 0} variant="outline" onClick={() => run(() => deleteTestOrders(), '🗑 Test orders removed')} className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 text-xs" size="sm">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete {testOrders.length} Test Orders
          </Button>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 border-b border-[#f0f1f3]">
          <div className="flex-1">
            <h2 className="text-[13px] font-black text-gray-900">All Orders ({orders.length})</h2>
            <p className="text-[11px] text-gray-500">{realOrders.length} real · {testOrders.length} test</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or order #" className="w-full h-8 pl-9 pr-3 rounded-lg border border-[#e8eaed] text-xs focus:outline-none focus:border-violet-400" />
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadOrdersCSV(orders)} className="gap-1.5 text-xs shrink-0">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="bg-[#f9fafb] border-b border-[#f0f1f3] sticky top-0">
              <tr>
                {['Order #', 'Customer', 'City', 'Total', 'Payment', 'Fulfillment', 'Source', 'Date'].map(h => (
                  <th key={h} className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f8f8]">
              {filtered.slice(0, 50).map(o => (
                <tr key={o.id} className={`hover:bg-[#fafafa] transition ${o.source === 'test_import' ? 'opacity-55' : ''}`}>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-600 font-bold">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{o.customer_name}</div>
                    <div className="text-[10px] text-gray-400">{o.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.customer_city || '—'}</td>
                  <td className="px-4 py-3 font-black text-gray-900">{formatMoney(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : o.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{o.payment_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${o.fulfillment_status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : o.fulfillment_status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{o.fulfillment_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold ${o.source === 'test_import' ? 'text-orange-400' : 'text-gray-400'}`}>{o.source === 'test_import' ? '🧪 test' : '🛒 live'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('fr-DZ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="py-12 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-gray-200 mb-2" /><p className="text-sm text-gray-400 font-bold">No orders found</p></div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  INVOICE STUDIO (jsPDF-powered)                                            */
/* ══════════════════════════════════════════════════════════════════════════ */

function InvoiceStudio({ orders }: { orders: EcommerceOrder[] }) {
  const [selected, setSelected] = useState<EcommerceOrder | null>(null)
  const [search, setSearch] = useState('')
  const [storeName, setStoreName] = useState('Sole District')
  const [storeAddress, setStoreAddress] = useState('Alger, Algérie')
  const [storePhone, setStorePhone] = useState('+213 5XX XX XX XX')
  const [primaryColor, setPrimaryColor] = useState('#6d28d9')
  const [generating, setGenerating] = useState(false)

  const filtered = useMemo(() =>
    orders.filter(o =>
      !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase())
    ), [orders, search])

  async function generatePDF(order: EcommerceOrder, action: 'print' | 'download') {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const items = Array.isArray(order.items) ? order.items as any[] : []
      const W = 210, margin = 18

      // Header background
      doc.setFillColor(primaryColor)
      doc.rect(0, 0, W, 42, 'F')

      // Store name
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(storeName, margin, 18)

      // INVOICE label
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 255, 255, 0.7)
      doc.text(storeAddress + (storePhone ? '  ·  ' + storePhone : ''), margin, 25)

      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('INVOICE', W - margin, 18, { align: 'right' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(order.order_number, W - margin, 26, { align: 'right' })
      doc.text(new Date(order.created_at).toLocaleDateString('fr-DZ', { year: 'numeric', month: 'long', day: 'numeric' }), W - margin, 32, { align: 'right' })

      // Billed To & Order Info boxes
      const infoY = 52
      doc.setFillColor(248, 248, 252)
      doc.roundedRect(margin, infoY, 82, 38, 3, 3, 'F')
      doc.roundedRect(margin + 88, infoY, 82, 38, 3, 3, 'F')

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(primaryColor)
      doc.text('BILLED TO', margin + 5, infoY + 8)
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(order.customer_name, margin + 5, infoY + 16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(order.customer_phone, margin + 5, infoY + 22)
      if (order.customer_city) doc.text(order.customer_city, margin + 5, infoY + 28)
      if (order.customer_address) doc.text(order.customer_address.slice(0, 40), margin + 5, infoY + 34)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(primaryColor)
      doc.text('ORDER DETAILS', margin + 93, infoY + 8)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Payment: ${(order.payment_method || 'COD').toUpperCase()}`, margin + 93, infoY + 16)
      doc.text(`Status: ${order.fulfillment_status}`, margin + 93, infoY + 22)
      doc.text(`Payment status: ${order.payment_status}`, margin + 93, infoY + 28)
      if (order.promotion_code) doc.text(`Promo: ${order.promotion_code}`, margin + 93, infoY + 34)

      // Items table
      autoTable(doc, {
        startY: infoY + 46,
        head: [['#', 'Product', 'Qty', 'Unit Price', 'Total']],
        body: items.map((item, i) => [
          i + 1,
          item.name || 'Product',
          item.quantity || 1,
          `${new Intl.NumberFormat('fr-DZ').format(item.price || 0)} DZD`,
          `${new Intl.NumberFormat('fr-DZ').format((item.price || 0) * (item.quantity || 1))} DZD`,
        ]),
        styles: { fontSize: 9, cellPadding: 4, lineColor: [240, 240, 245], lineWidth: 0.1 },
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 252] },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'center', cellWidth: 15 }, 3: { halign: 'right', cellWidth: 35 }, 4: { halign: 'right', cellWidth: 35 } },
        margin: { left: margin, right: margin },
      })

      // Totals
      const tableBottom = (doc as any).lastAutoTable.finalY + 6
      const totals = [
        ['Subtotal', `${new Intl.NumberFormat('fr-DZ').format(order.subtotal)} DZD`],
        ['Shipping', `${new Intl.NumberFormat('fr-DZ').format(order.shipping_fee)} DZD`],
        ...(order.discount_amount ? [['Discount', `-${new Intl.NumberFormat('fr-DZ').format(order.discount_amount)} DZD`]] : []),
      ]
      const totalsX = W - margin - 70
      let ty = tableBottom

      for (const [label, val] of totals) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text(label, totalsX, ty)
        doc.text(val, W - margin, ty, { align: 'right' })
        ty += 6
      }

      // Grand total
      doc.setFillColor(primaryColor)
      doc.roundedRect(totalsX - 4, ty, W - margin - totalsX + 4, 10, 2, 2, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('TOTAL', totalsX, ty + 7)
      doc.text(`${new Intl.NumberFormat('fr-DZ').format(order.total)} DZD`, W - margin, ty + 7, { align: 'right' })

      // Footer
      const footerY = 280
      doc.setDrawColor(230, 230, 240)
      doc.setLineWidth(0.4)
      doc.line(margin, footerY, W - margin, footerY)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(160, 160, 180)
      doc.text(`Thank you for your order at ${storeName}`, W / 2, footerY + 6, { align: 'center' })
      doc.text(`Generated ${new Date().toLocaleDateString('fr-DZ')}`, W / 2, footerY + 11, { align: 'center' })

      if (action === 'download') {
        doc.save(`invoice-${order.order_number}.pdf`)
      } else {
        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank')
        if (win) setTimeout(() => { win.print() }, 600)
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h2 className="text-[14px] font-black text-gray-900 mb-4">Invoice Settings</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Store Name</label>
            <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full h-9 rounded-lg border border-[#e8eaed] px-3 text-sm font-semibold" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Address</label>
            <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="w-full h-9 rounded-lg border border-[#e8eaed] px-3 text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Phone</label>
            <input value={storePhone} onChange={e => setStorePhone(e.target.value)} className="w-full h-9 rounded-lg border border-[#e8eaed] px-3 text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Brand Color</label>
            <div className="flex items-center gap-2 h-9 rounded-lg border border-[#e8eaed] px-3">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-5 w-5 rounded cursor-pointer border-none outline-none" />
              <span className="text-sm font-mono text-gray-600">{primaryColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0f1f3]">
          <div className="flex-1">
            <h2 className="text-[13px] font-black text-gray-900">Generate PDF Invoices</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Professional invoices with your brand color. Download or print.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…" className="w-full h-8 pl-9 pr-3 rounded-lg border border-[#e8eaed] text-xs" />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-bold text-gray-400">No orders yet. Seed test orders first.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f8f8f8] max-h-[600px] overflow-y-auto">
            {filtered.slice(0, 50).map(o => (
              <div key={o.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafafa] transition cursor-pointer ${selected?.id === o.id ? 'bg-violet-50/70 border-l-2 border-violet-500' : ''}`} onClick={() => setSelected(o)}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${primaryColor}18` }}>
                  <ReceiptText className="h-4 w-4" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-black text-gray-900">{o.order_number}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{o.payment_status}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{o.customer_name} · {o.customer_city || 'No city'}</div>
                </div>
                <div className="text-[14px] font-black text-gray-900 shrink-0">{formatMoney(o.total)}</div>
                <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="outline" disabled={generating} onClick={() => generatePDF(o, 'print')} className="text-xs h-8 px-2.5 gap-1">
                    <Printer className="h-3 w-3" /> Print
                  </Button>
                  <Button size="sm" disabled={generating} onClick={() => generatePDF(o, 'download')} className="text-xs h-8 px-2.5 gap-1" style={{ background: primaryColor }}>
                    {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice preview panel */}
      {selected && (
        <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f1f3]">
            <div>
              <h2 className="text-[13px] font-black text-gray-900">Invoice Preview — {selected.order_number}</h2>
              <p className="text-[11px] text-gray-500">{selected.customer_name} · {formatMoney(selected.total)}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={generating} onClick={() => generatePDF(selected, 'print')} className="gap-1.5 text-xs">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button size="sm" disabled={generating} onClick={() => generatePDF(selected, 'download')} className="gap-1.5 text-xs text-white" style={{ background: primaryColor }}>
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download PDF
              </Button>
            </div>
          </div>
          {/* Preview as styled HTML (PDF preview not possible in browser without canvas) */}
          <div className="p-5">
            <div className="rounded-2xl overflow-hidden border border-[#e8eaed] shadow-inner" style={{ minHeight: 480 }}>
              <div style={{ background: primaryColor, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'system-ui' }}>{storeName}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{storeAddress}{storePhone ? ` · ${storePhone}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'system-ui' }}>INVOICE</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{selected.order_number}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{new Date(selected.created_at).toLocaleDateString('fr-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
              <div style={{ padding: '24px 32px', background: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  <div style={{ background: '#f8f8fc', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: primaryColor, marginBottom: 8 }}>Billed To</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{selected.customer_name}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{selected.customer_phone}</div>
                    {selected.customer_city && <div style={{ fontSize: 12, color: '#666' }}>{selected.customer_city}</div>}
                  </div>
                  <div style={{ background: '#f8f8fc', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: primaryColor, marginBottom: 8 }}>Order Info</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Method: <strong style={{ color: '#111' }}>{(selected.payment_method || 'COD').toUpperCase()}</strong></div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Status: <strong style={{ color: '#111' }}>{selected.fulfillment_status}</strong></div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Payment: <strong style={{ color: '#111' }}>{selected.payment_status}</strong></div>
                  </div>
                </div>
                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                  <thead>
                    <tr style={{ background: primaryColor }}>
                      {['Product', 'Qty', 'Price', 'Total'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 11, textAlign: h === 'Product' ? 'left' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(selected.items) ? selected.items as any[] : []).map((item: any, i: number) => (
                      <tr key={i} style={{ background: i % 2 ? '#f8f8fc' : '#fff' }}>
                        <td style={{ padding: '8px 12px', fontSize: 12 }}>{item.name}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right' }}>{formatMoney(item.price)}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right', fontWeight: 700 }}>{formatMoney(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 40, fontSize: 12, color: '#666' }}><span>Subtotal</span><span>{formatMoney(selected.subtotal)}</span></div>
                  <div style={{ display: 'flex', gap: 40, fontSize: 12, color: '#666' }}><span>Shipping</span><span>{formatMoney(selected.shipping_fee)}</span></div>
                  {selected.discount_amount > 0 && <div style={{ display: 'flex', gap: 40, fontSize: 12, color: '#666' }}><span>Discount</span><span>-{formatMoney(selected.discount_amount)}</span></div>}
                  <div style={{ display: 'flex', gap: 40, background: primaryColor, color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 900, fontSize: 16, marginTop: 4 }}>
                    <span>TOTAL</span><span>{formatMoney(selected.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  IMPORT HISTORY                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */

function ImportHistory({ entries, onClear }: { entries: ImportHistoryEntry[]; onClear: () => void }) {
  return (
    <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f1f3]">
        <div>
          <h2 className="text-[13px] font-black text-gray-900">Import History</h2>
          <p className="text-[11px] text-gray-500">{entries.length} import{entries.length !== 1 ? 's' : ''} logged</p>
        </div>
        {entries.length > 0 && (
          <button onClick={onClear} className="text-xs font-bold text-gray-400 hover:text-red-500 transition">Clear history</button>
        )}
      </div>
      {entries.length === 0 ? (
        <div className="py-16 text-center">
          <History className="mx-auto h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-bold text-gray-400">No import history yet</p>
          <p className="text-xs text-gray-300 mt-1">History is tracked locally in your browser</p>
        </div>
      ) : (
        <div className="divide-y divide-[#f8f8f8]">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition">
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-black text-gray-900 truncate">{e.filename}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(e.date).toLocaleString('fr-DZ')}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <div className="text-[16px] font-black text-emerald-600">{e.success}</div>
                  <div className="text-[9px] font-bold text-emerald-500 uppercase">imported</div>
                </div>
                {e.failed > 0 && (
                  <div className="text-center">
                    <div className="text-[16px] font-black text-red-500">{e.failed}</div>
                    <div className="text-[9px] font-bold text-red-400 uppercase">failed</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-[16px] font-black text-gray-700">{e.count}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase">total</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
