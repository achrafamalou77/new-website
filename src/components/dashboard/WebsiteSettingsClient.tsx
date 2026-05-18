// src/components/dashboard/WebsiteSettingsClient.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { updateWebsiteConfig } from '@/app/actions/agency'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, Check, ExternalLink, Globe, ArrowUp, ArrowDown, Eye, EyeOff, Sparkles, Undo, 
  Download, Upload, RefreshCw, Smartphone, Monitor, Shield, Compass, HeartHandshake, 
  Users, Clock, Map, Camera, Plane, Ship, Ticket, Calendar, Phone, Mail, Award, 
  MapPin, Search, Star, MessageSquare, Plus, Trash2, ArrowRight, Palette, Copy, AlertCircle, Save,
  HelpCircle, Video, Code, Landmark, Car
} from 'lucide-react'
import { templatesList } from '@/lib/templates-data'
import PublicSite from '@/components/website/PublicSite'

export function WebsiteSettingsClient({ activeTrips }: { activeTrips: any[] }) {
  const { agencyInfo, websiteConfig, setWebsiteConfig, businessTypeSlug } = useSettingsStore()

  // Initialize with fallback to dynamic template preset based on business vertical
  const [formData, setFormData] = useState<any>(() => {
    const defaultTemplate = templatesList.find(t => t.business_type_slug === (businessTypeSlug || 'travel')) || templatesList[0]
    const config = (websiteConfig || defaultTemplate) as any
    return {
      active_template_id: config.active_template_id || defaultTemplate.id,
      global_styles: { ...defaultTemplate.global_styles, ...(config.global_styles || {}) },
      structure: { 
        sections: config.structure?.sections || defaultTemplate.structure.sections 
      },
      content: { ...((defaultTemplate as any).content || {}), ...(config.content || {}) },
      trips_display: { ...((defaultTemplate as any).trips_display || {}), ...(config.trips_display || {}) },
      seo: { ...((defaultTemplate as any).seo || {}), ...(config.seo || {}) },
      advanced: { ...((defaultTemplate as any).advanced || {}), ...(config.advanced || {}) }
    }
  })

  const [history, setHistory] = useState<any[]>([])
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [activeTab, setActiveTab] = useState<'sections' | 'global' | 'seo' | 'advanced'>('sections')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [customTemplateName, setCustomTemplateName] = useState('')
  const [savedCustomTemplates, setSavedCustomTemplates] = useState<any[]>([])

  // Push state to undo history
  const pushHistory = (state: any) => {
    setHistory(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(state))])
  }

  // Trigger Undo
  const handleUndo = () => {
    if (history.length === 0) return
    const previousState = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    setFormData(previousState)
  }

  // Auto-save loop (every 3 seconds)
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    const timer = setTimeout(() => {
      saveSettings(formData)
    }, 3000)
    return () => clearTimeout(timer)
  }, [formData])

  const saveSettings = async (config: any) => {
    setLoading(true)
    setError('')
    
    const result = await updateWebsiteConfig(config)
    
    if (result.success) {
      setSaved(true)
      setWebsiteConfig(config)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error || 'Failed to save website configurations')
    }
    setLoading(false)
  }

  // 14 Draggable / Clickable Sections Library items
  const SECTION_LIBRARY = [
    { type: 'Hero', name: 'Hero Banner', icon: Sparkles, desc: 'Introductory slider or cover image with prominent CTA', defaultVariant: 'full' },
    { type: 'Stats', name: 'Numeric Stats', icon: Clock, desc: 'Display client numbers, trips, guides and certifications', defaultVariant: 'grid' },
    { type: 'Trips', name: 'Trips Grid', icon: Plane, desc: 'Visual 3-column grid displaying travel destination catalog', defaultVariant: 'grid-3' },
    { type: 'WhyUs', name: 'Why Choose Us', icon: Shield, desc: 'List cards highlighting key agency unique values', defaultVariant: 'cards' },
    { type: 'Testimonials', name: 'Client Testimonials', icon: Star, desc: 'Client quotes and feedback reviews with avatar initials', defaultVariant: 'grid' },
    { type: 'Gallery', name: 'Photo Gallery', icon: Camera, desc: 'Stunning collage or masonry grid of destination photos', defaultVariant: 'grid' },
    { type: 'FAQ', name: 'Collapsible FAQs', icon: HelpCircle, desc: 'Accordion listings covering agency refund or visa process policies', defaultVariant: 'accordion' },
    { type: 'Team', name: 'Consultants Team', icon: Users, desc: 'Introduce expert local guides and holiday curators', defaultVariant: 'grid' },
    { type: 'Blog', name: 'Travel Blog Advice', icon: Map, desc: 'Editorial articles for active tourists and travelers', defaultVariant: 'grid' },
    { type: 'Contact', name: 'Contact Form & Coordinates', icon: Mail, desc: 'Simulated feedback forms with phone number, email & maps', defaultVariant: 'split' },
    { type: 'Text', name: 'Rich Editorial Paragraph', icon: MessageSquare, desc: 'Custom title alongside multi-column text paragraphs', defaultVariant: 'centered' },
    { type: 'Video', name: 'YouTube Showcase', icon: Video, desc: 'Embed YouTube tour videos or custom drone playbacks', defaultVariant: 'boxed' },
    { type: 'HTML', name: 'Developer HTML Embed', icon: Code, desc: 'Inject custom CSS scripts, widgets or HTML blocks', defaultVariant: 'raw' },
    { type: 'Banner', name: 'Announcement countdown', icon: Ticket, desc: 'Urgent promotions, timers or discount ribbon alert lines', defaultVariant: 'promotional' }
  ];

  // Add Section to Canvas
  const addSection = (sectionType: string) => {
    pushHistory(formData);
    const libraryMatch = SECTION_LIBRARY.find(s => s.type === sectionType);
    const newSectionId = `sec-${sectionType.toLowerCase()}-${Date.now()}`;
    
    const newSection = {
      id: newSectionId,
      type: sectionType,
      variant: libraryMatch?.defaultVariant || 'grid',
      visibility: { desktop: true, mobile: true },
      styles: {
        bg_type: 'color',
        bg_color: '#ffffff',
        text_color: '#1e293b',
        padding_top: 16,
        padding_bottom: 16
      },
      content: getSectionDefaultContent(sectionType)
    };

    setFormData((prev: any) => ({
      ...prev,
      structure: {
        sections: [...prev.structure.sections, newSection]
      }
    }));
    setSelectedSectionId(newSectionId);
  };

  // Add Section to specific Index in Canvas
  const addSectionAtIndex = (sectionType: string, index: number) => {
    pushHistory(formData);
    const libraryMatch = SECTION_LIBRARY.find(s => s.type === sectionType);
    const newSectionId = `sec-${sectionType.toLowerCase()}-${Date.now()}`;
    
    const newSection = {
      id: newSectionId,
      type: sectionType,
      variant: libraryMatch?.defaultVariant || 'grid',
      visibility: { desktop: true, mobile: true },
      styles: {
        bg_type: 'color',
        bg_color: '#ffffff',
        text_color: '#1e293b',
        padding_top: 16,
        padding_bottom: 16
      },
      content: getSectionDefaultContent(sectionType)
    };

    setFormData((prev: any) => {
      const newSections = [...prev.structure.sections];
      newSections.splice(index, 0, newSection);
      return {
        ...prev,
        structure: {
          ...prev.structure,
          sections: newSections
        }
      };
    });
    setSelectedSectionId(newSectionId);
    setInsertIndex(null); // Close picker
  };

  // Section Default contents provisioner
  const getSectionDefaultContent = (type: string) => {
    const isCar = businessTypeSlug === 'car_showroom';
    switch (type) {
      case 'Hero':
        return {
          badge: isCar ? '🚗 EXCLUSIVE SHOWROOM' : '🌴 EXPLORE EXCLUSIVES',
          title: isCar ? 'Find Your Perfect Drive' : 'Discover Dream Horizons',
          subtitle: isCar 
            ? "Algeria's most premium multi-brand vehicle inventory. Virtual test drives, flexible bank partnership financing, and instant expert support."
            : 'Best package prices, expert tour curators and 24/7 client booking assistants.',
          primary_cta: isCar ? 'Explore Inventory' : 'Explore Trips',
          secondary_cta: isCar ? 'Schedule Test Drive' : 'Contact Us'
        };
      case 'Stats':
        return {
          items: isCar ? [
            { number: '250+', label: 'Vehicles Sold', icon: 'Car' },
            { number: '4.9★', label: 'Client Reviews', icon: 'Star' },
            { number: '100%', label: 'Financing Approved', icon: 'Landmark' },
            { number: '24/7', label: 'Showroom Assistant', icon: 'Clock' }
          ] : [
            { number: '12K+', label: 'Happy Tourists', icon: 'Users' },
            { number: '4.9★', label: 'Client Reviews', icon: 'Star' },
            { number: '15+', label: 'Desert Safaris', icon: 'Compass' },
            { number: '24/7', label: 'Local Guides', icon: 'Clock' }
          ]
        };
      case 'WhyUs':
        return {
          title: isCar ? 'Why Choose Our Dealership?' : 'Why Travel With Ephedia?',
          subtitle: isCar 
            ? 'Uncompromising vehicle quality, certified inspections, and flexible bank financing.'
            : 'Uncompromising quality, custom routes and local support.',
          items: isCar ? [
            { icon: 'Shield', title: 'Certified Inspections', description: 'Every vehicle passes a rigorous 150-point technical check before listing.' },
            { icon: 'HeartHandshake', title: 'Bank Partnerships', description: 'Flexible financing integrations with local banking entities: CPA, AGB, BADR, BDL.' },
            { icon: 'Compass', title: 'Nationwide Transport', description: 'Secure shipment and registration processing across all 58 Algerian wilayas.' }
          ] : [
            { icon: 'Shield', title: 'Secured Payments', description: 'Easy CCP receipts matching and online deposit structures.' },
            { icon: 'HeartHandshake', title: 'Top Accommodations', description: 'Curated 4★-5★ hotels with demipension meal plans.' },
            { icon: 'Compass', title: 'Experienced Guides', description: 'Francophone guides detailing historical contexts.' }
          ]
        };
      case 'Trips':
        return {
          title: isCar ? 'Premium Showroom Inventory' : 'Premium Touring Packages',
          subtitle: isCar 
            ? 'Browse our live catalog of certified new, used, and pre-owned automobiles.'
            : 'Browse catalog of active adventures departing from Algiers.'
        };
      case 'Testimonials':
        return {
          title: isCar ? 'What Our Buyers Say' : 'What Our Clients Say',
          items: isCar ? [
            { name: 'Yacine Meziane', quote: 'Organized and professional team. Purchased a Seat Ibiza and the financing application was validated in days.', rating: 5, avatar: 'YM', location: 'Alger' },
            { name: 'Karim Rahal', quote: 'Excellent contact experience! The AI chatbot scheduled my test drive instantly, then walk-in service was top-notch.', rating: 5, avatar: 'KR', location: 'Oran' }
          ] : [
            { name: 'Kamel Benziane', quote: 'An incredible Sahara adventure with the Amine tour team. Service was impeccable!', rating: 5, avatar: 'KB', location: 'Alger' },
            { name: 'Sarah Amalou', quote: 'The Umrah package was meticulously organized. The Amiri hotel was incredibly close.', rating: 5, avatar: 'SA', location: 'Constantine' }
          ]
        };
      case 'FAQ':
        return {
          title: 'Foire Aux Questions'
        };
      case 'Team':
        return {
          title: isCar ? 'Meet Our Showroom Staff' : 'Meet Our Curators'
        };
      case 'Blog':
        return {
          title: isCar ? 'Automotive Advice & News' : 'Latest Travel Tips'
        };
      case 'Contact':
        return {
          title: 'Connect With Us',
          subtitle: isCar 
            ? 'Schedule an on-site visit or review deposit and finance partnership options.'
            : 'Drop us a line or complete payment deposit details.',
          email: 'contact@ephedia.dz',
          phone: '+213 555 12 34 56',
          address: '04 Rue Didouche Mourad, Alger'
        };
      default:
        return {
          title: 'Custom Content Block',
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam id varius dolor.'
        };
    }
  };

  // Move Section Up/Down on Canvas
  const moveSectionOnCanvas = (index: number, direction: 'up' | 'down') => {
    pushHistory(formData);
    const updatedSections = [...formData.structure.sections];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === updatedSections.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[targetIdx];
    updatedSections[targetIdx] = temp;

    setFormData((prev: any) => ({
      ...prev,
      structure: { sections: updatedSections }
    }));
  };

  // Delete Section
  const deleteSection = (sectionId: string) => {
    pushHistory(formData);
    setFormData((prev: any) => ({
      ...prev,
      structure: {
        sections: prev.structure.sections.filter((s: any) => s.id !== sectionId)
      }
    }));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
  };

  // Inline Click content editor callback
  const handleInlineEdit = (sectionId: string, contentKey: string, newValue: any) => {
    setFormData((prev: any) => {
      const sections = [...prev.structure.sections];
      const matchIdx = sections.findIndex(s => s.id === sectionId);
      if (matchIdx === -1) return prev;

      const updatedSection = { ...sections[matchIdx] };
      
      // Update deep nested object key
      if (contentKey.includes('.')) {
        const parts = contentKey.split('.');
        const contentObj = { ...updatedSection.content };
        
        // Handle items.0.title syntax
        if (parts[0] === 'items' && parts.length === 3) {
          const idx = parseInt(parts[1]);
          const key = parts[2];
          const newItems = [...(contentObj.items || [])];
          newItems[idx] = { ...newItems[idx], [key]: newValue };
          contentObj.items = newItems;
        }
        updatedSection.content = contentObj;
      } else {
        updatedSection.content = {
          ...updatedSection.content,
          [contentKey]: newValue
        };
      }

      sections[matchIdx] = updatedSection;
      return { ...prev, structure: { sections } };
    });
  };

  // Export Configurations as JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${agencyInfo?.subdomain || 'agency'}_website_builder_config.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Import Configurations from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8')
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string)
          pushHistory(formData)
          setFormData(parsed)
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        } catch (err) {
          setError('Invalid backup JSON file')
        }
      }
    }
  }

  // Save Custom Template name
  const handleSaveCustomTemplate = () => {
    if (!customTemplateName.trim()) return;
    const newCustom = {
      id: `custom-${Date.now()}`,
      name: customTemplateName,
      config: JSON.parse(JSON.stringify(formData))
    };
    setSavedCustomTemplates(prev => [...prev, newCustom]);
    setCustomTemplateName('');
    alert('Visual builder layout successfully saved as a custom reusable template preset!');
  };

  // Revert back to original template defaults
  const handleResetToDefaults = () => {
    if (confirm('Are you absolutely sure you want to reset all canvas sections back to the template defaults? All custom text modifications will be lost.')) {
      pushHistory(formData);
      const defaultTemplate = templatesList.find(t => t.business_type_slug === (businessTypeSlug || 'travel')) || templatesList[0]
      const match = templatesList.find(t => t.id === formData.active_template_id) || defaultTemplate;
      setFormData({
        ...formData,
        structure: match.structure,
        global_styles: match.global_styles
      });
    }
  };

  const selectedSection = formData.structure.sections.find((s: any) => s.id === selectedSectionId);

  return (
    <div className="h-full overflow-y-auto p-6 max-w-7xl mx-auto space-y-6 font-geist text-left bg-slate-50/50 select-none page-enter">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" /> Visual Page Builder
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Design your premium customer catalog visually. Click preview text blocks to edit them inline instantly.</p>
        </div>

        {/* Builder Status, Previews & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          
          <Link href="/dashboard/settings/website/templates" className="inline-flex items-center justify-center h-9 px-4 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 shadow-sm mr-2 gap-1.5">
            <Palette className="h-3.5 w-3.5 text-indigo-500" /> Templates Library
          </Link>

          {history.length > 0 && (
            <Button
              onClick={handleUndo}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-xs text-slate-650 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
              title="Undo last change"
            >
              <Undo className="h-3.5 w-3.5" /> Undo
            </Button>
          )}

          <Button
            onClick={handleExportJSON}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

          <label className="inline-flex items-center justify-center h-9 px-3 border border-slate-200 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-sm">
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Import
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
            {saved && (
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full animate-bounce">
                <Check className="h-3.5 w-3.5 mr-1" /> Auto-Saved
              </span>
            )}
            
            <a
              href={`http://${agencyInfo?.subdomain || 'ephedia'}.localhost:3000`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white gap-2 shadow-sm transition"
            >
              <Globe className="h-4 w-4" /> Live Website <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span><strong>Validation error:</strong> {error}</span>
        </div>
      )}

      {/* Main Split Screen Visual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Section Library & Global Styling (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-slate-200/60 p-1.5 rounded-2xl shadow-sm">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="bg-transparent gap-1 p-0 flex w-full border-0">
                <TabsTrigger value="sections" className="rounded-xl text-xs font-bold py-2 px-3 flex-1 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 border-0 transition duration-150">🧱 Layout Sections</TabsTrigger>
                <TabsTrigger value="global" className="rounded-xl text-xs font-bold py-2 px-3 flex-1 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 border-0 transition duration-150">🎨 Global Styles</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Section Library tab */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              
              {/* Selected Section Settings Editor Panel */}
              {selectedSection ? (
                <Card className="bg-white border border-indigo-200 rounded-2xl shadow-md overflow-hidden text-left ring-2 ring-indigo-500/20">
                  <CardHeader className="border-b border-slate-150 p-5 bg-indigo-50/20 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold tracking-tight text-indigo-900 uppercase">Section Editor</CardTitle>
                      <CardDescription className="text-[10px] text-indigo-500 mt-0.5">Parameters for the selected: {selectedSection.type}</CardDescription>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => setSelectedSectionId(null)} className="h-6 text-slate-500 hover:text-slate-900 text-[10px] font-bold">
                      Close
                    </Button>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs font-medium">
                    
                    {/* Layout Variants Picker */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Layout Variant Style</Label>
                      <Select 
                        value={selectedSection.variant} 
                        onValueChange={v => {
                          pushHistory(formData);
                          setFormData((prev: any) => {
                            const secs = [...prev.structure.sections];
                            const idx = secs.findIndex(s => s.id === selectedSectionId);
                            if (idx !== -1) secs[idx].variant = v;
                            return { ...prev, structure: { sections: secs } };
                          });
                        }}
                      >
                        <SelectTrigger className="rounded-xl bg-slate-100 border-0 text-xs font-bold text-slate-800 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          {selectedSection.type === 'Hero' && (
                            <>
                              <SelectItem value="full">High Impact Full Cover</SelectItem>
                              <SelectItem value="split">Clean Editorial Split Side</SelectItem>
                              <SelectItem value="minimal">Ultra Centered Minimalism</SelectItem>
                            </>
                          )}
                          {selectedSection.type === 'Stats' && (
                            <>
                              <SelectItem value="grid">Grid Segment Blocks</SelectItem>
                              <SelectItem value="bar">Thin Row Banner Line</SelectItem>
                              <SelectItem value="boxed">Dark Boxed Segment Cards</SelectItem>
                            </>
                          )}
                          {selectedSection.type === 'Trips' && (
                            <>
                              <SelectItem value="grid-3">3-Column Grid Cards</SelectItem>
                              <SelectItem value="list">Stretched Vertical Rows</SelectItem>
                            </>
                          )}
                          {selectedSection.type === 'WhyUs' && (
                            <>
                              <SelectItem value="cards">Border Outlines Grid</SelectItem>
                              <SelectItem value="accordion">Collapsible List Folds</SelectItem>
                            </>
                          )}
                          {selectedSection.type === 'Testimonials' && (
                            <>
                              <SelectItem value="grid">Standard Column Reviewers</SelectItem>
                              <SelectItem value="slider">Marquee Transition Slider</SelectItem>
                            </>
                          )}
                          {/* Fallback standard variants */}
                          {!['Hero', 'Stats', 'Trips', 'WhyUs', 'Testimonials'].includes(selectedSection.type) && (
                            <>
                              <SelectItem value="grid">Default Grid</SelectItem>
                              <SelectItem value="list">Stretched List</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Background Type picker */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Background Styling Type</Label>
                      <Select 
                        value={selectedSection.styles?.bg_type || 'color'} 
                        onValueChange={v => {
                          pushHistory(formData);
                          setFormData((prev: any) => {
                            const secs = [...prev.structure.sections];
                            const idx = secs.findIndex(s => s.id === selectedSectionId);
                            if (idx !== -1) secs[idx].styles = { ...secs[idx].styles, bg_type: v };
                            return { ...prev, structure: { sections: secs } };
                          });
                        }}
                      >
                        <SelectTrigger className="rounded-xl bg-slate-100 border-0 text-xs font-bold text-slate-800 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="color">Solid Background Color</SelectItem>
                          <SelectItem value="gradient">Theme Gradient Tone</SelectItem>
                          <SelectItem value="image">Custom Background Image URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSection.styles?.bg_type === 'image' && (
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Label className="text-[10px] font-bold text-slate-500">Background Image URL</Label>
                        <Input 
                          placeholder="https://images.unsplash.com/photo-..." 
                          className="h-8 rounded-lg text-xs"
                          value={selectedSection.content?.image_url || ''}
                          onChange={e => {
                            pushHistory(formData);
                            setFormData((prev: any) => {
                              const secs = [...prev.structure.sections];
                              const idx = secs.findIndex(s => s.id === selectedSectionId);
                              if (idx !== -1) secs[idx].content = { ...secs[idx].content, image_url: e.target.value };
                              return { ...prev, structure: { sections: secs } };
                            });
                          }}
                        />
                      </div>
                    )}

                    {/* Section Top Padding */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Top padding</span>
                        <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{selectedSection.styles?.padding_top || 16}px</span>
                      </div>
                      <Slider 
                        min={4} 
                        max={32} 
                        value={[selectedSection.styles?.padding_top || 16]} 
                        onValueChange={(v: any) => {
                          setFormData((prev: any) => {
                            const secs = [...prev.structure.sections];
                            const idx = secs.findIndex(s => s.id === selectedSectionId);
                            if (idx !== -1) secs[idx].styles = { ...secs[idx].styles, padding_top: v[0] };
                            return { ...prev, structure: { sections: secs } };
                          });
                        }}
                      />
                    </div>

                    {/* Section Bottom Padding */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Bottom padding</span>
                        <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{selectedSection.styles?.padding_bottom || 16}px</span>
                      </div>
                      <Slider 
                        min={4} 
                        max={32} 
                        value={[selectedSection.styles?.padding_bottom || 16]} 
                        onValueChange={(v: any) => {
                          setFormData((prev: any) => {
                            const secs = [...prev.structure.sections];
                            const idx = secs.findIndex(s => s.id === selectedSectionId);
                            if (idx !== -1) secs[idx].styles = { ...secs[idx].styles, padding_bottom: v[0] };
                            return { ...prev, structure: { sections: secs } };
                          });
                        }}
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <Button 
                        onClick={() => deleteSection(selectedSection.id)}
                        className="flex-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] font-bold rounded-xl h-8 gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Segment
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              ) : null}

              {/* Add New Section Drawer Library */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden text-left">
                <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                  <CardTitle className="text-sm font-bold tracking-tight text-slate-800">Section Library</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500 font-medium">Click any library component card below to insert it dynamically at the bottom of your live canvas stack.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto">
                  {SECTION_LIBRARY.map(libItem => {
                    const LibIcon = libItem.icon;
                    return (
                      <button
                        key={libItem.type}
                        onClick={() => addSection(libItem.type)}
                        className="group w-full border border-slate-100 hover:border-indigo-400 hover:shadow bg-slate-50/20 hover:bg-indigo-50/5 p-3 rounded-xl text-left flex gap-3 transition"
                      >
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 group-hover:bg-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0 transition">
                          <LibIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{libItem.name}</span>
                            <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-400 px-1 rounded uppercase tracking-wider">Add</span>
                          </h4>
                          <p className="text-[9px] text-slate-400 leading-snug mt-0.5 truncate">{libItem.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>

            </div>
          )}

          {/* Global Design variables tab */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              
              {/* Theme custom colors */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden text-left">
                <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                  <CardTitle className="text-xs font-bold tracking-tight text-slate-800 uppercase">Global Color Palette</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500 font-medium">Fine-tune individual hex colors across all templates at once.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'Primary', key: 'primary_color' },
                    { label: 'Secondary', key: 'secondary_color' },
                    { label: 'Text', key: 'text_color' },
                    { label: 'Background', key: 'bg_color' },
                    { label: 'Card BG', key: 'card_bg_color' },
                    { label: 'Border Color', key: 'border_color' }
                  ].map(c => (
                    <div key={c.key} className="space-y-1 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      <Label className="text-[10px] font-bold text-slate-500">{c.label}</Label>
                      <div className="flex gap-1.5">
                        <input 
                          type="color" 
                          className="w-7 h-7 p-0 rounded-md cursor-pointer border border-slate-200 shrink-0 bg-white" 
                          value={formData.global_styles[c.key]} 
                          onChange={e => {
                            pushHistory(formData);
                            setFormData((prev: any) => ({
                              ...prev,
                              global_styles: { ...prev.global_styles, [c.key]: e.target.value }
                            }));
                          }} 
                        />
                        <Input 
                          className="rounded-lg h-7 border-slate-250 text-[10px] font-mono font-bold uppercase p-1.5 focus:bg-white" 
                          value={formData.global_styles[c.key]} 
                          onChange={e => {
                            pushHistory(formData);
                            setFormData((prev: any) => ({
                              ...prev,
                              global_styles: { ...prev.global_styles, [c.key]: e.target.value }
                            }));
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Typography Variables */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden text-left">
                <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                  <CardTitle className="text-xs font-bold tracking-tight text-slate-800 uppercase">Typography System</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs font-medium">
                  
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500">Heading Font Pair</Label>
                    <Select 
                      value={formData.global_styles.heading_font} 
                      onValueChange={v => {
                        pushHistory(formData);
                        setFormData((prev: any) => ({
                          ...prev,
                          global_styles: { ...prev.global_styles, heading_font: v }
                        }));
                      }}
                    >
                      <SelectTrigger className="rounded-xl bg-slate-100 border-0 text-xs font-bold text-slate-800 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="Inter">Inter (Modern Clean)</SelectItem>
                        <SelectItem value="Poppins">Poppins (Sleek Geometric)</SelectItem>
                        <SelectItem value="Cairo">Cairo (Bold Sahara Arabic)</SelectItem>
                        <SelectItem value="Amiri">Amiri (Traditional Serif)</SelectItem>
                        <SelectItem value="Geist">Geist (High Contrast Architecture)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Heading Size</span>
                        <span className="text-indigo-600 bg-indigo-50 px-1 rounded">{formData.global_styles.heading_size || 40}px</span>
                      </div>
                      <Slider 
                        min={20} 
                        max={60} 
                        value={[formData.global_styles.heading_size || 40]} 
                        onValueChange={(v: any) => {
                          setFormData((prev: any) => ({
                            ...prev,
                            global_styles: { ...prev.global_styles, heading_size: v[0] }
                          }));
                        }}
                      />
                    </div>

                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Body Size</span>
                        <span className="text-indigo-600 bg-indigo-50 px-1 rounded">{formData.global_styles.body_size || 16}px</span>
                      </div>
                      <Slider 
                        min={12} 
                        max={24} 
                        value={[formData.global_styles.body_size || 16]} 
                        onValueChange={(v: any) => {
                          setFormData((prev: any) => ({
                            ...prev,
                            global_styles: { ...prev.global_styles, body_size: v[0] }
                          }));
                        }}
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Showroom financing settings */}
              {businessTypeSlug === 'car_showroom' && (
                <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden text-left">
                  <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                    <CardTitle className="text-xs font-bold tracking-tight text-slate-800 uppercase flex items-center gap-1.5">
                      <Landmark className="h-4 w-4 text-emerald-500" /> Showroom Financing Settings
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-medium">Configure default parameters for the dynamic financing calculators.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs font-medium">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Default Interest Rate (APR)</span>
                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">{(formData.advanced?.default_interest_rate !== undefined ? formData.advanced.default_interest_rate : 7.5).toFixed(2)}%</span>
                      </div>
                      <Slider 
                        min={1} 
                        max={25} 
                        step={0.1}
                        value={[formData.advanced?.default_interest_rate !== undefined ? formData.advanced.default_interest_rate : 7.5]} 
                        onValueChange={(v: any) => {
                          setFormData((prev: any) => ({
                            ...prev,
                            advanced: {
                              ...prev.advanced,
                              default_interest_rate: v[0]
                            }
                          }));
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Custom template saves */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden text-left">
                <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                  <CardTitle className="text-xs font-bold tracking-tight text-slate-800 uppercase">Save Custom Template</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500 font-medium">Backup modified configurations as custom reusable layouts.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Template Name (e.g. Winter 2026)" 
                      className="rounded-xl text-xs font-semibold h-9"
                      value={customTemplateName}
                      onChange={e => setCustomTemplateName(e.target.value)}
                    />
                    <Button 
                      onClick={handleSaveCustomTemplate}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-4 h-9 shrink-0 gap-1"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Layout
                    </Button>
                  </div>

                  {savedCustomTemplates.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Saved Custom Presets:</span>
                      {savedCustomTemplates.map(cust => (
                        <div key={cust.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border text-xs">
                          <span className="font-bold text-slate-700">{cust.name}</span>
                          <Button 
                            variant="ghost" 
                            size="xs" 
                            onClick={() => {
                              pushHistory(formData);
                              setFormData(cust.config);
                            }}
                            className="text-[10px] text-indigo-600 font-extrabold hover:text-indigo-800 h-6"
                          >
                            Load Layout
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

        </div>

        {/* CENTER CANVAS & VIEWPORT (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Viewport Frame Header selector */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Live Visual Canvas</span>
            
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'mobile', label: 'Mobile (375px)', icon: Smartphone },
                { id: 'tablet', label: 'Tablet (768px)', icon: Monitor }, // use Monitor for tablet/desktop representation
                { id: 'desktop', label: 'Desktop (100%)', icon: Monitor }
              ].map(dev => {
                const DevIcon = dev.icon;
                const isCurrent = previewDevice === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => setPreviewDevice(dev.id as any)}
                    className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition ${isCurrent ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    title={dev.label}
                  >
                    <DevIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{dev.id.toUpperCase()}</span>
                  </button>
                )
              })}
            </div>

            <Button 
              onClick={handleResetToDefaults} 
              variant="outline" 
              size="xs"
              className="bg-transparent border-slate-750 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-xl h-8 gap-1 border-slate-700"
            >
              <RefreshCw className="h-3 w-3" /> Revert Defaults
            </Button>
          </div>

          {/* Stacking Sections Visual Organizer Drawer Canvas */}
          <div className="flex flex-col items-center w-full">
            <div 
              className="flex flex-col gap-3 bg-slate-200 border border-slate-300 p-4 rounded-3xl min-h-[400px] transition-all duration-300 w-full"
              style={{
                maxWidth: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
              }}
            >
              <div className="text-center py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider">
                Canvas Stack Start
              </div>

              {formData.structure.sections.map((sec: any, idx: number) => {
                const isSelected = selectedSectionId === sec.id;
                
                return (
                  <div key={sec.id} className="space-y-3 w-full">
                    
                    {/* Inline Add Section Divider Line */}
                    <div className="relative group/divider py-1.5 flex items-center justify-center">
                      <div className="absolute inset-x-0 h-px bg-slate-300 opacity-0 group-hover/divider:opacity-100 transition duration-150" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInsertIndex(idx);
                        }}
                        className="relative z-10 h-7 px-3 rounded-full border border-slate-305 bg-white hover:bg-indigo-50 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 text-[10px] font-bold shadow-sm transition flex items-center gap-1.5 opacity-0 group-hover/divider:opacity-100"
                      >
                        <Plus className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Insert Section Here</span>
                      </button>
                    </div>

                    {/* Inline section insert library choices */}
                    {insertIndex === idx && (
                      <div className="bg-white border-2 border-dashed border-indigo-400 p-4 rounded-2xl animate-fade-in space-y-3 shadow-md">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Choose Section to Insert</span>
                          <Button 
                            variant="ghost" 
                            size="xs" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setInsertIndex(null);
                            }}
                            className="h-5 text-slate-500 hover:text-slate-700 text-[10px] font-bold"
                          >
                            Cancel
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {SECTION_LIBRARY.map(lib => {
                            const Icon = lib.icon;
                            return (
                              <button
                                key={lib.type}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addSectionAtIndex(lib.type, idx);
                                }}
                                className="flex items-center gap-2 p-2 border border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl text-left transition"
                              >
                                <div className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 truncate">{lib.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Main section preview panel */}
                    <div 
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`group relative overflow-hidden transition-all duration-300 rounded-2xl cursor-pointer ${
                        isSelected 
                          ? 'ring-4 ring-indigo-500 bg-indigo-50/5' 
                          : 'hover:ring-2 hover:ring-indigo-400 bg-white shadow-sm border border-slate-200/80'
                      }`}
                    >
                      {/* Canvas section indicators & actions */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition duration-150">
                        <span className="bg-slate-900/90 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                          {sec.type} ({sec.variant})
                        </span>

                        {/* Move controls */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSectionOnCanvas(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 bg-white hover:bg-slate-100 border rounded-lg text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSectionOnCanvas(idx, 'down');
                          }}
                          disabled={idx === formData.structure.sections.length - 1}
                          className="p-1 bg-white hover:bg-slate-100 border rounded-lg text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(sec.id);
                          }}
                          className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Rendering active visual preview element! */}
                      <div className="pointer-events-auto">
                        <PublicSite 
                          agency={agencyInfo} 
                          trips={activeTrips} 
                          isEditing={true} 
                          onContentEdit={handleInlineEdit} 
                          customConfig={{
                            global_styles: formData.global_styles,
                            structure: { sections: [sec] }
                          }}
                        />
                      </div>

                      {/* Overlay outline banner */}
                      <div className={`absolute inset-0 bg-indigo-500/5 transition opacity-0 group-hover:opacity-100 border-2 ${isSelected ? 'border-indigo-500 opacity-100' : 'border-indigo-400'} pointer-events-none rounded-2xl`} />

                    </div>
                  </div>
                );
              })}

              {/* Final divider after the map to allow inserting at the end of the stack */}
              <div className="relative group/divider py-1.5 flex items-center justify-center w-full">
                <div className="absolute inset-x-0 h-px bg-slate-300 opacity-0 group-hover/divider:opacity-100 transition duration-150" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInsertIndex(formData.structure.sections.length);
                  }}
                  className="relative z-10 h-7 px-3 rounded-full border border-slate-300 bg-white hover:bg-indigo-50 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 text-[10px] font-bold shadow-sm transition flex items-center gap-1.5 opacity-0 group-hover/divider:opacity-100"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Insert Section Here</span>
                </button>
              </div>

              {insertIndex === formData.structure.sections.length && (
                <div className="bg-white border-2 border-dashed border-indigo-400 p-4 rounded-2xl animate-fade-in space-y-3 shadow-md w-full">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Choose Section to Insert</span>
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setInsertIndex(null);
                      }}
                      className="h-5 text-slate-500 hover:text-slate-700 text-[10px] font-bold"
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SECTION_LIBRARY.map(lib => {
                      const Icon = lib.icon;
                      return (
                        <button
                          key={lib.type}
                          onClick={(e) => {
                            e.stopPropagation();
                            addSectionAtIndex(lib.type, formData.structure.sections.length);
                          }}
                          className="flex items-center gap-2 p-2 border border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl text-left transition"
                        >
                          <div className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 truncate">{lib.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="text-center py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider">
                Canvas Stack End
              </div>
            </div>
          </div>

          {/* Interactive simulated responsive double previewer iframe/element! */}
          <Card className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-xl">
            <CardHeader className="p-4 border-b border-slate-800 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wide">Interactive Responsive Preview Frame</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500 mt-0.5">Test real-time hover effects, compare drawers, search filters, and responsive resizing.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden bg-slate-850 flex items-center justify-center min-h-[460px] relative">
              
              <div 
                className="overflow-y-auto overflow-x-hidden border border-slate-800 bg-white transition-all duration-300 relative shadow-2xl"
                style={{
                  width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
                  height: '600px'
                }}
              >
                {/* Embed actual upgraded PublicSite loaded dynamically with our state builder! */}
                <PublicSite 
                  agency={{ ...agencyInfo, website_config: formData }} 
                  trips={activeTrips} 
                  isEditing={false} 
                />
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
