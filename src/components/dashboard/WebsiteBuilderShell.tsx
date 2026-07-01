'use client'
// src/components/dashboard/WebsiteBuilderShell.tsx
// The main WordPress-style visual website builder — unified for all business types

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Send, Undo2, Redo2, Eye, EyeOff, Laptop, Tablet, Smartphone,
  Plus, Trash2, ArrowUp, ArrowDown, Copy, ChevronRight, ChevronLeft,
  Palette, Layout, Settings, Globe, RefreshCw, Check, AlertCircle,
  GripVertical, X, Info, Layers, Type, Image as ImageIcon, Link,
  Star, Car, Key, Calculator, Navigation, BarChart, Grid, Phone,
  MessageSquare, Mail, MapPin, ShoppingCart, Ship, FileText, Briefcase,
  AlignJustify, GitBranch, Award, Clock
} from 'lucide-react'
import { saveBuilderDraft, publishBuilderConfig, getBuilderConfig, getRevisionData } from '@/app/actions/builder'
import ShowroomPublicSite from '@/components/website/ShowroomPublicSite'
import {
  PERFECT_SHOWROOM_TEMPLATE,
  SHOWROOM_SECTION_LIBRARY,
  getDefaultSectionContent,
  type ShowroomBuilderConfig,
  type ShowroomSection,
  type ShowroomSectionType,
  type ShowroomGlobalConfig
} from '@/lib/car-showroom-builder-template'
import { getTenantUrl } from '@/lib/tenant-url'

// ─── ICON MAP ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  Car, Key, Calculator, Navigation, BarChart, Grid, Phone, MessageSquare,
  Mail, MapPin, ShoppingCart, Ship, FileText, Briefcase, AlignJustify,
  GitBranch, Award, Clock, Star, Layers, Layout, Palette
}
const DynIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = ICON_MAP[name] || Car
  return <Icon className={className} />
}

// ─── DEVICE WIDTHS ────────────────────────────────────────────────────────────
const DEVICE_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px'
}

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface WebsiteBuilderShellProps {
  agency: any
  initialConfig: any
  initialRevisions: any[]
  salesCars?: any[]
  rentalCars?: any[]
}

// ─── SECTION CATEGORY GROUPS ─────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  layout: '📐 Structure',
  content: '📝 Contenu',
  dynamic: '🔗 Données DB',
  interactive: '⚡ Interactif'
}

export default function WebsiteBuilderShell({
  agency,
  initialConfig,
  initialRevisions,
  salesCars = [],
  rentalCars = []
}: WebsiteBuilderShellProps) {

  const router = useRouter()

  // ── CONFIG STATE ─────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<ShowroomBuilderConfig>(() => {
    // Load from saved DB config if it looks like our new format
    if (
      initialConfig?.builder_data?.global?.primaryColor &&
      Array.isArray(initialConfig?.builder_data?.sections) &&
      initialConfig.builder_data.sections.length > 0
    ) {
      const saved = initialConfig.builder_data as ShowroomBuilderConfig
      // Merge agency data into global
      if (agency) {
        saved.global.companyName = agency.company_name || saved.global.companyName
        saved.global.phone = agency.phone || saved.global.phone
        saved.global.address = agency.address || saved.global.address
        saved.global.logoUrl = agency.website_settings?.logo_url || saved.global.logoUrl
      }
      return saved
    }
    // Start from perfect template, merged with agency data
    const tpl = JSON.parse(JSON.stringify(PERFECT_SHOWROOM_TEMPLATE)) as ShowroomBuilderConfig
    if (agency) {
      tpl.global.companyName = agency.company_name || tpl.global.companyName
      tpl.global.phone = agency.phone || tpl.global.phone
      tpl.global.whatsapp = agency.phone || tpl.global.whatsapp
      tpl.global.address = agency.address || tpl.global.address
      tpl.global.logoUrl = agency.website_settings?.logo_url || tpl.global.logoUrl
      tpl.global.seoTitle = `${agency.company_name || 'Auto Premium'} | Importation & Showroom`
    }
    return tpl
  })

  // ── UI STATE ─────────────────────────────────────────────────────────────────
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [sidebarTab, setSidebarTab] = useState<'sections' | 'styles' | 'content' | 'templates'>('sections')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [sectionEditorOpen, setSectionEditorOpen] = useState(false)
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null)
  const [revisions, setRevisions] = useState(initialRevisions || [])

  // ── HISTORY (Undo/Redo) ───────────────────────────────────────────────────
  const [past, setPast] = useState<ShowroomBuilderConfig[]>([])
  const [future, setFuture] = useState<ShowroomBuilderConfig[]>([])

  // ── SAVE STATE ────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const lastSaved = useRef(JSON.stringify(config))

  // ── SELECTED SECTION ──────────────────────────────────────────────────────
  const selectedSection = config.sections.find(s => s.id === selectedSectionId) || null

  // ── UPDATE CONFIG (with history) ──────────────────────────────────────────
  const updateConfig = useCallback((newConfig: ShowroomBuilderConfig) => {
    setPast(prev => [...prev.slice(-49), config])
    setFuture([])
    setConfig(newConfig)
  }, [config])

  const undo = () => {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setPast(p => p.slice(0, -1))
    setFuture(f => [...f, config])
    setConfig(prev)
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[future.length - 1]
    setFuture(f => f.slice(0, -1))
    setPast(p => [...p, config])
    setConfig(next)
  }

  // ── AUTO SAVE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const current = JSON.stringify(config)
      if (current !== lastSaved.current) {
        setSaveStatus('saving')
        try {
          await saveBuilderDraft(config)
          lastSaved.current = current
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 3000)
        } catch {
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
        }
      }
    }, 30000) // every 30s
    return () => clearInterval(interval)
  }, [config])

  // ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
      if (e.key === 'Escape') { setSelectedSectionId(null); setSectionEditorOpen(false); setInsertAtIndex(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [past, future, config])

  // ── SAVE ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      await saveBuilderDraft(config)
      lastSaved.current = JSON.stringify(config)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      const result = await publishBuilderConfig(config)
      if (result.success) {
        lastSaved.current = JSON.stringify(config)
        setSaveStatus('saved')
        const updated = await getBuilderConfig()
        setRevisions(updated.revisions)
        alert(`✅ Site publié avec succès ! (Révision #${result.revision})`)
      }
    } catch {
      setSaveStatus('error')
      alert('Une erreur est survenue lors de la publication.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadRevision = async (revId: string, revNum: number) => {
    if (!confirm(`Charger la révision #${revNum} ? Les modifications non enregistrées seront perdues.`)) return
    try {
      const data = await getRevisionData(revId)
      if (data) updateConfig(data as any)
    } catch {
      alert('Erreur lors du chargement de la révision.')
    }
  }

  // ── SECTION OPERATIONS ───────────────────────────────────────────────────
  const addSection = (type: ShowroomSectionType, atIndex?: number) => {
    const newSection = getDefaultSectionContent(type, config.global)
    const newSections = [...config.sections]
    if (atIndex !== undefined) {
      newSections.splice(atIndex, 0, newSection)
    } else {
      newSections.push(newSection)
    }
    updateConfig({ ...config, sections: newSections })
    setSelectedSectionId(newSection.id)
    setSectionEditorOpen(true)
    setInsertAtIndex(null)
  }

  const deleteSection = (id: string) => {
    if (!confirm('Supprimer cette section ?')) return
    updateConfig({ ...config, sections: config.sections.filter(s => s.id !== id) })
    if (selectedSectionId === id) { setSelectedSectionId(null); setSectionEditorOpen(false) }
  }

  const duplicateSection = (section: ShowroomSection) => {
    const idx = config.sections.findIndex(s => s.id === section.id)
    const newSec: ShowroomSection = {
      ...JSON.parse(JSON.stringify(section)),
      id: `${section.type.toLowerCase()}-${Date.now()}`
    }
    const newSections = [...config.sections]
    newSections.splice(idx + 1, 0, newSec)
    updateConfig({ ...config, sections: newSections })
  }

  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= config.sections.length) return
    const secs = [...config.sections];
    [secs[idx], secs[target]] = [secs[target], secs[idx]]
    updateConfig({ ...config, sections: secs })
  }

  const toggleSectionVisibility = (id: string) => {
    updateConfig({
      ...config,
      sections: config.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
    })
  }

  // ── UPDATE SECTION CONTENT / STYLES ──────────────────────────────────────
  const updateSectionContent = (id: string, key: string, value: any) => {
    updateConfig({
      ...config,
      sections: config.sections.map(s =>
        s.id === id ? { ...s, content: { ...s.content, [key]: value } } : s
      )
    })
  }

  const updateSectionStyle = (id: string, key: string, value: any) => {
    updateConfig({
      ...config,
      sections: config.sections.map(s =>
        s.id === id ? { ...s, styles: { ...s.styles, [key]: value } } : s
      )
    })
  }

  const updateGlobal = (key: keyof ShowroomGlobalConfig, value: any) => {
    updateConfig({ ...config, global: { ...config.global, [key]: value } })
  }

  // ── SECTION LIBRARY BY CATEGORY ───────────────────────────────────────────
  const libraryByCategory = SHOWROOM_SECTION_LIBRARY.reduce((acc, item) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, typeof SHOWROOM_SECTION_LIBRARY>)

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0a0a0a] overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ═══════════════════════════════ TOPBAR ═══════════════════════════════ */}
      <header className="h-14 flex-shrink-0 bg-[#111111] border-b border-white/8 flex items-center justify-between px-4 z-40">
        {/* Left: Back btn + Logo + Info */}
        <div className="flex items-center gap-3">
          {/* ← Back to Dashboard */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition"
            title="Retour au tableau de bord"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="w-px h-5 bg-white/10 flex-shrink-0" />

          <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-xs shadow-lg">
            W
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-black text-white leading-none">Visual Builder</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate max-w-[180px]">
              {agency?.company_name || 'Showroom'}
            </div>
          </div>
        </div>

        {/* Center: Undo/Redo + Device */}
        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-3">
            <button
              onClick={undo}
              disabled={past.length === 0}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
              title="Annuler (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
              title="Rétablir (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Device switcher */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 gap-0.5 border border-white/8">
            {([
              { id: 'desktop', icon: Laptop, label: 'Bureau' },
              { id: 'tablet', icon: Tablet, label: 'Tablette' },
              { id: 'mobile', icon: Smartphone, label: 'Mobile' }
            ] as const).map(d => (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`p-1.5 rounded-lg transition ${device === d.id ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                title={d.label}
              >
                <d.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          {/* Save status */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold">
            <div className={`h-2 w-2 rounded-full ${
              saveStatus === 'saving' ? 'bg-amber-400 animate-pulse' :
              saveStatus === 'saved' ? 'bg-emerald-500' :
              saveStatus === 'error' ? 'bg-red-500' : 'bg-slate-600'
            }`} />
            <span className="text-slate-500">
              {saveStatus === 'saving' ? 'Enregistrement...' :
               saveStatus === 'saved' ? 'Enregistré' :
               saveStatus === 'error' ? 'Erreur' : 'Brouillon'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {agency?.subdomain && (
            <a
              href={getTenantUrl(agency.subdomain, agency.custom_domain)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 border border-white/10 hover:bg-white/10 transition"
            >
              <Globe className="h-3.5 w-3.5" />
              Live
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white border border-white/20 hover:bg-white/10 transition disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sauvegarder</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-white transition disabled:opacity-50 hover:scale-[1.02]"
            style={{ background: '#e11d48' }}
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publier</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════ MAIN AREA ════════════════════════════ */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ─── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <aside className="w-[280px] flex-shrink-0 bg-[#111111] border-r border-white/8 flex flex-col overflow-hidden z-30">
          {/* Tab Bar */}
          <div className="grid grid-cols-4 gap-0 border-b border-white/8 flex-shrink-0">
            {([
              { id: 'sections', icon: Layers, label: 'Sections' },
              { id: 'styles', icon: Palette, label: 'Styles' },
              { id: 'content', icon: Settings, label: 'Contenu' },
              { id: 'templates', icon: Layout, label: 'Modèles' }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`py-3 flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-wide transition ${
                  sidebarTab === tab.id
                    ? 'text-rose-400 border-b-2 border-rose-500 bg-white/5'
                    : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">

            {/* ─── SECTIONS TAB ─────────────────────────────────────────────── */}
            {sidebarTab === 'sections' && (
              <div className="p-3 space-y-4">

                {/* Canvas section order list */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1 pb-1 flex items-center justify-between">
                    <span>Structure de la page</span>
                    <span className="bg-rose-600/20 text-rose-400 px-1.5 py-0.5 rounded-full">
                      {config.sections.length} sections
                    </span>
                  </div>

                  {config.sections.map((sec, idx) => {
                    const libItem = SHOWROOM_SECTION_LIBRARY.find(l => l.type === sec.type)
                    const isSelected = selectedSectionId === sec.id
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setSelectedSectionId(sec.id)
                          setSectionEditorOpen(true)
                        }}
                        className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-rose-600/20 ring-1 ring-rose-500/40'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className={`text-[11px] font-bold truncate ${isSelected ? 'text-rose-300' : 'text-slate-300'}`}>
                            {libItem?.label || sec.type}
                          </div>
                          <div className="text-[9px] text-slate-600 font-semibold truncate">{sec.type}</div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={e => { e.stopPropagation(); moveSection(idx, 'up') }}
                            disabled={idx === 0}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-500 disabled:opacity-20 transition"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); moveSection(idx, 'down') }}
                            disabled={idx === config.sections.length - 1}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-500 disabled:opacity-20 transition"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); toggleSectionVisibility(sec.id) }}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-500 transition"
                            title={sec.visible ? 'Masquer' : 'Afficher'}
                          >
                            {sec.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteSection(sec.id) }}
                            className="p-0.5 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Section Library */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1 pb-1">
                    Ajouter une Section
                  </div>
                  {Object.entries(libraryByCategory).map(([cat, items]) => (
                    <div key={cat} className="space-y-1">
                      <div className="text-[9px] font-semibold text-slate-600 px-1">{CATEGORY_LABELS[cat]}</div>
                      {items.map(item => (
                        <button
                          key={item.type}
                          onClick={() => addSection(item.type)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition hover:bg-white/5 group"
                        >
                          <div className="h-7 w-7 rounded-lg bg-rose-600/15 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-600/25 transition">
                            <DynIcon name={item.icon} className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-slate-300 leading-none">{item.label}</div>
                            <div className="text-[9px] text-slate-600 font-semibold mt-0.5 truncate">{item.description}</div>
                          </div>
                          <Plus className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── STYLES TAB ───────────────────────────────────────────────── */}
            {sidebarTab === 'styles' && (
              <div className="p-3 space-y-5">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">Styles Globaux</div>

                {/* Color Palette */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400">Palette de Couleurs</div>
                  {([
                    { key: 'primaryColor', label: 'Couleur Principale', desc: 'Boutons, accents, badges' },
                    { key: 'secondaryColor', label: 'Couleur Secondaire', desc: 'Hover, dégradés' },
                    { key: 'bgColor', label: 'Fond de Page', desc: 'Background global' },
                    { key: 'cardBgColor', label: 'Fond des Cartes', desc: 'Background cartes' },
                    { key: 'textColor', label: 'Texte Corps', desc: 'Paragraphes' },
                    { key: 'headingColor', label: 'Texte Titres', desc: 'H1, H2, H3' }
                  ] as const).map(c => (
                    <div key={c.key} className="flex items-center gap-2 bg-white/4 rounded-xl px-3 py-2 border border-white/8">
                      <input
                        type="color"
                        value={config.global[c.key]}
                        onChange={e => updateGlobal(c.key, e.target.value)}
                        className="h-7 w-7 rounded-lg cursor-pointer border-0 bg-transparent"
                        title={c.label}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-300 leading-none">{c.label}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">{config.global[c.key]}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400">Police de Caractères</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(['Inter', 'Outfit', 'Poppins', 'Cairo', 'Raleway'] as const).map(font => (
                      <button
                        key={font}
                        onClick={() => updateGlobal('fontFamily', font)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition ${
                          config.global.fontFamily === font
                            ? 'bg-rose-600/20 text-rose-300 ring-1 ring-rose-500/40'
                            : 'bg-white/4 text-slate-400 hover:bg-white/8 border border-white/8'
                        }`}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Style */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400">Style Boutons</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['filled', 'outline', 'pill'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => updateGlobal('buttonStyle', style)}
                        className={`px-2 py-2 rounded-xl text-[10px] font-bold transition ${
                          config.global.buttonStyle === style
                            ? 'bg-rose-600/20 text-rose-300 ring-1 ring-rose-500/40'
                            : 'bg-white/4 text-slate-400 hover:bg-white/8 border border-white/8'
                        }`}
                      >
                        {style === 'filled' ? 'Rempli' : style === 'outline' ? 'Contour' : 'Pilule'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── CONTENT TAB ──────────────────────────────────────────────── */}
            {sidebarTab === 'content' && (
              <div className="p-3 space-y-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">Informations Société</div>

                {([
                  { key: 'companyName', label: 'Nom de l\'entreprise', type: 'text', placeholder: 'Auto Premium' },
                  { key: 'phone', label: 'Téléphone', type: 'tel', placeholder: '+213 5XX XX XX XX' },
                  { key: 'whatsapp', label: 'WhatsApp (numéro)', type: 'tel', placeholder: '+213560003106' },
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'contact@autopremium.dz' },
                  { key: 'address', label: 'Adresse', type: 'text', placeholder: 'Rue, Ville, Algérie' },
                  { key: 'logoUrl', label: 'URL Logo', type: 'url', placeholder: 'https://' },
                  { key: 'socialFacebook', label: 'Facebook URL', type: 'url', placeholder: 'https://facebook.com/...' },
                  { key: 'socialInstagram', label: 'Instagram URL', type: 'url', placeholder: 'https://instagram.com/...' }
                ] as const).map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">{field.label}</label>
                    <input
                      type={field.type}
                      value={String(config.global[field.key] || '')}
                      onChange={e => updateGlobal(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-white/4 border border-white/10 text-white text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-600"
                    />
                  </div>
                ))}

                <div className="space-y-1.5 border-t border-white/8 pt-4">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">SEO</div>
                  {([
                    { key: 'seoTitle', label: 'Titre SEO', type: 'text', placeholder: 'Auto Premium | Showroom...' },
                    { key: 'seoDescription', label: 'Description SEO', type: 'text', placeholder: 'Description pour Google...' }
                  ] as const).map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400">{field.label}</label>
                      <input
                        type={field.type}
                        value={String(config.global[field.key] || '')}
                        onChange={e => updateGlobal(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-white/4 border border-white/10 text-white text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TEMPLATES TAB ────────────────────────────────────────────── */}
            {sidebarTab === 'templates' && (
              <div className="p-3 space-y-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">Templates Prédéfinis</div>

                {/* Current template indicator */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-black text-emerald-300">Template Actif</div>
                    <div className="text-[9px] text-emerald-500 font-semibold">Auto Premium Dark</div>
                  </div>
                </div>

                {/* Template Option */}
                {[
                  {
                    id: 'dark-gold',
                    name: 'Auto Premium Dark',
                    desc: 'Fond sombre, accent rouge/or. Élégant et moderne.',
                    colors: ['#0a0a0a', '#e11d48', '#f59e0b'],
                    active: true
                  },
                  {
                    id: 'white-clean',
                    name: 'Clean White Dealer',
                    desc: 'Fond blanc épuré. Style concession moderne.',
                    colors: ['#ffffff', '#1e40af', '#2563eb'],
                    active: false
                  },
                  {
                    id: 'navy-orange',
                    name: 'Import Pro Navy',
                    desc: 'Marine et orange. Axé importation professionnelle.',
                    colors: ['#0b132b', '#ea580c', '#fb923c'],
                    active: false
                  }
                ].map(tpl => (
                  <div
                    key={tpl.id}
                    className={`rounded-2xl border overflow-hidden transition cursor-pointer ${
                      tpl.active
                        ? 'border-rose-500/50 ring-1 ring-rose-500/30'
                        : 'border-white/8 hover:border-white/20'
                    }`}
                    onClick={() => {
                      if (tpl.id === 'dark-gold') {
                        updateConfig({ ...PERFECT_SHOWROOM_TEMPLATE, global: { ...PERFECT_SHOWROOM_TEMPLATE.global, ...config.global } })
                      } else if (tpl.id === 'white-clean') {
                        updateConfig({
                          ...config,
                          global: {
                            ...config.global,
                            primaryColor: '#1e40af',
                            secondaryColor: '#2563eb',
                            bgColor: '#f8fafc',
                            cardBgColor: '#ffffff',
                            textColor: '#475569',
                            headingColor: '#0f172a'
                          }
                        })
                      } else if (tpl.id === 'navy-orange') {
                        updateConfig({
                          ...config,
                          global: {
                            ...config.global,
                            primaryColor: '#ea580c',
                            secondaryColor: '#fb923c',
                            bgColor: '#0b132b',
                            cardBgColor: '#1a2540',
                            textColor: '#94a3b8',
                            headingColor: '#f1f5f9'
                          }
                        })
                      }
                    }}
                  >
                    {/* Color Preview Strip */}
                    <div className="h-12 flex">
                      {tpl.colors.map((c, i) => (
                        <div key={i} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-black text-white">{tpl.name}</div>
                        {tpl.active && (
                          <span className="text-[9px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">Actif</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{tpl.desc}</div>
                    </div>
                  </div>
                ))}

                {/* Revisions */}
                {revisions.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/8">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Historique Révisions</div>
                    {revisions.map((rev: any) => (
                      <button
                        key={rev.id}
                        onClick={() => handleLoadRevision(rev.id, rev.revision_number)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/4 hover:bg-white/8 text-left transition border border-white/8"
                      >
                        <div>
                          <div className="text-[10px] font-bold text-slate-300">Révision #{rev.revision_number}</div>
                          <div className="text-[9px] text-slate-600">
                            {new Date(rev.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ─── CANVAS AREA ──────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col bg-[#0d0d0d] overflow-hidden relative">
          {/* Canvas toolbar */}
          <div className="flex-shrink-0 h-10 border-b border-white/6 flex items-center justify-between px-4 bg-[#0a0a0a]">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
              <span>Canvas</span>
              <span className="text-slate-700">·</span>
              <span>{device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px'}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
              <span>Cliquez sur une section pour l'éditer</span>
              <Info className="h-3 w-3" />
            </div>
          </div>

          {/* Scrollable canvas container */}
          <div className="flex-1 overflow-auto">
            <div
              className="mx-auto transition-all duration-300 min-h-full"
              style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%' }}
            >
              {/* The sections — rendered as a stack with click-to-select overlays */}
              {config.sections.map((section, idx) => (
                <div key={section.id} className="relative group/sec">
                  {/* Insert above button */}
                  <div className="absolute -top-4 left-0 right-0 z-20 flex justify-center opacity-0 group-hover/sec:opacity-100 transition pointer-events-none">
                    <div className="pointer-events-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); setInsertAtIndex(idx) }}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-lg hover:bg-rose-700 transition"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Insérer ici
                      </button>
                    </div>
                  </div>

                  {/* Section click overlay */}
                  <div
                    className={`relative cursor-pointer transition-all duration-200 ${
                      selectedSectionId === section.id
                        ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-[#0d0d0d]'
                        : 'hover:ring-1 hover:ring-rose-500/40 hover:ring-offset-1 hover:ring-offset-[#0d0d0d]'
                    } ${!section.visible ? 'opacity-40' : ''}`}
                    onClick={() => {
                      setSelectedSectionId(section.id)
                      setSectionEditorOpen(true)
                    }}
                  >
                    {/* Section action buttons */}
                    <div className="absolute top-2 right-2 z-30 flex items-center gap-1 opacity-0 group-hover/sec:opacity-100 transition">
                      <div className="flex items-center gap-1 bg-[#111111]/90 backdrop-blur rounded-xl p-1 border border-white/15 shadow-xl">
                        <span className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wide border-r border-white/10 mr-0.5">
                          {section.type}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); moveSection(idx, 'up') }}
                          disabled={idx === 0}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
                          title="Monter"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); moveSection(idx, 'down') }}
                          disabled={idx === config.sections.length - 1}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
                          title="Descendre"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); duplicateSection(section) }}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 transition"
                          title="Dupliquer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleSectionVisibility(section.id) }}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 transition"
                          title={section.visible ? 'Masquer' : 'Afficher'}
                        >
                          {section.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteSection(section.id) }}
                          className="p-1 rounded-lg hover:bg-red-500/30 text-slate-500 hover:text-red-400 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Render the ACTUAL section from ShowroomPublicSite */}
                    <ShowroomPublicSite
                      config={{ global: config.global, sections: [section] }}
                      salesCars={salesCars}
                      rentalCars={rentalCars}
                      isPreview={true}
                    />
                  </div>
                </div>
              ))}

              {/* Append section button at bottom */}
              <div className="flex justify-center py-8 opacity-0 hover:opacity-100 transition group/add">
                <button
                  onClick={() => setInsertAtIndex(config.sections.length)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black bg-rose-600/80 text-white hover:bg-rose-600 transition shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une section
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ─── SECTION EDITOR PANEL (right side-panel) ─────────────────────── */}
        {sectionEditorOpen && selectedSection && (
          <aside
            className="w-[280px] flex-shrink-0 bg-[#111111] border-l border-white/8 flex flex-col overflow-hidden z-30"
          >
            {/* Panel Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div>
                <div className="text-[11px] font-black text-white">Éditer Section</div>
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">{selectedSection.type}</div>
              </div>
              <button
                onClick={() => { setSectionEditorOpen(false); setSelectedSectionId(null) }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">

              {/* ── Section Styles ── */}
              <div className="space-y-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Styles de la Section</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Fond</label>
                    <div className="flex gap-1.5 items-center bg-white/4 rounded-lg px-2 py-1.5 border border-white/8">
                      <input
                        type="color"
                        value={selectedSection.styles.bgColor}
                        onChange={e => updateSectionStyle(selectedSection.id, 'bgColor', e.target.value)}
                        className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-[9px] font-mono text-slate-400 truncate">{selectedSection.styles.bgColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Texte</label>
                    <div className="flex gap-1.5 items-center bg-white/4 rounded-lg px-2 py-1.5 border border-white/8">
                      <input
                        type="color"
                        value={selectedSection.styles.textColor}
                        onChange={e => updateSectionStyle(selectedSection.id, 'textColor', e.target.value)}
                        className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-[9px] font-mono text-slate-400 truncate">{selectedSection.styles.textColor}</span>
                    </div>
                  </div>
                </div>

                {/* Background Image (for Hero) */}
                {(selectedSection.type === 'Hero') && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Image de Fond (URL)</label>
                    <input
                      type="url"
                      value={selectedSection.styles.backgroundImage || ''}
                      onChange={e => updateSectionStyle(selectedSection.id, 'backgroundImage', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-white/4 border border-white/10 text-white text-[10px] font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-600"
                    />
                    {selectedSection.styles.backgroundImage && (
                      <div className="h-16 rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={selectedSection.styles.backgroundImage}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Padding */}
                <div className="grid grid-cols-2 gap-2">
                  {(['paddingTop', 'paddingBottom'] as const).map(pad => (
                    <div key={pad} className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">
                        {pad === 'paddingTop' ? 'Marge Haut' : 'Marge Bas'} ({selectedSection.styles[pad]}×4px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={32}
                        value={selectedSection.styles[pad]}
                        onChange={e => updateSectionStyle(selectedSection.id, pad, Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section Content Fields ── */}
              <div className="space-y-3 border-t border-white/8 pt-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Contenu</div>
                <SectionContentEditor
                  section={selectedSection}
                  updateContent={updateSectionContent}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ─── INSERT SECTION MODAL ─────────────────────────────────────────── */}
      {insertAtIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInsertAtIndex(null)}
        >
          <div
            className="bg-[#111111] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h2 className="text-sm font-black text-white">Choisir une Section</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Sélectionnez le type de section à insérer.</p>
              </div>
              <button onClick={() => setInsertAtIndex(null)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {Object.entries(libraryByCategory).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{CATEGORY_LABELS[cat]}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(item => (
                      <button
                        key={item.type}
                        onClick={() => addSection(item.type, insertAtIndex)}
                        className="flex items-start gap-3 p-3 rounded-2xl text-left transition hover:bg-rose-600/10 hover:border-rose-500/30 border border-white/8 bg-white/3"
                      >
                        <div className="h-9 w-9 rounded-xl bg-rose-600/15 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <DynIcon name={item.icon} className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white">{item.label}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SECTION CONTENT EDITOR ───────────────────────────────────────────────────
// Context-aware fields for each section type

function SectionContentEditor({ section, updateContent }: {
  section: ShowroomSection
  updateContent: (id: string, key: string, value: any) => void
}) {
  const up = (key: string, value: any) => updateContent(section.id, key, value)

  const TextInput = ({ field, label, placeholder }: { field: string; label: string; placeholder?: string }) => (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={section.content[field] || ''}
        onChange={e => up(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/4 border border-white/10 text-white text-[10px] font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-600"
      />
    </div>
  )

  const Toggle = ({ field, label }: { field: string; label: string }) => (
    <div className="flex items-center justify-between py-1">
      <label className="text-[10px] font-bold text-slate-400">{label}</label>
      <button
        onClick={() => up(field, !section.content[field])}
        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${section.content[field] ? 'bg-rose-600' : 'bg-white/15'}`}
      >
        <div className={`h-4 w-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${section.content[field] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )

  switch (section.type) {
    case 'Hero':
      return (
        <div className="space-y-3">
          <TextInput field="badge" label="Badge / Chapeau" placeholder="⚡ IMPORTATION PREMIUM" />
          <TextInput field="headline" label="Titre Principal" placeholder="Trouvez Votre Voiture de Rêve" />
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Sous-titre</label>
            <textarea
              value={section.content.subheadline || ''}
              onChange={e => up('subheadline', e.target.value)}
              rows={2}
              className="w-full bg-white/4 border border-white/10 text-white text-[10px] font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-600 resize-none"
              placeholder="Description..."
            />
          </div>
          <TextInput field="primaryCTA" label="Bouton Principal" placeholder="Voir le Stock" />
          <TextInput field="primaryCTAHref" label="Lien Bouton Principal" placeholder="#sales" />
          <TextInput field="secondaryCTA" label="Bouton Secondaire" placeholder="Contactez-nous" />
          <TextInput field="secondaryCTAHref" label="Lien Bouton Secondaire" placeholder="#contact" />
          <Toggle field="showTrustBadges" label="Afficher badges confiance" />
        </div>
      )

    case 'Navbar':
      return (
        <div className="space-y-3">
          <Toggle field="sticky" label="Navigation fixe (sticky)" />
          <Toggle field="showPhoneButton" label="Bouton Téléphone" />
          <Toggle field="showWhatsappButton" label="Bouton WhatsApp" />
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Liens de Navigation</label>
            {(section.content.links || []).map((link: any, i: number) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={link.label}
                  onChange={e => {
                    const links = [...section.content.links]
                    links[i] = { ...links[i], label: e.target.value }
                    up('links', links)
                  }}
                  placeholder="Label"
                  className="flex-1 bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
                />
                <input
                  value={link.href}
                  onChange={e => {
                    const links = [...section.content.links]
                    links[i] = { ...links[i], href: e.target.value }
                    up('links', links)
                  }}
                  placeholder="#section"
                  className="flex-1 bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const links = section.content.links.filter((_: any, li: number) => li !== i)
                    up('links', links)
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => up('links', [...(section.content.links || []), { label: 'Nouveau', href: '#' }])}
              className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold text-rose-400 border border-rose-500/30 hover:bg-rose-600/10 transition"
            >
              <Plus className="h-3 w-3" /> Ajouter un lien
            </button>
          </div>
        </div>
      )

    case 'Stats':
      return (
        <div className="space-y-3">
          {(section.content.items || []).map((item: any, i: number) => (
            <div key={i} className="space-y-1.5 p-3 rounded-xl border border-white/8 bg-white/3">
              <div className="text-[9px] font-black text-slate-500 uppercase">Stat #{i + 1}</div>
              <input
                value={item.number}
                onChange={e => {
                  const items = [...section.content.items]; items[i] = { ...items[i], number: e.target.value }
                  up('items', items)
                }}
                placeholder="100+"
                className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
              />
              <input
                value={item.label}
                onChange={e => {
                  const items = [...section.content.items]; items[i] = { ...items[i], label: e.target.value }
                  up('items', items)
                }}
                placeholder="Véhicules Livrés"
                className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )

    case 'SalesInventory':
      return (
        <div className="space-y-3">
          <TextInput field="title" label="Titre" placeholder="Véhicules en Vente" />
          <TextInput field="subtitle" label="Sous-titre" placeholder="Notre sélection..." />
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Nb. par ligne</label>
            <select
              value={section.content.cardsPerRow || 3}
              onChange={e => up('cardsPerRow', Number(e.target.value))}
              className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value={2}>2 colonnes</option>
              <option value={3}>3 colonnes</option>
            </select>
          </div>
          <Toggle field="showFilters" label="Afficher les filtres" />
          <Toggle field="showPrice" label="Afficher les prix" />
          <Toggle field="showWhatsapp" label="Bouton WhatsApp" />
        </div>
      )

    case 'RentalFleet':
      return (
        <div className="space-y-3">
          <TextInput field="title" label="Titre" placeholder="Location de Véhicules" />
          <TextInput field="subtitle" label="Sous-titre" />
          <Toggle field="showDailyRate" label="Afficher tarif journalier" />
          <Toggle field="showWhatsapp" label="Bouton WhatsApp" />
        </div>
      )

    case 'ImportCalculator':
      return (
        <div className="space-y-3">
          <TextInput field="title" label="Titre" placeholder="Simulateur d'Importation" />
          <TextInput field="subtitle" label="Sous-titre" />
          <Toggle field="showTimeline" label="Afficher les étapes" />
        </div>
      )

    case 'Services':
      return (
        <div className="space-y-3">
          <TextInput field="title" label="Titre" placeholder="Nos Services" />
          <TextInput field="subtitle" label="Sous-titre" />
          {(section.content.items || []).map((item: any, i: number) => (
            <div key={i} className="space-y-1.5 p-3 rounded-xl border border-white/8 bg-white/3">
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-black text-slate-500 uppercase">Service #{i + 1}</div>
                <button onClick={() => {
                  const items = section.content.items.filter((_: any, ii: number) => ii !== i)
                  up('items', items)
                }} className="p-0.5 text-slate-600 hover:text-red-400 transition"><X className="h-3 w-3" /></button>
              </div>
              <input
                value={item.title}
                onChange={e => { const items = [...section.content.items]; items[i] = { ...items[i], title: e.target.value }; up('items', items) }}
                placeholder="Titre"
                className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
              />
              <input
                value={item.desc}
                onChange={e => { const items = [...section.content.items]; items[i] = { ...items[i], desc: e.target.value }; up('items', items) }}
                placeholder="Description..."
                className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
              />
            </div>
          ))}
          <button
            onClick={() => up('items', [...(section.content.items || []), { icon: 'Car', title: 'Nouveau Service', desc: 'Description...' }])}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold text-rose-400 border border-rose-500/30 hover:bg-rose-600/10 transition"
          >
            <Plus className="h-3 w-3" /> Ajouter un service
          </button>
        </div>
      )

    case 'Testimonials':
      return (
        <div className="space-y-3">
          <TextInput field="title" label="Titre" placeholder="Témoignages Clients" />
          <TextInput field="subtitle" label="Sous-titre" />
          {(section.content.items || []).map((item: any, i: number) => (
            <div key={i} className="space-y-1.5 p-3 rounded-xl border border-white/8 bg-white/3">
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-black text-slate-500">Client #{i + 1}</div>
                <button onClick={() => { const items = section.content.items.filter((_: any, ii: number) => ii !== i); up('items', items) }} className="p-0.5 text-slate-600 hover:text-red-400"><X className="h-3 w-3" /></button>
              </div>
              <input value={item.name} onChange={e => { const items = [...section.content.items]; items[i] = { ...items[i], name: e.target.value }; up('items', items) }} placeholder="Nom client" className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none" />
              <input value={item.city} onChange={e => { const items = [...section.content.items]; items[i] = { ...items[i], city: e.target.value }; up('items', items) }} placeholder="Ville" className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none" />
              <textarea value={item.text} onChange={e => { const items = [...section.content.items]; items[i] = { ...items[i], text: e.target.value }; up('items', items) }} placeholder="Témoignage..." rows={2} className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none resize-none" />
            </div>
          ))}
          <button onClick={() => up('items', [...(section.content.items || []), { name: 'Nouveau Client', city: 'Alger', rating: 5, text: 'Super service !', avatar: 'NC' }])}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold text-rose-400 border border-rose-500/30 hover:bg-rose-600/10 transition">
            <Plus className="h-3 w-3" /> Ajouter un témoignage
          </button>
        </div>
      )

    case 'BrandGrid':
      return (
        <div className="space-y-3">
          <TextInput field="title" label="Titre" placeholder="Nos Marques" />
          <TextInput field="subtitle" label="Sous-titre" />
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Marques (une par ligne)</label>
            <textarea
              value={(section.content.brands || []).join('\n')}
              onChange={e => up('brands', e.target.value.split('\n').map((b: string) => b.trim()).filter(Boolean))}
              rows={5}
              className="w-full bg-white/4 border border-white/10 text-white text-[10px] rounded-xl px-3 py-2 focus:outline-none resize-none font-mono"
              placeholder={'Toyota\nHyundai\nKia'}
            />
          </div>
        </div>
      )

    case 'Contact':
      return (
        <div className="space-y-3">
          <TextInput field="title" label="Titre" placeholder="Contactez-Nous" />
          <TextInput field="subtitle" label="Sous-titre" />
          <TextInput field="cta" label="Texte du bouton" placeholder="Envoyer" />
          <Toggle field="showForm" label="Afficher formulaire" />
          <Toggle field="showMap" label="Afficher carte" />
          {section.content.showMap && (
            <TextInput field="mapEmbedUrl" label="URL Embed Google Maps" placeholder="https://www.google.com/maps/embed?pb=..." />
          )}
        </div>
      )

    case 'Footer':
      return (
        <div className="space-y-3">
          <TextInput field="copyrightText" label="Texte Copyright" placeholder="© 2026 Auto Premium..." />
          <Toggle field="showSocials" label="Afficher réseaux sociaux" />
          <Toggle field="showWhatsappFloat" label="Bouton WhatsApp flottant" />
        </div>
      )

    default:
      return (
        <div className="text-[10px] text-slate-500 italic py-4 text-center">
          Sélectionnez une section pour l'éditer.
        </div>
      )
  }
}
