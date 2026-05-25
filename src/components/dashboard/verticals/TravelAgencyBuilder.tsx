'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, ArrowRight, Laptop, Tablet, Smartphone, Eye, Save, Send,
  Plus, Trash2, ArrowUp, ArrowDown, Copy, Settings, Undo2, Redo2,
  RefreshCw, Star, Compass, Tag, Shield, HeartHandshake, Award, Search,
  Mail, SendHorizontal, Edit, Check, Globe, HelpCircle, FileText, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { saveBuilderDraft, publishBuilderConfig, getBuilderConfig, getRevisionData } from '@/app/actions/builder'
import { createClient } from '@/lib/supabase/client'

// Predefined Travel Section Types
type TravelSectionType = 'Navbar' | 'HeroSearch' | 'DestinationsGrid' | 'FeaturedPackages' | 'WhyChooseUs' | 'Testimonials' | 'Newsletter' | 'ContactForm' | 'Footer'

interface TravelSection {
  id: string
  type: TravelSectionType
  content: any
  style: {
    paddingY: string
    backgroundColor: string
    textColor: string
    alignment: 'left' | 'center' | 'right'
  }
}

interface TravelBuilderConfig {
  global: {
    primaryColor: string
    secondaryColor: string
    fontFamily: 'Inter' | 'Outfit' | 'Roboto' | 'Montserrat'
    logoUrl: string
    faviconUrl: string
    seoTitle: string
    seoDescription: string
    socialFacebook: string
    socialInstagram: string
    phone: string
    whatsapp: string
    address: string
    iataLicense: string
  }
  sections: TravelSection[]
}

const DEFAULT_TRAVEL_CONFIG: TravelBuilderConfig = {
  global: {
    primaryColor: '#f97316', // Sunset Orange Accent
    secondaryColor: '#3b82f6', // Ocean Blue
    fontFamily: 'Inter',
    logoUrl: '',
    faviconUrl: '/favicon.ico',
    seoTitle: 'Sahara & Beyond | Voyages Premium',
    seoDescription: 'Découvrez l\'Algérie et le monde entier avec des circuits sur-mesure d\'exception, vols et visa inclus.',
    socialFacebook: 'https://facebook.com',
    socialInstagram: 'https://instagram.com',
    phone: '+213 555 12 34 56',
    whatsapp: '+213 555 12 34 56',
    address: 'Didouche Mourad, Alger, Algérie',
    iataLicense: 'IATA-21345689'
  },
  sections: [
    {
      id: 'travel-nav',
      type: 'Navbar',
      content: {
        links: [
          { label: 'Destinations', url: '#destinations' },
          { label: 'Forfaits', url: '#forfaits' },
          { label: 'Sur Mesure', url: '#sur-mesure' },
          { label: 'Contact', url: '#contact' }
        ],
        sticky: true,
        phoneButton: true
      },
      style: { paddingY: 'py-4', backgroundColor: '#ffffff', textColor: '#1e293b', alignment: 'center' }
    },
    {
      id: 'travel-hero',
      type: 'HeroSearch',
      content: {
        title: 'Explorez le Monde, Vivez l\'Aventure',
        subtitle: 'Circuits d\'exception au Sahara, séjours organisés en Europe et voyages sur-mesure clé en main.',
        backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
        searchPlaceholder: 'Où voulez-vous aller ?',
        ctaText: 'Découvrir nos forfaits'
      },
      style: { paddingY: 'py-24', backgroundColor: '#fff7ed', textColor: '#1e293b', alignment: 'center' }
    },
    {
      id: 'travel-whyus',
      type: 'WhyChooseUs',
      content: {
        title: 'Pourquoi Voyager avec Nous ?',
        subtitle: 'L\'excellence opérationnelle et l\'expertise locale à chaque étape de votre circuit.',
        items: [
          { title: 'Prix Compétitifs', description: 'Les meilleurs partenariats aériens et hôteliers pour des tarifs avantageux.', icon: 'Compass' },
          { title: 'Visa & Dossier Inclus', description: 'Prise en charge intégrale de vos démarches de visa touristique ou d\'affaires.', icon: 'Shield' },
          { title: 'Assurance Voyage', description: 'Garanties d\'assistance complètes pour voyager en toute sérénité.', icon: 'HeartHandshake' },
          { title: 'Guide Francophone', description: 'Accompagnateurs qualifiés natifs pour enrichir vos explorations culturelles.', icon: 'Award' }
        ]
      },
      style: { paddingY: 'py-16', backgroundColor: '#ffffff', textColor: '#1e293b', alignment: 'center' }
    },
    {
      id: 'travel-destinations',
      type: 'DestinationsGrid',
      content: {
        title: 'Nos Destinations Phares',
        subtitle: 'Découvrez des escapades inoubliables sélectionnées pour vous.',
        layout: 'grid',
        destinations: [
          { country: 'Djanet, Sahara', flag: '🇩🇿', price: '65 000 DZD', duration: '7 jours', image: 'https://images.unsplash.com/photo-1547191831-e6e4e546355b?w=600' },
          { country: 'Istanbul, Turquie', flag: '🇹🇷', price: '120 000 DZD', duration: '8 jours', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600' },
          { country: 'Dubaï, E.A.U.', flag: '🇦🇪', price: '185 000 DZD', duration: '6 jours', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600' }
        ]
      },
      style: { paddingY: 'py-16', backgroundColor: '#fff7ed', textColor: '#1e293b', alignment: 'center' }
    },
    {
      id: 'travel-testimonials',
      type: 'Testimonials',
      content: {
        title: 'Ce que Disent nos Voyageurs',
        items: [
          { name: 'Kamel M.', rating: 5, quote: 'Un séjour inoubliable à Djanet ! L\'organisation de l\'équipe Sahara & Beyond a été parfaite, du vol d\'Alger aux bivouacs dans le Tassili.', avatar: 'KM' },
          { name: 'Sarah B.', rating: 5, quote: 'Visa obtenu en un temps record pour Istanbul, hôtel superbe très bien placé et accompagnateur aux petits soins. Je recommande !', avatar: 'SB' }
        ]
      },
      style: { paddingY: 'py-16', backgroundColor: '#ffffff', textColor: '#1e293b', alignment: 'center' }
    },
    {
      id: 'travel-newsletter',
      type: 'Newsletter',
      content: {
        title: 'Recevez nos Offres Exclusives',
        buttonText: 'S\'abonner'
      },
      style: { paddingY: 'py-12', backgroundColor: '#f97316', textColor: '#ffffff', alignment: 'center' }
    },
    {
      id: 'travel-footer',
      type: 'Footer',
      content: {
        columns: [
          { title: 'Explorer', items: [{ label: 'Destinations', url: '#' }, { label: 'Organisés', url: '#' }] },
          { title: 'Agence', items: [{ label: 'À Propos', url: '#' }, { label: 'Contact', url: '#' }] }
        ],
        copyrightText: '© 2026 SAHARA BEYOND TRAVEL. Tous droits réservés.'
      },
      style: { paddingY: 'py-12', backgroundColor: '#1e293b', textColor: '#ffffff', alignment: 'center' }
    }
  ]
}

export default function TravelAgencyBuilder({ agency: fetchedAgency, initialConfig, initialRevisions }: any) {
  const [config, setConfig] = useState<TravelBuilderConfig>(() => {
    if (initialConfig && initialConfig.builder_data && Array.isArray(initialConfig.builder_data.sections)) {
      return initialConfig.builder_data as TravelBuilderConfig;
    }
    const initial = { ...DEFAULT_TRAVEL_CONFIG };
    if (fetchedAgency) {
      initial.global.phone = fetchedAgency.website_settings?.phone || initial.global.phone;
      initial.global.whatsapp = fetchedAgency.website_settings?.phone || initial.global.whatsapp;
      initial.global.address = fetchedAgency.website_settings?.address || initial.global.address;
      initial.global.logoUrl = fetchedAgency.website_settings?.logo_url || initial.global.logoUrl;
    }
    return initial;
  })
  const [agency, setAgency] = useState<any>(fetchedAgency)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [revisions, setRevisions] = useState<any[]>(initialRevisions || [])

  // Layout View Mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'sections' | 'style' | 'revisions'>('sections')

  // History State for Undo/Redo (Up to 50 elements)
  const [pastConfigs, setPastConfigs] = useState<TravelBuilderConfig[]>([])
  const [futureConfigs, setFutureConfigs] = useState<TravelBuilderConfig[]>([])

  // Auto-Save Effect (triggers every 30 seconds if changes are made)
  const lastSavedConfig = useRef<string>(JSON.stringify(config))
  useEffect(() => {
    if (loading || !agency) return

    const interval = setInterval(async () => {
      const currentStr = JSON.stringify(config)
      if (currentStr !== lastSavedConfig.current) {
        setSaveStatus('saving')
        try {
          await saveBuilderDraft(config)
          lastSavedConfig.current = currentStr
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 3000)
        } catch (err) {
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [config, loading, agency])

  // Save manual action
  const handleManualSave = async () => {
    setSaving(true)
    setSaveStatus('saving')
    try {
      await saveBuilderDraft(config)
      lastSavedConfig.current = JSON.stringify(config)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  // Publish Config Live
  const handlePublish = async () => {
    setSaving(true)
    setSaveStatus('saving')
    try {
      const res = await publishBuilderConfig(config)
      if (res.success) {
        lastSavedConfig.current = JSON.stringify(config)
        setSaveStatus('saved')
        
        // Reload revisions list
        const { revisions: updatedRevisions } = await getBuilderConfig()
        setRevisions(updatedRevisions)

        alert(`✨ Félicitations ! Votre site de voyage a été publié avec succès (Révision #${res.revision}).`)
      }
    } catch (err) {
      alert('Une erreur est survenue lors de la publication.')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  // Update Config Helper (supports undo/redo stack)
  const updateConfig = (newConfig: TravelBuilderConfig) => {
    setPastConfigs(prev => [...prev.slice(-49), config]) // Limit stack to 50
    setFutureConfigs([]) // Clear redo
    setConfig(newConfig)
  }

  // Undo Function
  const handleUndo = () => {
    if (pastConfigs.length === 0) return
    const prev = pastConfigs[pastConfigs.length - 1]
    setPastConfigs(past => past.slice(0, -1))
    setFutureConfigs(fut => [...fut, config])
    setConfig(prev)
  }

  // Redo Function
  const handleRedo = () => {
    if (futureConfigs.length === 0) return
    const next = futureConfigs[futureConfigs.length - 1]
    setFutureConfigs(fut => fut.slice(0, -1))
    setPastConfigs(past => [...past, config])
    setConfig(next)
  }

  // Load Particular Revision
  const handleLoadRevision = async (revId: string, revNum: number) => {
    if (confirm(`Voulez-vous charger la révision #${revNum} ? Les modifications non enregistrées seront perdues.`)) {
      setLoading(true)
      try {
        const revData = await getRevisionData(revId)
        if (revData) {
          updateConfig(revData as any)
          alert(`Révision #${revNum} chargée avec succès dans le plan de travail.`)
        }
      } catch (err) {
        alert('Erreur lors du chargement de la révision.')
      } finally {
        setLoading(false)
      }
    }
  }

  // Section Ordering Helpers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSections.length) return

    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp

    updateConfig({
      ...config,
      sections: newSections
    })
  }

  const deleteSection = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette section ?')) {
      updateConfig({
        ...config,
        sections: config.sections.filter(s => s.id !== id)
      })
      if (selectedSectionId === id) setSelectedSectionId(null)
    }
  }

  const addSection = (type: TravelSectionType) => {
    let initialContent = {}
    
    if (type === 'HeroSearch') {
      initialContent = {
        title: 'Explorez le Monde, Vivez l\'Aventure',
        subtitle: 'Circuits d\'exception au Sahara, séjours organisés en Europe et voyages sur-mesure clé en main.',
        backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
        searchPlaceholder: 'Où voulez-vous aller ?',
        ctaText: 'Découvrir nos forfaits'
      }
    } else if (type === 'WhyChooseUs') {
      initialContent = {
        title: 'Pourquoi Voyager avec Nous ?',
        subtitle: 'L\'excellence opérationnelle et l\'expertise locale à chaque étape de votre circuit.',
        items: [
          { title: 'Prix Compétitifs', description: 'Les meilleurs partenariats aériens et hôteliers pour des tarifs avantageux.', icon: 'Compass' },
          { title: 'Visa & Dossier Inclus', description: 'Prise en charge intégrale de vos démarches de visa touristique ou d\'affaires.', icon: 'Shield' }
        ]
      }
    } else if (type === 'DestinationsGrid') {
      initialContent = {
        title: 'Nos Destinations Phares',
        subtitle: 'Découvrez des escapades inoubliables sélectionnées pour vous.',
        layout: 'grid',
        destinations: [
          { country: 'Djanet, Sahara', flag: '🇩🇿', price: '65 000 DZD', duration: '7 jours', image: 'https://images.unsplash.com/photo-1547191831-e6e4e546355b?w=600' }
        ]
      }
    } else if (type === 'Testimonials') {
      initialContent = {
        title: 'Ce que Disent nos Voyageurs',
        items: [
          { name: 'Kamel M.', rating: 5, quote: 'Un séjour inoubliable à Djanet !', avatar: 'KM' }
        ]
      }
    } else if (type === 'Newsletter') {
      initialContent = {
        title: 'Recevez nos Offres Exclusives',
        buttonText: 'S\'abonner'
      }
    } else if (type === 'Navbar') {
      initialContent = {
        links: [
          { label: 'Destinations', url: '#destinations' },
          { label: 'Forfaits', url: '#forfaits' }
        ],
        sticky: true,
        phoneButton: true
      }
    } else if (type === 'Footer') {
      initialContent = {
        columns: [
          { title: 'Explorer', items: [{ label: 'Destinations', url: '#' }] }
        ],
        copyrightText: '© 2026 Travel Agency. Tous droits réservés.'
      }
    } else {
      initialContent = { title: `Section ${type}` }
    }
 
    const newSection: TravelSection = {
      id: `section-${Date.now()}`,
      type,
      content: initialContent,
      style: {
        paddingY: 'py-16',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        alignment: 'center'
      }
    }
 
    updateConfig({
      ...config,
      sections: [...config.sections, newSection]
    })
    setSelectedSectionId(newSection.id)
  }

  const updateGlobalField = (path: string, value: any) => {
    updateConfig({
      ...config,
      global: {
        ...config.global,
        [path]: value
      }
    })
  }

  const updateSectionField = (sectionId: string, path: string, value: any) => {
    updateConfig({
      ...config,
      sections: config.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            content: {
              ...s.content,
              [path]: value
            }
          }
        }
        return s
      })
    })
  }

  const updateSectionStyle = (sectionId: string, path: string, value: any) => {
    updateConfig({
      ...config,
      sections: config.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            style: {
              ...s.style,
              [path]: value
            }
          }
        }
        return s
      })
    })
  }

  const selectedSection = config.sections.find(s => s.id === selectedSectionId)

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Compass': return <Compass className="h-6 w-6 text-orange-500" />
      case 'Shield': return <Shield className="h-6 w-6 text-orange-500" />
      case 'HeartHandshake': return <HeartHandshake className="h-6 w-6 text-orange-500" />
      case 'Award': return <Award className="h-6 w-6 text-orange-500" />
      default: return <Compass className="h-6 w-6 text-orange-500" />
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-50 text-slate-700 font-sans">
      
      {/* 1. TOP BUILDER TOOLBAR */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-5 flex items-center justify-between shadow-xs select-none">
        
        {/* Logo & Agency Info */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
            T
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 leading-none">Travel Agency Builder</h1>
            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Plan de travail pour {agency?.company_name || 'Votre Agence'}</p>
          </div>
        </div>

        {/* Undo/Redo & Device Previews */}
        <div className="flex items-center gap-4">
          
          {/* History control */}
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-4">
            <button
              onClick={handleUndo}
              disabled={pastConfigs.length === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
              title="Annuler (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={futureConfigs.length === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
              title="Rétablir (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Preview Modes */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {[
              { id: 'desktop', icon: Laptop, title: 'Desktop (Ordinateur)' },
              { id: 'tablet', icon: Tablet, title: 'Tablet (Tablette)' },
              { id: 'mobile', icon: Smartphone, title: 'Mobile (Téléphone)' }
            ].map(dev => {
              const IconComp = dev.icon
              return (
                <button
                  key={dev.id}
                  onClick={() => setPreviewDevice(dev.id as any)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === dev.id
                      ? 'bg-white text-orange-500 shadow-xs'
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                  title={dev.title}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              )
            })}
          </div>

          {/* Save Status Dot */}
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold">
            <span className={`h-2.5 w-2.5 rounded-full ${
              saveStatus === 'saving' ? 'bg-amber-400 animate-pulse' :
              saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-slate-300'
            }`} />
            {saveStatus === 'saving' ? 'Auto-enregistrement...' :
             saveStatus === 'saved' ? 'Enregistré' : 'Draft en ligne'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPreviewOpen(true)}
            variant="outline"
            className="rounded-xl h-8 text-[11px] font-bold border-slate-200 gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-orange-500" /> Aperçu
          </Button>

          <Button
            onClick={handleManualSave}
            variant="outline"
            disabled={saving}
            className="rounded-xl h-8 text-[11px] font-bold border-slate-200 gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 text-orange-500" /> Sauvegarder
          </Button>

          <Button
            onClick={handlePublish}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-8 text-[11px] font-black gap-1.5 shadow-sm cursor-pointer border-0"
          >
            <Send className="h-3.5 w-3.5" /> Publier le Site
          </Button>
        </div>
      </header>

      {/* 2. DOCK BODY AREA */}
      <div className="flex-1 min-h-0 flex">
        
        {/* A. LEFT SIDEBAR: ELEMENTS LIBRARY & GLOBAL SETTINGS */}
        <aside className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col select-none shadow-xs">
          
          {/* Tab Selector */}
          <div className="grid grid-cols-3 border-b border-slate-200/60 p-2 gap-1 bg-slate-50/60">
            {[
              { id: 'sections', label: 'Modules' },
              { id: 'style', label: 'Styles' },
              { id: 'revisions', label: 'Révisions' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase text-center transition cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-white text-orange-500 shadow-xs border border-slate-200/85' 
                    : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Body scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* TAB 1: SECTIONS LIBRARY */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                
                {/* Structure Outline */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    ⚙️ Modules Actifs sur la Page
                  </h3>
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    {config.sections.map((sect, idx) => (
                      <div 
                        key={sect.id} 
                        onClick={() => setSelectedSectionId(sect.id)}
                        className={`group/item flex items-center justify-between p-2 rounded-lg text-xs font-semibold cursor-pointer border transition ${
                          selectedSectionId === sect.id 
                            ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-xs' 
                            : 'bg-white border-slate-200/70 hover:border-orange-200'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5 font-bold">
                          <span className="text-[10px] opacity-40">#{idx + 1}</span>
                          {sect.type}
                        </span>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveSection(idx, 'up'); }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            disabled={idx === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveSection(idx, 'down'); }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            disabled={idx === config.sections.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteSection(sect.id); }}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new Travel Modules list */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    ✨ Ajouter un Module Voyage
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'Navbar', label: 'Menu de Navigation', icon: '🌐' },
                      { type: 'HeroSearch', label: 'Bannière de Recherche', icon: '⛺' },
                      { type: 'WhyChooseUs', label: 'Nos Atouts', icon: '🤝' },
                      { type: 'DestinationsGrid', label: 'Grille Destinations', icon: '🗺️' },
                      { type: 'Testimonials', label: 'Avis Clients', icon: '💬' },
                      { type: 'Newsletter', label: 'Newsletter', icon: '📩' },
                      { type: 'Footer', label: 'Pied de page', icon: '🏛️' }
                    ].map(btn => (
                      <button
                        key={btn.type}
                        onClick={() => addSection(btn.type as TravelSectionType)}
                        className="p-3 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
                      >
                        <span className="text-lg group-hover:scale-110 transition">{btn.icon}</span>
                        <span className="text-[9px] font-black leading-tight text-slate-800">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GLOBAL STYLE PALETTE */}
            {activeTab === 'style' && (
              <div className="space-y-4 text-xs font-bold">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Palette Couleur Primaire</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config.global.primaryColor}
                      onChange={e => updateGlobalField('primaryColor', e.target.value)}
                      className="h-8 w-12 rounded border cursor-pointer border-slate-200"
                    />
                    <Input 
                      type="text" 
                      value={config.global.primaryColor}
                      onChange={e => updateGlobalField('primaryColor', e.target.value)}
                      className="h-8 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Police Principale (Google Fonts)</Label>
                  <select 
                    value={config.global.fontFamily}
                    onChange={e => updateGlobalField('fontFamily', e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 font-bold text-xs"
                  >
                    <option value="Inter">Inter (Moderne & Lisible)</option>
                    <option value="Outfit">Outfit (Minimaliste Élégante)</option>
                    <option value="Roboto">Roboto (Technique)</option>
                    <option value="Montserrat">Montserrat (Chaleureuse Prestige)</option>
                  </select>
                </div>

                <hr className="border-slate-100 my-2" />

                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase font-black tracking-wider text-slate-400">Paramètres SEO</h3>
                  
                  <div className="space-y-1">
                    <Label className="text-[9px] text-slate-500">Titre SEO du Site</Label>
                    <Input 
                      value={config.global.seoTitle} 
                      onChange={e => updateGlobalField('seoTitle', e.target.value)} 
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] text-slate-500">Description Meta</Label>
                    <Textarea 
                      value={config.global.seoDescription} 
                      onChange={e => updateGlobalField('seoDescription', e.target.value)} 
                      className="text-xs font-semibold"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase font-black tracking-wider text-slate-400">Informations Agence</h3>
                  
                  <div className="space-y-1">
                    <Label className="text-[9px] text-slate-500">Téléphone de Contact</Label>
                    <Input 
                      value={config.global.phone} 
                      onChange={e => updateGlobalField('phone', e.target.value)} 
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] text-slate-500">Licence IATA</Label>
                    <Input 
                      value={config.global.iataLicense} 
                      onChange={e => updateGlobalField('iataLicense', e.target.value)} 
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REVISIONS LOG */}
            {activeTab === 'revisions' && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  📅 Historique de Publication
                </h3>
                
                {revisions.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Aucune publication enregistrée pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {revisions.map((rev, idx) => (
                      <div 
                        key={rev.id}
                        onClick={() => handleLoadRevision(rev.id, rev.revision_number)}
                        className="bg-white hover:bg-orange-50/50 border border-slate-200 rounded-xl p-3 text-left transition cursor-pointer space-y-1.5 hover:border-orange-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-800">
                            Révision #{rev.revision_number}
                          </span>
                          {rev.published_at && (
                            <span className="text-[8px] bg-orange-100 text-orange-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                              Publié
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-semibold">
                          Le {new Date(rev.published_at || rev.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* EDIT CONTAINER SIDEBAR DRAWER */}
          {selectedSection && (
            <div className="h-80 border-t border-slate-200 bg-slate-50 flex flex-col text-left">
              <div className="h-10 shrink-0 border-b border-slate-200 px-4 flex items-center justify-between bg-white select-none">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-wide">
                  ✍️ Modifier: {selectedSection.type}
                </span>
                <button 
                  onClick={() => setSelectedSectionId(null)}
                  className="text-xs text-slate-400 hover:text-slate-800 font-bold"
                >
                  Fermer
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-bold">
                
                {/* Specific Section Fields */}
                {selectedSection.type === 'HeroSearch' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Titre Principal</Label>
                      <Input 
                        value={selectedSection.content.title}
                        onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)}
                        className="h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Sous-titre d'accroche</Label>
                      <Textarea 
                        value={selectedSection.content.subtitle}
                        onChange={e => updateSectionField(selectedSection.id, 'subtitle', e.target.value)}
                        className="text-xs font-semibold bg-white"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Lien Image d'Arrière-plan</Label>
                      <Input 
                        value={selectedSection.content.backgroundImage}
                        onChange={e => updateSectionField(selectedSection.id, 'backgroundImage', e.target.value)}
                        className="h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'WhyChooseUs' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Titre de la Section</Label>
                      <Input 
                        value={selectedSection.content.title}
                        onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)}
                        className="h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-[9px] text-slate-500">Modifier les 2 Premiers Atouts</Label>
                      {(selectedSection.content.items || []).slice(0, 2).map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 space-y-1.5">
                          <Input 
                            value={item.title}
                            onChange={e => {
                              const newItems = [...selectedSection.content.items]
                              newItems[idx].title = e.target.value
                              updateSectionField(selectedSection.id, 'items', newItems)
                            }}
                            className="h-7 text-[10px] font-bold"
                            placeholder="Titre"
                          />
                          <Input 
                            value={item.description}
                            onChange={e => {
                              const newItems = [...selectedSection.content.items]
                              newItems[idx].description = e.target.value
                              updateSectionField(selectedSection.id, 'items', newItems)
                            }}
                            className="h-7 text-[10px]"
                            placeholder="Description"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedSection.type === 'DestinationsGrid' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Titre de la Section</Label>
                      <Input 
                        value={selectedSection.content.title}
                        onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)}
                        className="h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Style de Grille</Label>
                      <select 
                        value={selectedSection.content.layout}
                        onChange={e => updateSectionField(selectedSection.id, 'layout', e.target.value)}
                        className="w-full h-8 rounded border bg-white px-2 text-xs"
                      >
                        <option value="grid">Grille Classique</option>
                        <option value="masonry">Mosaïque Asymétrique</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedSection.type === 'Newsletter' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Titre de l'Encart</Label>
                      <Input 
                        value={selectedSection.content.title}
                        onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)}
                        className="h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Libellé du Bouton</Label>
                      <Input 
                        value={selectedSection.content.buttonText}
                        onChange={e => updateSectionField(selectedSection.id, 'buttonText', e.target.value)}
                        className="h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                  </>
                )}

                {/* Common Section Styling Controls */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <Label className="text-[9px] text-slate-400 uppercase tracking-wider">Style de la Section</Label>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-400">Fond</span>
                      <Input 
                        type="text" 
                        value={selectedSection.style.backgroundColor}
                        onChange={e => updateSectionStyle(selectedSection.id, 'backgroundColor', e.target.value)}
                        className="h-7 text-[10px] bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-400">Couleur Texte</span>
                      <Input 
                        type="text" 
                        value={selectedSection.style.textColor}
                        onChange={e => updateSectionStyle(selectedSection.id, 'textColor', e.target.value)}
                        className="h-7 text-[10px] bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </aside>

        {/* B. CENTRAL WORKSPACE: INTERACTIVE CANVAS */}
        <main className="flex-1 bg-slate-100 flex items-center justify-center p-6 select-none overflow-y-auto">
          
          <div 
            className={`bg-white shadow-xl transition-all duration-300 overflow-y-auto border border-slate-200/90 ${
              previewDevice === 'desktop' ? 'w-full max-w-[1024px] h-[95%]' :
              previewDevice === 'tablet' ? 'w-[768px] h-[90%] rounded-2xl' :
              'w-[375px] h-[85%] rounded-[3rem]'
            }`}
            style={{ fontFamily: config.global.fontFamily }}
          >
            
            <div className="min-h-full flex flex-col bg-white">
              
              {config.sections.map((sect, sectIdx) => {
                const isSelected = selectedSectionId === sect.id
                
                return (
                  <div 
                    key={sect.id}
                    onClick={() => setSelectedSectionId(sect.id)}
                    className={`relative group border-2 cursor-pointer transition ${
                      isSelected 
                        ? 'border-orange-500' 
                        : 'border-transparent hover:border-orange-300'
                    }`}
                    style={{ 
                      backgroundColor: sect.style.backgroundColor,
                      color: sect.style.textColor,
                      textAlign: sect.style.alignment
                    }}
                  >
                    
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition z-10 uppercase tracking-widest">
                      {sect.type}
                    </div>

                    <div className={`px-8 ${sect.style.paddingY}`}>
                      
                      {/* NAVBAR MODULE */}
                      {sect.type === 'Navbar' && (
                        <div className="flex items-center justify-between py-2 text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded bg-orange-500 flex items-center justify-center text-white text-[10px] font-black">S</span>
                            <span className="font-black text-slate-800">{fetchedAgency?.company_name || 'Sahara Travel'}</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-500 text-[10px] uppercase font-black">
                            {(sect.content.links || []).map((lnk: any, idx: number) => (
                              <span key={idx} className="hover:text-orange-500">{lnk.label}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* HERO MODULE */}
                      {sect.type === 'HeroSearch' && (
                        <div className="py-12 space-y-6 flex flex-col items-center max-w-2xl mx-auto">
                          <h1 className="text-3xl font-black tracking-tight leading-tight text-slate-850">
                            {sect.content.title}
                          </h1>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {sect.content.subtitle}
                          </p>
                          <div className="w-full flex bg-white border border-slate-200/90 p-2 rounded-2xl shadow-md max-w-md">
                            <input 
                              type="text" 
                              disabled 
                              placeholder={sect.content.searchPlaceholder}
                              className="flex-1 bg-transparent border-0 text-xs px-2 focus:outline-none"
                            />
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] px-4 py-1.5 rounded-xl cursor-pointer">
                              Rechercher
                            </button>
                          </div>
                        </div>
                      )}

                      {/* WHY CHOOSE US MODULE */}
                      {sect.type === 'WhyChooseUs' && (
                        <div className="space-y-8 py-4">
                          <div className="text-center space-y-1.5">
                            <h2 className="text-xl font-black text-slate-850">{sect.content.title}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{sect.content.subtitle}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {(sect.content.items || []).map((it: any, itIdx: number) => (
                              <div key={itIdx} className="bg-white border border-slate-200 p-4 rounded-xl flex gap-3.5 hover:shadow-sm transition">
                                <div className="h-10 w-10 shrink-0 bg-orange-100 rounded-xl flex items-center justify-center">
                                  {renderIcon(it.icon)}
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-black text-slate-800">{it.title}</h4>
                                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">{it.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DESTINATIONS GRID MODULE */}
                      {sect.type === 'DestinationsGrid' && (
                        <div className="space-y-8 py-4">
                          <div className="text-center space-y-1">
                            <h2 className="text-xl font-black text-slate-850">{sect.content.title}</h2>
                            <p className="text-[10px] text-slate-400 font-semibold">{sect.content.subtitle}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(sect.content.destinations || []).map((dest: any, destIdx: number) => (
                              <div key={destIdx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition text-left flex flex-col group">
                                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                  <img src={dest.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                    {dest.duration}
                                  </span>
                                </div>
                                <div className="p-3.5 space-y-2">
                                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                                    <span>{dest.flag}</span> {dest.country}
                                  </h4>
                                  <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                    <div className="flex flex-col">
                                      <span className="text-[7px] text-slate-400 font-extrabold uppercase leading-none">À partir de</span>
                                      <span className="text-[11px] font-black text-orange-500">{dest.price}</span>
                                    </div>
                                    <span className="text-[9px] bg-slate-100 hover:bg-slate-250 text-slate-650 font-bold px-2.5 py-1 rounded-lg">Voir</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TESTIMONIALS MODULE */}
                      {sect.type === 'Testimonials' && (
                        <div className="space-y-6 py-4">
                          <h2 className="text-lg font-black text-slate-850 text-center">{sect.content.title}</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {(sect.content.items || []).map((tst: any, tIdx: number) => (
                              <div key={tIdx} className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl space-y-2">
                                <div className="flex text-amber-400">
                                  {[...Array(tst.rating || 5)].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-amber-400" />
                                  ))}
                                </div>
                                <p className="text-[10px] text-slate-500 italic font-semibold">"{tst.quote}"</p>
                                <div className="flex items-center gap-2 pt-1.5">
                                  <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[9px] shadow-sm">
                                    {tst.avatar}
                                  </div>
                                  <span className="text-[9px] font-black text-slate-700">{tst.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* NEWSLETTER MODULE */}
                      {sect.type === 'Newsletter' && (
                        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto text-white">
                          <h3 className="text-sm font-black">{sect.content.title}</h3>
                          <div className="flex bg-white/10 border border-white/20 p-1.5 rounded-xl">
                            <input 
                              type="email" 
                              disabled 
                              placeholder="Votre email..."
                              className="bg-transparent text-[10px] font-bold text-white px-2 focus:outline-none placeholder-white/50 border-0"
                            />
                            <button className="bg-white text-orange-600 font-black text-[9px] px-3.5 py-1 rounded-lg">
                              {sect.content.buttonText}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* FOOTER MODULE */}
                      {sect.type === 'Footer' && (
                        <div className="py-4 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-700/30">
                          <span>{sect.content.copyrightText}</span>
                          <span className="font-extrabold uppercase tracking-wider text-[8px]">IATA LICENSED: {config.global.iataLicense}</span>
                        </div>
                      )}

                    </div>

                  </div>
                )
              })}

            </div>

          </div>

        </main>

      </div>

      {/* 3. FULL-SCREEN PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col select-none">
          <div className="h-12 bg-slate-950 border-b border-white/10 px-5 flex items-center justify-between text-white">
            <span className="text-xs font-black uppercase tracking-wider text-orange-500">👓 Aperçu Réel - Site Voyage Organisé</span>
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="h-7 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black transition cursor-pointer"
            >
              Fermer l'aperçu
            </button>
          </div>
          <div className="flex-1 bg-slate-100 overflow-y-auto flex justify-center p-6">
            <div className="w-full max-w-[1140px] bg-white shadow-2xl flex flex-col" style={{ fontFamily: config.global.fontFamily }}>
              {config.sections.map((sect) => (
                <div 
                  key={sect.id}
                  style={{ 
                    backgroundColor: sect.style.backgroundColor,
                    color: sect.style.textColor,
                    textAlign: sect.style.alignment
                  }}
                  className={`px-12 ${sect.style.paddingY}`}
                >
                  {sect.type === 'Navbar' && (
                    <div className="flex items-center justify-between py-2 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded bg-orange-500 flex items-center justify-center text-white text-[10px] font-black">S</span>
                        <span className="font-black text-slate-800">{fetchedAgency?.company_name || 'Sahara Travel'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 text-[10px] uppercase font-black">
                        {sect.content.links.map((lnk: any, idx: number) => (
                          <a key={idx} href={lnk.url} className="hover:text-orange-500">{lnk.label}</a>
                        ))}
                      </div>
                    </div>
                  )}

                  {sect.type === 'HeroSearch' && (
                    <div className="py-16 space-y-6 flex flex-col items-center max-w-2xl mx-auto">
                      <h1 className="text-4xl font-black tracking-tight leading-tight text-slate-850">
                        {sect.content.title}
                      </h1>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {sect.content.subtitle}
                      </p>
                      <div className="w-full flex bg-white border border-slate-200/90 p-2.5 rounded-2xl shadow-lg max-w-md">
                        <input 
                          type="text" 
                          placeholder={sect.content.searchPlaceholder}
                          className="flex-1 bg-transparent border-0 text-xs px-2 focus:outline-none"
                        />
                        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2 rounded-xl">
                          Rechercher
                        </button>
                      </div>
                    </div>
                  )}

                  {sect.type === 'WhyChooseUs' && (
                    <div className="space-y-10 py-6">
                      <div className="text-center space-y-1.5">
                        <h2 className="text-2xl font-black text-slate-850">{sect.content.title}</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{sect.content.subtitle}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
                        {(sect.content.items || []).map((it: any, itIdx: number) => (
                          <div key={itIdx} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-3 hover:shadow-md transition">
                            <div className="h-10 w-10 shrink-0 bg-orange-100 rounded-xl flex items-center justify-center">
                              {renderIcon(it.icon)}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-800">{it.title}</h4>
                              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">{it.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sect.type === 'DestinationsGrid' && (
                    <div className="space-y-10 py-6">
                      <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-slate-850">{sect.content.title}</h2>
                        <p className="text-xs text-slate-400 font-semibold">{sect.content.subtitle}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(sect.content.destinations || []).map((dest: any, destIdx: number) => (
                          <div key={destIdx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition text-left flex flex-col group">
                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                              <img src={dest.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              <span className="absolute top-3 left-3 bg-black/60 text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg">
                                {dest.duration}
                              </span>
                            </div>
                            <div className="p-4 space-y-3">
                              <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <span>{dest.flag}</span> {dest.country}
                              </h4>
                              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                <div className="flex flex-col">
                                  <span className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">À partir de</span>
                                  <span className="text-[12px] font-black text-orange-500">{dest.price}</span>
                                </div>
                                <span className="text-[10px] bg-orange-50 hover:bg-orange-100 text-orange-650 font-black px-3.5 py-1.5 rounded-xl transition">Réserver</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sect.type === 'Testimonials' && (
                    <div className="space-y-8 py-6">
                      <h2 className="text-2xl font-black text-slate-850 text-center">{sect.content.title}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {(sect.content.items || []).map((tst: any, tIdx: number) => (
                          <div key={tIdx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                            <div className="flex text-amber-400">
                              {[...Array(tst.rating || 5)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                              ))}
                            </div>
                            <p className="text-xs text-slate-600 italic font-semibold">"{tst.quote}"</p>
                            <div className="flex items-center gap-3 pt-2">
                              <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shadow-xs">
                                {tst.avatar}
                              </div>
                              <span className="text-xs font-black text-slate-700">{tst.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sect.type === 'Newsletter' && (
                    <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-xl mx-auto text-white">
                      <h3 className="text-lg font-black">{sect.content.title}</h3>
                      <div className="flex bg-white/15 border border-white/20 p-2 rounded-2xl w-full sm:w-auto">
                        <input 
                          type="email" 
                          placeholder="Votre email..."
                          className="bg-transparent text-xs font-bold text-white px-3 focus:outline-none placeholder-white/60 border-0"
                        />
                        <button className="bg-white hover:bg-orange-50 text-orange-600 font-black text-xs px-5 py-2 rounded-xl transition">
                          {sect.content.buttonText}
                        </button>
                      </div>
                    </div>
                  )}

                  {sect.type === 'Footer' && (
                    <div className="py-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-700/30">
                      <span>{sect.content.copyrightText}</span>
                      <span className="font-extrabold uppercase tracking-wider text-[10px]">IATA LICENSED: {config.global.iataLicense}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
