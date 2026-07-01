'use client'

import { useMemo, useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateWebsiteConfig } from '@/app/actions/agency'
import { uploadBuilderImage } from '@/app/actions/builder'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { templatesList } from '@/lib/templates-data'
import dynamic from 'next/dynamic'
import type PublicSiteType from '@/components/website/PublicSite'

const PublicSite = dynamic(() => import('@/components/website/PublicSite'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-white text-slate-500 text-xs gap-2">
      <div className="w-5.5 h-5.5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      Chargement de l'aperçu...
    </div>
  ),
})

import { Switch } from '@/components/ui/switch'
import {
  Palette,
  Monitor,
  Smartphone,
  Loader2,
  Check,
  Globe,
  ChevronRight,
  ExternalLink,
  FileText,
  LayoutTemplate,
  Save,
  ImagePlus,
  Trash2,
  Home,
  Compass,
  MapPin,
  Phone,
  Settings2,
  Search,
  Type,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const THEME_PRESETS = [
  {
    key: 'aventura',
    name: 'Aventura Bleu',
    primary_color: '#0ea5e9',
    secondary_color: '#0284c7',
    bg_color: '#f0f9ff',
    text_color: '#0f172a',
    card_bg_color: '#ffffff',
    border_color: '#bae6fd',
  },
  {
    key: 'sahara',
    name: 'Sahara Doré',
    primary_color: '#f59e0b',
    secondary_color: '#d97706',
    bg_color: '#fffbeb',
    text_color: '#1c1917',
    card_bg_color: '#ffffff',
    border_color: '#fde68a',
  },
  {
    key: 'emeraude',
    name: 'Émeraude',
    primary_color: '#10b981',
    secondary_color: '#059669',
    bg_color: '#ecfdf5',
    text_color: '#0f172a',
    card_bg_color: '#ffffff',
    border_color: '#a7f3d0',
  },
  {
    key: 'nuit',
    name: 'Nuit Indigo',
    primary_color: '#6366f1',
    secondary_color: '#4f46e5',
    bg_color: '#0f172a',
    text_color: '#f8fafc',
    card_bg_color: '#1e293b',
    border_color: '#334155',
  },
  {
    key: 'bordeaux',
    name: 'Bordeaux Rose',
    primary_color: '#be185d',
    secondary_color: '#9d174d',
    bg_color: '#fff1f2',
    text_color: '#0f172a',
    card_bg_color: '#ffffff',
    border_color: '#fecdd3',
  },
  {
    key: 'classique',
    name: 'Classique Bleu',
    primary_color: '#3b82f6',
    secondary_color: '#1d4ed8',
    bg_color: '#f8fafc',
    text_color: '#1e293b',
    card_bg_color: '#ffffff',
    border_color: '#e2e8f0',
  },
]

const FONTS = ['Inter', 'Cairo', 'Tajawal', 'Montserrat', 'Playfair Display', 'Poppins']
const BUTTON_SHAPES = ['Rounded', 'Pill', 'Square']
const DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

type TabId = 'pages' | 'content' | 'design' | 'themes' | 'settings'

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: 'pages', label: 'Pages', Icon: FileText },
  { id: 'content', label: 'Contenu', Icon: Type },
  { id: 'design', label: 'Style', Icon: Palette },
  { id: 'themes', label: 'Thèmes', Icon: LayoutTemplate },
  { id: 'settings', label: 'Réglages', Icon: Settings2 },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
const labelClass = 'block text-xs font-bold text-slate-600'

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 pb-2">
        {title}
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </label>
  )
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={fieldClass}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<[string, string]>
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      >
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function RangeSlider({
  value,
  min,
  max,
  onChange,
  label,
  unit = '',
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  label: string
  unit?: string
}) {
  return (
    <label className={labelClass}>
      <div className="flex justify-between items-center mb-1">
        <span>{label}</span>
        <span className="font-extrabold text-violet-600">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-violet-600 cursor-pointer"
      />
    </label>
  )
}

function ImageField({
  label,
  value,
  onUrlChange,
  onFileChange,
  uploading,
  placeholder = "Ou coller l'URL de l'image",
}: {
  label: string
  value: string
  onUrlChange: (v: string) => void
  onFileChange: (file: File) => void
  uploading: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <span className={labelClass}>{label}</span>
      {value && (
        <div className="relative w-full h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-2">
          <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => onUrlChange('')}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow transition-colors"
            title="Supprimer l'image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 transition">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
        ) : (
          <ImagePlus className="h-4 w-4 text-slate-500" />
        )}
        <span>{uploading ? 'Téléchargement...' : 'Télécharger une image'}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileChange(file)
          }}
        />
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function TravelWebsiteBuilder({
  activeTrips,
  visaTypes,
}: {
  activeTrips: any[]
  visaTypes: any[]
}) {
  const { agencyInfo, websiteConfig, setWebsiteConfig } = useSettingsStore()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('pages')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  // Debounced config — the preview only updates 400ms after the last edit
  const [debouncedConfig, setDebouncedConfig] = useState<any>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitializedAutoSaveRef = useRef(false)

  const [editorCurrentPage, setEditorCurrentPage] = useState<'home' | 'trips' | 'visas' | 'contact' | 'trip-detail'>('home')
  const [editorSelectedTrip, setEditorSelectedTrip] = useState<any>(null)

  const [liveUrl, setLiveUrl] = useState('#')
  useEffect(() => {
    const host = window.location.host
    const parts = host.split('.')
    const isLocalhost = host.includes('localhost') || host.includes('lvh.me') || host.includes('127.0.0.1')
    const port = window.location.port || '3000'
    if (isLocalhost && parts.length > 1 && parts[0] !== 'localhost') {
      setLiveUrl(`http://${parts[0]}.lvh.me:${port}/`)
      return
    }
    if (!isLocalhost && parts.length > 2) {
      setLiveUrl(`https://${host}/`)
      return
    }
    const sub = agencyInfo?.subdomain || 'monagence'
    if (isLocalhost) {
      setLiveUrl(`http://${sub}.lvh.me:${port}/`)
      return
    }
    const baseDomain = parts.slice(-2).join('.')
    setLiveUrl(`https://${sub}.${baseDomain}/`)
  }, [agencyInfo?.subdomain])

  // ── THEME TAB STATE ──────────────────────────────────────────────────────
  const defaultTheme = THEME_PRESETS[5] // classique
  const [activeThemeKey, setActiveThemeKey] = useState<string>(
    (websiteConfig as any)?.theme_key || 'classique'
  )
  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    (websiteConfig as any)?.active_template_id || 't-traventure-fr'
  )
  const [logoUrl, setLogoUrl] = useState<string>(
    (websiteConfig as any)?.logo_url || (websiteConfig as any)?.design?.logo_url || ''
  )
  const [uploadingImage, setUploadingImage] = useState<'logo' | 'hero' | null>(null)

  const handleImageUpload = async (file: File, target: 'logo' | 'hero') => {
    if (!file) return
    setUploadingImage(target)
    setSaveError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadBuilderImage(formData)
      if (res.success && res.url) {
        if (target === 'logo') {
          setLogoUrl(res.url)
        } else if (target === 'hero') {
          setHeroBgImageUrl(res.url)
        }
      } else {
        setSaveError(res.error || "Une erreur est survenue lors du chargement.")
      }
    } catch (e: any) {
      setSaveError(e.message || "Une erreur est survenue lors du chargement.")
    } finally {
      setUploadingImage(null)
    }
  }

  const [primaryColor, setPrimaryColor] = useState(
    (websiteConfig as any)?.global_styles?.primary_color || defaultTheme.primary_color
  )
  const [secondaryColor, setSecondaryColor] = useState(
    (websiteConfig as any)?.global_styles?.secondary_color || defaultTheme.secondary_color
  )
  const [bgColor, setBgColor] = useState(
    (websiteConfig as any)?.global_styles?.bg_color || defaultTheme.bg_color
  )
  const [textColor, setTextColor] = useState(
    (websiteConfig as any)?.global_styles?.text_color || defaultTheme.text_color
  )
  const [cardBgColor, setCardBgColor] = useState(
    (websiteConfig as any)?.global_styles?.card_bg_color || defaultTheme.card_bg_color
  )
  const [borderColor, setBorderColor] = useState(
    (websiteConfig as any)?.global_styles?.border_color || defaultTheme.border_color
  )
  const [headingFont, setHeadingFont] = useState(
    (websiteConfig as any)?.global_styles?.heading_font || 'Inter'
  )
  const [bodyFont, setBodyFont] = useState(
    (websiteConfig as any)?.global_styles?.body_font || 'Inter'
  )
  const [buttonShape, setButtonShape] = useState(
    (websiteConfig as any)?.global_styles?.button_shape || 'Rounded'
  )
  const [cardRadius, setCardRadius] = useState<number>(
    (websiteConfig as any)?.global_styles?.card_border_radius ?? 14
  )
  const [baseFontSize, setBaseFontSize] = useState<number>(
    (websiteConfig as any)?.global_styles?.base_font_size ?? 16
  )

  // ── HERO TAB STATE ───────────────────────────────────────────────────────
  const [heroTitle, setHeroTitle] = useState(
    (websiteConfig as any)?.content?.hero_title || `Bienvenue chez ${agencyInfo?.company_name || 'notre agence'}`
  )
  const [heroSubtitle, setHeroSubtitle] = useState(
    (websiteConfig as any)?.content?.hero_subtitle ||
      'Réservez votre prochaine aventure de rêve avec nous. Meilleurs prix, guides experts, support 24/7.'
  )
  const [heroCta, setHeroCta] = useState(
    (websiteConfig as any)?.content?.hero_cta_text || 'Explorer nos voyages'
  )
  const [heroSecondaryCta, setHeroSecondaryCta] = useState(
    (websiteConfig as any)?.content?.hero_secondary_cta_text || 'Contactez-nous'
  )
  const [heroBgType, setHeroBgType] = useState<'gradient' | 'solid' | 'image'>(
    (websiteConfig as any)?.content?.hero_bg_type?.toLowerCase() || 'gradient'
  )
  const [heroBgColor, setHeroBgColor] = useState(
    (websiteConfig as any)?.content?.hero_bg_color || '#0f172a'
  )
  const [heroBgImageUrl, setHeroBgImageUrl] = useState(
    (websiteConfig as any)?.content?.hero_bg_url || ''
  )
  const [heroOverlay, setHeroOverlay] = useState<number>(
    (websiteConfig as any)?.content?.hero_overlay ?? 40
  )
  const [heroHeight, setHeroHeight] = useState(
    (websiteConfig as any)?.content?.hero_height || '70vh'
  )
  const [heroBadge, setHeroBadge] = useState(
    (websiteConfig as any)?.content?.hero_badge_text || '🌴 VOYAGES EXCLUSIFS'
  )

  // ── SECTIONS TAB STATE ──────────────────────────────────────────────────
  const [showStats, setShowStats] = useState<boolean>(
    (websiteConfig as any)?.content?.show_stats_bar ?? true
  )
  const [showTrips, setShowTrips] = useState<boolean>(
    (websiteConfig as any)?.content?.show_trips ?? true
  )
  const [showVisas, setShowVisas] = useState<boolean>(
    (websiteConfig as any)?.content?.show_visas ?? true
  )
  const [showWhyUs, setShowWhyUs] = useState<boolean>(
    (websiteConfig as any)?.content?.show_why_choose_us ?? true
  )
  const [showTestimonials, setShowTestimonials] = useState<boolean>(
    (websiteConfig as any)?.content?.show_testimonials ?? true
  )
  const [showContact, setShowContact] = useState<boolean>(
    (websiteConfig as any)?.content?.show_contact_section ?? true
  )
  const [showFooter, setShowFooter] = useState<boolean>(
    (websiteConfig as any)?.content?.show_footer ?? true
  )
  const [tripsPerRow, setTripsPerRow] = useState<number>(
    (websiteConfig as any)?.trips_display?.cards_per_row ?? 3
  )
  const [showTripPrice, setShowTripPrice] = useState<boolean>(
    (websiteConfig as any)?.trips_display?.show_price ?? true
  )
  const [showDurationBadge, setShowDurationBadge] = useState<boolean>(
    (websiteConfig as any)?.trips_display?.show_duration_badge ?? true
  )
  const [showVisaFlag, setShowVisaFlag] = useState<boolean>(true)
  const [showVisaPrice, setShowVisaPrice] = useState<boolean>(true)
  const [showWhatsAppBtn, setShowWhatsAppBtn] = useState<boolean>(true)
  const [copyrightText, setCopyrightText] = useState(
    (websiteConfig as any)?.content?.copyright_text ||
      `© 2026 ${agencyInfo?.company_name || 'Agence'}. All rights reserved.`
  )

  const [statCards, setStatCards] = useState<{ number: string; label: string; icon: string }[]>(
    (websiteConfig as any)?.content?.stats_cards || [
      { number: '15+', label: "Années d'expérience", icon: 'Clock' },
      { number: '12k+', label: 'Clients satisfaits', icon: 'Users' },
      { number: '250+', label: 'Destinations', icon: 'Globe' },
      { number: '5.0', label: 'Note globale', icon: 'Sparkles' },
    ]
  )

  const [whyUsCards, setWhyUsCards] = useState<
    { icon: string; title: string; description: string }[]
  >(
    (websiteConfig as any)?.content?.why_choose_us_cards || [
      {
        icon: 'Compass',
        title: 'Itinéraires Curatés',
        description: 'Voyages artisanaux avec les meilleurs hébergements et guides certifiés.',
      },
      {
        icon: 'Shield',
        title: 'Opérations Sécurisées',
        description: 'Garanties complètes et annulations flexibles pour votre tranquillité.',
      },
      {
        icon: 'HeartHandshake',
        title: 'Support 24/7',
        description: 'Notre équipe est disponible sur WhatsApp à tout moment.',
      },
    ]
  )

  const [testimonials, setTestimonials] = useState<
    { name: string; location: string; quote: string; rating: number }[]
  >(
    (websiteConfig as any)?.content?.testimonials || [
      {
        name: 'Achraf Amalou',
        location: 'Alger',
        quote: 'Voyage exceptionnel! Tout était parfait.',
        rating: 5,
      },
      {
        name: 'Sarah B.',
        location: 'Oran',
        quote: 'Service impeccable, je recommande vivement.',
        rating: 5,
      },
      {
        name: 'Mourad K.',
        location: 'Constantine',
        quote: 'Prix compétitifs et équipe très professionnelle.',
        rating: 4,
      },
    ]
  )

  // ── CONTENT TAB STATE ───────────────────────────────────────────────────
  const [phone, setPhone] = useState(agencyInfo?.phone || '')
  const [email, setEmail] = useState(agencyInfo?.email || '')
  const [address, setAddress] = useState(agencyInfo?.address || '')
  const [whatsappNumber, setWhatsappNumber] = useState(
    (websiteConfig as any)?.content?.footer_social_whatsapp || agencyInfo?.phone || ''
  )
  const [facebook, setFacebook] = useState(
    (websiteConfig as any)?.content?.footer_social_facebook || ''
  )
  const [instagram, setInstagram] = useState(
    (websiteConfig as any)?.content?.footer_social_instagram || ''
  )
  const [tiktok, setTiktok] = useState('')
  const [businessHours, setBusinessHours] = useState<Record<string, string>>({
    saturday: '09:00 - 18:00',
    sunday: '09:00 - 18:00',
    monday: '09:00 - 18:00',
    tuesday: '09:00 - 18:00',
    wednesday: '09:00 - 18:00',
    thursday: '09:00 - 18:00',
    friday: 'Fermé',
  })

  // ── SEO TAB STATE ────────────────────────────────────────────────────────
  const [seoTitle, setSeoTitle] = useState(
    (websiteConfig as any)?.seo?.page_title ||
      `${agencyInfo?.company_name || 'Agence'} — Meilleure Agence de Voyage`
  )
  const [seoDescription, setSeoDescription] = useState(
    (websiteConfig as any)?.seo?.meta_description ||
      'Réservez des voyages inoubliables et des vacances personnalisées avec nous.'
  )
  const [seoKeywords, setSeoKeywords] = useState(
    ((websiteConfig as any)?.seo?.keywords || ['voyage', 'vacances', 'algérie']).join(', ')
  )
  const [ogImageUrl, setOgImageUrl] = useState((websiteConfig as any)?.seo?.og_image || '')

  // ── ADVANCED TAB STATE ───────────────────────────────────────────────────
  const [publishStatus, setPublishStatus] = useState(
    (websiteConfig as any)?.advanced?.publish_status || 'published'
  )
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    (websiteConfig as any)?.advanced?.maintenance_message ||
      'Nous mettons à jour notre site. Revenez bientôt!'
  )
  const [passwordProtection, setPasswordProtection] = useState<boolean>(
    (websiteConfig as any)?.advanced?.password_protection ?? false
  )
  const [headerScripts, setHeaderScripts] = useState(
    (websiteConfig as any)?.advanced?.custom_header_scripts || ''
  )
  const [footerScripts, setFooterScripts] = useState(
    (websiteConfig as any)?.advanced?.custom_footer_scripts || ''
  )

  // ─── RE-SYNC FROM STORE WHEN websiteConfig LOADS ──────────────────────────
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!websiteConfig || initializedRef.current) return
    initializedRef.current = true
    const cfg = websiteConfig as any
    if (cfg?.theme_key) setActiveThemeKey(cfg.theme_key)
    if (cfg?.active_template_id) setActiveTemplateId(cfg.active_template_id)
    if (cfg?.global_styles?.primary_color) setPrimaryColor(cfg.global_styles.primary_color)
    if (cfg?.global_styles?.secondary_color) setSecondaryColor(cfg.global_styles.secondary_color)
    if (cfg?.global_styles?.bg_color) setBgColor(cfg.global_styles.bg_color)
    if (cfg?.global_styles?.text_color) setTextColor(cfg.global_styles.text_color)
    if (cfg?.global_styles?.card_bg_color) setCardBgColor(cfg.global_styles.card_bg_color)
    if (cfg?.global_styles?.border_color) setBorderColor(cfg.global_styles.border_color)
    if (cfg?.global_styles?.heading_font) setHeadingFont(cfg.global_styles.heading_font)
    if (cfg?.global_styles?.body_font) setBodyFont(cfg.global_styles.body_font)
    if (cfg?.global_styles?.button_shape) setButtonShape(cfg.global_styles.button_shape)
    if (cfg?.global_styles?.card_border_radius != null) setCardRadius(cfg.global_styles.card_border_radius)
    if (cfg?.global_styles?.base_font_size) setBaseFontSize(cfg.global_styles.base_font_size)
    if (cfg?.content?.hero_title) setHeroTitle(cfg.content.hero_title)
    if (cfg?.content?.hero_subtitle) setHeroSubtitle(cfg.content.hero_subtitle)
    if (cfg?.content?.hero_cta_text) setHeroCta(cfg.content.hero_cta_text)
    if (cfg?.content?.hero_secondary_cta_text) setHeroSecondaryCta(cfg.content.hero_secondary_cta_text)
    if (cfg?.content?.hero_bg_type) setHeroBgType(cfg.content.hero_bg_type.toLowerCase() as any)
    if (cfg?.content?.hero_bg_color) setHeroBgColor(cfg.content.hero_bg_color)
    if (cfg?.content?.hero_bg_url) setHeroBgImageUrl(cfg.content.hero_bg_url)
    if (cfg?.content?.hero_overlay != null) setHeroOverlay(cfg.content.hero_overlay)
    if (cfg?.content?.hero_height) setHeroHeight(cfg.content.hero_height)
    if (cfg?.content?.hero_badge_text) setHeroBadge(cfg.content.hero_badge_text)
    if (cfg?.content?.show_stats_bar != null) setShowStats(cfg.content.show_stats_bar)
    if (cfg?.content?.show_trips != null) setShowTrips(cfg.content.show_trips)
    if (cfg?.content?.show_visas != null) setShowVisas(cfg.content.show_visas)
    if (cfg?.content?.show_why_choose_us != null) setShowWhyUs(cfg.content.show_why_choose_us)
    if (cfg?.content?.show_testimonials != null) setShowTestimonials(cfg.content.show_testimonials)
    if (cfg?.content?.show_contact_section != null) setShowContact(cfg.content.show_contact_section)
    if (cfg?.content?.show_footer != null) setShowFooter(cfg.content.show_footer)
    if (cfg?.content?.copyright_text) setCopyrightText(cfg.content.copyright_text)
    if (cfg?.content?.footer_social_facebook) setFacebook(cfg.content.footer_social_facebook)
    if (cfg?.content?.footer_social_instagram) setInstagram(cfg.content.footer_social_instagram)
    if (cfg?.content?.footer_social_whatsapp) setWhatsappNumber(cfg.content.footer_social_whatsapp)
    if (cfg?.content?.stats_cards?.length) setStatCards(cfg.content.stats_cards)
    if (cfg?.content?.why_choose_us_cards?.length) setWhyUsCards(cfg.content.why_choose_us_cards)
    if (cfg?.content?.testimonials?.length) setTestimonials(cfg.content.testimonials)
    if (cfg?.trips_display?.cards_per_row) setTripsPerRow(cfg.trips_display.cards_per_row)
    if (cfg?.trips_display?.show_price != null) setShowTripPrice(cfg.trips_display.show_price)
    if (cfg?.trips_display?.show_duration_badge != null) setShowDurationBadge(cfg.trips_display.show_duration_badge)
    if (cfg?.seo?.page_title) setSeoTitle(cfg.seo.page_title)
    if (cfg?.seo?.meta_description) setSeoDescription(cfg.seo.meta_description)
    if (cfg?.seo?.keywords?.length) setSeoKeywords(cfg.seo.keywords.join(', '))
    if (cfg?.seo?.og_image) setOgImageUrl(cfg.seo.og_image)
    if (cfg?.advanced?.publish_status) setPublishStatus(cfg.advanced.publish_status)
    if (cfg?.advanced?.maintenance_message) setMaintenanceMessage(cfg.advanced.maintenance_message)
    if (cfg?.advanced?.password_protection != null) setPasswordProtection(cfg.advanced.password_protection)
    if (cfg?.advanced?.custom_header_scripts) setHeaderScripts(cfg.advanced.custom_header_scripts)
    if (cfg?.advanced?.custom_footer_scripts) setFooterScripts(cfg.advanced.custom_footer_scripts)
  }, [websiteConfig])

  // ─── APPLY PRESET THEME ────────────────────────────────────────────────────
  const applyTheme = useCallback(
    (key: string) => {
      const preset = THEME_PRESETS.find((t) => t.key === key)
      if (!preset) return
      setActiveThemeKey(key)
      setPrimaryColor(preset.primary_color)
      setSecondaryColor(preset.secondary_color)
      setBgColor(preset.bg_color)
      setTextColor(preset.text_color)
      setCardBgColor(preset.card_bg_color)
      setBorderColor(preset.border_color)
    },
    [
      setActiveThemeKey,
      setPrimaryColor,
      setSecondaryColor,
      setBgColor,
      setTextColor,
      setCardBgColor,
      setBorderColor,
    ]
  )

  const handleSelectTemplate = useCallback(
    (template: any) => {
      setActiveTemplateId(template.id)
      
      // Apply global styles
      if (template.global_styles) {
        setPrimaryColor(template.global_styles.primary_color || '#3b82f6')
        setSecondaryColor(template.global_styles.secondary_color || '#1d4ed8')
        setBgColor(template.global_styles.bg_color || '#f8fafc')
        setTextColor(template.global_styles.text_color || '#1e293b')
        setCardBgColor(template.global_styles.card_bg_color || '#ffffff')
        setBorderColor(template.global_styles.border_color || '#e2e8f0')
        setHeadingFont(template.global_styles.heading_font || 'Inter')
        setBodyFont(template.global_styles.body_font || 'Inter')
        setButtonShape(template.global_styles.button_shape || 'Rounded')
        setCardRadius(template.global_styles.card_border_radius ?? 14)
        setBaseFontSize(template.global_styles.base_font_size ?? 16)
      }

      // Apply layout structure / sections visibility
      const sectionTypes = template.structure?.sections?.map((s: any) => s.type) || []
      setShowStats(sectionTypes.includes('Stats'))
      setShowTrips(sectionTypes.includes('Trips'))
      setShowVisas(sectionTypes.includes('Visas'))
      setShowWhyUs(sectionTypes.includes('WhyUs'))
      setShowTestimonials(sectionTypes.includes('Testimonials'))
      setShowContact(sectionTypes.includes('Contact'))

      // Also extract template content if specified
      const heroSection = template.structure?.sections?.find((s: any) => s.type === 'Hero')
      if (heroSection && heroSection.content) {
        if (heroSection.content.title) setHeroTitle(heroSection.content.title)
        if (heroSection.content.subtitle) setHeroSubtitle(heroSection.content.subtitle)
        if (heroSection.content.primary_cta) setHeroCta(heroSection.content.primary_cta)
        if (heroSection.content.secondary_cta) setHeroSecondaryCta(heroSection.content.secondary_cta)
        if (heroSection.content.badge) setHeroBadge(heroSection.content.badge)
        if (heroSection.content.image_url) setHeroBgImageUrl(heroSection.content.image_url)
      }
    },
    [
      setActiveTemplateId,
      setPrimaryColor,
      setSecondaryColor,
      setBgColor,
      setTextColor,
      setCardBgColor,
      setBorderColor,
      setHeadingFont,
      setBodyFont,
      setButtonShape,
      setCardRadius,
      setBaseFontSize,
      setShowStats,
      setShowTrips,
      setShowVisas,
      setShowWhyUs,
      setShowTestimonials,
      setShowContact,
      setHeroTitle,
      setHeroSubtitle,
      setHeroCta,
      setHeroSecondaryCta,
      setHeroBadge,
      setHeroBgImageUrl,
    ]
  )

  // ─── BUILD CONFIG FOR PREVIEW ─────────────────────────────────────────────
  const builtConfig = useMemo(() => {
    return {
      logo_url: logoUrl,
      theme_key: activeThemeKey,
      active_template_id: activeTemplateId,
      design: {
        logo_url: logoUrl,
      },
      global_styles: {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: secondaryColor,
        text_color: textColor,
        bg_color: bgColor,
        card_bg_color: cardBgColor,
        border_color: borderColor,
        heading_font: headingFont,
        body_font: bodyFont,
        base_font_size: baseFontSize,
        button_shape: buttonShape,
        button_style: 'Filled',
        button_size: 'Medium',
        card_border_radius: cardRadius,
        heading_size: Math.round(baseFontSize * 2.5),
        body_size: baseFontSize,
      },
      content: {
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_cta_text: heroCta,
        hero_primary_cta_text: heroCta,
        hero_secondary_cta_text: heroSecondaryCta,
        hero_bg_type: heroBgType.charAt(0).toUpperCase() + heroBgType.slice(1),
        hero_bg_color: heroBgColor,
        hero_bg_url: heroBgImageUrl,
        hero_overlay: heroOverlay,
        hero_height: heroHeight,
        hero_badge_text: heroBadge,
        show_stats_bar: showStats,
        show_trips: showTrips,
        show_visas: showVisas,
        show_why_choose_us: showWhyUs,
        show_testimonials: showTestimonials,
        show_contact_section: showContact,
        show_footer: showFooter,
        copyright_text: copyrightText,
        footer_social_facebook: facebook,
        footer_social_instagram: instagram,
        footer_social_whatsapp: whatsappNumber,
        footer_social_enabled: true,
        footer_columns: 4,
        show_logo_in_navbar: true,
        show_agency_name_in_navbar: true,
        navbar_style: 'Glassmorphism',
        sticky_navbar: true,
        show_search_bar: true,
        show_newsletter: false,
        section_order: ['Hero', 'Stats', 'Why Choose Us', 'Trips', 'Testimonials', 'Footer'],
        stats_cards: statCards,
        why_choose_us_cards: whyUsCards,
        testimonials: testimonials,
        hero_cta_link: 'trips',
      },
      trips_display: {
        ...(websiteConfig as any)?.trips_display,
        cards_per_row: tripsPerRow,
        show_price: showTripPrice,
        show_duration_badge: showDurationBadge,
        show_trip_image: true,
        card_style: 'Standard',
        book_now_text: 'Réserver',
        book_now_style: 'Solid filled',
        enable_search: true,
        enable_filter_destination: true,
        enable_filter_price: true,
        default_sort: 'Newest first',
      },
      seo: {
        page_title: seoTitle,
        meta_description: seoDescription,
        keywords: seoKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0),
        keywords_tags: seoKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0),
        og_image: ogImageUrl,
        og_image_upload: '',
        favicon: '',
        twitter_card_style: 'Summary Large Image',
        google_analytics_id: '',
        facebook_pixel_id: '',
        google_search_console: '',
      },
      advanced: {
        publish_status: publishStatus,
        maintenance_mode: publishStatus === 'maintenance',
        maintenance_message: maintenanceMessage,
        password_protection: passwordProtection,
        password_hash: '',
        custom_header_scripts: headerScripts,
        custom_footer_scripts: footerScripts,
        cookie_consent: false,
        cookie_message: '',
      },
      structure: {
        sections: [
          {
            id: 'hero-main',
            type: 'Hero',
            variant: 'full',
            visibility: { desktop: true, mobile: true },
            styles: {
              bg_type: heroBgType,
              bg_color: heroBgType === 'solid' ? heroBgColor : '#0f172a',
              text_color: '#ffffff',
              padding_top: 20,
              padding_bottom: 20,
              animation: 'fade',
            },
            content: {
              title: heroTitle,
              subtitle: heroSubtitle,
              primary_cta: heroCta,
              secondary_cta: heroSecondaryCta,
              badge: heroBadge,
              image_url: heroBgImageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
            },
          },
          ...(showStats
            ? [
                {
                  id: 'stats-bar',
                  type: 'Stats',
                  variant: 'grid',
                  visibility: { desktop: true, mobile: true },
                  styles: {
                    bg_type: 'solid',
                    bg_color: bgColor,
                    text_color: textColor,
                    padding_top: 8,
                    padding_bottom: 8,
                  },
                  content: { items: statCards },
                },
              ]
            : []),
          ...(showWhyUs
            ? [
                {
                  id: 'why-choose-us',
                  type: 'WhyUs',
                  variant: 'cards',
                  visibility: { desktop: true, mobile: true },
                  styles: {
                    bg_type: 'solid',
                    bg_color: cardBgColor,
                    text_color: textColor,
                    padding_top: 12,
                    padding_bottom: 12,
                  },
                  content: {
                    title: 'Pourquoi nous choisir ?',
                    subtitle: 'Des services pensés pour votre satisfaction.',
                    items: whyUsCards,
                  },
                },
              ]
            : []),
          ...(showTrips
            ? [
                {
                  id: 'trips-main',
                  type: 'Trips',
                  variant: `grid-${tripsPerRow}`,
                  visibility: { desktop: true, mobile: true },
                  styles: {
                    bg_type: 'solid',
                    bg_color: bgColor,
                    text_color: textColor,
                    padding_top: 12,
                    padding_bottom: 12,
                  },
                  content: {
                    title: 'Nos Voyages',
                    subtitle: 'Toutes les offres actives avec détails complets',
                  },
                },
              ]
            : []),
          ...(showVisas
            ? [
                {
                  id: 'visas-main',
                  type: 'Visas',
                  variant: 'cards',
                  visibility: { desktop: true, mobile: true },
                  styles: {
                    bg_type: 'solid',
                    bg_color: cardBgColor,
                    text_color: textColor,
                    padding_top: 12,
                    padding_bottom: 12,
                  },
                  content: { title: 'Services Visa', subtitle: 'Types de visa, délais et coûts' },
                },
              ]
            : []),
          ...(showTestimonials
            ? [
                {
                  id: 'testimonials',
                  type: 'Testimonials',
                  variant: 'cards',
                  visibility: { desktop: true, mobile: true },
                  styles: {
                    bg_type: 'solid',
                    bg_color: bgColor,
                    text_color: textColor,
                    padding_top: 12,
                    padding_bottom: 12,
                  },
                  content: {
                    title: 'Témoignages',
                    subtitle: 'Ce que disent nos clients',
                    items: testimonials,
                  },
                },
              ]
            : []),
          ...(showContact
            ? [
                {
                  id: 'contact-main',
                  type: 'Contact',
                  variant: 'simple',
                  visibility: { desktop: true, mobile: true },
                  styles: {
                    bg_type: 'solid',
                    bg_color: cardBgColor,
                    text_color: textColor,
                    padding_top: 12,
                    padding_bottom: 12,
                  },
                  content: { title: 'Contactez-nous' },
                },
              ]
            : []),
        ],
      },
    }
  }, [
    activeThemeKey,
    primaryColor,
    secondaryColor,
    bgColor,
    textColor,
    cardBgColor,
    borderColor,
    headingFont,
    bodyFont,
    baseFontSize,
    buttonShape,
    cardRadius,
    heroTitle,
    heroSubtitle,
    heroCta,
    heroSecondaryCta,
    heroBgType,
    heroBgColor,
    heroBgImageUrl,
    heroOverlay,
    heroHeight,
    heroBadge,
    showStats,
    showTrips,
    showVisas,
    showWhyUs,
    showTestimonials,
    showContact,
    showFooter,
    tripsPerRow,
    showTripPrice,
    showDurationBadge,
    copyrightText,
    facebook,
    instagram,
    whatsappNumber,
    statCards,
    whyUsCards,
    testimonials,
    seoTitle,
    seoDescription,
    seoKeywords,
    ogImageUrl,
    publishStatus,
    maintenanceMessage,
    passwordProtection,
    headerScripts,
    footerScripts,
    websiteConfig,
    logoUrl,
  ])

  // Update debouncedConfig 400ms after builtConfig changes
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedConfig(builtConfig)
    }, 400)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [builtConfig])

  // ─── VALIDATE ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!heroTitle || heroTitle.trim().length < 3) {
      return 'Le titre du hero doit contenir au moins 3 caractères.'
    }
    return null
  }

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const persistConfig = async (showSuccessToast: boolean) => {
    const result = await updateWebsiteConfig(builtConfig, showSuccessToast)
    if (!result.success) {
      setSaveError(result.error || 'Échec de la sauvegarde')
      return false
    }

    setWebsiteConfig(builtConfig as any)

    if (showSuccessToast) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Auto-reload the mobile iframe so it reflects the published changes
      setTimeout(() => {
        const iframe = document.querySelector('.travel-builder-mobile-frame iframe') as HTMLIFrameElement
        if (iframe) {
          const base = liveUrl === '#' ? '/' : liveUrl
          iframe.src = `${base}${base.includes('?') ? '&' : '?'}t=${Date.now()}`
        }
      }, 800)
    }

    return true
  }

  const handleSave = () => {
    const err = validate()
    if (err) {
      setSaveError(err)
      return
    }
    setSaveError('')
    startTransition(async () => {
      await persistConfig(true)
    })
  }

  useEffect(() => {
    if (!hasInitializedAutoSaveRef.current) {
      hasInitializedAutoSaveRef.current = true
      console.log('AUTO-SAVE: Initial mount skipped');
      return
    }

    const builtStr = JSON.stringify(builtConfig);
    const storedStr = JSON.stringify(websiteConfig);
    if (builtStr === storedStr) {
      console.log('AUTO-SAVE: Configs are identical, skipping save.');
      return
    }

    console.log('AUTO-SAVE: Config changed! Diff length:', Math.abs((builtStr || '').length - (storedStr || '').length));
    console.log('AUTO-SAVE: builtStr:', builtStr);
    console.log('AUTO-SAVE: storedStr:', storedStr);

    const err = validate()
    if (err) {
      console.log('AUTO-SAVE: Validation failed:', err);
      return
    }

    console.log('AUTO-SAVE: Scheduling save in 1200ms...');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(async () => {
      console.log('AUTO-SAVE: Executing persistConfig...');
      setIsAutoSaving(true)
      setSaveError('')
      await persistConfig(false)
      setIsAutoSaving(false)
      console.log('AUTO-SAVE: persistConfig completed.');
    }, 1200)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [builtConfig, websiteConfig])

  // ─── AGENCY INFO ──────────────────────────────────────────────────────────
  const agencyForPreview = useMemo(
    () => ({
      ...agencyInfo,
      business_type_slug: 'travel',
      website_config: builtConfig,
      phone,
      email,
      address,
    }),
    [agencyInfo, builtConfig, phone, email, address]
  )

  // ─── RENDER LEFT PANEL CONTENT ─────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      // ──── PAGES ─────────────────────────────────────────────────────────
      case 'pages':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pages du site</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Sélectionnez une page pour modifier son contenu. Les pages de détails des voyages sont générées automatiquement.
              </p>
            </div>
            <div className="space-y-2">
              {[
                { id: 'home', label: 'Accueil (Page principale)', icon: Home },
                { id: 'trips', label: 'Voyages (Catalogue)', icon: Compass },
                { id: 'visas', label: 'Visas (Services)', icon: MapPin },
                { id: 'contact', label: 'Contact & Réseaux', icon: Phone },
              ].map((page) => {
                const Icon = page.icon
                const isCurrent = editorCurrentPage === page.id
                return (
                  <button
                    key={page.id}
                    onClick={() => {
                      setEditorCurrentPage(page.id as any)
                      setEditorSelectedTrip(null)
                      setActiveTab('content')
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                      isCurrent
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {page.label}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                )
              })}
            </div>

            {activeTrips && activeTrips.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Détails des voyages</p>
                <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50 scrollbar-thin">
                  {activeTrips.map((trip) => {
                    const isSelected = editorCurrentPage === 'trip-detail' && editorSelectedTrip?.id === trip.id
                    return (
                      <button
                        key={trip.id}
                        onClick={() => {
                          setEditorSelectedTrip(trip)
                          setEditorCurrentPage('trip-detail')
                          setActiveTab('content')
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span className="truncate pr-2">{trip.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )

      // ──── CONTENT ───────────────────────────────────────────────────────
      case 'content':
        return (
          <div className="space-y-6">
            <button
              onClick={() => setActiveTab('pages')}
              className="text-xs font-black text-violet-600 flex items-center gap-1 hover:underline"
            >
              ← Toutes les pages
            </button>
            <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white flex items-center justify-between">
              <span>
                {editorCurrentPage === 'home' && 'Page Accueil'}
                {editorCurrentPage === 'trips' && 'Voyages (Catalogue)'}
                {editorCurrentPage === 'visas' && 'Visas (Services)'}
                {editorCurrentPage === 'contact' && 'Contact'}
                {editorCurrentPage === 'trip-detail' && 'Détail Voyage'}
              </span>
              {editorCurrentPage === 'trip-detail' && editorSelectedTrip && (
                <span className="text-[10px] bg-violet-600 px-2 py-0.5 rounded font-bold uppercase truncate max-w-[120px]">
                  {editorSelectedTrip.title}
                </span>
              )}
            </div>

            {/* HOME PAGE EDITOR */}
            {editorCurrentPage === 'home' && (
              <div className="space-y-6">
                <PanelSection title="Section Hero (En-tête)">
                  <InputField label="Badge text (ex: 🌴 VOYAGES EXCLUSIFS)" value={heroBadge} onChange={setHeroBadge} />
                  <InputField label="Titre principal" value={heroTitle} onChange={setHeroTitle} />
                  {heroTitle.trim().length > 0 && heroTitle.trim().length < 3 && (
                    <div className="text-red-500 text-[10px] font-bold mt-1">Minimum 3 caractères requis.</div>
                  )}
                  <TextareaField label="Description sous-titre" value={heroSubtitle} onChange={setHeroSubtitle} rows={3} />
                  <InputField label="Texte bouton principal" value={heroCta} onChange={setHeroCta} />
                  <InputField label="Texte bouton secondaire" value={heroSecondaryCta} onChange={setHeroSecondaryCta} />
                  
                  <SelectField
                    label="Type d'arrière-plan"
                    value={heroBgType}
                    onChange={(val) => setHeroBgType(val as any)}
                    options={[
                      ['gradient', 'Dégradé moderne'],
                      ['solid', 'Couleur unie'],
                      ['image', 'Image d\'arrière-plan'],
                    ]}
                  />

                  {heroBgType === 'solid' && (
                    <label className={labelClass}>
                      Couleur d'arrière-plan
                      <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                        <input
                          type="color"
                          value={heroBgColor}
                          onChange={(e) => setHeroBgColor(e.target.value)}
                          className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                        />
                        <input
                          value={heroBgColor}
                          onChange={(e) => setHeroBgColor(e.target.value)}
                          className="min-w-0 flex-1 text-sm font-bold uppercase outline-none text-slate-800"
                        />
                      </span>
                    </label>
                  )}

                  {heroBgType === 'image' && (
                    <>
                      <ImageField
                        label="Image du Hero"
                        value={heroBgImageUrl}
                        onUrlChange={setHeroBgImageUrl}
                        onFileChange={(file) => handleImageUpload(file, 'hero')}
                        uploading={uploadingImage === 'hero'}
                      />
                      <RangeSlider
                        value={heroOverlay}
                        min={0}
                        max={80}
                        onChange={setHeroOverlay}
                        label="Assombrissement de l'image (Overlay)"
                        unit="%"
                      />
                    </>
                  )}

                  <SelectField
                    label="Hauteur de l'en-tête"
                    value={heroHeight}
                    onChange={setHeroHeight}
                    options={[
                      ['60vh', '60% de la hauteur écran'],
                      ['70vh', '70% de la hauteur écran'],
                      ['80vh', '80% de la hauteur écran'],
                      ['100vh', 'Hauteur complète (100vh)'],
                    ]}
                  />
                </PanelSection>

                <PanelSection title="Chiffres clés (Stats)">
                  <div className="grid grid-cols-1 gap-2">
                    {statCards.map((stat, idx) => (
                      <div key={idx} className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <input
                          value={stat.number}
                          onChange={(e) => {
                            const next = [...statCards]
                            next[idx] = { ...next[idx], number: e.target.value }
                            setStatCards(next)
                          }}
                          className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold text-violet-600 text-center outline-none focus:border-violet-500"
                          placeholder="Nombre"
                        />
                        <input
                          value={stat.label}
                          onChange={(e) => {
                            const next = [...statCards]
                            next[idx] = { ...next[idx], label: e.target.value }
                            setStatCards(next)
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500"
                          placeholder="Label"
                        />
                      </div>
                    ))}
                  </div>
                </PanelSection>

                <PanelSection title="Pourquoi nous choisir">
                  <div className="space-y-3">
                    {whyUsCards.map((card, idx) => (
                      <div key={idx} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <input
                          value={card.title}
                          onChange={(e) => {
                            const next = [...whyUsCards]
                            next[idx] = { ...next[idx], title: e.target.value }
                            setWhyUsCards(next)
                          }}
                          placeholder="Titre"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-violet-500"
                        />
                        <textarea
                          value={card.description}
                          onChange={(e) => {
                            const next = [...whyUsCards]
                            next[idx] = { ...next[idx], description: e.target.value }
                            setWhyUsCards(next)
                          }}
                          placeholder="Description"
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-violet-500 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </PanelSection>

                <PanelSection title="Témoignages clients">
                  <div className="space-y-3">
                    {testimonials.map((t, idx) => (
                      <div key={idx} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex gap-2">
                          <input
                            value={t.name}
                            onChange={(e) => {
                              const next = [...testimonials]
                              next[idx] = { ...next[idx], name: e.target.value }
                              setTestimonials(next)
                            }}
                            placeholder="Nom du client"
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-violet-500"
                          />
                          <input
                            value={t.location}
                            onChange={(e) => {
                              const next = [...testimonials]
                              next[idx] = { ...next[idx], location: e.target.value }
                              setTestimonials(next)
                            }}
                            placeholder="Ville"
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-violet-500"
                          />
                        </div>
                        <textarea
                          value={t.quote}
                          onChange={(e) => {
                            const next = [...testimonials]
                            next[idx] = { ...next[idx], quote: e.target.value }
                            setTestimonials(next)
                          }}
                          placeholder="Commentaire ou citation"
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-violet-500 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </PanelSection>
              </div>
            )}

            {/* CONTACT PAGE EDITOR */}
            {editorCurrentPage === 'contact' && (
              <div className="space-y-6">
                <PanelSection title="Coordonnées de contact">
                  <InputField label="Téléphone public" value={phone} onChange={setPhone} placeholder="+213..." />
                  <InputField label="Email public" value={email} onChange={setEmail} placeholder="contact@agence.dz" />
                  <InputField label="Adresse physique" value={address} onChange={setAddress} placeholder="Alger, Algérie" />
                  <InputField label="Numéro WhatsApp (pour le bouton)" value={whatsappNumber} onChange={setWhatsappNumber} placeholder="+213..." />
                </PanelSection>

                <PanelSection title="Réseaux Sociaux">
                  <InputField label="Facebook (URL)" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/..." />
                  <InputField label="Instagram (URL)" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
                  <InputField label="TikTok (URL)" value={tiktok} onChange={setTiktok} placeholder="https://tiktok.com/@..." />
                </PanelSection>

                <PanelSection title="Horaires d'ouverture">
                  <div className="space-y-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-16 text-xs font-bold text-slate-500 uppercase shrink-0">
                          {day === 'saturday' ? 'Samedi' :
                           day === 'sunday' ? 'Dimanche' :
                           day === 'monday' ? 'Lundi' :
                           day === 'tuesday' ? 'Mardi' :
                           day === 'wednesday' ? 'Mercredi' :
                           day === 'thursday' ? 'Jeudi' : 'Vendredi'}
                        </span>
                        <input
                          type="text"
                          value={businessHours[day] || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setBusinessHours(prev => ({ ...prev, [day]: val }))
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500"
                        />
                      </div>
                    ))}
                  </div>
                </PanelSection>
              </div>
            )}

            {/* VOYAGES PAGE HELP */}
            {editorCurrentPage === 'trips' && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 space-y-2.5">
                <strong className="block text-sm">Catalogue Voyages</strong>
                <p>Cette page affiche automatiquement tous vos voyages actifs enregistrés sur le tableau de bord.</p>
                <p>Pour ajouter de nouveaux voyages ou modifier les détails existants, utilisez l'onglet <strong>Voyages</strong> du tableau de bord général.</p>
                <p>Utilisez l'onglet <strong>Réglages</strong> dans la barre latérale pour modifier le nombre de cartes par ligne ou activer/désactiver le prix.</p>
              </div>
            )}

            {/* VISAS PAGE HELP */}
            {editorCurrentPage === 'visas' && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 space-y-2.5">
                <strong className="block text-sm">Gestion des Services Visas</strong>
                <p>Cette page affiche tous les services de visa configurés dans votre agence.</p>
                <p>Vous pouvez ajouter de nouveaux visas ou mettre à jour les tarifs directement dans la section <strong>Visas</strong> du tableau de bord principal.</p>
              </div>
            )}

            {/* TRIP DETAIL EDITOR */}
            {editorCurrentPage === 'trip-detail' && editorSelectedTrip && (
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 space-y-2.5">
                  <strong className="block text-sm">Page Détail Voyage</strong>
                  <p>Cette page affiche l'itinéraire détaillé, les étapes journalières, la galerie d'images et le module de réservation pour le voyage <strong>{editorSelectedTrip.title}</strong>.</p>
                </div>
                <button
                  onClick={() => {
                    setEditorCurrentPage('trips')
                    setEditorSelectedTrip(null)
                  }}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Retour au Catalogue des Voyages
                </button>
              </div>
            )}
          </div>
        )

      // ──── DESIGN ────────────────────────────────────────────────────────
      case 'design':
        return (
          <div className="space-y-6">
            <ImageField
              label="Logo de l'agence"
              value={logoUrl}
              onUrlChange={setLogoUrl}
              onFileChange={(file) => handleImageUpload(file, 'logo')}
              uploading={uploadingImage === 'logo'}
            />

            <PanelSection title="Thèmes prédéfinis">
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isActive = activeThemeKey === preset.key
                  return (
                    <button
                      key={preset.key}
                      onClick={() => applyTheme(preset.key)}
                      className={`w-full overflow-hidden rounded-xl border text-left p-3 transition-all ${
                        isActive
                          ? 'border-violet-500 ring-2 ring-violet-100 bg-violet-50/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="h-10 rounded-lg flex items-center justify-center gap-1.5 mb-2" style={{ backgroundColor: preset.bg_color }}>
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary_color }} />
                        <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: preset.secondary_color }} />
                        <span className="w-2 h-2 rounded opacity-50" style={{ backgroundColor: preset.text_color }} />
                      </div>
                      <span className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800">{preset.name}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-violet-600" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </PanelSection>

            <PanelSection title="Couleurs personnalisées">
              {[
                { label: 'Couleur primaire', value: primaryColor, setter: setPrimaryColor },
                { label: 'Couleur secondaire', value: secondaryColor, setter: setSecondaryColor },
                { label: 'Arrière-plan', value: bgColor, setter: setBgColor },
                { label: 'Texte principal', value: textColor, setter: setTextColor },
                { label: 'Arrière-plan carte', value: cardBgColor, setter: setCardBgColor },
                { label: 'Bordures & lignes', value: borderColor, setter: setBorderColor },
              ].map(({ label, value, setter }, index) => (
                <label key={index} className={labelClass}>
                  {label}
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <input
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="min-w-0 flex-1 text-sm font-bold uppercase outline-none text-slate-800"
                    />
                  </span>
                </label>
              ))}
            </PanelSection>

            <PanelSection title="Typographie & Textes">
              <SelectField
                label="Police des titres"
                value={headingFont}
                onChange={setHeadingFont}
                options={FONTS.map(f => [f, f])}
              />
              <SelectField
                label="Police du corps"
                value={bodyFont}
                onChange={setBodyFont}
                options={FONTS.map(f => [f, f])}
              />
              <RangeSlider
                value={baseFontSize}
                min={14}
                max={20}
                onChange={setBaseFontSize}
                label="Taille de police de base"
                unit="px"
              />
            </PanelSection>

            <PanelSection title="Formes & Angles">
              <label className={labelClass}>Forme des boutons</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {BUTTON_SHAPES.map((shape) => {
                  const isCurrent = buttonShape === shape
                  return (
                    <button
                      key={shape}
                      onClick={() => setButtonShape(shape)}
                      className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all ${
                        isCurrent
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {shape === 'Rounded' ? 'Arrondi' : shape === 'Pill' ? 'Pilule' : 'Carré'}
                    </button>
                  )
                })}
              </div>
              <div className="pt-2">
                <RangeSlider
                  value={cardRadius}
                  min={0}
                  max={24}
                  onChange={setCardRadius}
                  label="Rayon des cartes"
                  unit="px"
                />
              </div>
            </PanelSection>
          </div>
        )

      // ──── SETTINGS ──────────────────────────────────────────────────────
      case 'settings':
        return (
          <div className="space-y-6">
            <PanelSection title="Sections de la page d'accueil">
              <ToggleField label="Stats animées" checked={showStats} onChange={setShowStats} />
              <ToggleField label="Catalogue voyages" checked={showTrips} onChange={setShowTrips} />
              <ToggleField label="Catalogue visas" checked={showVisas} onChange={setShowVisas} />
              <ToggleField label="Pourquoi nous choisir" checked={showWhyUs} onChange={setShowWhyUs} />
              <ToggleField label="Témoignages clients" checked={showTestimonials} onChange={setShowTestimonials} />
              <ToggleField label="Formulaire contact" checked={showContact} onChange={setShowContact} />
              <ToggleField label="Pied de page (Footer)" checked={showFooter} onChange={setShowFooter} />
            </PanelSection>

            {showTrips && (
              <PanelSection title="Options — Section Voyages">
                <label className={labelClass}>Cartes par ligne (desktop)</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTripsPerRow(n)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                        tripsPerRow === n
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {n} colonnes
                    </button>
                  ))}
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <ToggleField label="Afficher le prix du voyage" checked={showTripPrice} onChange={setShowTripPrice} />
                  <ToggleField label="Afficher le badge de durée" checked={showDurationBadge} onChange={setShowDurationBadge} />
                </div>
              </PanelSection>
            )}

            {showVisas && (
              <PanelSection title="Options — Section Visas">
                <ToggleField label="Afficher le drapeau du pays" checked={showVisaFlag} onChange={setShowVisaFlag} />
                <ToggleField label="Afficher le prix du visa" checked={showVisaPrice} onChange={setShowVisaPrice} />
              </PanelSection>
            )}

            {showContact && (
              <PanelSection title="Options — Section Contact">
                <ToggleField label="Activer le bouton WhatsApp" checked={showWhatsAppBtn} onChange={setShowWhatsAppBtn} />
              </PanelSection>
            )}

            {showFooter && (
              <PanelSection title="Options — Footer">
                <InputField label="Texte copyright" value={copyrightText} onChange={setCopyrightText} />
              </PanelSection>
            )}
          </div>
        )

      // ──── THEMES ───────────────────────────────────────────────────────
      case 'themes': {
        const travelTemplates = templatesList.filter(t => (t.business_type_slug || 'travel') === 'travel')
        return (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Bibliothèque de Thèmes</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Sélectionnez un thème pour transformer instantanément le design et la mise en page de votre site.
              </p>
            </div>
            <div className="space-y-3">
              {travelTemplates.map((template) => {
                const isActive = activeTemplateId === template.id
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`flex flex-col w-full text-left overflow-hidden rounded-xl border p-3 transition-all ${
                      isActive
                        ? 'border-violet-500 ring-2 ring-violet-100 bg-violet-50/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 mb-3 border border-slate-150">
                      <img 
                        src={template.thumbnail_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500'} 
                        alt={template.name} 
                        className="w-full h-full object-cover animate-fade-in" 
                      />
                      {isActive && (
                        <div className="absolute top-2 right-2 bg-violet-600 text-white rounded-full p-1 shadow">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-800">{template.name}</span>
                      {template.category && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {template.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium leading-normal">
                      {template.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  // ─── RENDER MAIN LAYOUT ────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-100 font-sans">
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-950">Website Builder</h1>
            {(isPending || isAutoSaving) && (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase text-violet-700 animate-pulse">
                Sauvegarde...
              </span>
            )}
            {saved && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                Sauvegardé
              </span>
            )}
            {saveError && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase text-red-700">
                Erreur
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Voyage Agency · {activeTrips.length} voyages · {visaTypes.length} visas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition"
          >
            Dashboard
          </button>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition"
          >
            Open site <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-violet-700 transition"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Publish
          </button>
        </div>
      </header>

      {saveError && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-2 text-center text-xs font-bold text-red-700">
          {saveError}
        </div>
      )}

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="sticky top-0 z-10 grid grid-cols-6 border-b border-slate-200 bg-white">
            {TABS.map((item) => {
              const Icon = item.Icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 px-1 py-3 text-[9px] font-black border-b-2 transition-all ${
                    activeTab === item.id
                      ? 'border-violet-600 bg-violet-50 text-violet-700'
                      : 'border-transparent text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-5 p-5">
            {renderTabContent()}
          </div>
        </aside>

        <section className="flex flex-col min-h-0 min-w-0 overflow-hidden p-4 lg:p-6">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Live preview · {
                  editorCurrentPage === 'home' ? 'Accueil' :
                  editorCurrentPage === 'trips' ? 'Catalogue Voyages' :
                  editorCurrentPage === 'visas' ? 'Catalogue Visas' :
                  editorCurrentPage === 'contact' ? 'Contact' : 'Détail Voyage'
                }
              </p>
              <p className="text-xs text-slate-400">Aperçu en temps réel de votre site agence de voyage</p>
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`rounded-lg p-2 transition-colors ${previewMode === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`rounded-lg p-2 transition-colors ${previewMode === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={`mx-auto flex flex-1 flex-col min-h-0 w-full overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl transition-all ${previewMode === 'mobile' ? 'max-w-[390px]' : 'max-w-full'}`}>
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 truncate rounded-md bg-white px-3 py-1 text-[10px] text-slate-400">
                {liveUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/{
                  editorCurrentPage === 'home' ? '' :
                  editorCurrentPage === 'trip-detail' ? 'trips/...' :
                  editorCurrentPage
                }
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {previewMode === 'mobile' ? (
                <div className="w-full h-full bg-white flex flex-col justify-between">
                  <div className="flex-1 min-h-0 travel-builder-mobile-frame relative">
                    <iframe
                      src={liveUrl === '#' ? '/' : liveUrl}
                      title="Aperçu Mobile"
                      className="w-full h-full border-none bg-white"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500">
                      💡 Publiez vos changements, puis{' '}
                      <button
                        onClick={() => {
                          const iframe = document.querySelector('.travel-builder-mobile-frame iframe') as HTMLIFrameElement
                          if (iframe) iframe.src = iframe.src
                        }}
                        className="bg-none border-none text-violet-600 hover:text-violet-700 cursor-pointer font-bold underline px-1"
                      >
                        rafraîchissez
                      </button>{' '}
                      pour les voir ici.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full min-h-full bg-white">
                  <PublicSite
                    agency={agencyForPreview}
                    trips={activeTrips}
                    visas={visaTypes}
                    isEditing={true}
                    customConfig={debouncedConfig ?? builtConfig}
                    currentPage={editorCurrentPage}
                    onPageChange={(page) => {
                      setEditorCurrentPage(page);
                      if (page !== 'trip-detail') setEditorSelectedTrip(null);
                    }}
                    selectedTrip={editorSelectedTrip}
                    onSelectedTripChange={(trip) => {
                      setEditorSelectedTrip(trip);
                      setEditorCurrentPage('trip-detail');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default TravelWebsiteBuilder
