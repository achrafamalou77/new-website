'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, ArrowRight, Laptop, Tablet, Smartphone, Eye, Save, Send,
  Plus, Trash2, ArrowUp, ArrowDown, Copy, Settings, Undo2, Redo2,
  Menu, Info, Check, Image as ImageIcon, MapPin, Phone, MessageSquare,
  Sparkles, HelpCircle, FileText, ChevronRight, RefreshCw, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getBuilderConfig, saveBuilderDraft, publishBuilderConfig, getRevisionData } from '@/app/actions/builder'
import { createClient } from '@/lib/supabase/client'

// Predefined Section Types
type SectionType = 'Navbar' | 'Hero' | 'Stats' | 'Car Grid' | 'Services' | 'Testimonials' | 'Contact' | 'Contact Bar' | 'Map' | 'Text' | 'Image' | 'Footer'

interface Section {
  id: string
  type: SectionType
  content: any
  style: {
    paddingY: string
    backgroundColor: string
    textColor: string
    alignment: 'left' | 'center' | 'right'
  }
}

interface BuilderConfig {
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
    socialTwitter: string
    phone: string
    whatsapp: string
    address: string
  }
  sections: Section[]
}

const DEFAULT_CAR_SHOWROOM_CONFIG: BuilderConfig = {
  global: {
    primaryColor: '#fbbf24', // Premium Gold Accent
    secondaryColor: '#0f0f0f', // Sleek Dark
    fontFamily: 'Outfit',
    logoUrl: '/images/logo.png',
    faviconUrl: '/favicon.ico',
    seoTitle: 'Amine Auto 35 | Showroom Premium',
    seoDescription: 'Découvrez notre showroom de véhicules haut de gamme prêts pour la route ou commandez votre voiture personnalisée.',
    socialFacebook: 'https://facebook.com',
    socialInstagram: 'https://instagram.com',
    socialTwitter: 'https://twitter.com',
    phone: '0560 00 31 06',
    whatsapp: '0560 00 31 06',
    address: 'Cheraga, Alger, Algérie'
  },
  sections: [
    {
      id: 'section-nav',
      type: 'Navbar',
      content: {
        links: [
          { label: 'Accueil', url: '#' },
          { label: 'En Stock', url: '#stock' },
          { label: 'Sur Commande', url: '#commande' },
          { label: 'Contact', url: '#contact' }
        ],
        sticky: true,
        phoneButton: true
      },
      style: { paddingY: 'py-4', backgroundColor: '#0f0f0f', textColor: '#ffffff', alignment: 'center' }
    },
    {
      id: 'section-hero',
      type: 'Hero',
      content: {
        badge: '⚡ NEUF / OCCASION / SUR COMMANDE',
        headline: 'Importation & Showroom Premium',
        subtitle: 'Découvrez les derniers arrivages de véhicules de prestige ou commandez sur-mesure.',
        primaryButtonText: 'Voir le Stock',
        primaryButtonUrl: '#stock',
        secondaryButtonText: 'Contactez-nous',
        secondaryButtonUrl: '#contact',
        backgroundImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1920&q=80',
        enableOverlay: true,
        animation: 'fade-in-up'
      },
      style: { paddingY: 'py-24', backgroundColor: '#0f0f0f', textColor: '#ffffff', alignment: 'center' }
    },
    {
      id: 'section-stats',
      type: 'Stats',
      content: {
        title: 'Notre agence en chiffres',
        items: [
          { number: '250+', label: 'Véhicules Livrés' },
          { number: '10+', label: 'Années d\'Expérience' },
          { number: '99%', label: 'Satisfaction Client' }
        ]
      },
      style: { paddingY: 'py-12', backgroundColor: '#fbbf24', textColor: '#0f0f0f', alignment: 'center' }
    },
    {
      id: 'section-grid',
      type: 'Car Grid',
      content: {
        title: 'Derniers Arrivages',
        subtitle: 'Nos nouveautés premium prêtes pour la route.',
        showFilters: true,
        showPrice: true,
        showSpecs: true,
        showWhatsApp: true,
        carsPerRow: 3,
        limit: 6
      },
      style: { paddingY: 'py-16', backgroundColor: '#0f0f0f', textColor: '#ffffff', alignment: 'center' }
    },
    {
      id: 'section-contact-bar',
      type: 'Contact Bar',
      content: {
        text: 'Des questions ? Contactez-nous directement',
        whatsappUrl: 'https://wa.me/213560003106?text=Bonjour%2C%20je%20viens%20du%20site%20Amine%20Auto.',
        whatsappLabel: 'WhatsApp'
      },
      style: { paddingY: 'py-3', backgroundColor: '#1a1a1a', textColor: '#9ca3af', alignment: 'center' }
    },
    {
      id: 'section-footer',
      type: 'Footer',
      content: {
        columns: [
          { title: 'Showroom', items: [{ label: 'Stock', url: '#stock' }, { label: 'Sur Commande', url: '#commande' }] },
          { title: 'Société', items: [{ label: 'À Propos', url: '#' }, { label: 'Contact', url: '#contact' }] }
        ],
        copyrightText: '© 2026 AMINE AUTO 35. Tous droits réservés.'
      },
      style: { paddingY: 'py-12', backgroundColor: '#0f0f0f', textColor: '#ffffff', alignment: 'center' }
    }
  ]
}

const DEFAULT_TRAVEL_CONFIG: BuilderConfig = {
  global: {
    primaryColor: '#3b82f6', // Premium Blue
    secondaryColor: '#ffffff', // Clean light background
    fontFamily: 'Inter',
    logoUrl: '/images/logo-travel.png',
    faviconUrl: '/favicon.ico',
    seoTitle: 'Algeria Travel | Voyages d\'Exception',
    seoDescription: 'Découvrez le monde avec notre agence de voyage premium. Circuits organisés, hôtels de luxe et expériences uniques.',
    socialFacebook: 'https://facebook.com',
    socialInstagram: 'https://instagram.com',
    socialTwitter: 'https://twitter.com',
    phone: '+213 555 12 34 56',
    whatsapp: '+213 555 12 34 56',
    address: 'Alger Centre, Algérie'
  },
  sections: [
    {
      id: 'section-nav',
      type: 'Navbar',
      content: {
        links: [
          { label: 'Voyages', url: '#voyages' },
          { label: 'À propos', url: '#apropos' },
          { label: 'Réserver maintenant', url: '#reserver' }
        ],
        sticky: true,
        phoneButton: true
      },
      style: { paddingY: 'py-4', backgroundColor: '#ffffff', textColor: '#1e293b', alignment: 'center' }
    },
    {
      id: 'section-hero',
      type: 'Hero',
      content: {
        badge: '✨ VOYAGES UNIQUES',
        headline: 'Explorez le Monde avec Style',
        subtitle: 'Circuits organisés premium avec guides locaux experts, vols inclus et hôtels 4★/5★.',
        primaryButtonText: 'Découvrir nos Voyages',
        primaryButtonUrl: '#voyages',
        secondaryButtonText: 'Nous Contacter',
        secondaryButtonUrl: '#contact',
        backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
        enableOverlay: true,
        animation: 'fade-in-up'
      },
      style: { paddingY: 'py-24', backgroundColor: '#ffffff', textColor: '#1e293b', alignment: 'center' }
    },
    {
      id: 'section-stats',
      type: 'Stats',
      content: {
        title: 'Notre agence en chiffres',
        items: [
          { number: '15k+', label: 'Voyageurs' },
          { number: '50+', label: 'Destinations' },
          { number: '98%', label: 'Satisfaction' }
        ]
      },
      style: { paddingY: 'py-12', backgroundColor: '#3b82f6', textColor: '#ffffff', alignment: 'center' }
    },
    {
      id: 'section-footer',
      type: 'Footer',
      content: {
        columns: [
          { title: 'Destinations', items: [{ label: 'Europe', url: '#' }, { label: 'Asie', url: '#' }] },
          { title: 'Agence', items: [{ label: 'À Propos', url: '#' }, { label: 'Contact', url: '#' }] }
        ],
        copyrightText: '© 2026 Algeria Travel. Tous droits réservés.'
      },
      style: { paddingY: 'py-12', backgroundColor: '#1e293b', textColor: '#ffffff', alignment: 'center' }
    }
  ]
}

function sanitizeConfig(configData: any, businessTypeSlug: string, agencySettings: any): BuilderConfig {
  const savedSections = configData?.sections || [];
  const travelOnlyTypes = ['Trips', 'Gallery', 'FAQ', 'Team', 'Blog', 'Video', 'HTML', 'Banner'];
  const hasTravelSections = savedSections.some((s: any) => travelOnlyTypes.includes(s.type));
  const hasNoCarSections = !savedSections.some((s: any) => ['Navbar', 'Car Grid', 'Services', 'Footer'].includes(s.type));
  
  const hasCarSections = savedSections.some((s: any) => ['Car Grid', 'Services'].includes(s.type));
  
  const needsCarReset = businessTypeSlug === 'car_showroom' && (hasTravelSections || hasNoCarSections || savedSections.length === 0);
  const needsTravelReset = businessTypeSlug !== 'car_showroom' && (hasCarSections || savedSections.length === 0);
  
  let finalConfig: BuilderConfig;
  if (needsCarReset) {
    finalConfig = JSON.parse(JSON.stringify(DEFAULT_CAR_SHOWROOM_CONFIG));
  } else if (needsTravelReset) {
    finalConfig = JSON.parse(JSON.stringify(DEFAULT_TRAVEL_CONFIG));
  } else {
    finalConfig = JSON.parse(JSON.stringify(configData)) as BuilderConfig;
  }
  
  if (agencySettings) {
    finalConfig.global.phone = agencySettings.website_settings?.phone || finalConfig.global.phone;
    finalConfig.global.whatsapp = agencySettings.website_settings?.phone || finalConfig.global.whatsapp;
    finalConfig.global.address = agencySettings.website_settings?.address || finalConfig.global.address;
    finalConfig.global.logoUrl = agencySettings.website_settings?.logo_url || finalConfig.global.logoUrl;
  }
  
  return finalConfig;
}

export default function CarShowroomBuilder({ agency: fetchedAgency, initialConfig, initialRevisions }: any) {
  const [config, setConfig] = useState<BuilderConfig>(() => {
    if (initialConfig && initialConfig.builder_data && Array.isArray(initialConfig.builder_data.sections)) {
      return sanitizeConfig(initialConfig.builder_data, fetchedAgency?.business_type_slug, fetchedAgency);
    }
    const initial = { ...DEFAULT_CAR_SHOWROOM_CONFIG };
    if (fetchedAgency) {
      initial.global.phone = fetchedAgency.website_settings?.phone || initial.global.phone;
      initial.global.whatsapp = fetchedAgency.website_settings?.phone || initial.global.whatsapp;
      initial.global.address = fetchedAgency.website_settings?.address || initial.global.address;
      initial.global.logoUrl = fetchedAgency.website_settings?.logo_url || initial.global.logoUrl;
    }
    return initial;
  })
  const [agency, setAgency] = useState<any>(fetchedAgency)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [revisions, setRevisions] = useState<any[]>(initialRevisions || [])

  // Layout View Mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'sections' | 'style' | 'revisions'>('sections')

  // History State for Undo/Redo (Up to 50 elements)
  const [pastConfigs, setPastConfigs] = useState<BuilderConfig[]>([])
  const [futureConfigs, setFutureConfigs] = useState<BuilderConfig[]>([])

  // Real data stats from database
  const [carsCount, setCarsCount] = useState({ sell: 0, command: 0, rental: 0 })

  // Initialize and Fetch Dynamic Counts
  useEffect(() => {
    async function loadData() {
      if (!fetchedAgency) {
        setLoading(false);
        return;
      }
      try {
        // Fetch counts from Supabase dynamically for builder display
        const supabase = createClient()
        if (supabase) {
          const { count: sellCount } = await supabase.from('car_sales_inventory').select('*', { count: 'exact', head: true }).eq('agency_id', fetchedAgency.id).eq('car_type', 'sell')
          const { count: commandCount } = await supabase.from('car_sales_inventory').select('*', { count: 'exact', head: true }).eq('agency_id', fetchedAgency.id).eq('car_type', 'sur_command')
          const { count: rentalCount } = await supabase.from('car_sales_inventory').select('*', { count: 'exact', head: true }).eq('agency_id', fetchedAgency.id).eq('car_type', 'rental')
          
          setCarsCount({
            sell: sellCount || 0,
            command: commandCount || 0,
            rental: rentalCount || 0
          })
        }
      } catch (err) {
        console.error('Error loading dynamic counts in builder:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchedAgency])

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

        alert(`✨ Félicitations ! Votre site a été publié avec succès (Révision #${res.revision}).`)
      }
    } catch (err) {
      alert('Une erreur est survenue lors de la publication.')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  // Update Config Helper (supports undo/redo stack)
  const updateConfig = (newConfig: BuilderConfig) => {
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
          const sanitized = sanitizeConfig(revData, agency?.business_type_slug, agency)
          updateConfig(sanitized)
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

    // Swap
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

  const duplicateSection = (section: Section) => {
    const newSections = [...config.sections]
    const index = newSections.findIndex(s => s.id === section.id)
    if (index === -1) return

    const duplicated: Section = {
      ...section,
      id: `section-${Date.now()}`,
      content: JSON.parse(JSON.stringify(section.content)) // Deep copy
    }

    newSections.splice(index + 1, 0, duplicated)
    updateConfig({
      ...config,
      sections: newSections
    })
  }

  const addSection = (type: SectionType) => {
    let initialContent = {}
    const isCar = agency?.business_type_slug === 'car_showroom'
    
    if (type === 'Hero') {
      initialContent = isCar ? {
        badge: '⚡ NEUF / OCCASION / SUR COMMANDE',
        headline: 'Importation & Showroom Premium',
        subtitle: 'Découvrez les derniers arrivages de véhicules de prestige ou commandez sur-mesure.',
        primaryButtonText: 'Voir le Stock',
        primaryButtonUrl: '#stock',
        secondaryButtonText: 'Contactez-nous',
        secondaryButtonUrl: '#contact',
        backgroundImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1920&q=80',
        enableOverlay: true,
        animation: 'fade-in-up'
      } : {
        badge: '✨ VOYAGES UNIQUES',
        headline: 'Explorez le Monde avec Style',
        subtitle: 'Circuits organisés premium avec guides locaux experts, vols inclus et hôtels 4★/5★.',
        primaryButtonText: 'Découvrir nos Voyages',
        primaryButtonUrl: '#voyages',
        secondaryButtonText: 'Nous Contacter',
        secondaryButtonUrl: '#contact',
        backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
        enableOverlay: true,
        animation: 'fade-in-up'
      }
    } else if (type === 'Stats') {
      initialContent = isCar ? {
        title: 'Performances de notre agence',
        items: [
          { number: '250+', label: 'Véhicules Livrés' },
          { number: '10+', label: 'Années d\'Expérience' },
          { number: '99%', label: 'Satisfaction Client' }
        ]
      } : {
        title: 'Notre agence en chiffres',
        items: [
          { number: '15k+', label: 'Voyageurs' },
          { number: '50+', label: 'Destinations' },
          { number: '98%', label: 'Satisfaction' }
        ]
      }
    } else if (type === 'Services') {
      initialContent = isCar ? {
        title: 'Nos Services d\'Exception',
        items: [
          { title: 'Achat Showroom', desc: 'Une sélection de voitures haut de gamme disponibles immédiatement en concession.', icon: 'Tag' },
          { title: 'Importation Sur Commande', desc: 'Nous gérons tout le processus d\'importation avec dédouanement clé en main.', icon: 'Plus' },
          { title: 'Location Premium', desc: 'Des véhicules d\'exception disponibles en location courte et longue durée.', icon: 'Clock' }
        ]
      } : {
        title: 'Prestations de l\'agence',
        items: [
          { title: 'Circuits Découverte', desc: 'Des voyages inoubliables pour toute la famille.', icon: 'Compass' },
          { title: 'Hôtels 5 Étoiles', desc: 'Une sélection d\'hôtels de luxe haut de gamme.', icon: 'Star' }
        ]
      }
    } else if (type === 'Car Grid') {
      initialContent = {
        title: isCar ? 'Derniers Arrivages' : 'Nos Prochains Départs',
        subtitle: isCar ? 'Nos nouveautés premium prêtes pour la route.' : 'Sélection de circuits disponibles.',
        showFilters: true,
        showPrice: true,
        showSpecs: isCar,
        showWhatsApp: isCar,
        carsPerRow: 3,
        limit: 6
      }
    } else if (type === 'Contact') {
      initialContent = isCar ? {
        title: 'Des questions ? Contactez-nous directement',
        subtitle: 'Nos conseillers sont à votre disposition par téléphone ou WhatsApp.',
        showForm: false
      } : {
        title: 'Contactez-nous',
        subtitle: 'Une question ? Notre équipe vous répond instantanément.',
        showForm: true
      }
    } else if (type === 'Navbar') {
      initialContent = isCar ? {
        links: [
          { label: 'Accueil', url: '#' },
          { label: 'En Stock', url: '#stock' },
          { label: 'Sur Commande', url: '#commande' },
          { label: 'Contact', url: '#contact' }
        ],
        sticky: true,
        phoneButton: true
      } : {
        links: [
          { label: 'Voyages', url: '#voyages' },
          { label: 'À propos', url: '#apropos' },
          { label: 'Réserver maintenant', url: '#reserver' }
        ],
        sticky: true,
        phoneButton: true
      }
    } else if (type === 'Contact Bar') {
      initialContent = {
        text: isCar ? 'Des questions ? Contactez-nous directement' : 'Besoin d\'aide ? Contactez notre équipe',
        whatsappUrl: isCar ? 'https://wa.me/213560003106?text=Bonjour%2C%20je%20viens%20du%20site%20Amine%20Auto.' : 'https://wa.me/',
        whatsappLabel: 'WhatsApp'
      }
    } else if (type === 'Footer') {
      initialContent = isCar ? {
        columns: [
          { title: 'Showroom', items: [{ label: 'Stock', url: '#stock' }, { label: 'Sur Commande', url: '#commande' }] },
          { title: 'Société', items: [{ label: 'À Propos', url: '#' }, { label: 'Contact', url: '#contact' }] }
        ],
        copyrightText: '© 2026 AMINE AUTO 35. Tous droits réservés.'
      } : {
        columns: [
          { title: 'Destinations', items: [{ label: 'Europe', url: '#' }, { label: 'Asie', url: '#' }] },
          { title: 'Agence', items: [{ label: 'À Propos', url: '#' }, { label: 'Contact', url: '#' }] }
        ],
        copyrightText: '© 2026 Algeria Travel. Tous droits réservés.'
      }
    } else {
      initialContent = { title: `Section ${type}` }
    }
 
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      content: initialContent,
      style: {
        paddingY: 'py-16',
        backgroundColor: isCar ? '#0f0f0f' : (type === 'Navbar' || type === 'Footer' ? '#1e293b' : '#ffffff'),
        textColor: isCar ? '#ffffff' : (type === 'Navbar' || type === 'Footer' ? '#ffffff' : '#1e293b'),
        alignment: 'center'
      }
    }
 
    updateConfig({
      ...config,
      sections: [...config.sections, newSection]
    })
    setSelectedSectionId(newSection.id)
  }

  // Properties Field Editing Helpers
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

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <RefreshCw className="h-10 w-10 animate-spin text-red-600" />
        <span className="text-sm font-bold">Chargement de l'atelier de création visuelle...</span>
      </div>
    )
  }

  const selectedSection = config.sections.find(s => s.id === selectedSectionId)

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-100 text-slate-700">
      
      {/* 1. TOP BUILDER TOOLBAR */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-5 flex items-center justify-between shadow-xs select-none">
        
        {/* Logo & Agency Info */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            W
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 leading-none">Visual Website Builder</h1>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">Éditeur premium pour {agency?.company_name}</p>
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
                      ? 'bg-white text-slate-900 shadow-xs'
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
            <Eye className="h-3.5 w-3.5" /> Aperçu
          </Button>

          <Button
            onClick={handleManualSave}
            variant="outline"
            disabled={saving}
            className="rounded-xl h-8 text-[11px] font-bold border-slate-200 gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" /> Sauvegarder
          </Button>

          <Button
            onClick={handlePublish}
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-8 text-[11px] font-bold gap-1.5 shadow-sm cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> Publier le Site
          </Button>
        </div>
      </header>

      {/* 2. DOCK BODY AREA */}
      <div className="flex-1 min-h-0 flex">
        
        {/* A. LEFT SIDEBAR: ELEMENTS LIBRARY & GLOBAL SETTINGS TAB BAR */}
        <aside className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col select-none">
          
          {/* Tab Selector */}
          <div className="grid grid-cols-3 border-b border-slate-200/60 p-2 gap-1 bg-slate-50">
            <button
              onClick={() => setActiveTab('sections')}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase text-center transition cursor-pointer ${
                activeTab === 'sections' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              Éléments
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase text-center transition cursor-pointer ${
                activeTab === 'style' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              Style
            </button>
            <button
              onClick={() => setActiveTab('revisions')}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase text-center transition cursor-pointer ${
                activeTab === 'revisions' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              Historique
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* TAB SECTIONS: INSERT ELEMENTS */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Bibliothèque de Sections</h3>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">Cliquez pour insérer instantanément une section au bas de votre modèle.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'Navbar', label: 'En-tête (Navbar)', icon: Menu, color: 'text-blue-500 bg-blue-50' },
                    { type: 'Hero', label: 'Bannière (Hero)', icon: Sparkles, color: 'text-indigo-500 bg-indigo-50' },
                    { type: 'Stats', label: 'Statistiques', icon: Layers, color: 'text-amber-500 bg-amber-50' },
                    { type: 'Car Grid', label: 'Grille Véhicules', icon: FileText, color: 'text-red-500 bg-red-50' },
                    { type: 'Services', label: 'Services', icon: HelpCircle, color: 'text-emerald-500 bg-emerald-50' },
                    { type: 'Testimonials', label: 'Avis Clients', icon: MessageSquare, color: 'text-pink-500 bg-pink-50' },
                    { type: 'Contact', label: 'Formulaire Lead', icon: Phone, color: 'text-cyan-500 bg-cyan-50' },
                    { type: 'Contact Bar', label: 'Barre WhatsApp', icon: MessageSquare, color: 'text-green-500 bg-green-50' },
                    { type: 'Map', label: 'Carte d\'accès', icon: MapPin, color: 'text-teal-500 bg-teal-50' },
                    { type: 'Text', label: 'Texte Libre', icon: FileText, color: 'text-purple-500 bg-purple-50' },
                    { type: 'Image', label: 'Bannière Image', icon: ImageIcon, color: 'text-slate-500 bg-slate-50' },
                    { type: 'Footer', label: 'Pied-de-page', icon: Menu, color: 'text-gray-500 bg-gray-50' }
                  ].map(sec => {
                    const SecIcon = sec.icon
                    return (
                      <button
                        key={sec.type}
                        onClick={() => addSection(sec.type as SectionType)}
                        className="p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-350 hover:shadow-xs transition duration-200 flex flex-col items-center gap-1.5 text-center cursor-pointer group"
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${sec.color} group-hover:scale-105`}>
                          <SecIcon className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 leading-none">{sec.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB STYLE: GLOBAL BRAND SETTINGS */}
            {activeTab === 'style' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Charte de Marque</h3>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">Ces paramètres personnalisent l'ensemble de votre vitrine en temps réel.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Couleur Primaire (Red/Branding)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={config.global.primaryColor}
                        onChange={e => updateGlobalField('primaryColor', e.target.value)}
                        className="w-10 h-8 rounded-lg p-0 border border-slate-200 shrink-0 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config.global.primaryColor}
                        onChange={e => updateGlobalField('primaryColor', e.target.value)}
                        className="h-8 rounded-lg border-slate-200 font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Couleur Secondaire (Fonds Sombre)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={config.global.secondaryColor}
                        onChange={e => updateGlobalField('secondaryColor', e.target.value)}
                        className="w-10 h-8 rounded-lg p-0 border border-slate-200 shrink-0 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config.global.secondaryColor}
                        onChange={e => updateGlobalField('secondaryColor', e.target.value)}
                        className="h-8 rounded-lg border-slate-200 font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Typographie Principale</Label>
                    <select
                      value={config.global.fontFamily}
                      onChange={e => updateGlobalField('fontFamily', e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 text-xs px-2 text-slate-700 bg-white"
                    >
                      <option value="Outfit">Outfit (Moderne & Premium)</option>
                      <option value="Inter">Inter (Épuré & Corporatif)</option>
                      <option value="Roboto">Roboto (Technologique)</option>
                      <option value="Montserrat">Montserrat (Luxe & Majuscules)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Logo de Concession (URL)</Label>
                    <Input
                      value={config.global.logoUrl}
                      onChange={e => updateGlobalField('logoUrl', e.target.value)}
                      className="h-8 rounded-lg border-slate-200 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase">Paramètres SEO</h4>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Titre SEO de la page</Label>
                    <Input
                      value={config.global.seoTitle}
                      onChange={e => updateGlobalField('seoTitle', e.target.value)}
                      placeholder="e.g. Amine Auto | Showroom Premium"
                      className="h-8 rounded-lg border-slate-200 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Description SEO de la page</Label>
                    <Textarea
                      value={config.global.seoDescription}
                      onChange={e => updateGlobalField('seoDescription', e.target.value)}
                      placeholder="e.g. Vente et importation de voitures d'Europe..."
                      className="rounded-lg border-slate-200 text-xs h-16 min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB REVISIONS: LOAD PAST REVISIONS */}
            {activeTab === 'revisions' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Historique des versions</h3>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">Restaurez des sauvegardes publiées de votre design (limité à 10 versions).</p>
                </div>

                <div className="space-y-2">
                  {revisions.map((rev, index) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5 hover:border-slate-350 transition duration-150 text-xs text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800">Version #{rev.revision_number}</span>
                        {index === 0 && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase">Actif</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold leading-none">
                        Publiée le : {new Date(rev.published_at || rev.created_at).toLocaleString()}
                      </span>
                      <Button
                        onClick={() => handleLoadRevision(rev.id, rev.revision_number)}
                        variant="secondary"
                        className="h-7 text-[10px] font-black rounded-lg w-full mt-1.5 hover:bg-slate-100 cursor-pointer"
                      >
                        Charger cette révision
                      </Button>
                    </div>
                  ))}

                  {revisions.length === 0 && (
                    <div className="border border-dashed rounded-xl p-6 text-center text-slate-400 text-[10px]">
                      Aucune révision enregistrée. Publiez pour créer la première version.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* B. CANVAS PREVIEW VIEWPORT (MIDDLE AREA) */}
        <main className="flex-1 min-h-0 bg-slate-100 p-8 overflow-y-auto flex justify-center">
          <div className={`transition-all duration-300 w-full flex flex-col ${
            agency?.business_type_slug === 'car_showroom' ? 'bg-[#0f0f0f] text-white' : 'bg-white text-slate-800'
          } ${
            previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-slate-300 rounded-xl' :
            previewDevice === 'mobile' ? 'max-w-[375px] shadow-2xl border-[10px] border-slate-900 rounded-[40px] h-[780px] overflow-y-auto relative' :
            'w-full shadow-sm'
          }`}>
            
            {/* Device-specific header demo */}
            {previewDevice === 'mobile' && (
              <div className="h-6 shrink-0 bg-slate-900 text-[8px] px-6 text-slate-400 flex items-center justify-between font-bold z-10 sticky top-0">
                <span>09:41</span>
                <span className="w-16 h-3.5 rounded-full bg-black mx-auto shrink-0 border border-slate-700/50" />
                <span>📶 🔋</span>
              </div>
            )}

            {/* List of configuration sections in canvas */}
            <div className="flex-1 flex flex-col">
              {config.sections.map((sec, index) => {
                const isSelected = selectedSectionId === sec.id
                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`relative group border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10'
                        : 'border-transparent hover:border-slate-300 hover:bg-slate-50/20'
                    }`}
                  >
                    
                    {/* Controls overlay */}
                    <div className="absolute top-2.5 right-2.5 z-10 bg-slate-900/90 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-800 gap-1.5 items-center hidden group-hover:flex">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'up') }}
                        disabled={index === 0}
                        className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                        title="Monter"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'down') }}
                        disabled={index === config.sections.length - 1}
                        className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                        title="Descendre"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateSection(sec) }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                        title="Dupliquer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSection(sec.id) }}
                        className="p-1 rounded-lg text-red-400 hover:text-red-300 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className={`${sec.style.paddingY} px-6 border-b border-dashed border-slate-200/50`} style={{ backgroundColor: sec.style.backgroundColor, color: sec.style.textColor, textAlign: sec.style.alignment }}>
                      {sec.type === 'Navbar' && (
                        agency?.business_type_slug === 'car_showroom' ? (
                          <div className="flex items-center justify-between w-full text-xs font-bold py-2 select-none text-white">
                            <div className="flex items-center gap-2.5">
                              <img src={config.global.logoUrl || '/images/logo.png'} alt="Logo" className="h-7 w-auto shrink-0 rounded-md object-contain" />
                            </div>
                            <div className="hidden md:flex items-center gap-6">
                              {sec.content.links?.map((lnk: any, idx: number) => (
                                <span key={idx} className={`${idx === 0 ? 'text-white' : 'text-white/70'} hover:text-amber-400 font-extrabold transition text-[10px] uppercase cursor-default`}>{lnk.label}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-white/10 hover:bg-white/20 text-white rounded-md px-2 py-1 text-[9px] font-black uppercase border border-white/10">
                                AR
                              </span>
                              {sec.content.phoneButton && (
                                <span className="bg-amber-400 hover:bg-amber-500 text-black rounded-xl px-3 py-1.5 text-[10px] font-black flex items-center gap-1.5 transition cursor-default">
                                  📞 {config.global.phone || '0560 00 31 06'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full text-xs font-extrabold select-none">
                            <div className="flex items-center gap-2">
                              <img src={config.global.logoUrl} alt="Logo" className="h-6 w-auto shrink-0 rounded-md object-contain" />
                              <span className="text-[11px] font-black">{agency?.company_name || 'Algeria Travel'}</span>
                            </div>
                            <div className="hidden md:flex gap-4">
                              {sec.content.links?.map((lnk: any, idx: number) => (
                                <span key={idx} className="hover:opacity-85 text-[10px] uppercase font-black">{lnk.label}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              {sec.content.phoneButton && (
                                <span className="bg-blue-600 text-white rounded-lg px-2.5 py-1 text-[9px] font-black">
                                  📞 Appeler
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}

                      {/* HERO SECTION */}
                      {sec.type === 'Hero' && (
                        agency?.business_type_slug === 'car_showroom' ? (
                          <div className="max-w-4xl mx-auto space-y-6 py-8 text-center text-white relative">
                            <span className="bg-amber-400/20 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase inline-block">
                              {sec.content.badge || '⚡ NEUF / OCCASION / SUR COMMANDE'}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-white uppercase">
                              {sec.content.headline || 'Importation & Showroom Premium'}
                            </h2>
                            <p className="text-[12px] text-gray-300 leading-relaxed font-semibold max-w-xl mx-auto">
                              {sec.content.subtitle || 'Découvrez les derniers arrivages de véhicules de prestige.'}
                            </p>
                            
                            {/* Brand logos row */}
                            <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
                              {['Volkswagen', 'Škoda', 'BMW', 'Kia', 'Hyundai'].map((brand, idx) => (
                                <div key={idx} className="h-11 w-11 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-white font-extrabold text-[7px] hover:bg-white/10 hover:border-amber-400/40 transition uppercase tracking-tight">
                                  {brand.slice(0, 3)}
                                </div>
                              ))}
                            </div>

                            {/* Search Bar with 3 fields and Yellow/Gold Button */}
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3 shadow-xl">
                              <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 text-left border border-white/5">
                                <span className="text-[8px] text-gray-400 block font-bold uppercase">Marque</span>
                                <span className="text-[11px] text-white font-extrabold block mt-0.5">Toutes les Marques</span>
                              </div>
                              <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 text-left border border-white/5">
                                <span className="text-[8px] text-gray-400 block font-bold uppercase">Modèle</span>
                                <span className="text-[11px] text-white font-extrabold block mt-0.5">Tous les Modèles</span>
                              </div>
                              <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 text-left border border-white/5">
                                <span className="text-[8px] text-gray-400 block font-bold uppercase">Année</span>
                                <span className="text-[11px] text-white font-extrabold block mt-0.5">Année Min</span>
                              </div>
                              <button className="bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-black text-xs uppercase flex items-center justify-center py-3.5 transition">
                                🔍 Rechercher
                              </button>
                            </div>

                            {/* 3 Categories: Neuf, Occasion, Sur Commande */}
                            <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg mx-auto">
                              <div className="bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col items-center gap-1 transition">
                                <span className="text-amber-400 text-xs">⭐</span>
                                <span className="text-[10px] text-white font-black uppercase">Neuf</span>
                              </div>
                              <div className="bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col items-center gap-1 transition">
                                <span className="text-amber-400 text-xs">🛡️</span>
                                <span className="text-[10px] text-white font-black uppercase">Occasion</span>
                              </div>
                              <div className="bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col items-center gap-1 transition">
                                <span className="text-amber-400 text-xs">📝</span>
                                <span className="text-[10px] text-white font-black uppercase">Sur Commande</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-2xl mx-auto space-y-4 py-6">
                            <span className="bg-blue-600/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase inline-block">
                              {sec.content.badge}
                            </span>
                            <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight">
                              {sec.content.headline}
                            </h2>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                              {sec.content.subtitle}
                            </p>
                            <div className="flex justify-center gap-3 pt-2">
                              <span className="bg-blue-600 text-white rounded-xl px-4 py-2 text-[10px] font-black">
                                {sec.content.primaryButtonText}
                              </span>
                              {sec.content.secondaryButtonText && (
                                <span className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-[10px] font-black">
                                  {sec.content.secondaryButtonText}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}

                      {/* STATS SECTION */}
                      {sec.type === 'Stats' && (
                        <div className="space-y-4 select-none">
                          {sec.content.title && <h3 className="text-xs font-black uppercase tracking-widest">{sec.content.title}</h3>}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {sec.content.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex flex-col text-center">
                                <span className="text-xl md:text-2xl font-black">{item.number}</span>
                                <span className="text-[9px] uppercase font-bold opacity-80 mt-0.5">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CAR GRID SECTION */}
                      {sec.type === 'Car Grid' && (
                        agency?.business_type_slug === 'car_showroom' ? (
                          <div className="space-y-6 text-white text-left">
                            <div className="text-center space-y-1.5 max-w-md mx-auto">
                              <h3 className="text-base font-black uppercase tracking-wider text-white">{sec.content.title || 'Derniers Arrivages'}</h3>
                              <p className="text-[10px] text-gray-400 font-semibold">{sec.content.subtitle || 'Nos véhicules disponibles immédiatement'}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                              {[
                                { name: 'Hyundai Tucson N-Line 2024', price: '6,800,000 DZD', spec: 'HYBRID · AUTOMATIC · 15 KM', stock: 'V-2026-001', origin: 'GERMANY (IMPORTED)', vin: 'KMHJ3814...' },
                                { name: 'Seat Leon FR 1.5 TGI', price: '3,850,000 DZD', spec: 'ESSENCE · AUTOMATIQUE · 2023', stock: 'V-2026-002', origin: 'SPAIN (LOCAL)', vin: 'VSSZZZ5F...' },
                                { name: 'Kia Sportage GT-Line', price: '5,900,000 DZD', spec: 'ESSENCE · BOITE AUTO · 2023', stock: 'V-2026-003', origin: 'GERMANY (IMPORTED)', vin: 'U5YPB811...' }
                              ].map((car, idx) => (
                                <div key={idx} className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-amber-400/30 transition">
                                  {/* Image area with badges */}
                                  <div className="h-36 bg-white/5 shrink-0 overflow-hidden relative flex items-center justify-center">
                                    <span className="absolute top-2 left-2 bg-emerald-500 text-white rounded-lg px-2 py-0.5 text-[7px] font-black uppercase tracking-wide">
                                      Available
                                    </span>
                                    <span className="absolute top-2 left-[72px] bg-red-500 text-white rounded-lg px-2 py-0.5 text-[7px] font-black uppercase tracking-wide">
                                      NEW
                                    </span>
                                    <span className="absolute top-2 right-2 bg-blue-500 text-white rounded-lg px-2 py-0.5 text-[7px] font-black uppercase tracking-wide">
                                      À VENDRE
                                    </span>
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                      🚗 Photo Véhicule
                                    </div>
                                  </div>
                                  {/* Info */}
                                  <div className="p-4 space-y-1.5 flex-1 flex flex-col">
                                    <span className="text-[7px] text-gray-500 font-mono uppercase">{car.stock}</span>
                                    <span className="text-[7px] text-gray-500 font-semibold uppercase">{car.origin}</span>
                                    <h4 className="text-[11px] font-extrabold text-white uppercase tracking-tight">{car.name}</h4>
                                    <span className="text-[7px] text-gray-600 font-mono">{car.vin}</span>
                                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">{car.spec}</p>
                                    <div className="pt-1.5 mt-auto">
                                      <span className="text-[8px] text-gray-500 font-bold uppercase block">SELLING PRICE</span>
                                      <span className="text-red-500 font-black text-sm">{car.price}</span>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex gap-2 pt-2">
                                      <span className="flex-1 py-1.5 bg-[#0f0f0f] border border-gray-700 text-white rounded-lg text-[8px] font-black text-center cursor-default flex items-center justify-center gap-1">
                                        📋 Details & Specs
                                      </span>
                                      <span className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-[8px] font-black text-center cursor-default flex items-center justify-center gap-1">
                                        📊 Calculator
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="text-center space-y-1 max-w-md mx-auto">
                              <h3 className="text-sm font-black">{sec.content.title}</h3>
                              <p className="text-[10px] text-slate-400 font-semibold">{sec.content.subtitle}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {[
                                { brand: 'Algeria Travel', model: 'Circuit Sahara Premium', type: 'luxury', count: '10' },
                                { brand: 'Algeria Travel', model: 'Escapade Kabylie Verte', type: 'adventure', count: '5' },
                                { brand: 'Algeria Travel', model: 'Week-end Tipaza Bleue', type: 'general', count: '8' }
                              ].map((demo, idx) => (
                                <div key={idx} className="bg-slate-50 border rounded-2xl p-4 text-left flex flex-col gap-2 shadow-xs select-none">
                                  <div className="h-28 bg-slate-200 rounded-xl shrink-0 overflow-hidden relative">
                                    <span className="absolute top-2 left-2 bg-blue-600 text-white rounded-lg px-2 py-0.5 text-[8px] font-black uppercase">
                                      {demo.type}
                                    </span>
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                      ✈️ [Aperçu Circuit]
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[11px] font-black text-slate-800">{demo.model}</h4>
                                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Places Restantes: {demo.count} voyageurs</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}

                      {/* SERVICES SECTION */}
                      {sec.type === 'Services' && (
                        <div className="space-y-6">
                          <h3 className="text-sm font-black text-center">{sec.content.title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {sec.content.items?.map((item: any, idx: number) => (
                              <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col text-left gap-2 hover:shadow-xs transition">
                                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-black">
                                  ⚡
                                </div>
                                <h4 className="text-[11px] font-black text-slate-800">{item.title}</h4>
                                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">{item.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TESTIMONIALS SECTION */}
                      {sec.type === 'Testimonials' && (
                        <div className="space-y-6 select-none">
                          <h3 className="text-sm font-black text-center">{sec.content.title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sec.content.items?.map((item: any, idx: number) => (
                              <div key={idx} className="bg-slate-50 border rounded-2xl p-5 flex flex-col text-left gap-2.5">
                                <div className="text-amber-400 text-[10px]">⭐⭐⭐⭐⭐</div>
                                <p className="text-[10px] text-slate-650 italic font-semibold leading-relaxed">"{item.quote}"</p>
                                <span className="text-[9px] font-black text-slate-850">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CONTACT SECTION */}
                      {sec.type === 'Contact' && (
                        agency?.business_type_slug === 'car_showroom' ? (
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-center space-y-4 max-w-2xl mx-auto">
                            <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-white">Des questions ? Contactez-nous directement</h3>
                            <p className="text-[10px] text-gray-400 font-medium max-w-md mx-auto">Nos conseillers commerciaux sont disponibles 7j/7 pour répondre à vos demandes d'importation et de stock.</p>
                            <div className="flex justify-center gap-3 pt-2">
                              <a href="https://wa.me/213560003106" target="_blank" className="bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl px-5 py-2.5 text-[10px] font-black flex items-center gap-2 transition shadow-md">
                                💬 Discuter sur WhatsApp
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="space-y-4">
                              <h3 className="text-sm font-black text-slate-800">{sec.content.title}</h3>
                              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{sec.content.subtitle}</p>
                              <div className="space-y-2 text-[10px] font-extrabold text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{config.global.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{config.global.address}</span>
                                </div>
                              </div>
                            </div>
                            
                            {sec.content.showForm && (
                              <div className="bg-white border rounded-2xl p-5 space-y-3">
                                <div className="space-y-1">
                                  <Label className="text-[9px] font-bold uppercase text-slate-400">Nom Complet *</Label>
                                  <Input disabled className="h-8 rounded-lg text-xs" placeholder="e.g. Amine" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] font-bold uppercase text-slate-400">Téléphone *</Label>
                                  <Input disabled className="h-8 rounded-lg text-xs" placeholder="e.g. 0550 00 00 00" />
                                </div>
                                <Button disabled className="w-full bg-slate-900 text-white rounded-lg h-8 text-[10px] font-black mt-2">
                                  Envoyer la demande
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {/* CONTACT BAR SECTION */}
                      {sec.type === 'Contact Bar' && (
                        agency?.business_type_slug === 'car_showroom' ? (
                          <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-[10px] text-gray-400 font-semibold">{sec.content.text}</span>
                            <a href={sec.content.whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg px-4 py-2 text-[9px] font-black flex items-center gap-2 transition shadow-md cursor-pointer">
                              💬 {sec.content.whatsappLabel || 'WhatsApp'}
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-[10px] text-slate-500 font-semibold">{sec.content.text}</span>
                            <span className="bg-[#25D366] text-white rounded-lg px-3 py-1.5 text-[9px] font-black flex items-center gap-1.5">
                              💬 {sec.content.whatsappLabel || 'WhatsApp'}
                            </span>
                          </div>
                        )
                      )}

                      {/* MAP SECTION */}
                      {sec.type === 'Map' && (
                        <div className="h-44 bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-slate-200 select-none">
                          <MapPin className="h-6 w-6 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 mt-1">{sec.content.title || 'Carte Interactive'}</span>
                          <span className="text-[8px] text-slate-400 font-bold mt-0.5">{config.global.address}</span>
                        </div>
                      )}

                      {/* TEXT SECTION */}
                      {sec.type === 'Text' && (
                        <div className="max-w-xl mx-auto space-y-2 py-4">
                          {sec.content.title && <h3 className="text-sm font-black">{sec.content.title}</h3>}
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">{sec.content.body || 'Écrivez votre texte libre ici.'}</p>
                        </div>
                      )}

                      {/* IMAGE SECTION */}
                      {sec.type === 'Image' && (
                        <div className="space-y-2 select-none">
                          <img src={sec.content.imageUrl} alt="Image" className="w-full max-h-56 object-cover rounded-2xl border" />
                          {sec.content.caption && <span className="text-[9px] text-slate-400 font-bold">{sec.content.caption}</span>}
                        </div>
                      )}

                      {/* FOOTER SECTION */}
                      {sec.type === 'Footer' && (
                        agency?.business_type_slug === 'car_showroom' ? (
                          <div className="flex flex-col gap-6 text-[10px] font-semibold select-none text-left text-gray-400">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2.5">
                                <div className="font-extrabold text-[12px] tracking-wider text-white">
                                  <span>AMINE</span>
                                  <span className="text-amber-400 ml-1 font-black">AUTO 35</span>
                                </div>
                                <p className="text-gray-550 leading-normal text-[9px]">{config.global.seoDescription.slice(0, 80)}...</p>
                              </div>
                              <div className="space-y-2 flex flex-col">
                                <h4 className="font-black text-white uppercase text-[9px] tracking-widest">Navigation</h4>
                                <span className="hover:text-amber-400 transition text-[9px]">Accueil</span>
                                <span className="hover:text-amber-400 transition text-[9px]">Stock</span>
                                <span className="hover:text-amber-400 transition text-[9px]">Contact</span>
                              </div>
                              <div className="space-y-2 flex flex-col">
                                <h4 className="font-black text-white uppercase text-[9px] tracking-widest">Réseaux Sociaux</h4>
                                <div className="flex items-center gap-3">
                                  <span className="hover:text-amber-400 transition">Facebook</span>
                                  <span className="hover:text-amber-400 transition">Instagram</span>
                                  <span className="hover:text-amber-400 transition">Twitter</span>
                                </div>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-white/10 text-gray-500 text-[8px] flex justify-between">
                              <span>© 2026 AMINE AUTO 35. Conçu avec le Visual Website Builder.</span>
                              <span className="font-bold text-amber-400">Premium Concession</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6 text-[10px] font-semibold leading-none select-none text-left">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-black text-slate-300 uppercase text-[9px] tracking-widest">{agency?.company_name}</h4>
                                <p className="text-slate-500 leading-normal">{config.global.seoDescription.slice(0, 50)}...</p>
                              </div>
                              {sec.content.columns?.map((col: any, idx: number) => (
                                <div key={idx} className="space-y-2 flex flex-col">
                                  <h4 className="font-black text-slate-300 uppercase text-[9px] tracking-widest">{col.title}</h4>
                                  {col.items?.map((item: any, idy: number) => (
                                    <span key={idy} className="text-slate-500 hover:text-white transition">{item.label}</span>
                                  ))}
                                </div>
                              ))}
                            </div>
                            <div className="pt-4 border-t border-slate-800 text-slate-600 text-[9px] flex justify-between">
                              <span>{sec.content.copyrightText}</span>
                              <span className="font-bold text-red-500">{agency?.company_name}</span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              })}

              {config.sections.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl m-8">
                  <Plus className="h-10 w-10 text-slate-300 stroke-[1.5] mb-2" />
                  <span className="text-xs font-bold">Votre site est vide</span>
                  <span className="text-[10px] mt-0.5">Cliquez sur un élément de la bibliothèque à gauche pour commencer le design.</span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* C. RIGHT SIDEBAR: CONTEXTUAL PROPERTIES PANEL */}
        <aside className="w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col select-none">
          <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50 shrink-0">
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-slate-400 animate-spin-slow" /> Propriétés de Section
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-xs text-slate-700">
            {selectedSection ? (
              <div className="space-y-4">
                
                {/* Header detail */}
                <div className="bg-slate-50 rounded-xl p-3 border">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">{selectedSection.type}</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg font-bold">ID: {selectedSection.id.slice(0, 10)}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal mt-1">Personnalisez le contenu et le style de cette section ci-dessous.</p>
                </div>

                {/* STYLE EDITING FIELDS ROW */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider border-b pb-1.5">Mise en forme (Design)</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase text-slate-400">Espacement (Padding Y)</Label>
                      <select
                        value={selectedSection.style.paddingY}
                        onChange={e => updateSectionStyle(selectedSection.id, 'paddingY', e.target.value)}
                        className="w-full h-8 rounded-lg border border-slate-200 text-[11px] px-2 bg-white"
                      >
                        <option value="py-0">Sans espacement (0px)</option>
                        <option value="py-4">Étroit (16px)</option>
                        <option value="py-8">Moyen (32px)</option>
                        <option value="py-12">Large (48px)</option>
                        <option value="py-16">Très Large (64px)</option>
                        <option value="py-24">Extra Large (96px)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase text-slate-400">Alignement du Texte</Label>
                      <select
                        value={selectedSection.style.alignment}
                        onChange={e => updateSectionStyle(selectedSection.id, 'alignment', e.target.value)}
                        className="w-full h-8 rounded-lg border border-slate-200 text-[11px] px-2 bg-white"
                      >
                        <option value="left">Gauche</option>
                        <option value="center">Centré</option>
                        <option value="right">Droite</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase text-slate-400">Couleur d'arrière-plan</Label>
                      <div className="flex gap-1.5 items-center">
                        <Input
                          type="color"
                          value={selectedSection.style.backgroundColor}
                          onChange={e => updateSectionStyle(selectedSection.id, 'backgroundColor', e.target.value)}
                          className="w-7 h-7 rounded-lg p-0 border border-slate-200 shrink-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={selectedSection.style.backgroundColor}
                          onChange={e => updateSectionStyle(selectedSection.id, 'backgroundColor', e.target.value)}
                          className="h-7 rounded-lg border-slate-200 font-mono text-[9px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase text-slate-400">Couleur du Texte</Label>
                      <div className="flex gap-1.5 items-center">
                        <Input
                          type="color"
                          value={selectedSection.style.textColor}
                          onChange={e => updateSectionStyle(selectedSection.id, 'textColor', e.target.value)}
                          className="w-7 h-7 rounded-lg p-0 border border-slate-200 shrink-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={selectedSection.style.textColor}
                          onChange={e => updateSectionStyle(selectedSection.id, 'textColor', e.target.value)}
                          className="h-7 rounded-lg border-slate-200 font-mono text-[9px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONTENT EDITING FIELDS ROW (Depends on Section Type) */}
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider border-b pb-1.5">Contenus de Section</h4>
                  
                  {/* HERO FIELDS */}
                  {selectedSection.type === 'Hero' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Badge Annonce</Label>
                        <Input value={selectedSection.content.badge} onChange={e => updateSectionField(selectedSection.id, 'badge', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Titre Principal</Label>
                        <Input value={selectedSection.content.headline} onChange={e => updateSectionField(selectedSection.id, 'headline', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Sous-titre descriptif</Label>
                        <Textarea value={selectedSection.content.subtitle} onChange={e => updateSectionField(selectedSection.id, 'subtitle', e.target.value)} className="text-xs rounded-lg border-slate-200 h-16 min-h-[60px]" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Image d'arrière-plan (URL)</Label>
                        <Input value={selectedSection.content.backgroundImage} onChange={e => updateSectionField(selectedSection.id, 'backgroundImage', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-slate-400">Bouton Principal Text</Label>
                          <Input value={selectedSection.content.primaryButtonText} onChange={e => updateSectionField(selectedSection.id, 'primaryButtonText', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-slate-400">Bouton Principal URL</Label>
                          <Input value={selectedSection.content.primaryButtonUrl} onChange={e => updateSectionField(selectedSection.id, 'primaryButtonUrl', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CAR GRID FIELDS */}
                  {selectedSection.type === 'Car Grid' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Titre de la Grille</Label>
                        <Input value={selectedSection.content.title} onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Sous-titre descriptif</Label>
                        <Input value={selectedSection.content.subtitle} onChange={e => updateSectionField(selectedSection.id, 'subtitle', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-slate-400">Voitures par ligne</Label>
                          <select value={selectedSection.content.carsPerRow} onChange={e => updateSectionField(selectedSection.id, 'carsPerRow', Number(e.target.value))} className="w-full h-8 rounded-lg border text-xs px-2 bg-white">
                            <option value={2}>2 colonnes</option>
                            <option value={3}>3 colonnes</option>
                            <option value={4}>4 colonnes</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-slate-400">Afficher Prix</Label>
                          <select value={selectedSection.content.showPrice ? 'true' : 'false'} onChange={e => updateSectionField(selectedSection.id, 'showPrice', e.target.value === 'true')} className="w-full h-8 rounded-lg border text-xs px-2 bg-white">
                            <option value="true">Oui</option>
                            <option value="false">Non</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTACT FIELDS */}
                  {selectedSection.type === 'Contact' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Titre Principal</Label>
                        <Input value={selectedSection.content.title} onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Sous-titre descriptif</Label>
                        <Input value={selectedSection.content.subtitle} onChange={e => updateSectionField(selectedSection.id, 'subtitle', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Afficher Formulaire Lead</Label>
                        <select value={selectedSection.content.showForm ? 'true' : 'false'} onChange={e => updateSectionField(selectedSection.id, 'showForm', e.target.value === 'true')} className="w-full h-8 rounded-lg border text-xs px-2 bg-white">
                          <option value="true">Oui (formulaire actif)</option>
                          <option value="false">Non</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* CONTACT BAR FIELDS */}
                  {selectedSection.type === 'Contact Bar' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Texte d'accroche</Label>
                        <Input value={selectedSection.content.text} onChange={e => updateSectionField(selectedSection.id, 'text', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Lien WhatsApp (URL)</Label>
                        <Input value={selectedSection.content.whatsappUrl} onChange={e => updateSectionField(selectedSection.id, 'whatsappUrl', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Libellé du bouton</Label>
                        <Input value={selectedSection.content.whatsappLabel} onChange={e => updateSectionField(selectedSection.id, 'whatsappLabel', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                    </div>
                  )}

                  {/* MAP FIELDS */}
                  {selectedSection.type === 'Map' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Titre de la carte</Label>
                        <Input value={selectedSection.content.title} onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                    </div>
                  )}

                  {/* TEXT FIELDS */}
                  {selectedSection.type === 'Text' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Titre</Label>
                        <Input value={selectedSection.content.title} onChange={e => updateSectionField(selectedSection.id, 'title', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Texte</Label>
                        <Textarea value={selectedSection.content.body} onChange={e => updateSectionField(selectedSection.id, 'body', e.target.value)} className="text-xs rounded-lg border-slate-200 h-24" />
                      </div>
                    </div>
                  )}

                  {/* IMAGE FIELDS */}
                  {selectedSection.type === 'Image' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">URL de l'image</Label>
                        <Input value={selectedSection.content.imageUrl} onChange={e => updateSectionField(selectedSection.id, 'imageUrl', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Légende</Label>
                        <Input value={selectedSection.content.caption} onChange={e => updateSectionField(selectedSection.id, 'caption', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                    </div>
                  )}

                  {/* FOOTER FIELDS */}
                  {selectedSection.type === 'Footer' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Copyright Text</Label>
                        <Input value={selectedSection.content.copyrightText} onChange={e => updateSectionField(selectedSection.id, 'copyrightText', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200" />
                      </div>
                    </div>
                  )}

                  {/* NAVBAR FIELDS */}
                  {selectedSection.type === 'Navbar' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Barre fixe en haut (Sticky)</Label>
                        <select value={selectedSection.content.sticky ? 'true' : 'false'} onChange={e => updateSectionField(selectedSection.id, 'sticky', e.target.value === 'true')} className="w-full h-8 rounded-lg border text-xs px-2 bg-white">
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-slate-400">Afficher bouton appel</Label>
                        <select value={selectedSection.content.phoneButton ? 'true' : 'false'} onChange={e => updateSectionField(selectedSection.id, 'phoneButton', e.target.value === 'true')} className="w-full h-8 rounded-lg border text-xs px-2 bg-white">
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center text-slate-400 p-4 border border-dashed rounded-2xl">
                <Layers className="h-8 w-8 text-slate-350 stroke-[1.5] mb-1.5" />
                <span className="text-[10px] font-bold">Aucune section sélectionnée</span>
                <span className="text-[9px] mt-0.5">Cliquez sur n'importe quelle section du plan de travail central pour la modifier.</span>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 3. FULL DEVICE SCREEN PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-slate-200">
          <header className="h-14 bg-slate-950 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <span className="text-xs font-black text-white">✨ APERÇU DE VOTRE SITE WEB</span>
            <Button
              onClick={() => setIsPreviewOpen(false)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-8 text-[11px] font-black cursor-pointer"
            >
              Fermer l'aperçu
            </Button>
          </header>
          
          <div className="flex-1 bg-[#0a0e17] overflow-y-auto p-4 md:p-8 flex justify-center">
            <div className="w-full max-w-4xl bg-[#0a0e17] rounded-3xl border border-slate-800 shadow-2xl p-6 overflow-hidden space-y-12">
              <span className="text-[9px] bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-lg font-black uppercase">
                Mode Aperçu Live
              </span>
              
              {/* Dynamic sections render */}
              {config.sections.map(sec => (
                <div key={sec.id} className={`${sec.style.paddingY} border-b border-slate-800/30`} style={{ textAlign: sec.style.alignment, color: sec.style.textColor }}>
                  
                  {sec.type === 'Navbar' && (
                    agency?.business_type_slug === 'car_showroom' ? (
                      <div className="flex items-center justify-between w-full text-xs font-bold py-2 select-none text-white px-4">
                        <div className="flex items-center gap-2.5">
                          <img src={config.global.logoUrl || '/images/logo.png'} alt="Logo" className="h-7 w-auto shrink-0 rounded-md object-contain" />
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                          {sec.content.links?.map((lnk: any, idx: number) => (
                            <span key={idx} className={`${idx === 0 ? 'text-white' : 'text-white/70'} hover:text-amber-400 font-extrabold transition text-[10px] uppercase`}>{lnk.label}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-white/10 hover:bg-white/20 text-white rounded-md px-2 py-1 text-[9px] font-black uppercase border border-white/10">
                            AR
                          </span>
                          {sec.content.phoneButton && (
                            <span className="bg-amber-400 hover:bg-amber-500 text-black rounded-xl px-3 py-1.5 text-[10px] font-black flex items-center gap-1.5 transition">
                              📞 {config.global.phone || '0560 00 31 06'}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs font-extrabold px-4">
                        <div className="flex items-center gap-2">
                          <img src={config.global.logoUrl} alt="Logo" className="h-6 w-auto shrink-0" />
                          <span className="text-[11px] font-black text-white">{agency?.company_name}</span>
                        </div>
                        <div className="flex gap-4">
                          {sec.content.links?.map((lnk: any, idx: number) => (
                            <span key={idx} className="hover:opacity-85 text-slate-350">{lnk.label}</span>
                          ))}
                        </div>
                        <div>
                          {sec.content.phoneButton && (
                            <span className="bg-blue-600 text-white rounded-lg px-2.5 py-1 text-[9px] font-black">
                              📞 {config.global.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {sec.type === 'Hero' && (
                    agency?.business_type_slug === 'car_showroom' ? (
                      <div className="max-w-4xl mx-auto space-y-6 py-8 text-center text-white relative">
                        <span className="bg-amber-400/20 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase inline-block">
                          {sec.content.badge || '⚡ NEUF / OCCASION / SUR COMMANDE'}
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-white uppercase">
                          {sec.content.headline || 'Importation & Showroom Premium'}
                        </h2>
                        <p className="text-[12px] text-gray-300 leading-relaxed font-semibold max-w-xl mx-auto">
                          {sec.content.subtitle || 'Découvrez les derniers arrivages de véhicules de prestige.'}
                        </p>
                        
                        {/* Brand logos row */}
                        <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
                          {['Volkswagen', 'Škoda', 'BMW', 'Kia', 'Hyundai'].map((brand, idx) => (
                            <div key={idx} className="h-11 w-11 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-white font-extrabold text-[7px] hover:bg-white/10 hover:border-amber-400/40 transition uppercase tracking-tight">
                              {brand.slice(0, 3)}
                            </div>
                          ))}
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3 shadow-xl">
                          <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 text-left border border-white/5">
                            <span className="text-[8px] text-gray-400 block font-bold uppercase">Marque</span>
                            <span className="text-[11px] text-white font-extrabold block mt-0.5">Toutes les Marques</span>
                          </div>
                          <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 text-left border border-white/5">
                            <span className="text-[8px] text-gray-400 block font-bold uppercase">Modèle</span>
                            <span className="text-[11px] text-white font-extrabold block mt-0.5">Tous les Modèles</span>
                          </div>
                          <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 text-left border border-white/5">
                            <span className="text-[8px] text-gray-400 block font-bold uppercase">Année</span>
                            <span className="text-[11px] text-white font-extrabold block mt-0.5">Année Min</span>
                          </div>
                          <button className="bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-black text-xs uppercase flex items-center justify-center py-3.5 transition">
                            🔍 Rechercher
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-2xl mx-auto space-y-4 py-8">
                        <span className="bg-blue-600/20 text-blue-500 border border-blue-500/30 px-3 py-1 rounded-full text-[9px] font-black inline-block">
                          {sec.content.badge}
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{sec.content.headline}</h2>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{sec.content.subtitle}</p>
                        <div className="flex justify-center gap-3">
                          <span className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-[10px] font-black">
                            {sec.content.primaryButtonText}
                          </span>
                        </div>
                      </div>
                    )
                  )}

                  {sec.type === 'Stats' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                      {sec.content.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex flex-col text-center">
                          <span className="text-2xl font-black text-white">{item.number}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.type === 'Car Grid' && (
                    agency?.business_type_slug === 'car_showroom' ? (
                      <div className="space-y-6 text-white text-left">
                        <div className="text-center space-y-1.5 max-w-md mx-auto">
                          <h3 className="text-base font-black uppercase tracking-wider text-white">{sec.content.title || 'Derniers Arrivages'}</h3>
                          <p className="text-[10px] text-gray-400 font-semibold">{sec.content.subtitle || 'Nos véhicules disponibles immédiatement'}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          {[
                            { name: 'Hyundai Tucson N-Line 2024', price: '6,800,000 DZD', spec: 'HYBRID · AUTOMATIC · 15 KM', stock: 'V-2026-001', origin: 'GERMANY (IMPORTED)', vin: 'KMHJ3814...' },
                            { name: 'Seat Leon FR 1.5 TGI', price: '3,850,000 DZD', spec: 'ESSENCE · AUTOMATIQUE · 2023', stock: 'V-2026-002', origin: 'SPAIN (LOCAL)', vin: 'VSSZZZ5F...' },
                            { name: 'Kia Sportage GT-Line', price: '5,900,000 DZD', spec: 'ESSENCE · BOITE AUTO · 2023', stock: 'V-2026-003', origin: 'GERMANY (IMPORTED)', vin: 'U5YPB811...' }
                          ].map((car, idx) => (
                            <div key={idx} className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-amber-400/30 transition">
                              <div className="h-36 bg-white/5 shrink-0 overflow-hidden relative flex items-center justify-center">
                                <span className="absolute top-2 left-2 bg-emerald-500 text-white rounded-lg px-2 py-0.5 text-[7px] font-black uppercase tracking-wide">Available</span>
                                <span className="absolute top-2 left-[72px] bg-red-500 text-white rounded-lg px-2 py-0.5 text-[7px] font-black uppercase tracking-wide">NEW</span>
                                <span className="absolute top-2 right-2 bg-blue-500 text-white rounded-lg px-2 py-0.5 text-[7px] font-black uppercase tracking-wide">À VENDRE</span>
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">🚗 Photo Véhicule</div>
                              </div>
                              <div className="p-4 space-y-1.5 flex-1 flex flex-col">
                                <span className="text-[7px] text-gray-500 font-mono uppercase">{car.stock}</span>
                                <span className="text-[7px] text-gray-500 font-semibold uppercase">{car.origin}</span>
                                <h4 className="text-[11px] font-extrabold text-white uppercase tracking-tight">{car.name}</h4>
                                <span className="text-[7px] text-gray-600 font-mono">{car.vin}</span>
                                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">{car.spec}</p>
                                <div className="pt-1.5 mt-auto">
                                  <span className="text-[8px] text-gray-500 font-bold uppercase block">SELLING PRICE</span>
                                  <span className="text-red-500 font-black text-sm">{car.price}</span>
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <span className="flex-1 py-1.5 bg-[#0f0f0f] border border-gray-700 text-white rounded-lg text-[8px] font-black text-center flex items-center justify-center gap-1">📋 Details & Specs</span>
                                  <span className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-[8px] font-black text-center flex items-center justify-center gap-1">📊 Calculator</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 py-6">
                        <h3 className="text-lg font-black text-white text-center">{sec.content.title}</h3>
                        <p className="text-slate-400 text-center text-[10px]">{sec.content.subtitle}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { brand: 'Algeria Travel', model: 'Circuit Sahara Premium', price: '120,000 DZD', spec: '7 Jours • Guide local' },
                            { brand: 'Algeria Travel', model: 'Escapade Kabylie Verte', price: '45,000 DZD', spec: '3 Jours • Pension Complète' }
                          ].map((tour, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 flex flex-col gap-2">
                              <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 font-bold">
                                ✈️ Aperçu Voyage
                              </div>
                              <h4 className="text-[11px] font-black text-white">{tour.model}</h4>
                              <span className="text-[10px] text-blue-500 font-bold">{tour.price}</span>
                              <span className="text-[9px] text-slate-400 font-semibold">{tour.spec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {sec.type === 'Contact Bar' && (
                    <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: sec.style.backgroundColor }}>
                      <span className="text-[10px] text-gray-400 font-semibold">{sec.content.text}</span>
                      <span className="bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg px-4 py-2 text-[9px] font-black flex items-center gap-2 transition shadow-md">
                        💬 {sec.content.whatsappLabel || 'WhatsApp'}
                      </span>
                    </div>
                  )}

                  {sec.type === 'Footer' && (
                    agency?.business_type_slug === 'car_showroom' ? (
                      <div className="flex flex-col gap-6 text-[10px] font-semibold select-none text-left text-gray-400 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2.5">
                            <div className="font-extrabold text-[12px] tracking-wider text-white">
                              <span>AMINE</span>
                              <span className="text-amber-400 ml-1 font-black">AUTO 35</span>
                            </div>
                            <p className="text-gray-550 leading-normal text-[9px]">{config.global.seoDescription.slice(0, 80)}...</p>
                          </div>
                          <div className="space-y-2 flex flex-col">
                            <h4 className="font-black text-white uppercase text-[9px] tracking-widest">Navigation</h4>
                            <span className="hover:text-amber-400 transition text-[9px]">Accueil</span>
                            <span className="hover:text-amber-400 transition text-[9px]">Stock</span>
                            <span className="hover:text-amber-400 transition text-[9px]">Contact</span>
                          </div>
                          <div className="space-y-2 flex flex-col">
                            <h4 className="font-black text-white uppercase text-[9px] tracking-widest">Réseaux Sociaux</h4>
                            <div className="flex items-center gap-3">
                              <span className="hover:text-amber-400 transition text-[9px]">Facebook</span>
                              <span className="hover:text-amber-400 transition text-[9px]">Instagram</span>
                              <span className="hover:text-amber-400 transition text-[9px]">Twitter</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 text-gray-500 text-[8px] flex justify-between">
                          <span>© 2026 AMINE AUTO 35. Conçu avec le Visual Website Builder.</span>
                          <span className="font-bold text-amber-400">Premium Concession</span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-8 border-t border-slate-800 text-[10px] text-slate-500 text-center flex flex-col gap-2">
                        <span>{sec.content.copyrightText}</span>
                        <span className="text-[8px] font-bold text-slate-650">Algeria Travel - Visual Website Builder Active</span>
                      </div>
                    )
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
