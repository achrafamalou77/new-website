// src/app/dashboard/settings/website/templates/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { templatesList } from '@/lib/templates-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateWebsiteConfig } from '@/app/actions/agency'
import { 
  Sparkles, Check, Eye, LayoutGrid, Monitor, Smartphone, 
  ArrowLeft, Palette, ShieldCheck, HeartHandshake, Compass, Loader2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function TemplatesGallery() {
  const router = useRouter()
  const { agencyInfo, websiteConfig, setWebsiteConfig, businessTypeSlug } = useSettingsStore()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const currentTemplateId = (websiteConfig as any)?.active_template_id || 't-aventra-classic'

  // Filter templates list by vertical first
  const activeVertical = businessTypeSlug || 'travel'
  useEffect(() => {
    if (activeVertical === 'ecommerce' || activeVertical === 'online_store') {
      router.replace('/dashboard/store/storefront')
    }
  }, [activeVertical, router])

  const allowedTemplates = templatesList.filter(t => {
    const templateVertical = t.business_type_slug || 'travel'
    return templateVertical === activeVertical
  })

  // Filter templates list by category
  const filteredTemplates = activeCategory === 'all' 
    ? allowedTemplates 
    : allowedTemplates.filter(t => t.category === activeCategory)

  // Switch template keeping user contents
  const handleUseTemplate = async (template: typeof templatesList[0]) => {
    setLoadingTemplateId(template.id)
    try {
      const existingConfig = (websiteConfig || {}) as any
      
      // Preserve content while replacing global styles and structures
      const updatedConfig = {
        ...existingConfig,
        active_template_id: template.id,
        global_styles: template.global_styles,
        // Sync design object for backwards compatibility
        design: {
          ...(existingConfig.design || {}),
          primary_color: template.global_styles.primary_color,
          secondary_color: template.global_styles.secondary_color,
          text_color: template.global_styles.text_color,
          bg_color: template.global_styles.bg_color,
          card_bg_color: template.global_styles.card_bg_color,
          border_color: template.global_styles.border_color,
          font_family: template.global_styles.heading_font,
          heading_size: template.global_styles.base_font_size * 2.5,
          body_size: template.global_styles.base_font_size,
          button_shape: template.global_styles.button_shape,
          button_style: template.global_styles.button_style,
          button_size: template.global_styles.button_size
        },
        structure: template.structure,
        // Preserve content blocks
        content: {
          ...(existingConfig.content || {}),
          section_order: template.structure.sections.map(s => s.type)
        }
      }

      const result = await updateWebsiteConfig(updatedConfig)
      if (result.success) {
        setWebsiteConfig(updatedConfig as any)
        setSuccessId(template.id)
        setTimeout(() => setSuccessId(null), 2000)
      } else {
        alert(result.error || 'Failed to update template.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTemplateId(null)
    }
  }

  // Define categories based on vertical
  const categories = activeVertical === 'car_showroom' 
    ? [
        { id: 'all', label: 'All Designs' },
        { id: 'general', label: 'Classic & Minimal' },
        { id: 'luxury', label: 'Premium & Luxury' },
        { id: 'adventure', label: 'Import & Custom' },
        { id: 'family', label: 'Rental & Fleet' }
      ]
    : [
        { id: 'all', label: 'All Designs' },
        { id: 'general', label: 'Classic & Modern' },
        { id: 'luxury', label: 'Luxury & Serif' },
        { id: 'adventure', label: 'Sahara & Adventure' },
        { id: 'family', label: 'Family & Playful' },
        { id: 'religious', label: 'Umrah & Religious' }
      ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-geist text-left bg-slate-50/50 min-h-screen">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <Link href="/dashboard/settings/website" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Visual Builder
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Palette className="h-6 w-6 text-indigo-500" /> Premium Templates Library
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Select and apply state-of-the-art designs with one-click previewing.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
              activeCategory === cat.id 
                ? 'bg-slate-900 border-slate-950 text-white shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const isActive = currentTemplateId === template.id
          const isSelected = successId === template.id
          
          return (
            <Card key={template.id} className={`overflow-hidden rounded-2xl border transition duration-300 bg-white hover:shadow-xl hover:border-slate-350 flex flex-col ${isActive ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200/80'}`}>
              
              {/* Thumbnail Area with Desktop + Mobile Previews */}
              <div className="relative group aspect-video overflow-hidden bg-slate-100">
                <Image 
                  src={template.thumbnail_url} 
                  alt={template.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover group-hover:scale-105 transition duration-500" 
                />
                
                {/* Visual Indicators Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-3">
                  <a
                    href={`http://${agencyInfo?.subdomain || 'ephedia'}.lvh.me:3000?preview_template_id=${template.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                  >
                    <Eye className="h-4 w-4" /> Live Preview
                  </a>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {isActive && (
                    <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm tracking-wide uppercase flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active Layout
                    </span>
                  )}
                  <span className="bg-slate-900/80 backdrop-blur-sm text-slate-100 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {template.category}
                  </span>
                </div>

                {/* Device previews indicator */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] text-white font-semibold">
                  <Monitor className="h-3 w-3" />
                  <span>Desktop</span>
                  <span className="opacity-50">|</span>
                  <Smartphone className="h-3 w-3" />
                  <span>Mobile</span>
                </div>
              </div>

              {/* Header Info */}
              <CardHeader className="p-5 flex-1 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base font-bold text-slate-800">{template.name}</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                  {template.description}
                </CardDescription>
              </CardHeader>

              {/* Color preset visual preview bar */}
              <div className="px-5 pb-3">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase tracking-wide">Palette:</span>
                  <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: template.global_styles.primary_color }} title="Primary" />
                  <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: template.global_styles.secondary_color }} title="Secondary" />
                  <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: template.global_styles.bg_color }} title="Background" />
                  <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: template.global_styles.border_color }} title="Border" />
                  <span className="text-[10px] font-bold text-slate-500 ml-auto font-mono">{template.global_styles.heading_font}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <CardContent className="p-5 pt-0 mt-auto border-t border-slate-100/80 flex gap-2">
                <a
                  href={`http://${agencyInfo?.subdomain || 'ephedia'}.lvh.me:3000?preview_template_id=${template.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 gap-1.5 transition"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </a>

                <Button
                  onClick={() => handleUseTemplate(template)}
                  disabled={isActive || loadingTemplateId === template.id}
                  className={`flex-[1.5] rounded-xl text-xs font-bold gap-1.5 ${
                    isActive 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-100' 
                      : isSelected 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {loadingTemplateId === template.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Applied!</span>
                    </>
                  ) : isActive ? (
                    <span>Active Template</span>
                  ) : (
                    <span>Use This Template</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
