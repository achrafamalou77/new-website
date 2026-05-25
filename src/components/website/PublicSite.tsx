// src/components/website/PublicSite.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { templatesList } from '@/lib/templates-data';
import { 
  X, Scale, ChevronRight, HelpCircle, AlertCircle, Plane, Bus, 
  Compass, Ship, Star, Check, Shield, HeartHandshake, Users, 
  Clock, MapPin, Search, Phone, Mail, Award, Calendar, Video, Play, Code
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import ShowroomPublicSite from './ShowroomPublicSite';
import { PERFECT_SHOWROOM_TEMPLATE, type ShowroomBuilderConfig } from '@/lib/car-showroom-builder-template';


interface PublicSiteProps {
  agency: any;
  trips: any[];
  salesCars?: any[];
  rentalCars?: any[];
  isEditing?: boolean;
  onContentEdit?: (sectionId: string, contentKey: string, newValue: any) => void;
  customConfig?: any; // To pass active builder configurations directly in editor
}

// Visual Icons Finder
const getSectionIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Compass, Shield, HeartHandshake, Users, Clock, Star, MapPin, 
    Search, Phone, Mail, Award, Calendar, Plane, Ship, Bus
  };
  return icons[iconName] || Compass;
};

export default function PublicSite({ 
  agency, 
  trips: initialTrips, 
  salesCars: initialSalesCars = [],
  rentalCars: initialRentalCars = [],
  isEditing = false, 
  onContentEdit, 
  customConfig 
}: PublicSiteProps) {
  
  const defaultSalesCars = [
    { id: 'sc-1', brand: 'Hyundai', model: 'Tucson 2.0 Htrac', year: 2026, selling_price: 6500000, condition: 'new', mileage: 0, fuel_type: 'diesel', transmission: 'automatic', cover_image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600', import_type: 'local' },
    { id: 'sc-2', brand: 'Seat', model: 'Ibiza FR Leon', year: 2025, selling_price: 4200000, condition: 'used', mileage: 15000, fuel_type: 'petrol', transmission: 'manual', cover_image_url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600', import_type: 'imported' },
    { id: 'sc-3', brand: 'Kia', model: 'Sportage GT-Line', year: 2026, selling_price: 7400000, condition: 'new', mileage: 0, fuel_type: 'diesel', transmission: 'automatic', cover_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600', import_type: 'local' },
    { id: 'sc-4', brand: 'Toyota', model: 'Land Cruiser Prado', year: 2026, selling_price: 18500000, condition: 'new', mileage: 0, fuel_type: 'diesel', transmission: 'automatic', cover_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600', import_type: 'sur_command' }
  ];

  const defaultRentalCars = [
    { id: 'rc-1', brand: 'Dacia', model: 'Sandero Stepway', year: 2025, daily_rate: 6500, security_deposit: 80000, transmission: 'manual', fuel_type: 'petrol', images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600'], status: 'available' },
    { id: 'rc-2', brand: 'Renault', model: 'Clio 5', year: 2025, daily_rate: 7500, security_deposit: 80000, transmission: 'automatic', fuel_type: 'diesel', images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600'], status: 'available' },
    { id: 'rc-3', brand: 'Hyundai', model: 'Tucson Htrac', year: 2026, daily_rate: 18000, security_deposit: 150000, transmission: 'automatic', fuel_type: 'hybrid', images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600'], status: 'available' }
  ];

  const salesCars = initialSalesCars.length > 0 ? initialSalesCars : defaultSalesCars;
  const rentalCars = initialRentalCars.length > 0 ? initialRentalCars : defaultRentalCars;

  const [trips, setTrips] = useState<any[]>(initialTrips || []);
  const [filteredTrips, setFilteredTrips] = useState<any[]>(initialTrips || []);
  const [comparedTrips, setComparedTrips] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [faqExpanded, setFaqExpanded] = useState<Record<string, boolean>>({});

  // Interactive Showroom Public States
  const [importFobPrice, setImportFobPrice] = useState<number>(4500000);
  const [selectedRentalCar, setSelectedRentalCar] = useState<string>('Dacia Sandero Stepway');
  const [rentalDays, setRentalDays] = useState<number>(3);
  const [selectedSalesCarForLoan, setSelectedSalesCarForLoan] = useState<any>(null);
  const [loanDownPercent, setLoanDownPercent] = useState<number>(30);
  const [loanMonths, setLoanMonths] = useState<number>(48);

  // Autoplay carousel slide index
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  // Brand Logo grid active filter
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  // RentPro Booking Form fields
  const [pickupLocation, setPickupLocation] = useState<string>('Alger Centre');
  const [returnLocation, setReturnLocation] = useState<string>('Alger Centre');
  const [pickupDate, setPickupDate] = useState<string>('2026-05-20');
  const [returnDate, setReturnDate] = useState<string>('2026-05-25');
  const [pickupTime, setPickupTime] = useState<string>('10:00');

  const tripsRef = useRef<HTMLDivElement>(null);

  // Load preview templates from URL or custom configurations
  const [activeTemplate, setActiveTemplate] = useState<any>(null);

  // Autoplay loop for carousel slide
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTrips(initialTrips || []);
    setFilteredTrips(initialTrips || []);
  }, [initialTrips]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const previewId = params.get('preview_template_id');
      if (previewId) {
        const match = templatesList.find(t => t.id === previewId);
        if (match) setActiveTemplate(match);
      }
    }
  }, []);

  // ── CAR SHOWROOM: Use new ShowroomPublicSite with builder config ──────────
  if (agency?.business_type_slug === 'car_showroom') {
    // Try to use the saved new-format builder config (global + sections)
    let showroomConfig: ShowroomBuilderConfig = PERFECT_SHOWROOM_TEMPLATE;
    
    const savedConfig = customConfig || agency?.website_config;
    if (savedConfig?.global?.primaryColor && Array.isArray(savedConfig?.sections) && savedConfig.sections.length > 0) {
      showroomConfig = savedConfig as ShowroomBuilderConfig;
    } else if (savedConfig?.builder_data?.global?.primaryColor && Array.isArray(savedConfig?.builder_data?.sections)) {
      showroomConfig = savedConfig.builder_data as ShowroomBuilderConfig;
    }

    // Merge agency contact info into global
    if (agency) {
      showroomConfig = {
        ...showroomConfig,
        global: {
          ...showroomConfig.global,
          companyName: agency.company_name || showroomConfig.global.companyName,
          phone: agency.phone || showroomConfig.global.phone,
          whatsapp: agency.phone || showroomConfig.global.whatsapp,
          address: agency.address || showroomConfig.global.address,
          logoUrl: agency.website_settings?.logo_url || showroomConfig.global.logoUrl,
        }
      };
    }

    return (
      <ShowroomPublicSite
        config={showroomConfig}
        salesCars={salesCars}
        rentalCars={rentalCars}
        isPreview={isEditing}
      />
    );
  }

  // ── TRAVEL AGENCY: Use existing template renderer below ───────────────────
  const defaultTravelTemplate = templatesList.find(t => t.business_type_slug === 'travel') || templatesList[0];
  let config = customConfig || activeTemplate || agency?.website_config || defaultTravelTemplate;

  // If config accidentally has car sections for a travel agency, reset
  const travelSections = config?.structure?.sections || [];
  const hasCarSections = travelSections.some((s: any) => ['Car Grid', 'Services', 'SalesInventory', 'RentalFleet'].includes(s.type));
  if (hasCarSections || travelSections.length === 0) {
    config = defaultTravelTemplate;
  }

  const globalStyles = config?.global_styles || templatesList[0].global_styles;
  const sections = config?.structure?.sections || templatesList[0].structure.sections;

  // Destructure global style parameters
  const primary = globalStyles.primary_color || '#3b82f6';
  const secondary = globalStyles.secondary_color || '#1d4ed8';
  const accent = globalStyles.accent_color || '#6366f1';
  const text = globalStyles.text_color || '#1e293b';
  const bg = globalStyles.bg_color || '#f8fafc';
  const cardBg = globalStyles.card_bg_color || '#ffffff';
  const border = globalStyles.border_color || '#e2e8f0';

  // Fonts
  const headingFont = globalStyles.heading_font || 'Inter';
  const bodyFont = globalStyles.body_font || 'Inter';
  const headingSize = globalStyles.heading_size || (globalStyles.base_font_size * 2.5);
  const bodySize = globalStyles.body_size || globalStyles.base_font_size;
  const btnShape = globalStyles.button_shape || 'Rounded';
  const btnStyle = globalStyles.button_style || 'Filled';
  const btnSize = globalStyles.button_size || 'Medium';
  const cardRadius = globalStyles.card_border_radius ?? 16;

  // Custom inline style mapping
  const customVariables = {
    '--primary': primary,
    '--secondary': secondary,
    '--accent': accent,
    '--text': text,
    '--bg': bg,
    '--card-bg': cardBg,
    '--border': border,
    '--font-heading': headingFont,
    '--font-body': bodyFont
  } as React.CSSProperties;

  // Search and Filter triggers
  const executeSearch = (q: string) => {
    let result = [...trips];
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(t => 
        (t.title ?? '').toLowerCase().includes(lower) || 
        (t.destination ?? '').toLowerCase().includes(lower)
      );
    }
    if (selectedDestination !== 'all') {
      result = result.filter(t => (t.destination || '').toLowerCase() === selectedDestination.toLowerCase());
    }
    if (selectedPrice !== 'all') {
      const maxPrice = parseInt(selectedPrice);
      result = result.filter(t => (t.price || 0) <= maxPrice);
    }
    setFilteredTrips(result);
  };

  // Inline Editing Wrap
  const EditableText = ({ 
    sectionId, 
    contentKey, 
    value, 
    className = '', 
    multiline = false 
  }: { 
    sectionId: string; 
    contentKey: string; 
    value: string; 
    className?: string; 
    multiline?: boolean 
  }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value);

    // Sync value
    useEffect(() => {
      setVal(value);
    }, [value]);

    if (!isEditing) {
      return <span className={className}>{value}</span>;
    }

    if (editing) {
      if (multiline) {
        return (
          <textarea
            className="w-full bg-slate-100 border border-indigo-400 p-2 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              if (onContentEdit) onContentEdit(sectionId, contentKey, e.target.value);
            }}
            onBlur={() => setEditing(false)}
            autoFocus
          />
        );
      }
      return (
        <input
          type="text"
          className="w-full bg-slate-100 border border-indigo-400 p-1.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            if (onContentEdit) onContentEdit(sectionId, contentKey, e.target.value);
          }}
          onBlur={() => setEditing(false)}
          autoFocus
        />
      );
    }

    return (
      <span 
        className={`${className} cursor-pointer hover:bg-amber-50 hover:ring-2 hover:ring-amber-400 hover:text-slate-900 rounded-lg px-1 transition duration-150 relative inline-block`}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        title="Double click to edit directly"
      >
        {value || 'Click to enter content'}
      </span>
    );
  };

  const getButtonStyle = () => {
    let classes = 'inline-flex items-center justify-center font-bold transition duration-200 ';
    
    // Shape
    if (btnShape === 'Pill') classes += 'rounded-full ';
    else if (btnShape === 'Square') classes += 'rounded-none ';
    else classes += 'rounded-xl ';

    // Size
    if (btnSize === 'Small') classes += 'px-4 py-1.5 text-xs ';
    else if (btnSize === 'Large') classes += 'px-8 py-3 text-base ';
    else classes += 'px-6 py-2.5 text-sm ';

    // Style
    if (btnStyle === 'Outline') {
      classes += 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white ';
    } else if (btnStyle === 'Ghost') {
      classes += 'text-[var(--primary)] hover:bg-[var(--primary)]/10 ';
    } else {
      classes += 'bg-[var(--primary)] hover:bg-[var(--secondary)] text-white shadow-md hover:shadow-lg ';
    }

    return classes;
  };

  const handleToggleCompare = (trip: any) => {
    setComparedTrips((prev) => {
      const exists = prev.some((t) => t.id === trip.id);
      if (exists) {
        return prev.filter((t) => t.id !== trip.id);
      }
      if (prev.length >= 3) {
        alert('Vous pouvez comparer un maximum de 3 voyages à la fois.');
        return prev;
      }
      return [...prev, trip];
    });
  };

  // Scroller
  const scrollToTrips = () => {
    tripsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div 
      className="w-full text-slate-800 select-none overflow-x-hidden antialiased" 
      style={customVariables}
    >
      {/* Header Fonts Load */}
      <link href={`https://fonts.googleapis.com/css2?family=${headingFont}&family=${bodyFont}&display=swap`} rel="stylesheet" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: headingFont }}>
            {agency?.company_name || 'Ephedia Travel'}
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
          <button onClick={scrollToTrips} className="hover:text-[var(--primary)] transition">Voyages</button>
          <a href="#why-choose-us" className="hover:text-[var(--primary)] transition">À propos</a>
          <a href="#contact" className={getButtonStyle()}>
            Réserver maintenant
          </a>
        </div>
      </nav>

      {/* RENDER DYNAMIC SECTIONS LIST */}
      <div className="flex flex-col">
        {sections.map((section: any) => {
          // Check visibility
          if (!section.visibility?.desktop && !isEditing) return null;

          const sectionBg = section.styles?.bg_type === 'image' && section.content?.image_url
            ? `linear-gradient(rgba(0, 0, 0, ${section.styles?.padding_top > 15 ? 0.6 : 0.4}), rgba(0, 0, 0, ${section.styles?.padding_top > 15 ? 0.6 : 0.4})), url(${section.content.image_url})`
            : section.styles?.bg_type === 'gradient'
            ? `linear-gradient(135deg, var(--primary), var(--secondary))`
            : section.styles?.bg_color || 'transparent';

          return (
            <section
              key={section.id}
              id={section.id}
              className={`relative overflow-hidden transition-all duration-300 w-full ${isEditing ? 'hover:ring-2 hover:ring-indigo-400 group/section' : ''}`}
              style={{
                background: sectionBg,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: section.styles?.text_color || text,
                paddingTop: `${(section.styles?.padding_top || 16) * 4}px`,
                paddingBottom: `${(section.styles?.padding_bottom || 16) * 4}px`
              }}
            >
              {/* Overlay edit handle */}
              {isEditing && (
                <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover/section:opacity-100 transition z-20 uppercase">
                  {section.type} ({section.variant})
                </div>
              )}

              <div className="max-w-6xl mx-auto px-6">
                
                {/* 1. HERO SECTION */}
                {section.type === 'Hero' && (
                  <>
                    {section.variant === 'carousel' ? (
                      <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-slate-950/40 border border-white/10 p-8 sm:p-16 text-center space-y-6 min-h-[500px] flex flex-col justify-center items-center">
                        {/* Background Transition Slideshow */}
                        {(() => {
                          const slides = section.content?.items || [
                            { title: "2S Oto Importation", subtitle: "Votre spécialiste d'importation de véhicules neufs en Algérie.", bg: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200" },
                            { title: "Gamme Multi-Marques Premium", subtitle: "Des modèles exclusifs sélectionnés avec soin pour votre confort.", bg: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200" },
                            { title: "Service Clé en Main", subtitle: "De la commande à la livraison finale de votre véhicule.", bg: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200" }
                          ];
                          const activeSlide = slides[activeSlideIdx % slides.length] || slides[0];

                          return (
                            <>
                              <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out opacity-45" style={{ backgroundImage: `url(${activeSlide.bg || activeSlide.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent z-0" />
                              
                              <div className="relative z-10 space-y-6 max-w-3xl animate-fade-in">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {section.content?.badge || 'EXCLUSIVE PRESTIGE'}
                                </span>
                                <h1 
                                  className="font-extrabold tracking-tight text-white drop-shadow-md text-3xl sm:text-5xl" 
                                  style={{ 
                                    fontFamily: headingFont, 
                                    lineHeight: 1.15
                                  }}
                                >
                                  {activeSlide.title}
                                </h1>
                                <p className="text-sm sm:text-base font-medium text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow">
                                  {activeSlide.subtitle}
                                </p>
                                
                                <div className="flex items-center justify-center gap-3 pt-2">
                                  <button onClick={() => {
                                    const element = document.getElementById('sales-inventory') || document.getElementById('trips-grid');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                  }} className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg transition">
                                    {section.content?.primary_cta || 'Découvrir la Gamme'}
                                  </button>
                                  <a href="#contact" className="px-6 py-2.5 border-2 border-white/40 text-white hover:bg-white/10 rounded-xl text-sm font-bold transition">
                                    {section.content?.secondary_cta || 'Nous Contacter'}
                                  </a>
                                </div>

                                {/* Slide dots */}
                                <div className="flex justify-center gap-2 pt-6">
                                  {slides.map((_: any, sIdx: number) => (
                                    <button 
                                      key={sIdx} 
                                      onClick={() => setActiveSlideIdx(sIdx)}
                                      className={`h-2 rounded-full transition-all duration-300 ${sIdx === activeSlideIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-white/40'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : section.variant === 'booking_form' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
                        {/* Left Side: Editorial Banner text */}
                        <div className="lg:col-span-7 space-y-6">
                          {section.content?.badge && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/10 text-white backdrop-blur border border-white/20">
                              <EditableText sectionId={section.id} contentKey="badge" value={section.content.badge} />
                            </span>
                          )}
                          <h1 
                            className="font-extrabold tracking-tight text-white" 
                            style={{ 
                              fontFamily: headingFont, 
                              fontSize: `${headingSize}px`,
                              lineHeight: 1.15
                            }}
                          >
                            <EditableText sectionId={section.id} contentKey="title" value={section.content.title} />
                          </h1>
                          <p className="text-sm sm:text-base font-medium opacity-90 max-w-2xl leading-relaxed text-slate-100">
                            <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle} multiline />
                          </p>
                          <div className="flex gap-4 pt-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                              ⭐ 4.9/5 Avis Clients
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                              🚗 00km & Garantie
                            </div>
                          </div>
                        </div>

                        {/* Right Side: RentPro Booking search estimator */}
                        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl space-y-4 text-slate-800">
                          <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-850 flex items-center gap-2">
                              🔑 Louer un véhicule
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Tarifs compétitifs avec caution flexible</p>
                          </div>

                          <div className="space-y-3 text-[10px] font-bold">
                            <div className="space-y-1">
                              <label className="text-slate-500 uppercase tracking-wide">Lieu de prise en charge</label>
                              <select 
                                value={pickupLocation} 
                                onChange={e => {
                                  setPickupLocation(e.target.value);
                                  setReturnLocation(e.target.value);
                                }}
                                className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-50 font-bold text-xs"
                              >
                                <option value="Alger Centre">Alger Centre (Grande Poste)</option>
                                <option value="Aéroport Alger">Aéroport d'Alger Houari Boumédiène (ALG)</option>
                                <option value="Oran">Oran (Centre)</option>
                                <option value="Constantine">Constantine (Centre)</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-slate-500 uppercase tracking-wide">Date départ</label>
                                <input 
                                  type="date" 
                                  value={pickupDate} 
                                  onChange={e => setPickupDate(e.target.value)} 
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-50 font-semibold text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-500 uppercase tracking-wide">Heure départ</label>
                                <input 
                                  type="time" 
                                  value={pickupTime} 
                                  onChange={e => setPickupTime(e.target.value)}
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-50 font-semibold text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-slate-500 uppercase tracking-wide">Date retour</label>
                                <input 
                                  type="date" 
                                  value={returnDate} 
                                  onChange={e => setReturnDate(e.target.value)}
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-50 font-semibold text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-500 uppercase tracking-wide">Heure retour</label>
                                <input 
                                  type="time" 
                                  value={pickupTime} 
                                  disabled
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-100 opacity-60 text-slate-400 font-semibold text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              const element = document.getElementById('rental-fleet') || document.getElementById('trips-grid');
                              element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5"
                          >
                            🔍 Rechercher un véhicule
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center max-w-3xl mx-auto space-y-6">
                        {section.content?.badge && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/10 text-white backdrop-blur border border-white/20">
                            <EditableText sectionId={section.id} contentKey="badge" value={section.content.badge} />
                          </span>
                        )}
                        <h1 
                          className="font-extrabold tracking-tight text-white" 
                          style={{ 
                            fontFamily: headingFont, 
                            fontSize: `${headingSize}px`,
                            lineHeight: 1.15
                          }}
                        >
                          <EditableText sectionId={section.id} contentKey="title" value={section.content.title} />
                        </h1>
                        <p className="text-sm md:text-base font-medium opacity-90 max-w-2xl mx-auto leading-relaxed text-white">
                          <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle} multiline />
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button onClick={scrollToTrips} className={getButtonStyle()}>
                            <EditableText sectionId={section.id} contentKey="primary_cta" value={section.content.primary_cta || 'Découvrir'} />
                          </button>
                          <a href="#contact" className="px-6 py-2.5 border-2 border-white/40 text-white hover:bg-white/10 rounded-xl text-sm font-bold transition">
                            <EditableText sectionId={section.id} contentKey="secondary_cta" value={section.content.secondary_cta || 'Contact'} />
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 2. STATS BAR */}
                {section.type === 'Stats' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {(section.content?.items || []).map((stat: any, idx: number) => {
                      const StatIcon = getSectionIcon(stat.icon);
                      return (
                        <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] p-5 rounded-2xl flex flex-col items-center text-center space-y-2 hover:scale-[1.02] transition shadow-sm">
                          <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                            <StatIcon className="h-5 w-5" />
                          </div>
                          <span className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, color: primary }}>
                            <EditableText sectionId={section.id} contentKey={`items.${idx}.number`} value={stat.number} />
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            <EditableText sectionId={section.id} contentKey={`items.${idx}.label`} value={stat.label} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. WHY CHOOSE US */}
                {section.type === 'WhyUs' && (
                  <div className="space-y-10 text-left">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle} />
                      </p>
                    </div>

                    {section.variant === 'categories_scroll' ? (
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x -mx-6 px-6">
                        {[
                          { title: "Économique", desc: "Parfait pour la ville, consommation ultra réduite.", icon: "Compass", count: "12 véhicules", bg: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=300" },
                          { title: "Berline", desc: "Idéal pour les longs trajets professionnels.", icon: "Shield", count: "8 véhicules", bg: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=300" },
                          { title: "SUV / Familiale", desc: "Espace et confort pour toute la famille.", icon: "HeartHandshake", count: "15 véhicules", bg: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300" },
                          { title: "Luxe & Sport", desc: "Faites sensation pour vos événements.", icon: "Award", count: "5 véhicules", bg: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300" }
                        ].map((cat, idx) => {
                          const IconComp = getSectionIcon(cat.icon);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => {
                                const element = document.getElementById('rental-fleet') || document.getElementById('trips-grid');
                                element?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="relative min-w-[240px] sm:min-w-[280px] h-48 rounded-[2rem] overflow-hidden snap-center group border border-slate-100 hover:border-indigo-400 hover:shadow-lg transition cursor-pointer"
                            >
                              <div className="absolute inset-0 bg-slate-900/60 z-10 transition group-hover:bg-slate-900/50" />
                              <img src={cat.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 z-20 p-5 flex flex-col justify-between text-white">
                                <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur text-white flex items-center justify-center">
                                  <IconComp className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">{cat.count}</span>
                                  <h4 className="text-xs font-black">{cat.title}</h4>
                                  <p className="text-[10px] opacity-80 leading-normal line-clamp-2">{cat.desc}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(section.content?.items || []).map((item: any, idx: number) => {
                          const CardIcon = getSectionIcon(item.icon);
                          return (
                            <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] p-6 rounded-2xl space-y-3 hover:shadow-md transition">
                              <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                                <CardIcon className="h-5 w-5" />
                              </div>
                              <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: headingFont }}>
                                <EditableText sectionId={section.id} contentKey={`items.${idx}.title`} value={item.title} />
                              </h3>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                <EditableText sectionId={section.id} contentKey={`items.${idx}.description`} value={item.description} multiline />
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3a. TIMELINE PROCESS SECTION */}
                {section.type === 'Timeline' && (
                  <div className="space-y-10 text-left">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Notre Processus en 4 Étapes'} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Comment commander votre véhicule importé en toute simplicité.'} />
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                      <div className="hidden md:block absolute top-1/2 left-4 right-4 h-0.5 bg-indigo-100 -translate-y-1/2 z-0" />
                      
                      {(section.content?.items || [
                        { step: "01", title: "Choix du modèle", desc: "Configurez le véhicule de vos rêves sur commande." },
                        { step: "02", title: "Validation et Acompte", desc: "Signature du contrat d'importation et premier paiement." },
                        { step: "03", title: "Achat & Transit", desc: "Achat en Europe et transport sécurisé vers le port d'Alger." },
                        { step: "04", title: "Dédouanement & Livraison", desc: "Formalités douanières et remise des clés clé-en-main." }
                      ]).map((item: any, idx: number) => (
                        <div key={idx} className="relative z-10 bg-white border border-slate-200/80 p-6 rounded-[2rem] hover:shadow-lg transition space-y-4">
                          <span className="h-10 w-10 rounded-full bg-indigo-650 text-white font-black text-xs flex items-center justify-center shadow-md">
                            {item.step}
                          </span>
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-slate-800">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3b. BRAND LOGO GRID SECTION */}
                {section.type === 'BrandGrid' && (
                  <div className="space-y-8 text-left">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Marques Disponibles'} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Filtrez le catalogue en sélectionnant l\'une de nos marques phares.'} />
                      </p>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {[
                        { name: 'all', label: 'Toutes', logo: '🌐' },
                        { name: 'Hyundai', label: 'Hyundai', logo: '🚗' },
                        { name: 'Kia', label: 'Kia', logo: '🚙' },
                        { name: 'Seat', label: 'Seat', logo: '🏎️' },
                        { name: 'Toyota', label: 'Toyota', logo: '🚐' },
                        { name: 'Renault', label: 'Renault', logo: '🚜' }
                      ].map((brand) => {
                        const isActive = selectedBrandFilter === brand.name;
                        return (
                          <button
                            key={brand.name}
                            onClick={() => {
                              setSelectedBrandFilter(brand.name);
                              const element = document.getElementById('sales-inventory') || document.getElementById('trips-grid');
                              element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`p-4 rounded-[1.5rem] border text-center transition flex flex-col items-center justify-center gap-2 ${
                              isActive 
                                ? 'bg-indigo-650 border-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                                : 'bg-white border-slate-200 text-slate-650 hover:border-indigo-400 hover:shadow-sm'
                            }`}
                          >
                            <span className="text-xl">{brand.logo}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{brand.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. TRIPS SECTION */}
                {section.type === 'Trips' && (
                  <div ref={tripsRef} className="space-y-8">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle} />
                      </p>
                    </div>

                    {/* Integrated Search Filters inside Live Preview */}
                    <div className="flex flex-col sm:flex-row gap-2 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm max-w-2xl mx-auto">
                      <div className="flex-1 flex items-center gap-2 px-2">
                        <Search className="h-4 w-4 text-slate-400 shrink-0" />
                        <input 
                          type="text" 
                          placeholder="Rechercher une destination..." 
                          className="bg-transparent border-0 text-xs font-medium focus:ring-0 w-full focus:outline-none text-slate-700" 
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            executeSearch(e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    {/* Trips Catalog Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filteredTrips.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-xs text-slate-500 font-bold">
                          Aucun circuit ne correspond à votre recherche.
                        </div>
                      ) : (
                        filteredTrips.slice(0, 3).map((trip: any) => {
                          const isCompared = comparedTrips.some(t => t.id === trip.id);
                          return (
                            <div 
                              key={trip.id} 
                              className="bg-[var(--card-bg)] border border-[var(--border)] overflow-hidden transition duration-300 hover:shadow-lg flex flex-col group"
                              style={{ borderRadius: `${cardRadius}px` }}
                            >
                              <div className="relative aspect-video overflow-hidden bg-slate-100">
                                <Image 
                                  src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500'} 
                                  alt="" 
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  quality={75}
                                  className="object-cover group-hover:scale-105 transition duration-500" 
                                />
                                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  {trip.duration_days} Jours
                                </span>
                              </div>
                              <div className="p-5 flex-1 flex flex-col space-y-3">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-extrabold text-[var(--primary)] uppercase tracking-widest">{trip.destination || 'Algérie'}</span>
                                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[var(--primary)] transition line-clamp-1">{trip.title}</h3>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{trip.description || 'Profitez de vacances inoubliables avec un service haut de gamme.'}</p>
                                <div className="pt-2 flex justify-between items-center border-t border-[var(--border)] mt-auto">
                                  <div className="flex flex-col">
                                    {trip.original_price && (
                                      <span className="text-[9px] text-slate-400 line-through font-semibold">
                                        {trip.original_price.toLocaleString()} DZD
                                      </span>
                                    )}
                                    <span className="text-xs font-black text-slate-800" style={{ color: primary }}>
                                      {trip.price?.toLocaleString()} DZD
                                    </span>
                                  </div>

                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleToggleCompare(trip)}
                                      className={`p-2 border rounded-xl transition ${isCompared ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                      title="Comparer"
                                    >
                                      <Scale className="h-3.5 w-3.5" />
                                    </button>
                                    <a href="#contact" className="px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--secondary)] text-white text-[10px] font-black rounded-xl transition">
                                      Réserver
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 5. TESTIMONIALS */}
                {section.type === 'Testimonials' && (
                  <div className="space-y-8">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title} />
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(section.content?.items || []).map((test: any, idx: number) => (
                        <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] p-6 rounded-2xl space-y-4 shadow-sm">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(test.rating || 5)].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            "<EditableText sectionId={section.id} contentKey={`items.${idx}.quote`} value={test.quote} multiline />"
                          </p>
                          <div className="flex items-center gap-3 pt-2">
                            <div className="h-8 w-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                              {test.avatar || 'AA'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                <EditableText sectionId={section.id} contentKey={`items.${idx}.name`} value={test.name} />
                              </h4>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. GALLERY */}
                {section.type === 'Gallery' && (
                  <div className="space-y-8">
                    <div className="text-center max-w-xl mx-auto">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Galerie Photos'} />
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
                        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
                        'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400'
                      ].map((imgUrl, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-[var(--border)] group">
                          <Image src={imgUrl} fill sizes="(max-width: 768px) 50vw, 33vw" quality={75} className="object-cover group-hover:scale-105 transition duration-300" alt="" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. FAQ */}
                {section.type === 'FAQ' && (
                  <div className="space-y-8 max-w-3xl mx-auto">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Foire Aux Questions'} />
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {[
                        { q: 'Comment réserver un circuit ?', a: 'Vous pouvez cliquer sur "Réserver" et compléter notre formulaire d\'acompte sécurisé en ligne.' },
                        { q: 'Quels sont les modes de paiement ?', a: 'Nous acceptons les paiements en espèces à notre agence, par virement bancaire CCP ou par BaridiMob.' }
                      ].map((item, idx) => {
                        const isExpanded = faqExpanded[`${section.id}-${idx}`];
                        return (
                          <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
                            <button 
                              onClick={() => setFaqExpanded(prev => ({ ...prev, [`${section.id}-${idx}`]: !isExpanded }))}
                              className="w-full px-6 py-4 flex items-center justify-between font-bold text-xs text-slate-800 hover:bg-slate-50 transition"
                            >
                              <span>{item.q}</span>
                              <ChevronRight className={`h-4 w-4 text-slate-500 transition duration-200 transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="px-6 pb-4 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-50">
                                {item.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. TEAM */}
                {section.type === 'Team' && (
                  <div className="space-y-8">
                    <div className="text-center max-w-xl mx-auto">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Notre Équipe'} />
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                      {[
                        { name: 'Kacem Amalou', role: 'Directeur Général', avatar: 'KA' },
                        { name: 'Amine Benzineb', role: 'Responsable Opérations', avatar: 'AB' }
                      ].map((member, i) => (
                        <div key={i} className="bg-[var(--card-bg)] border border-[var(--border)] p-5 rounded-2xl text-center space-y-3 shadow-sm">
                          <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-sm mx-auto">
                            {member.avatar}
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">{member.name}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. BLOG */}
                {section.type === 'Blog' && (
                  <div className="space-y-8">
                    <div className="text-center max-w-xl mx-auto">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Conseils Voyages & Blog'} />
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { title: 'Top 5 des destinations en Algérie', desc: 'Découvrez notre sélection des circuits incontournables du Tassili à Béjaïa.' },
                        { title: 'Comment bien préparer son voyage d\'Umrah ?', desc: 'Trousseau complet, formalités administratives et guides spirituels.' }
                      ].map((post, i) => (
                        <div key={i} className="bg-[var(--card-bg)] border border-[var(--border)] p-6 rounded-2xl space-y-3 shadow-sm group hover:border-[var(--primary)] transition">
                          <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-[var(--primary)] transition">{post.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{post.desc}</p>
                          <span className="text-[9px] text-[var(--primary)] font-bold uppercase tracking-wider flex items-center gap-1 pt-1 cursor-pointer">
                            Lire la suite <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 10. CONTACT SECTION */}
                {section.type === 'Contact' && (
                  <div id="contact" className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                          <EditableText sectionId={section.id} contentKey="title" value={section.content.title} />
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle} multiline />
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            <EditableText sectionId={section.id} contentKey="email" value={section.content.email} />
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl shrink-0">
                            <Phone className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            <EditableText sectionId={section.id} contentKey="phone" value={section.content.phone} />
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl shrink-0">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            <EditableText sectionId={section.id} contentKey="address" value={section.content.address} />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--card-bg)] border border-[var(--border)] p-6 rounded-2xl space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800">Formulaire de Contact</h3>
                      <div className="space-y-3 text-xs">
                        <input type="text" placeholder="Nom complet" className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-700" />
                        <input type="email" placeholder="Adresse Email" className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-700" />
                        <textarea placeholder="Votre message..." className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-700 h-24" />
                        <button className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--secondary)] text-white font-bold rounded-xl shadow transition">
                          Envoyer le Message
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. CUSTOM TEXT */}
                {section.type === 'Text' && (
                  <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">
                      <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Titre de Section'} />
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <EditableText sectionId={section.id} contentKey="text" value={section.content.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'} multiline />
                    </p>
                  </div>
                )}

                {/* 12. VIDEO EMBED */}
                {section.type === 'Video' && (
                  <div className="max-w-3xl mx-auto space-y-4 text-center">
                    <h2 className="text-lg font-bold">
                      <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Vidéo de Présentation'} />
                    </h2>
                    <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-[var(--border)] flex items-center justify-center relative">
                      <Video className="h-10 w-10 text-white opacity-40" />
                      <span className="absolute text-[10px] text-white/60 font-semibold bottom-4">Simulated Video Player</span>
                    </div>
                  </div>
                )}

                {/* 13. RAW HTML CONTAINER */}
                {section.type === 'HTML' && (
                  <div className="border border-dashed border-indigo-200 p-6 rounded-2xl bg-indigo-50/10">
                    <div className="flex items-center gap-1.5 text-indigo-600 mb-2">
                      <Code className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Custom HTML Code Injection</span>
                    </div>
                    <div className="text-xs font-mono text-slate-600 leading-relaxed bg-slate-900 p-4 rounded-xl text-left overflow-x-auto text-indigo-400">
                      <code>{section.content?.html || '<!-- Insert custom script or code here -->'}</code>
                    </div>
                  </div>
                )}

                {/* 14. DYNAMIC PROMOBANNER */}
                {section.type === 'Banner' && (
                  <div className="bg-[var(--primary)] text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-sm font-extrabold">
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Offre Spéciale !'} />
                      </h4>
                      <p className="text-xs opacity-90">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Bénéficiez de 15% de réduction immédiate.'} />
                      </p>
                    </div>
                    <a href="#contact" className="px-5 py-2 bg-white hover:bg-slate-50 text-[var(--primary)] text-xs font-black rounded-xl shadow transition shrink-0">
                      Profiter de l'offre
                    </a>
                  </div>
                )}

                {/* 15. DYNAMIC SALES SHOWROOM (Vente) */}
                {section.type === 'SalesInventory' && (
                  <div id="sales-inventory" className="space-y-8 text-left">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Notre Showroom Véhicules'} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Découvrez nos véhicules neufs et d\'occasion disponibles immédiatement.'} />
                      </p>
                    </div>

                    {/* Show filter helper if filtered brand active */}
                    {selectedBrandFilter !== 'all' && (
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl max-w-xs">
                        <span className="text-[10px] text-slate-500 font-bold">Filtre actif: <strong className="text-indigo-650 font-black uppercase">{selectedBrandFilter}</strong></span>
                        <button onClick={() => setSelectedBrandFilter('all')} className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider">Effacer</button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {(() => {
                        const list = salesCars.filter(car => 
                          selectedBrandFilter === 'all' || car.brand?.toLowerCase() === selectedBrandFilter.toLowerCase()
                        );
                        if (list.length === 0) {
                          return (
                            <div className="col-span-full bg-slate-50 border border-slate-200/80 rounded-3xl p-10 text-center space-y-2">
                              <span className="text-2xl">🚗</span>
                              <h4 className="text-xs font-black text-slate-800">Aucun véhicule trouvé</h4>
                              <p className="text-[10px] text-slate-500 leading-normal">Nous n'avons pas encore de véhicules enregistrés pour la marque {selectedBrandFilter}.</p>
                              <button onClick={() => setSelectedBrandFilter('all')} className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-xl transition mt-2">Voir tous les véhicules</button>
                            </div>
                          );
                        }
                        return list.map((car) => (
                          <div key={car.id} className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between group">
                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                              <img 
                                src={car.cover_image_url || car.img} 
                                alt="" 
                                className="object-cover w-full h-full transition duration-700 group-hover:scale-110" 
                              />
                              <span className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${car.condition === 'new' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                                {car.condition === 'new' ? 'Neuf 00km' : 'Occasion'}
                              </span>
                              {car.import_type && (
                                <span className="absolute top-3 right-3 text-[8px] font-extrabold uppercase bg-slate-900/80 backdrop-blur text-slate-200 px-2 py-0.5 rounded-full tracking-wider">
                                  {car.import_type === 'sur_command' ? 'Sur commande' : car.import_type === 'imported' ? 'Importé' : 'Disponible Local'}
                                </span>
                              )}
                            </div>
                            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold text-[var(--primary)] uppercase tracking-wider">{car.brand}</span>
                                <h4 className="text-xs font-black text-slate-800">{car.model} ({car.year})</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold py-2 border-y border-slate-100">
                                <span>⛽ {car.fuel_type || car.fuel}</span>
                                <span>⚙️ {car.transmission || car.trans}</span>
                                {car.mileage > 0 && <span className="col-span-2">🛣️ {car.mileage.toLocaleString()} km</span>}
                              </div>
                              <div className="pt-2 flex justify-between items-center mt-auto">
                                <span className="text-xs font-black text-indigo-650">{(car.selling_price || car.price).toLocaleString()} DZD</span>
                                <button 
                                  onClick={() => setSelectedSalesCarForLoan(car)}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 text-[10px] font-black rounded-xl transition"
                                >
                                  Simuler Crédit
                                </button>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Simulate Loan Credit Drawer/Modal */}
                    {selectedSalesCarForLoan && (
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-slate-800">📊 Simulateur de Crédit Auto</h4>
                            <button onClick={() => setSelectedSalesCarForLoan(null)} className="text-slate-400 hover:text-slate-600 text-[10px] font-bold">Fermer</button>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Simulez votre financement pour la <strong>{selectedSalesCarForLoan.brand} {selectedSalesCarForLoan.model}</strong>.
                          </p>

                          <div className="space-y-2.5 text-[10px] font-bold text-slate-600">
                            <div className="space-y-1">
                              <label className="text-slate-400 text-[9px] uppercase">Acompte Initial ({loanDownPercent}%)</label>
                              <input 
                                type="range" min="10" max="80" step="5" value={loanDownPercent} 
                                onChange={e => setLoanDownPercent(Number(e.target.value))}
                                className="w-full accent-indigo-600 cursor-pointer"
                              />
                              <div className="flex justify-between mt-0.5 text-[9px]">
                                <span>{(selectedSalesCarForLoan.price * (loanDownPercent/100)).toLocaleString()} DZD</span>
                                <span>80% Max</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-slate-400 text-[9px] uppercase">Durée du crédit ({loanMonths} mois)</label>
                              <input 
                                type="range" min="12" max="72" step="12" value={loanMonths} 
                                onChange={e => setLoanMonths(Number(e.target.value))}
                                className="w-full accent-indigo-600 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Calculated Results */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5">Dossier de Financement</span>
                          
                          {(() => {
                            const principal = selectedSalesCarForLoan.price * (1 - loanDownPercent/100);
                            const annualRate = 0.065; // 6.5% interest
                            const monthlyRate = annualRate / 12;
                            const monthlyPayment = monthlyRate > 0 
                              ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loanMonths))
                              : principal / loanMonths;

                            return (
                              <div className="space-y-2 font-bold">
                                <div className="flex justify-between text-slate-500 text-[10px]">
                                  <span>Montant du crédit:</span>
                                  <span>{Math.round(principal).toLocaleString()} DZD</span>
                                </div>
                                <div className="flex justify-between text-slate-500 text-[10px]">
                                  <span>Taux d'intérêt annuel:</span>
                                  <span>6.5% (Fixe)</span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                                  <span className="text-[10px] text-slate-400 uppercase">Mensualité Estimée:</span>
                                  <span className="text-sm font-black text-indigo-600">
                                    {Math.round(monthlyPayment).toLocaleString()} DZD / mois
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 16. DYNAMIC CAR RENTAL (Location) */}
                {section.type === 'RentalBooking' && (
                  <div id="rental-fleet" className="space-y-8 text-left">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Location de Voitures'} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Réservez votre voiture de location au meilleur prix avec kilométrage illimité.'} />
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {rentalCars.map((car: any, idx: number) => {
                        const isSelected = selectedRentalCar === car.model;
                        const carImg = car.images?.[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400';
                        return (
                          <div 
                            key={car.id || idx} 
                            onClick={() => setSelectedRentalCar(car.model)}
                            className={`bg-white border rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-2 ring-indigo-650 border-transparent shadow-md scale-[1.01]' : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'}`}
                          >
                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                              <img src={carImg} alt="" className="w-full h-full object-cover transition-all duration-500 hover:scale-105" />
                              {car.status && (
                                <span className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${car.status === 'available' ? 'bg-emerald-650' : 'bg-red-650'}`}>
                                  {car.status === 'available' ? 'Disponible' : 'Réservé'}
                                </span>
                              )}
                            </div>
                            <div className="p-5 space-y-3">
                              <div>
                                <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">{car.brand}</span>
                                <h4 className="text-xs font-black text-slate-800">{car.model}</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold py-2 border-y border-slate-100">
                                <span>⚙️ {car.transmission || 'Manuelle'}</span>
                                <span>⛽ {car.fuel_type || 'Essence'}</span>
                                <span className="col-span-2">🔒 Caution: {(car.security_deposit || 80000).toLocaleString()} DZD</span>
                              </div>
                              <div className="pt-1 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tarif Journalier</span>
                                <span className="text-xs font-black text-indigo-650">{(car.daily_rate || car.rate || 7500).toLocaleString()} DZD/J</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive Rental Estimator Calculator */}
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800">📅 Calculateur Express de Location</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] font-bold text-slate-600">
                          <div className="space-y-1">
                            <label className="text-slate-450 uppercase">Modèle Sélectionné</label>
                            <select 
                              value={selectedRentalCar} 
                              onChange={e => setSelectedRentalCar(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] font-semibold"
                            >
                              {rentalCars.map((car: any) => (
                                <option key={car.id} value={car.model}>
                                  {car.brand} {car.model} ({(car.daily_rate).toLocaleString()} DZD/J)
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-slate-455 uppercase">Durée de location (Jours)</label>
                            <input 
                              type="number" min="1" max="30" value={rentalDays} 
                              onChange={e => setRentalDays(Math.max(1, Number(e.target.value)))}
                              className="w-full rounded-xl border border-slate-200 bg-white p-2 text-[11px] font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display calculations */}
                      {(() => {
                        const activeCar = rentalCars.find(c => c.model === selectedRentalCar) || rentalCars[0];
                        const dailyRate = activeCar?.daily_rate || 7500;
                        const securityDeposit = activeCar?.security_deposit || 80000;
                        const subtotal = dailyRate * rentalDays;
                        const insuranceFee = 1500 * rentalDays; // Standard comprehensive insurance

                        return (
                          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3 font-bold">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5">Estimation de Réservation</span>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Tarif Journalier ({activeCar?.brand} {activeCar?.model}):</span>
                                <span>{dailyRate.toLocaleString()} DZD</span>
                              </div>
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Durée totale:</span>
                                <span>{rentalDays} jours</span>
                              </div>
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Assurance collision (incluse):</span>
                                <span>{insuranceFee.toLocaleString()} DZD</span>
                              </div>
                              <div className="flex justify-between text-amber-600 text-[10px] border-t border-dashed border-slate-100 pt-1.5">
                                <span>Caution de garantie (Restituée):</span>
                                <span>{securityDeposit.toLocaleString()} DZD</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                                <span className="text-[10px] text-slate-400 uppercase">Total Estimé:</span>
                                <span className="text-sm font-black text-indigo-650">
                                  {(subtotal + insuranceFee).toLocaleString()} DZD
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 17. DYNAMIC IMPORT TARIFF CALCULATOR (Sur Commande) */}
                {section.type === 'ImportCalculator' && (
                  <div className="space-y-8 text-left">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Simulateur Dédouanement Algérie'} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Estimez en temps réel le coût total de dédouanement au port d\'Alger.'} />
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800">⚓ Simulateur Express Port d'Alger</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Faites glisser le curseur pour simuler le prix d'achat du véhicule à l'étranger (FOB Europe) et calculer la taxe de dédouanement estimée en Algérie.
                        </p>

                        <div className="space-y-3">
                          <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Prix d'achat à l'étranger (FOB Europe)</label>
                          <input 
                            type="range" min="2000000" max="15000000" step="250000" value={importFobPrice}
                            onChange={e => setImportFobPrice(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                          />
                          <div className="flex justify-between text-xs font-black text-slate-700">
                            <span>2,000,000 DZD</span>
                            <span className="text-indigo-600 text-sm bg-indigo-50 px-3 py-1 rounded-xl">{importFobPrice.toLocaleString()} DZD</span>
                            <span>15,000,000 DZD</span>
                          </div>
                        </div>
                      </div>

                      {/* Calculations & Algerian customs breakdown */}
                      {(() => {
                        const dd = Math.round(importFobPrice * 0.3); // 30% droits de douane
                        const tva = Math.round((importFobPrice + dd) * 0.19); // 19% TVA
                        const daccis = 100000;
                        const stat = 20000;
                        const transit = 50000;
                        const portFees = 75000; // Magasinage, Gerbage, etc.
                        const transport = 40000;

                        const totalCustoms = dd + tva + daccis + stat + transit + portFees + transport;
                        const totalDelivered = importFobPrice + totalCustoms;

                        return (
                          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3 font-bold">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5">Estimation Droits et Taxes (Dédouanement)</span>
                            
                            <div className="space-y-2 text-[10px]">
                              <div className="flex justify-between text-slate-500">
                                <span>1. Droits de Douane (30%):</span>
                                <span>{dd.toLocaleString()} DZD</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>2. TVA Douane (19%):</span>
                                <span>{tva.toLocaleString()} DZD</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>3. Redevances & DACCIS:</span>
                                <span>{(daccis + stat).toLocaleString()} DZD</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>4. Magasinage, Transit & Transport:</span>
                                <span>{(transit + portFees + transport).toLocaleString()} DZD</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline text-xs">
                                <span className="text-[10px] text-slate-400 uppercase">Total Taxes Estimé:</span>
                                <span className="text-slate-800">{totalCustoms.toLocaleString()} DZD</span>
                              </div>
                              <div className="pt-2 border-t-2 border-double border-slate-200 flex justify-between items-baseline text-xs">
                                <span className="text-[10px] text-slate-400 uppercase">Coût Total Clé en main:</span>
                                <span className="text-sm font-black text-indigo-600">
                                  {totalDelivered.toLocaleString()} DZD
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

              </div>
            </section>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs text-left">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h4 className="text-slate-100 font-extrabold uppercase tracking-widest" style={{ fontFamily: headingFont }}>
              {agency?.company_name || 'Ephedia Travel'}
            </h4>
            <p className="leading-relaxed text-slate-500">Circuits de haute qualité au départ d'Alger. Le meilleur rapport qualité-prix garanti.</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-slate-100 font-bold uppercase tracking-wider">Contact & Horaires</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>Tél: {agency?.phone || '+213 555 12 34 56'}</li>
              <li>Email: {agency?.email || 'contact@agency.dz'}</li>
              <li>Samedi - Jeudi: 09:00 - 18:00</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-slate-100 font-bold uppercase tracking-wider">Mentions Légales</h4>
            <p className="text-slate-500 leading-relaxed">© 2026 {agency?.company_name || 'Ephedia'}. Tous droits réservés. Propulsé par Aventra SaaS.</p>
          </div>
        </div>
      </footer>

      {/* Dynamic Drawer Compare List */}
      <AnimatePresence>
        {comparedTrips.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white rounded-[2rem] p-4 shadow-2xl flex items-center justify-between gap-6 z-[90] max-w-xl w-[92%] border border-slate-700/60"
          >
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-indigo-400 shrink-0" />
              <div className="flex gap-2">
                {comparedTrips.map((trip) => (
                  <div key={trip.id} className="relative h-10 w-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0 group">
                    <Image 
                      src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=100'} 
                      alt="" 
                      fill
                      sizes="60px"
                      quality={75}
                      className="object-cover"
                    />
                    <button 
                      onClick={() => setComparedTrips(prev => prev.filter(t => t.id !== trip.id))}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white hover:scale-105 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">{comparedTrips.length}/3 sélectionnés</span>
              <button
                disabled={comparedTrips.length < 2}
                onClick={() => setIsCompareModalOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  comparedTrips.length >= 2 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Comparer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-side Trip Compare Modal */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompareModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto z-10 p-6 sm:p-10 border border-slate-200/60 text-left"
            >
              <button 
                onClick={() => setIsCompareModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Scale className="h-6 w-6 text-indigo-600" />
                <span>Comparateur de Forfaits</span>
              </h2>

              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 font-bold text-slate-500 uppercase w-32">Caractéristique</th>
                      {comparedTrips.map((trip) => (
                        <th key={trip.id} className="p-4 font-bold text-slate-800 text-center border-l border-slate-200/60 min-w-[200px]">
                          <div className="space-y-2">
                            <h3 className="font-bold text-slate-900 line-clamp-1">{trip.title}</h3>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr>
                      <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Prix Personne</td>
                      {comparedTrips.map((trip) => (
                        <td key={trip.id} className="p-4 text-center border-l border-slate-200/60 font-black text-indigo-600 text-sm">
                          {trip.price?.toLocaleString()} DZD
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Destination</td>
                      {comparedTrips.map((trip) => (
                        <td key={trip.id} className="p-4 text-center border-l border-slate-200/60 font-bold text-slate-700">
                          {trip.destination || 'Algérie'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Durée</td>
                      {comparedTrips.map((trip) => (
                        <td key={trip.id} className="p-4 text-center border-l border-slate-200/60 font-semibold text-slate-600">
                          {trip.duration_days} Jours
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
