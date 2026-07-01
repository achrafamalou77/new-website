// src/components/website/PublicSite.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { templatesList } from '@/lib/templates-data';
import { 
  X, Scale, ChevronRight, HelpCircle, AlertCircle, Plane, Bus, 
  Compass, Ship, Star, Check, Shield, HeartHandshake, Users, 
  Clock, MapPin, Search, Phone, Mail, Award, Calendar, Video, Play, Code,
  Menu, ChevronDown, Filter, Utensils, Hotel, CreditCard, MessageCircle, ChevronLeft,
  CheckCircle2, XCircle, FileText, QrCode, UploadCloud, Smartphone, Loader2, Info
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import ShowroomPublicSite from './ShowroomPublicSite';
import { TripDetailModal } from './TripDetailModal';
import { submitPublicBooking, submitVisaInquiry, submitContactForm } from '@/app/actions/public-bookings';
import { cn } from '@/lib/utils';

import { PERFECT_SHOWROOM_TEMPLATE, type ShowroomBuilderConfig } from '@/lib/car-showroom-builder-template';


interface PublicSiteProps {
  agency: any;
  trips: any[];
  visas?: any[];
  salesCars?: any[];
  rentalCars?: any[];
  isEditing?: boolean;
  onContentEdit?: (sectionId: string, contentKey: string, newValue: any) => void;
  customConfig?: any; // To pass active builder configurations directly in editor
  currentPage?: 'home' | 'trips' | 'visas' | 'contact' | 'trip-detail';
  onPageChange?: (page: 'home' | 'trips' | 'visas' | 'contact' | 'trip-detail') => void;
  selectedTrip?: any;
  onSelectedTripChange?: (trip: any) => void;
}

// Visual Icons Finder
const getSectionIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Compass, Shield, HeartHandshake, Users, Clock, Star, MapPin, 
    Search, Phone, Mail, Award, Calendar, Plane, Ship, Bus
  };
  return icons[iconName] || Compass;
};

// DZD Price Formatter
const formatDZD = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DZD';
};

// Country flag map
const getCountryFlag = (name: string): string => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('france') || lower.includes('schengen') || lower.includes('europe')) return '🇫🇷';
  if (lower.includes('turquie') || lower.includes('turkey')) return '🇹🇷';
  if (lower.includes('canada')) return '🇨🇦';
  if (lower.includes('usa') || lower.includes('états-unis') || lower.includes('amerique')) return '🇺🇸';
  if (lower.includes('maroc') || lower.includes('morocco')) return '🇲🇦';
  if (lower.includes('espagne') || lower.includes('spain')) return '🇪🇸';
  if (lower.includes('italie') || lower.includes('italy')) return '🇮🇹';
  if (lower.includes('arabie') || lower.includes('omra') || lower.includes('hajj') || lower.includes('mecque')) return '🇸🇦';
  if (lower.includes('thaïlande') || lower.includes('thailand')) return '🇹🇭';
  if (lower.includes('egypte') || lower.includes('egypt')) return '🇪🇬';
  if (lower.includes('emirats') || lower.includes('dubai')) return '🇦🇪';
  if (lower.includes('chine') || lower.includes('china')) return '🇨🇳';
  if (lower.includes('tunisie') || lower.includes('tunisia')) return '🇹🇳';
  if (lower.includes('allemagne') || lower.includes('germany')) return '🇩🇪';
  if (lower.includes('royaume') || lower.includes('uk') || lower.includes('angleterre')) return '🇬🇧';
  return '🌍';
};

const parseOptions = (fieldVal: any, fallbackName: string) => {
  if (!fieldVal) return [{ name: fallbackName, price: 0 }]
  if (typeof fieldVal === 'string' && fieldVal.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(fieldVal)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch (e) {
      console.error('Error parsing options:', e)
    }
  }
  return [{ name: fieldVal, price: 0 }]
}

export default function PublicSite({ 
  agency, 
  trips: initialTrips, 
  visas = [],
  salesCars: initialSalesCars = [],
  rentalCars: initialRentalCars = [],
  isEditing = false, 
  onContentEdit, 
  customConfig,
  currentPage: externalPage,
  onPageChange: externalOnPageChange,
  selectedTrip: externalSelectedTrip,
  onSelectedTripChange: externalOnSelectedTripChange
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
  const [selectedTripForModal, setSelectedTripForModal] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [faqExpanded, setFaqExpanded] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [tripDestFilter, setTripDestFilter] = useState('all');
  const [tripMaxPrice, setTripMaxPrice] = useState(500000);
  const [tripSearch, setTripSearch] = useState('');
  
  // Dynamic page router states for multi-page support
  const [currentPageState, setCurrentPageState] = useState<'home' | 'trips' | 'visas' | 'contact' | 'trip-detail'>('home');
  const currentPage = externalPage ?? currentPageState;
  const setCurrentPage = (page: 'home' | 'trips' | 'visas' | 'contact' | 'trip-detail') => {
    if (externalOnPageChange) {
      externalOnPageChange(page);
    } else {
      setCurrentPageState(page);
    }
  };

  const [selectedTripState, setSelectedTripState] = useState<any>(null);
  const selectedTrip = externalSelectedTrip ?? selectedTripState;
  const setSelectedTrip = (trip: any) => {
    if (externalOnSelectedTripChange) {
      externalOnSelectedTripChange(trip);
    } else {
      setSelectedTripState(trip);
    }
  };

  const [isOnlineBookingOpen, setIsOnlineBookingOpen] = useState(false);

  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  // Visa Inquiry Form States
  const [selectedVisaForInquiry, setSelectedVisaForInquiry] = useState<any>(null);
  const [visaName, setVisaName] = useState('');
  const [visaPhone, setVisaPhone] = useState('');
  const [visaEmail, setVisaEmail] = useState('');
  const [visaNotes, setVisaNotes] = useState('');
  const [visaSubmitting, setVisaSubmitting] = useState(false);
  const [visaSuccessCode, setVisaSuccessCode] = useState<string | null>(null);
  const [visaError, setVisaError] = useState('');

  // Trip details states (for trip detail full page view)
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'itinerary' | 'inclusions' | 'pricing' | 'documents' | 'reviews'>('overview');
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [bookingFullName, setBookingFullName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingNumTravelers, setBookingNumTravelers] = useState(1);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingReceiptName, setBookingReceiptName] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccessCode, setBookingSuccessCode] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    if (selectedTrip) {
      const roomOptions = parseOptions(selectedTrip.room_type, 'Double');
      const mealOptions = parseOptions(selectedTrip.meal_plan, 'Demi-pension');
      setSelectedRoom(roomOptions[0]?.name || '');
      setSelectedMeal(mealOptions[0]?.name || '');
      setActiveImage(0);
      setActiveDetailTab('overview');
      setExpandedDay(1);
      
      // Reset booking form
      setBookingFullName('');
      setBookingPhone('');
      setBookingEmail('');
      setBookingNumTravelers(1);
      setBookingDate('');
      setBookingReceiptName('');
      setBookingSuccessCode(null);
      setBookingError('');
    }
  }, [selectedTrip]);

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
    const currentTemplateId = customConfig?.active_template_id || activeTemplate?.id || agency?.website_config?.active_template_id;
    if (currentTemplateId === 't-indonesia-charm') return;
    const timer = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, [customConfig, activeTemplate, agency]);

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
  const activeTemplateId = config?.active_template_id || 't-traventure-fr';

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

  // Submit Contact Form
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !contactMessage) {
      setContactError('Veuillez remplir les champs obligatoires (Nom, Téléphone, Message).');
      return;
    }
    setContactSubmitting(true);
    setContactError('');
    setContactSuccess(false);
    try {
      const res = await submitContactForm({
        agencyId: agency.id,
        fullName: contactName,
        phone: contactPhone,
        email: contactEmail,
        subject: contactSubject || 'Prise de contact',
        message: contactMessage
      });
      if (res.success) {
        setContactSuccess(true);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } else {
        setContactError(res.error || 'Une erreur est survenue.');
      }
    } catch (err: any) {
      console.error(err);
      setContactError(err.message || 'Une erreur est survenue.');
    } finally {
      setContactSubmitting(false);
    }
  };

  // Submit Visa Inquiry Form
  const handleVisaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visaName || !visaPhone || !selectedVisaForInquiry) {
      setVisaError('Veuillez remplir les champs obligatoires (Nom, Téléphone).');
      return;
    }
    setVisaSubmitting(true);
    setVisaError('');
    setVisaSuccessCode(null);
    try {
      const res = await submitVisaInquiry({
        agencyId: agency.id,
        fullName: visaName,
        phone: visaPhone,
        email: visaEmail,
        visaTypeId: selectedVisaForInquiry.id,
        notes: visaNotes
      });
      if (res.success && res.code) {
        setVisaSuccessCode(res.code);
      } else {
        setVisaError(res.error || 'Une erreur est survenue.');
      }
    } catch (err: any) {
      console.error(err);
      setVisaError(err.message || 'Une erreur est survenue.');
    } finally {
      setVisaSubmitting(false);
    }
  };

  // Submit Booking Form (CCP Deposit)
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFullName || !bookingPhone || !selectedTrip) {
      setBookingError('Veuillez remplir les champs obligatoires (Nom, Téléphone).');
      return;
    }
    setBookingSubmitting(true);
    setBookingError('');
    setBookingSuccessCode(null);
    
    // Calculate prices
    const roomOptions = parseOptions(selectedTrip.room_type, 'Double');
    const mealOptions = parseOptions(selectedTrip.meal_plan, 'Demi-pension');
    const selectedRoomOption = roomOptions.find(r => r.name === selectedRoom) || roomOptions[0];
    const selectedMealOption = mealOptions.find(m => m.name === selectedMeal) || mealOptions[0];
    const roomOffset = selectedRoomOption ? Number(selectedRoomOption.price) : 0;
    const mealOffset = selectedMealOption ? Number(selectedMealOption.price) : 0;
    const singlePersonPrice = Number(selectedTrip.price) + roomOffset + mealOffset;
    const totalTripPrice = singlePersonPrice * bookingNumTravelers;
    const depositAmount = Math.round(totalTripPrice * 0.20); // 20% deposit

    try {
      const res = await submitPublicBooking({
        agencyId: agency.id,
        tripId: selectedTrip.id,
        fullName: bookingFullName,
        phone: bookingPhone,
        email: bookingEmail,
        numTravelers: bookingNumTravelers,
        selectedDate: bookingDate || '15 Juillet 2026',
        selectedRoom,
        selectedMeal,
        totalPrice: totalTripPrice,
        notes: `Dépôt Acompte CCP estimé: ${depositAmount} DZD. Reçu uploade: ${bookingReceiptName || 'aucun'}.`,
      });
      if (res.success && res.bookingCode) {
        setBookingSuccessCode(res.bookingCode);
      } else {
        setBookingError(res.error || 'Une erreur est survenue.');
      }
    } catch (err: any) {
      console.error(err);
      setBookingError(err.message || 'Une erreur est survenue.');
    } finally {
      setBookingSubmitting(false);
    }
  };

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

  // Keep builder preview and live website behavior identical:
  // only render real database content, never demo placeholders.
  const displayTrips = trips;
  const displayVisas = visas;

  // Unique destinations for filter
  const allDestinations = Array.from(new Set(displayTrips.map((t: any) => t.destination).filter(Boolean)));

  // Filtered trips for grid-3 variant
  const grid3Trips = displayTrips.filter((t: any) => {
    const matchDest = tripDestFilter === 'all' || (t.destination || '').toLowerCase().includes(tripDestFilter.toLowerCase());
    const matchPrice = (t.price || 0) <= tripMaxPrice;
    const matchSearch = !tripSearch || 
      (t.title || '').toLowerCase().includes(tripSearch.toLowerCase()) || 
      (t.destination || '').toLowerCase().includes(tripSearch.toLowerCase());
    return matchDest && matchPrice && matchSearch;
  });

  // WhatsApp phone
  // Nested subcomponent for Routea Explorer split dashboard layout
  const RouteaExplorerDashboard = () => {
    const [localSearch, setLocalSearch] = useState('');
    const [localDestFilter, setLocalDestFilter] = useState('all');
    
    // Filter trips based on category tab & search input
    const routeaFilteredTrips = displayTrips.filter((t: any) => {
      const matchSearch = !localSearch || t.title.toLowerCase().includes(localSearch.toLowerCase()) || (t.destination || '').toLowerCase().includes(localSearch.toLowerCase());
      const matchDest = localDestFilter === 'all' || t.destination === localDestFilter;
      return matchSearch && matchDest;
    });

    const activeTrip = selectedTrip || routeaFilteredTrips[0] || displayTrips[0];
    
    // Find matching visa if possible for the active trip
    const matchingVisa = activeTrip ? visas.find((v: any) => v.country?.toLowerCase() === activeTrip.destination?.toLowerCase()) : null;

    return (
      <div className="w-full bg-slate-100/60 min-h-screen pb-12 font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side: Trips list & search & filters */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Header card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4 text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Destinations Populaires</h2>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Explorez nos circuits organisés et réservez en ligne</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-black bg-blue-50 text-blue-650 border border-blue-100">
                    ✈️ {displayTrips.length} circuits
                  </span>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1 flex items-center gap-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Rechercher une destination, un pays..."
                      className="flex-1 bg-transparent border-0 text-xs font-semibold focus:ring-0 focus:outline-none text-slate-755 py-2"
                      value={localSearch}
                      onChange={e => setLocalSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Destination category tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setLocalDestFilter('all')}
                  className={`px-3.5 py-1.5 text-[11px] font-black rounded-xl border transition-all whitespace-nowrap ${
                    localDestFilter === 'all'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  Tout
                </button>
                {allDestinations.map((dest: string) => (
                  <button
                    key={dest}
                    onClick={() => setLocalDestFilter(dest)}
                    className={`px-3.5 py-1.5 text-[11px] font-black rounded-xl border transition-all whitespace-nowrap ${
                      localDestFilter === dest
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                    }`}
                  >
                    {getCountryFlag(dest)} {dest}
                  </button>
                ))}
              </div>

              {/* Grid of trips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {routeaFilteredTrips.length === 0 ? (
                  <div className="col-span-full py-14 bg-white rounded-3xl border border-slate-200/60 text-center flex flex-col items-center justify-center space-y-2">
                    <div className="text-3xl">🏜️</div>
                    <h3 className="text-xs font-bold text-slate-700">Aucun voyage trouvé</h3>
                    <p className="text-[10px] text-slate-400 max-w-xs">Modifiez vos critères de recherche.</p>
                  </div>
                ) : (
                  routeaFilteredTrips.map((trip: any) => {
                    const isSelected = activeTrip?.id === trip.id;
                    const discount = trip.compare_at_price && trip.compare_at_price > trip.price 
                      ? Math.round(((trip.compare_at_price - trip.price) / trip.compare_at_price) * 100)
                      : 15;
                    
                    return (
                      <div
                        key={trip.id}
                        onClick={() => setSelectedTrip(trip)}
                        className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-100 shadow-md scale-[1.01]'
                            : 'border-slate-200/85 hover:border-slate-300 hover:shadow'
                        }`}
                      >
                        {/* Image */}
                        <div className="relative aspect-[16/11] overflow-hidden bg-slate-100 shrink-0">
                          <Image
                            src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600'}
                            alt={trip.title || 'Voyage'}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition duration-500"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black text-white bg-black/60 backdrop-blur-sm">
                            {getCountryFlag(trip.destination)} {trip.destination || 'Algérie'}
                          </span>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-black text-white bg-blue-600">
                            Remise {discount}%
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-3.5 flex-1 flex flex-col space-y-1.5 text-left">
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>🕒 {trip.duration_days} Jours</span>
                            <span className="text-[#c5a880] font-black">★ 4.8</span>
                          </div>
                          
                          <h3 className="text-xs font-black text-slate-805 line-clamp-1 group-hover:text-blue-600 transition">
                            {trip.title}
                          </h3>
                          <p className="text-[10px] text-slate-450 leading-relaxed line-clamp-2">
                            {trip.description || 'Itinéraire complet avec vols directs, hébergements premium.'}
                          </p>

                          <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-auto">
                            <span className="text-[9px] text-slate-400 font-bold">Prix</span>
                            <span className="text-xs font-black text-slate-800">{formatDZD(trip.price)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
            
            {/* Right side: persistent preview pane */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              {activeTrip ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden space-y-5 text-left">
                  
                  {/* Image */}
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <Image
                      src={activeTrip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600'}
                      alt={activeTrip.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">
                        {getCountryFlag(activeTrip.destination)} {activeTrip.destination}
                      </p>
                      <h2 className="text-sm font-black mt-0.5 leading-snug drop-shadow-sm">{activeTrip.title}</h2>
                    </div>
                  </div>

                  <div className="px-5 pb-5 space-y-5">
                    {/* Parameters */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-650 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">💰</span>
                        <div>
                          <p className="text-[7px] text-slate-400 uppercase font-black">Coût Moyen</p>
                          <p className="text-[9px] text-slate-800 font-black">{formatDZD(activeTrip.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">📅</span>
                        <div>
                          <p className="text-[7px] text-slate-400 uppercase font-black">Meilleure Saison</p>
                          <p className="text-[9px] text-slate-800 font-black">Avril - Septembre</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🛂</span>
                        <div>
                          <p className="text-[7px] text-slate-400 uppercase font-black">Visa requis</p>
                          <p className="text-[9px] text-slate-800 font-black">
                            {matchingVisa ? 'Requis (' + matchingVisa.visa_type + ')' : (activeTrip.visa_type || 'Requis')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🏨</span>
                        <div>
                          <p className="text-[7px] text-slate-400 uppercase font-black">Hôtels inclus</p>
                          <p className="text-[9px] text-slate-800 font-black">4★ & 5★</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wide">Itinéraire & détails</h4>
                      <p className="text-[10px] text-slate-550 leading-relaxed">
                        {activeTrip.description || 'Itinéraire haut de gamme incluant les transferts aéroportuaires, guides locaux certifiés et visites guidées exclusives.'}
                      </p>
                    </div>

                    {/* Hotels included Routea style */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wide">Hôtels Inclus</h4>
                      <div className="space-y-1.5">
                        {[
                          { name: 'Hotel Las Arenas Resort', rating: '5★', price: 'Inclus', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200' },
                          { name: 'The Westin Valencia', rating: '5★', price: 'Inclus', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=200' }
                        ].map((hotel, index) => (
                          <div key={index} className="flex items-center justify-between border border-slate-100 p-1.5 rounded-xl bg-white shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="relative h-8 w-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                                <img src={hotel.img} alt="" className="object-cover w-full h-full" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-700 line-clamp-1">{hotel.name}</p>
                                <p className="text-[7px] text-slate-450 font-bold">{hotel.rating} Excellent (120 avis)</p>
                              </div>
                            </div>
                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg shrink-0">{hotel.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Booking button */}
                    <div className="pt-1">
                      <a
                        href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Bonjour, je souhaite réserver le voyage "${activeTrip.title}"`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md transition-all hover:scale-[1.01]"
                      >
                        Book Tour (WhatsApp)
                      </a>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
                  Sélectionnez un voyage pour voir ses détails ici.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  };

  // WhatsApp phone
  // Nested subcomponent for full-page detailed trip view
  const TripDetailPage = () => {
    if (!selectedTrip) return null;

    const roomOptions = parseOptions(selectedTrip.room_type, 'Double');
    const mealOptions = parseOptions(selectedTrip.meal_plan, 'Demi-pension');

    // Images Gallery
    const images = selectedTrip.image_urls && selectedTrip.image_urls.length > 0 
      ? selectedTrip.image_urls 
      : ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200'];
    const allImages = [...images, ...(Array.isArray(selectedTrip.gallery_images) ? selectedTrip.gallery_images : [])].filter(Boolean);

    // Itinerary fallback
    const getItinerary = (): any[] => {
      if (Array.isArray(selectedTrip.itinerary) && selectedTrip.itinerary.length > 0) {
        return selectedTrip.itinerary;
      }
      const daysCount = selectedTrip.duration_days || 7;
      return Array.from({ length: daysCount }, (_, i) => ({
        day: i + 1,
        title: `Jour ${i + 1}: Exploration & Activités`,
        description: `Découvrez les plus beaux sites de la région avec notre guide local. Temps libre pour le shopping et les loisirs.`,
        activities: 'Visites libres, Déjeuner traditionnel'
      }));
    };
    const itinerary = getItinerary();

    // Inclusions/Exclusions fallback
    const inclusions = Array.isArray(selectedTrip.included_items) && selectedTrip.included_items.length > 0
      ? selectedTrip.included_items
      : ['Transport principal (Aller-Retour)', 'Hébergement en chambre double/triple', 'Guide accompagnateur professionnel', 'Petits déjeuners quotidiens', 'Assistance 24/7'];
    const exclusions = Array.isArray(selectedTrip.excluded_items) && selectedTrip.excluded_items.length > 0
      ? selectedTrip.excluded_items
      : ['Assurance voyage internationale', 'Frais de visa (si requis)', 'Repas non mentionnés', 'Dépenses personnelles et pourboires'];

    // Pricing calculation
    const selectedRoomOption = roomOptions.find(r => r.name === selectedRoom) || roomOptions[0];
    const selectedMealOption = mealOptions.find(m => m.name === selectedMeal) || mealOptions[0];
    const roomOffset = selectedRoomOption ? Number(selectedRoomOption.price) : 0;
    const mealOffset = selectedMealOption ? Number(selectedMealOption.price) : 0;
    const singlePersonPrice = Number(selectedTrip.price) + roomOffset + mealOffset;
    const totalTripPrice = singlePersonPrice * bookingNumTravelers;
    const depositAmount = Math.round(totalTripPrice * 0.20); // 20% deposit

    const handleWhatsApp = () => {
      const message = encodeURIComponent(`Bonjour ${agency.company_name}! Je suis intéressé(e) par le voyage "${selectedTrip.title}" pour ${selectedTrip.destination}. Merci de m'envoyer les détails de réservation.`);
      window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank');
    };

    const handleCall = () => {
      window.open(`tel:${agency.phone || '+213 555 12 34 56'}`, '_self');
    };

    const reqDocs = Array.isArray(selectedTrip.required_documents) && selectedTrip.required_documents.length > 0
      ? selectedTrip.required_documents
      : ['Copie couleur du passeport (valide +6 mois)', 'Copie de la carte d\'identité nationale', '2 photos d\'identité fond blanc'];

    return (
      <div className="bg-slate-50 min-h-screen py-8 text-left">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Back button */}
          <button 
            onClick={() => { setCurrentPage('trips'); setSelectedTrip(null); }}
            className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[var(--primary)] transition bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au catalogue
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col: Trip Info & Gallery */}
            <div className="lg:col-span-8 space-y-8 bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[2rem] shadow-sm">
              {/* Gallery */}
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                <Image 
                  src={allImages[activeImage]} 
                  alt={selectedTrip.title} 
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-all duration-500 brightness-95"
                  priority
                />
                
                {allImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition shadow-md"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition shadow-md"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allImages.map((img, i) => (
                    <button 
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`relative w-20 aspect-[4/3] rounded-lg overflow-hidden border-2 transition ${activeImage === i ? 'border-[var(--primary)] scale-102' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Badge */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-xs" style={{ background: primary }}>
                    {getCountryFlag(selectedTrip.destination)} {selectedTrip.destination || 'Algérie'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-650 text-[10px] font-bold">
                    {selectedTrip.duration_days} Jours / {selectedTrip.num_nights || (selectedTrip.duration_days - 1)} Nuits
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                  {selectedTrip.title}
                </h1>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200/50 rounded-2xl text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50/50 text-indigo-650 flex items-center justify-center shrink-0 border border-indigo-100/50">
                    {selectedTrip.transport_type === 'Avion' || selectedTrip.transport_type === 'Vol' ? <Plane className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Transport</p>
                    <p className="font-bold text-slate-750">{selectedTrip.transport_type || 'Vol direct'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50/50 text-indigo-650 flex items-center justify-center shrink-0 border border-indigo-100/50">
                    <Hotel className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hébergement</p>
                    <p className="font-bold text-slate-755 line-clamp-1">{selectedTrip.hotel_name || 'Hôtel inclus'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50/50 text-indigo-650 flex items-center justify-center shrink-0 border border-indigo-100/50">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pension</p>
                    <p className="font-bold text-slate-750 line-clamp-1">{selectedMealOption?.name || 'Demi-pension'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50/50 text-indigo-650 flex items-center justify-center shrink-0 border border-indigo-100/50">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Départ</p>
                    <p className="font-bold text-slate-750">{selectedTrip.departure_city || 'Alger'}</p>
                  </div>
                </div>
              </div>

              {/* Tabs selectors */}
              <div className="flex border-b border-slate-200 overflow-x-auto pb-px gap-6 text-xs font-bold uppercase tracking-wider">
                {[
                  { id: 'overview', name: 'Aperçu' },
                  { id: 'itinerary', name: 'Itinéraire' },
                  { id: 'inclusions', name: 'Inclus / Exclus' },
                  { id: 'pricing', name: 'Tarifs & Options' },
                  { id: 'documents', name: 'Formalités' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`pb-4 shrink-0 transition relative ${activeDetailTab === tab.id ? 'text-[var(--primary)]' : 'text-slate-400 hover:text-slate-650'}`}
                  >
                    {tab.name}
                    {activeDetailTab === tab.id && (
                      <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--primary)]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              <div className="pt-2 text-sm text-slate-600 leading-relaxed">
                {activeDetailTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 text-base">À propos du voyage</h3>
                      <p>{selectedTrip.description || "Partez pour une aventure inoubliable avec un accompagnement VIP. Ce séjour de rêve comprend l'hébergement, le transport et des excursions guidées."}</p>
                    </div>

                    {/* Fiche Technique Box */}
                    <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 text-left">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-650" /> Fiche Technique & Organisation
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                          <span className="text-lg">🗺️</span>
                          <div>
                            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Type de Voyage</p>
                            <p className="font-black text-slate-800 mt-0.5">
                              {selectedTrip.trip_type === 'circuit_routier' ? 'Circuit Routier (Bus Tour)' :
                               selectedTrip.trip_type === 'omra' ? 'Omra & Hajj (Sacré)' :
                               selectedTrip.trip_type === 'free_voyage' ? 'Séjour Libre (Flight + Hotel)' :
                               selectedTrip.trip_type === 'excursion' ? 'Excursion / Journée (Day Trip)' : 
                               'Package Organisé Complet'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                          <span className="text-lg">📈</span>
                          <div>
                            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Difficulté & Rythme</p>
                            <p className="font-black text-slate-800 mt-0.5">
                              {selectedTrip.trip_type === 'free_voyage' ? 'Facile & Relaxant (Pace calme)' :
                               selectedTrip.trip_type === 'excursion' ? 'Intense (1 jour chargé)' :
                               selectedTrip.duration_days <= 5 ? 'Facile (Court séjour accessible)' :
                               selectedTrip.duration_days <= 10 ? 'Modéré (Découvertes & Temps libre)' : 
                               'Actif / Complet (Circuit soutenu)'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                          <span className="text-lg">🧑‍✈️</span>
                          <div>
                            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Accompagnement</p>
                            <p className="font-black text-slate-800 mt-0.5">
                              {selectedTrip.guide_included ? `Organisé avec guide accompagnateur (${selectedTrip.guide_language || 'français/arabe'})` : 'Formule libre en totale autonomie'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                          <span className="text-lg">✈️</span>
                          <div>
                            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Planification</p>
                            <p className="font-black text-slate-800 mt-0.5">
                              {selectedTrip.trip_type === 'free_voyage' ? 'Vols et hôtels réservés, journées libres' : 
                               'Voyage clé en main, itinéraire 100% planifié et organisé'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) }

                {activeDetailTab === 'itinerary' && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-slate-800 text-base">Le programme au jour le jour</h3>
                    <div className="relative pl-6 border-l-2 border-slate-200 ml-3 space-y-6">
                      {itinerary.map((day) => {
                        const isExpanded = expandedDay === day.day;
                        return (
                          <div key={day.day} className="relative">
                            <button 
                              onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                              className={`absolute -left-[31px] top-0.5 w-[11px] h-[11px] rounded-full border-2 border-white transition-all ${isExpanded ? 'bg-[var(--primary)] scale-120' : 'bg-slate-300'}`}
                            />
                            <div className="space-y-2">
                              <button 
                                onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                                className="text-left font-bold text-slate-800 hover:text-[var(--primary)] flex items-center gap-2 focus:outline-none"
                              >
                                <span className="text-[10px] text-[var(--primary)] font-black tracking-wider uppercase">Jour {day.day}</span>
                                <span>—</span>
                                <span>{day.title}</span>
                              </button>
                              
                              {isExpanded && (
                                <p className="text-xs text-slate-500 leading-relaxed pl-1 pb-1 animate-fadeIn">
                                  {day.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'inclusions' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-[#c5a880]/5 border border-[#c5a880]/20 rounded-2xl space-y-3">
                      <h4 className="font-bold text-xs text-[#c5a880] uppercase tracking-wider flex items-center gap-1.5"><Check className="w-4 h-4 text-[#c5a880]" /> Services Inclus</h4>
                      <ul className="space-y-2">
                        {inclusions.map((inc: any, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-650">
                            <Check className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                      <h4 className="font-bold text-xs text-rose-800 uppercase tracking-wider flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-rose-450" /> Non Inclus</h4>
                      <ul className="space-y-2">
                        {exclusions.map((exc: any, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-650">
                            <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-1" />
                            <span>{exc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'pricing' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-base">Tarifs et Suppléments</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                      <div className="flex justify-between p-3 border-b bg-slate-50 font-bold text-slate-700">
                        <span>Option</span>
                        <span>Supplément (DZD)</span>
                      </div>
                      <div className="divide-y text-slate-650">
                        <div className="flex justify-between p-3 font-semibold text-slate-850">
                          <span>Prix de base (Chambre standard)</span>
                          <span style={{ color: primary }} className="font-black">{formatDZD(selectedTrip.price)}</span>
                        </div>
                        {roomOptions.map((room: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-3 pl-6">
                            <span>Option Chambre: {room.name}</span>
                            <span className="font-bold text-slate-600">
                              {room.price > 0 ? `+${room.price.toLocaleString()} DZD` : 'Inclus'}
                            </span>
                          </div>
                        ))}
                        {mealOptions.map((meal: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-3 pl-6">
                            <span>Option Repas: {meal.name}</span>
                            <span className="font-bold text-slate-600">
                              {meal.price > 0 ? `+${meal.price.toLocaleString()} DZD` : 'Inclus'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'documents' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-base">Documents administratifs requis</h3>
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-xs text-slate-550 font-bold">Pour confirmer votre dossier de réservation, vous devez préparer les pièces suivantes :</p>
                      <ul className="space-y-2 text-xs text-slate-650 pl-2">
                        {reqDocs.map((doc: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Sticky Booking Form */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[2rem] shadow-md text-left space-y-5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">À partir de</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1" style={{ color: primary }}>{formatDZD(selectedTrip.price)}</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Accompagnement et services compris</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setIsOnlineBookingOpen(true)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                  >
                    <CreditCard className="h-4 w-4" />
                    Réserver en Ligne (CCP)
                  </button>

                  <button 
                    onClick={handleWhatsApp}
                    className="w-full py-3 bg-[#25D366] hover:bg-[#20b857] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                  >
                    <MessageCircle className="h-4.5 w-4.5 fill-white" />
                    Réserver sur WhatsApp
                  </button>

                  <button 
                    onClick={handleCall}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Phone className="h-4 w-4 text-slate-450" />
                    Appeler l'Agence
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const IndonesiaCharmDashboard = () => {
    const [localSearch, setLocalSearch] = useState('');
    const [localBudget, setLocalBudget] = useState('all');
    const [localMonth, setLocalMonth] = useState('all');
    
    // Filter trips
    const indonesiaFilteredTrips = displayTrips.filter((t: any) => {
      const matchSearch = !localSearch || t.title.toLowerCase().includes(localSearch.toLowerCase()) || (t.destination || '').toLowerCase().includes(localSearch.toLowerCase());
      const matchBudget = localBudget === 'all' || t.price <= Number(localBudget);
      return matchSearch && matchBudget;
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setCurrentPage('trips');
    };

    const searchMonths = [
      { value: 'all', label: 'Toutes les dates' },
      { value: '06', label: 'Juin 2026' },
      { value: '07', label: 'Juillet 2026' },
      { value: '08', label: 'Août 2026' },
      { value: '09', label: 'Septembre 2026' }
    ];

    const budgetRanges = [
      { value: 'all', label: 'Tout Budget' },
      { value: '150000', label: 'Max 150 000 DA' },
      { value: '250000', label: 'Max 250 000 DA' },
      { value: '350000', label: 'Max 350 000 DA' }
    ];

    const guestOptions = [
      { value: 1, label: '1 Voyageur' },
      { value: 2, label: '2 Voyageurs' },
      { value: 3, label: '3 Voyageurs' },
      { value: 4, label: '4 Voyageurs+' }
    ];

    // Navbar overlay component
    const GlassNavbar = () => {
      const [mobOpen, setMobOpen] = useState(false);
      return (
        <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent py-4 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <span className="font-extrabold text-lg text-white tracking-wider font-serif">
                {agency?.company_name?.toUpperCase() || 'INDOTRAVI'}
              </span>
            </div>

            {/* Centered Glass Pill Nav Links */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-2 py-1 shadow-lg">
              {[
                { label: 'Accueil', page: 'home' },
                { label: 'Voyages', page: 'trips' },
                { label: 'Visas', page: 'visas' },
                { label: 'Contact', page: 'contact' }
              ].map((item) => {
                const isAct = currentPage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => { setCurrentPage(item.page as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={cn(
                      "px-5 py-2 text-xs font-semibold rounded-full transition-all duration-300",
                      isAct 
                        ? "bg-white text-slate-950 shadow" 
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Language Selector and Button */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white select-none">
                FR
              </div>
              <button 
                onClick={() => { setCurrentPage('trips'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-full px-5 py-2 text-xs transition shadow hover:shadow-lg"
              >
                Réserver
              </button>
            </div>

            {/* Mobile Nav Trigger */}
            <button
              onClick={() => setMobOpen(!mobOpen)}
              className="md:hidden p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"
            >
              {mobOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Overlay Menu */}
          <AnimatePresence>
            {mobOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute left-4 right-4 top-16 bg-slate-950/90 backdrop-blur-2xl border border-white/15 p-5 rounded-3xl flex flex-col gap-4 z-40 text-center shadow-2xl"
              >
                {[
                  { label: 'Accueil', page: 'home' },
                  { label: 'Voyages', page: 'trips' },
                  { label: 'Visas', page: 'visas' },
                  { label: 'Contact', page: 'contact' }
                ].map((item) => (
                  <button
                    key={item.page}
                    onClick={() => { setCurrentPage(item.page as any); setMobOpen(false); window.scrollTo({ top: 0 }); }}
                    className="py-2.5 text-xs font-bold text-white border-b border-white/5 last:border-0"
                  >
                    {item.label}
                  </button>
                ))}
                <button 
                  onClick={() => { setCurrentPage('trips'); setMobOpen(false); window.scrollTo({ top: 0 }); }}
                  className="w-full bg-white text-slate-950 font-bold py-2.5 rounded-full text-xs"
                >
                  Réserver maintenant
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      );
    };

    // Subpage: Home
    if (currentPage === 'home') {
      return (
        <div className="w-full bg-slate-50/50 pb-20 font-sans text-left overflow-x-hidden relative">
          {/* Glass Navbar */}
          <GlassNavbar />

          {/* HERO SECTION */}
          <div className="relative h-[680px] sm:h-[620px] flex items-center justify-center overflow-hidden bg-slate-950">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image 
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600" 
                alt="Scenic Forest Lake"
                fill
                priority
                className="object-cover brightness-[0.55] contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6 pt-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest text-[#c5a880] uppercase"
              >
                ✨ EXPLORER LE MONDE
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none max-w-3xl mx-auto font-serif"
              >
                Charme naturel et culturel extraordinaire
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xs sm:text-sm text-slate-200/90 font-medium max-w-lg mx-auto leading-relaxed"
              >
                Explorer le monde est une aventure inoubliable. Profitez de la richesse des cultures et de la convivialité des locaux.
              </motion.p>

              {/* Glass Search widget pill */}
              <motion.form 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                onSubmit={handleSearchSubmit} 
                className="mt-8 max-w-3xl mx-auto"
              >
                <div className="bg-white/10 backdrop-blur-md border border-white/25 p-2 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-white">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-2 text-left">
                    <div className="border-b sm:border-b-0 sm:border-r border-white/15 pb-2 sm:pb-0 sm:pr-4">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date de départ
                      </label>
                      <select
                        value={localMonth}
                        onChange={e => setLocalMonth(e.target.value)}
                        className="bg-transparent border-0 p-0 text-xs font-bold text-white focus:ring-0 focus:outline-none w-full mt-1 cursor-pointer appearance-none"
                      >
                        {searchMonths.map(m => (
                          <option key={m.value} value={m.value} className="text-slate-900 font-semibold">{m.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="border-b sm:border-b-0 sm:border-r border-white/15 py-2 sm:py-0 sm:px-4">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Budget Max
                      </label>
                      <select
                        value={localBudget}
                        onChange={e => setLocalBudget(e.target.value)}
                        className="bg-transparent border-0 p-0 text-xs font-bold text-white focus:ring-0 focus:outline-none w-full mt-1 appearance-none cursor-pointer"
                      >
                        {budgetRanges.map(b => (
                          <option key={b.value} value={b.value} className="text-slate-900 font-semibold">{b.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="py-2 sm:py-0 sm:pl-4">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Voyageurs
                      </label>
                      <select
                        value={bookingNumTravelers}
                        onChange={e => setBookingNumTravelers(Number(e.target.value))}
                        className="bg-transparent border-0 p-0 text-xs font-bold text-white focus:ring-0 focus:outline-none w-full mt-1 appearance-none cursor-pointer"
                      >
                        {guestOptions.map(g => (
                          <option key={g.value} value={g.value} className="text-slate-900 font-semibold">{g.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl sm:rounded-full px-8 py-3.5 text-xs tracking-wider uppercase transition shadow-md shrink-0 flex items-center justify-center gap-2"
                  >
                    <Search className="h-3.5 w-3.5" /> Rechercher
                  </button>
                </div>
              </motion.form>
            </div>
          </div>

          {/* OVERLAPPING STATS CARDS */}
          <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { number: '10M+', label: 'Clients Satisfaits' },
                { number: '09+', label: 'Années d\'Expérience' },
                { number: '12K', label: 'Destinations Mondiales' },
                { number: '5.0', label: 'Note Moyenne' }
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  key={i} 
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 text-center flex flex-col justify-center"
                >
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-serif">{stat.number}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* BENTO DESTINATIONS GALLERY */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#c5a880]">Merveilles du Monde</span>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 font-serif">Destinations de Rêve</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm md:text-right leading-relaxed">
                Une beauté naturelle extraordinaire, une richesse spirituelle et culturelle à découvrir aux quatre coins de notre planète.
              </p>
            </div>

            {/* Bento Grid layout with 5 items */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Card 1: Maka (La Mecque) - Landscape (col-span-7) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                onClick={() => { setLocalSearch('Mecque'); setCurrentPage('trips'); }}
                className="md:col-span-7 relative h-72 rounded-[24px] overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                <Image 
                  src="/makkah.jpg" 
                  alt="La Mecque"
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h3 className="text-lg font-black tracking-tight font-serif">La Mecque (Maka)</h3>
                  <p className="text-xs text-slate-350 font-bold mt-1">Omra & Voyages Spirituels</p>
                </div>
              </motion.div>

              {/* Card 2: Bali - Portrait (col-span-5) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => { setLocalSearch('Bali'); setCurrentPage('trips'); }}
                className="md:col-span-5 relative h-72 rounded-[24px] overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                <Image 
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800" 
                  alt="Bali"
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h3 className="text-lg font-black tracking-tight font-serif">Bali</h3>
                  <p className="text-xs text-slate-350 font-bold mt-1">Plages Paradis & Nature Sauvage</p>
                </div>
              </motion.div>

              {/* Card 3: Tunisie - Portrait (col-span-5) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                onClick={() => { setLocalSearch('Tunisie'); setCurrentPage('trips'); }}
                className="md:col-span-5 relative h-72 rounded-[24px] overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                <Image 
                  src="/tunisie.jpg" 
                  alt="Tunisie"
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h3 className="text-lg font-black tracking-tight font-serif">Tunisie</h3>
                  <p className="text-xs text-slate-350 font-bold mt-1">Carthage, Sidi Bou Saïd & Djerba</p>
                </div>
              </motion.div>

              {/* Card 4: Egypte - Landscape (col-span-7) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => { setLocalSearch('Egypte'); setCurrentPage('trips'); }}
                className="md:col-span-7 relative h-72 rounded-[24px] overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                <Image 
                  src="https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800" 
                  alt="Égypte"
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h3 className="text-lg font-black tracking-tight font-serif">Égypte</h3>
                  <p className="text-xs text-slate-350 font-bold mt-1">Pyramides de Gizeh & Croisières Nil</p>
                </div>
              </motion.div>

              {/* Card 5: Turquie - Wide landscape (col-span-12) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                onClick={() => { setLocalSearch('Turquie'); setCurrentPage('trips'); }}
                className="md:col-span-12 relative h-72 rounded-[24px] overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                <Image 
                  src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200" 
                  alt="Turquie"
                  fill
                  className="object-cover group-hover:scale-102 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h3 className="text-xl font-black tracking-tight font-serif">Turquie</h3>
                  <p className="text-xs text-slate-300 font-semibold mt-1">Capitale Historique Istanbul & Montgolfières de Cappadoce</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* BENEFITS SECTION */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column: Image with overlays */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative h-[480px] rounded-[2rem] overflow-hidden shadow-xl group"
              >
                <Image 
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800" 
                  alt="Explorer in Yellow Raincoat"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/10" />
                
                {/* Floating Widget */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/70 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-lg">
                      🌍
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan Voyage</p>
                      <p className="text-xs font-black text-slate-800">Aventure Mondiale</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-slate-900 text-white rounded-full px-3.5 py-1">
                    ★ 5.0
                  </span>
                </div>
              </motion.div>

              {/* Right Column: Benefit List */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#c5a880]">Nos Avantages</span>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 font-serif">En un clic</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed mt-3">
                    Nous gérons tous les aspects logistiques de vos vacances afin de vous garantir un séjour fluide et serein de bout en bout.
                  </p>
                </motion.div>

                <div className="space-y-4">
                  {[
                    {
                      title: 'Trouvez votre destination',
                      desc: 'Explorez un large catalogue de circuits organisés. Sélectionnez les forfaits selon vos envies et budgets.',
                      icon: Compass
                    },
                    {
                      title: 'Réservation facilitée',
                      desc: 'Nous vous assistons dans l\'acquisition des billets, transferts, visas et hébergements.',
                      icon: Calendar
                    },
                    {
                      title: 'Paiement CCP / BaridiMob',
                      desc: 'Réglez vos acomptes en toute sécurité par CCP national ou virement bancaire rapide.',
                      icon: CreditCard
                    },
                    {
                      title: 'Explorez sereinement',
                      desc: 'Profitez de nos guides locaux experts et d\'un support francophone permanent par WhatsApp.',
                      icon: HeartHandshake
                    }
                  ].map((item, index) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      key={index} 
                      className="flex items-start gap-4 p-3 hover:bg-slate-100/50 rounded-2xl transition duration-150 text-left"
                    >
                      <div className="h-9 w-9 bg-slate-150 rounded-xl flex items-center justify-center text-slate-700 shrink-0 mt-1">
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                        <p className="text-[11px] text-slate-455 mt-1 leading-relaxed font-semibold">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TRIPS SECTION ("Nos destinations de voyage") */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
            <div className="text-center space-y-3 mb-12">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#c5a880]">Circuits Organisés</span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif">Nos destinations de voyage</h2>
              <p className="text-xs sm:text-sm text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
                Découvrez nos circuits les plus demandés à des prix incroyables.
              </p>
            </div>

            {/* List Trips */}
            {displayTrips.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-150 p-12 text-center text-slate-400 text-sm font-semibold shadow-sm max-w-xl mx-auto">
                🏝️ Aucun circuit disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayTrips.slice(0, 3).map((trip: any, idx: number) => {
                  const hasDiscount = trip.compare_at_price && trip.compare_at_price > trip.price;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 25 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      key={trip.id}
                      onClick={() => { setSelectedTrip(trip); setCurrentPage('trip-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="group bg-white rounded-[24px] border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                    >
                      {/* Image container */}
                      <div className="relative aspect-[4/3] bg-slate-100">
                        <Image 
                          src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'} 
                          alt={trip.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-all duration-500"
                        />
                        
                        {/* Rating Overlay */}
                        <span className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> 4.8
                        </span>

                        {/* Duration Overlay */}
                        <span className="absolute top-3 left-3 bg-white/95 text-slate-800 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                          🕒 {trip.duration_days} Jours
                        </span>

                        {hasDiscount && (
                          <span className="absolute bottom-3 left-3 bg-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            Promo
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-[#c5a880] uppercase tracking-widest font-serif">
                            {trip.destination || 'International'}
                          </p>
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-[#c5a880] transition line-clamp-1">
                            {trip.title}
                          </h3>
                          <p className="text-xs text-slate-450 leading-relaxed line-clamp-2 font-semibold">
                            {trip.description || 'Itinéraire complet avec vols directs, hébergements premium.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Tarif</p>
                            <p className="text-sm font-black text-slate-850">{formatDZD(trip.price)}</p>
                          </div>
                          <span className="text-[11px] font-black bg-slate-900 text-white group-hover:bg-[#c5a880] group-hover:text-white px-4 py-2 rounded-full transition-all">
                            Voir détails
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* View More CTA */}
            {displayTrips.length > 3 && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => { setCurrentPage('trips'); window.scrollTo({ top: 0 }); }}
                  className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-full text-xs tracking-wider uppercase transition shadow-md hover:shadow-lg"
                >
                  Voir tous les voyages
                </button>
              </div>
            )}
          </div>

          {/* TESTIMONIALS SECTION */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-slate-100 rounded-[2rem] p-8 sm:p-12 relative overflow-hidden shadow-inner flex flex-col md:flex-row gap-8 items-center text-left"
            >
              {/* Left Column: Author */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative h-14 w-14 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow">
                  <Image 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" 
                    alt="Donald Salhan avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-850">Donald Salhan</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Voyageur régulier</p>
                </div>
              </div>

              {/* Right Column: Quote */}
              <div className="relative flex-1">
                <span className="absolute -top-12 -left-4 text-[#c5a880]/10 text-[9rem] font-serif leading-none select-none pointer-events-none">“</span>
                <p className="text-xs sm:text-sm text-slate-550 leading-relaxed font-semibold italic relative z-10">
                  Ce site de voyage est très informatif et simple à utiliser. Les détails fournis sur les hébergements et excursions m'ont permis de réserver notre circuit sans stress en toute sérénité.
                </p>
              </div>
            </motion.div>
          </div>

          {/* OUR TRAVEL MEMORIES (Blogs Section) */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
            <div className="text-center space-y-2 mb-12">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#c5a880]">Le Blog</span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif">Nos souvenirs de voyage</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Tendances Voyage 2026 – Ce qu\'il faut savoir',
                  desc: 'Voyager en 2026 apporte de précieuses leçons de vie. Les tarifs peuvent fluctuer, mais explorer le monde reste unique...',
                  date: '12 Mai 2026',
                  img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'
                },
                {
                  title: 'Aventure 4x4 & Jeep : Le nouveau must des circuits',
                  desc: 'Le hors-piste gagne en popularité cette année. Découvrez les frissons des traversées du Sahara algérien...',
                  date: '08 Mai 2026',
                  img: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800'
                }
              ].map((blog, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  key={idx} 
                  className="group bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-56 bg-slate-100">
                    <Image src={blog.img} alt={blog.title} fill className="object-cover group-hover:scale-[1.02] transition-all duration-500" />
                    <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {blog.date}
                    </span>
                  </div>
                  <div className="p-6 text-left space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-[#c5a880] transition font-serif">
                        {blog.title}
                      </h3>
                      <p className="text-[11px] text-slate-455 leading-relaxed mt-2 line-clamp-2 font-semibold">
                        {blog.desc}
                      </p>
                    </div>
                    <span onClick={() => setCurrentPage('contact')} className="text-[10px] font-black text-slate-700 hover:text-[#c5a880] inline-flex items-center gap-1 mt-4 transition cursor-pointer">
                      Lire la suite <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Subpage: Voyages Listing Page (GLASSY MODE)
    if (currentPage === 'trips') {
      return (
        <div className="w-full bg-slate-50/50 text-slate-900 pb-28 pt-12 font-sans text-left min-h-screen relative overflow-hidden">
          {/* Ambients Glowing Orbs */}
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#c5a880]/3 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-violet-600/3 blur-[100px] pointer-events-none" style={{ animationDelay: '2s' }} />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-serif"
                >
                  Nos Circuits
                </motion.h1>
                <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-2">
                  Découvrez nos offres exceptionnelles et réservez votre prochaine aventure.
                </p>
              </div>

              {/* Real-time search bar */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-1.5 border border-slate-200/80 rounded-full bg-white/70 backdrop-blur-md focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all max-w-sm w-full shadow-md text-slate-900"
              >
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filtrer par destination..."
                  className="flex-1 bg-transparent border-0 text-xs font-semibold focus:ring-0 focus:outline-none text-slate-900 py-2 placeholder-slate-400"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                />
              </motion.div>
            </div>

            {/* List Trips */}
            {indonesiaFilteredTrips.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl py-20 text-center text-slate-500 text-xs font-semibold shadow-md max-w-xl mx-auto flex flex-col items-center justify-center space-y-2">
                <span className="text-3xl">🏜️</span>
                <p>Aucun voyage ne correspond à votre recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {indonesiaFilteredTrips.map((trip: any, i: number) => {
                  const hasDiscount = trip.compare_at_price && trip.compare_at_price > trip.price;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      key={trip.id}
                      onClick={() => { setSelectedTrip(trip); setCurrentPage('trip-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="group bg-white/90 backdrop-blur-md border border-slate-200/50 hover:border-slate-300/80 rounded-[24px] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] bg-slate-900/60">
                        <Image 
                          src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'} 
                          alt={trip.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-all duration-500 brightness-95"
                        />
                        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> 4.8
                        </span>
                        <span className="absolute top-3 left-3 bg-white/95 text-slate-800 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                          🕒 {trip.duration_days} Jours
                        </span>
                        {hasDiscount && (
                          <span className="absolute bottom-3 left-3 bg-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            Promo
                          </span>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-4">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-[#c5a880] uppercase tracking-widest font-serif">
                            {trip.destination || 'International'}
                          </p>
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-[#c5a880] transition line-clamp-1">
                            {trip.title}
                          </h3>
                          <p className="text-xs text-slate-550 leading-relaxed line-clamp-2 font-semibold">
                            {trip.description || 'Itinéraire complet avec vols directs, hébergements premium.'}
                          </p>
                        </div>

                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Tarif package</p>
                            <p className="text-xs font-black text-slate-900">{formatDZD(trip.price)}</p>
                          </div>
                          <span className="text-[10px] font-black bg-slate-900 text-white group-hover:bg-[#c5a880] group-hover:text-slate-950 px-4 py-2 rounded-full transition-all shadow-md">
                            Détails
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Subpage: Visas (GLASSY MODE)
    if (currentPage === 'visas') {
      return (
        <div className="w-full bg-slate-50/50 text-slate-900 pb-28 pt-12 font-sans text-left min-h-screen relative overflow-hidden">
          {/* Ambients Glowing Orbs */}
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#c5a880]/3 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-violet-600/3 blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="mb-12 text-center space-y-2 max-w-xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-serif"
              >
                Assistance Visa
              </motion.h1>
              <p className="text-xs sm:text-sm text-slate-400 font-semibold leading-relaxed">
                Notre agence prend en charge toutes vos démarches de visa de A à Z avec un taux de réussite optimal.
              </p>
            </div>

            {/* List Visas */}
            {!visas || visas.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center text-slate-400 text-xs font-semibold shadow-inner max-w-xl mx-auto">
                🛂 Aucun type de visa disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Visas Grid */}
                <div className="lg:col-span-6 space-y-4">
                  {visas.map((visa: any, i: number) => {
                    const isSelected = selectedVisaForInquiry?.id === visa.id;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -25 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        key={visa.id}
                        onClick={() => setSelectedVisaForInquiry(visa)}
                        className={`p-5 rounded-3xl border bg-white/80 backdrop-blur-md cursor-pointer transition-all duration-200 text-left flex items-start gap-4 ${
                          isSelected 
                            ? 'border-slate-900 ring-2 ring-slate-100 shadow-md' 
                            : 'border-slate-200/60 shadow-sm hover:border-slate-300'
                        }`}
                      >
                        <span className="text-3xl shrink-0">
                          {getCountryFlag(visa.country)}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-900">{visa.country}</h3>
                            <span className="text-[9px] font-black text-[#c5a880] bg-[#c5a880]/10 border border-[#c5a880]/20 px-2 py-0.5 rounded-lg">
                              {visa.visa_type || 'Touristique'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">Traitement: {visa.processing_time || '7 - 14 jours'}</p>
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                            <span className="text-[9px] text-slate-400 font-bold">Frais de service</span>
                            <span className="text-xs font-black text-[#c5a880]">{formatDZD(visa.price)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Visa Request Form */}
                <div className="lg:col-span-6 bg-white/90 border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-lg space-y-5">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 font-serif">
                    Formulaire d'information
                  </h3>
                  {selectedVisaForInquiry ? (
                    <form onSubmit={handleVisaSubmit} className="space-y-4 text-left">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Destination Sélectionnée</p>
                        <p className="text-xs font-black text-[#c5a880] mt-0.5">
                          {getCountryFlag(selectedVisaForInquiry.country)} {selectedVisaForInquiry.country} – {selectedVisaForInquiry.visa_type}
                        </p>
                      </div>

                      <div className="space-y-3.5 text-slate-200">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Votre nom complet</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Nom et Prénom"
                            value={visaName}
                            onChange={e => setVisaName(e.target.value)}
                            className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Téléphone (WhatsApp)</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="Ex: 0555 12 34 56"
                            value={visaPhone}
                            onChange={e => setVisaPhone(e.target.value)}
                            className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Email (Optionnel)</label>
                          <input 
                            type="email" 
                            placeholder="Ex: contact@email.com"
                            value={visaEmail}
                            onChange={e => setVisaEmail(e.target.value)}
                            className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Note ou demande spéciale</label>
                          <textarea 
                            rows={3}
                            placeholder="Ex: Documents requis, rendez-vous..."
                            value={visaNotes}
                            onChange={e => setVisaNotes(e.target.value)}
                            className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-400 transition"
                          />
                        </div>
                      </div>

                      {visaError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-[10px] font-bold">
                          ⚠️ {visaError}
                        </div>
                      )}

                      {visaSuccessCode && (
                        <div className="bg-[#c5a880]/10 border border-[#c5a880]/20 p-3 rounded-xl text-[#c5a880] text-[10px] font-bold text-center">
                          🎉 Demande enregistrée ! Code dossier: <span className="underline">{visaSuccessCode}</span>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={visaSubmitting}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md"
                      >
                        {visaSubmitting ? 'Envoi...' : 'Envoyer ma demande'}
                      </button>
                    </form>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-[11px] font-semibold border border-dashed border-white/10 rounded-2xl">
                      Sélectionnez une destination de visa à gauche pour ouvrir le formulaire.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Subpage: Contact (GLASSY MODE)
    if (currentPage === 'contact') {
      return (
        <div className="w-full bg-slate-50/50 text-slate-900 pb-28 pt-12 font-sans text-left min-h-screen relative overflow-hidden">
          {/* Ambients Glowing Orbs */}
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#c5a880]/3 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-violet-600/3 blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="mb-12 text-center space-y-2 max-w-xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-serif"
              >
                Prenez Contact
              </motion.h1>
              <p className="text-xs sm:text-sm text-slate-400 font-semibold leading-relaxed">
                Notre équipe d'experts est disponible pour vous conseiller et vous accompagner dans toutes vos réservations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Contact Information cards */}
              <div className="lg:col-span-4 space-y-4">
                {[
                  { title: 'Téléphone & WhatsApp', val: agency.phone || '+213 555 12 34 56', icon: Phone },
                  { title: 'Email de l\'agence', val: agency.email || 'contact@agence.com', icon: Mail },
                  { title: 'Adresse Showroom', val: agency.address || 'Alger, Algérie', icon: MapPin },
                  { title: 'Horaires d\'ouverture', val: 'Du Samedi au Jeudi: 08:30 – 17:30', icon: Clock }
                ].map((c, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    key={i} 
                    className="bg-white/90 border border-slate-200/60 rounded-3xl p-5 shadow-md flex items-center gap-4 text-left"
                  >
                    <div className="h-9 w-9 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                      <c.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.title}</h4>
                      <p className="text-xs font-black text-slate-900 mt-1">{c.val}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-8 bg-white/90 border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-md space-y-5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 font-serif">
                  Envoyer un message
                </h3>
                <form onSubmit={handleContactSubmit} className="space-y-4 text-left text-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Votre nom complet</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Nom et Prénom"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">N° de Téléphone</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="Ex: 0555 12 34 56"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Email (Optionnel)</label>
                      <input 
                        type="email" 
                        placeholder="Ex: client@email.com"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Sujet</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Demande de tarif..."
                        value={contactSubject}
                        onChange={e => setContactSubject(e.target.value)}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-400 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Message</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="Comment pouvons-nous vous aider ?"
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-400 transition"
                    />
                  </div>

                  {contactError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-[10px] font-bold">
                      ⚠️ {contactError}
                    </div>
                  )}

                  {contactSuccess && (
                    <div className="bg-[#c5a880]/10 border border-[#c5a880]/20 p-3 rounded-xl text-[#c5a880] text-[10px] font-bold text-center">
                      🎉 Votre message a été envoyé avec succès ! Notre équipe vous contactera sous peu.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={contactSubmitting}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md"
                  >
                    {contactSubmitting ? 'Envoi...' : 'Envoyer mon message'}
                  </button>
                </form>

                {/* Map Display */}
                <div className="rounded-3xl overflow-hidden h-60 w-full border border-slate-200/60 shadow-md mt-4 relative bg-slate-100">
                  <iframe 
                    title="Agency Location Map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(agency.address || 'Alger, Algérie')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0 grayscale opacity-80"
                    allowFullScreen 
                    loading="lazy" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Subpage: Trip Details page (GLASSY MODE)
    if (currentPage === 'trip-detail' && selectedTrip) {
      const roomOptions = parseOptions(selectedTrip.room_type, 'Double');
      const mealOptions = parseOptions(selectedTrip.meal_plan, 'Demi-pension');

      const images = selectedTrip.image_urls && selectedTrip.image_urls.length > 0 
        ? selectedTrip.image_urls 
        : ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200'];
      const allImages = [...images, ...(Array.isArray(selectedTrip.gallery_images) ? selectedTrip.gallery_images : [])].filter(Boolean);

      // Itinerary builder
      const getItinerary = (): any[] => {
        if (Array.isArray(selectedTrip.itinerary) && selectedTrip.itinerary.length > 0) {
          return selectedTrip.itinerary;
        }
        const daysCount = selectedTrip.duration_days || 7;
        return Array.from({ length: daysCount }, (_, i) => ({
          day: i + 1,
          title: `Jour ${i + 1}: Exploration & Activités`,
          description: `Découvrez les plus beaux sites de la région avec notre guide local. Temps libre pour le shopping et les loisirs.`,
          activities: 'Visites libres, Déjeuner traditionnel'
        }));
      };
      const itinerary = getItinerary();

      const inclusions = Array.isArray(selectedTrip.included_items) && selectedTrip.included_items.length > 0
        ? selectedTrip.included_items
        : ['Transport principal (Aller-Retour)', 'Hébergement en chambre double/triple', 'Guide professionnel', 'Petits déjeuners quotidiens'];
      const exclusions = Array.isArray(selectedTrip.excluded_items) && selectedTrip.excluded_items.length > 0
        ? selectedTrip.excluded_items
        : ['Assurance voyage internationale', 'Frais de visa (si requis)', 'Repas non mentionnés'];

      const selectedRoomOption = roomOptions.find(r => r.name === selectedRoom) || roomOptions[0];
      const selectedMealOption = mealOptions.find(m => m.name === selectedMeal) || mealOptions[0];
      const roomOffset = selectedRoomOption ? Number(selectedRoomOption.price) : 0;
      const mealOffset = selectedMealOption ? Number(selectedMealOption.price) : 0;
      const singlePersonPrice = Number(selectedTrip.price) + roomOffset + mealOffset;
      const totalTripPrice = singlePersonPrice * bookingNumTravelers;
      
      const handleWhatsApp = () => {
        const message = encodeURIComponent(`Bonjour ${agency.company_name}! Je souhaite réserver le voyage "${selectedTrip.title}" pour ${selectedTrip.destination}. Nombre de voyageurs: ${bookingNumTravelers}.`);
        window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank');
      };

      const handleCall = () => {
        window.open(`tel:${agency.phone || '+213 555 12 34 56'}`, '_self');
      };

      return (
        <div className="bg-slate-50/50 text-slate-900 min-h-screen py-10 text-left font-sans relative overflow-hidden">
          {/* Ambients Glowing Orbs */}
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#c5a880]/3 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-violet-600/3 blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Back to catalog */}
            <button 
              onClick={() => { setCurrentPage('trips'); setSelectedTrip(null); }}
              className="mb-6 inline-flex items-center gap-2 text-xs font-black text-slate-700 hover:text-slate-950 transition bg-white border border-slate-200/80 px-5 py-2.5 rounded-full shadow-md backdrop-blur-md"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour au catalogue
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Image, Gallery, Itinerary */}
              <div className="lg:col-span-8 space-y-8 bg-white/90 border border-slate-200/50 p-6 sm:p-8 rounded-[2rem] shadow-lg backdrop-blur-md">
                
                {/* Active Image */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
                  <Image 
                    src={allImages[activeImage] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200'} 
                    alt={selectedTrip.title} 
                    fill
                    className="object-cover transition-all duration-300"
                  />
                  {allImages.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveImage(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActiveImage(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`relative h-12 w-20 rounded-lg overflow-hidden border shrink-0 transition-all ${
                          activeImage === idx ? 'border-white ring-2 ring-white/25 scale-95' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Title and Badge */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-[#c5a880] uppercase tracking-widest font-serif">{selectedTrip.destination}</span>
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug font-serif">{selectedTrip.title}</h1>
                  <p className="text-xs text-slate-400 font-semibold">{selectedTrip.duration_days} jours / {selectedTrip.duration_days - 1} nuits d'aventure exceptionnelle.</p>
                </div>

                {/* Parameters Bento Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Tarif de base</p>
                      <p className="text-xs font-black text-slate-900">{formatDZD(selectedTrip.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Meilleure Saison</p>
                      <p className="text-xs font-black text-slate-900">Avril - Septembre</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏨</span>
                    <div>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Hôtels Inclus</p>
                      <p className="text-xs font-black text-slate-900">4★ & 5★ Luxe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛂</span>
                    <div>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Visa requis</p>
                      <p className="text-xs font-black text-slate-900">{selectedTrip.visa_type || 'Requis'}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif">Description du Circuit</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {selectedTrip.description || 'Itinéraire complet avec vols directs, hébergements de luxe.'}
                  </p>
                </div>

                {/* Itinerary Day-by-Day */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif">Programme Détaillé</h3>
                  <div className="space-y-3">
                    {itinerary.map((dayObj: any, index: number) => (
                      <div key={index} className="p-4 bg-white border border-slate-200/60 rounded-2xl text-left space-y-1.5 hover:border-slate-350 transition duration-150 shadow-sm">
                        <span className="inline-flex items-center justify-center bg-slate-900 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          Jour {dayObj.day}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 font-serif">{dayObj.title}</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{dayObj.description}</p>
                        {dayObj.activities && (
                          <p className="text-[10px] text-[#c5a880] font-bold mt-1">✨ Activités: {dayObj.activities}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif">Inclus dans le package</h4>
                    <ul className="space-y-1.5 text-slate-650 text-[11px] font-semibold">
                      {inclusions.map((item: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#c5a880] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 font-serif">Non inclus</h4>
                    <ul className="space-y-1.5 text-slate-650 text-[11px] font-semibold">
                      {exclusions.map((item: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <X className="h-3.5 w-3.5 text-rose-455 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Inquiry Booking form widget */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 bg-white/90 border border-slate-200/60 rounded-[2rem] p-6 shadow-xl space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 font-serif">Réservation</h3>
                  <div className="pt-4 space-y-4">
                    
                    {/* Travelers Count */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Nombre de Voyageurs</label>
                      <div className="flex items-center justify-between border border-slate-200 rounded-xl p-1.5 mt-1 bg-white">
                        <button 
                          onClick={() => setBookingNumTravelers(v => Math.max(1, v - 1))}
                          className="h-8 w-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-800 transition"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-slate-900">{bookingNumTravelers}</span>
                        <button 
                          onClick={() => setBookingNumTravelers(v => v + 1)}
                          className="h-8 w-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-800 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Room Type */}
                    {roomOptions.length > 0 && (
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Type de Chambre</label>
                        <select
                          value={selectedRoom}
                          onChange={e => setSelectedRoom(e.target.value)}
                          className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-450"
                        >
                          {roomOptions.map((opt, i) => (
                            <option key={i} value={opt.name} className="text-slate-900 font-semibold">
                              {opt.name} {opt.price > 0 ? `(+${opt.price} DA)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Meal Plan */}
                    {mealOptions.length > 0 && (
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Formule Repas</label>
                        <select
                          value={selectedMeal}
                          onChange={e => setSelectedMeal(e.target.value)}
                          className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-450"
                        >
                          {mealOptions.map((opt, i) => (
                            <option key={i} value={opt.name} className="text-slate-900 font-semibold">
                              {opt.name} {opt.price > 0 ? `(+${opt.price} DA)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pricing Breakdown */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-xs font-semibold text-slate-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Tarif unitaire</span>
                        <span>{formatDZD(singlePersonPrice)}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 border-t border-slate-150 pt-2.5 text-sm">
                        <span>Total (TTC)</span>
                        <span>{formatDZD(totalTripPrice)}</span>
                      </div>
                    </div>

                    {/* Submit CTA */}
                    <div className="space-y-2 pt-2">
                      <button 
                        onClick={handleWhatsApp}
                        className="w-full py-3.5 bg-[#c5a880] hover:bg-[#b59871] text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-4.5 w-4.5" /> Réserver par WhatsApp
                      </button>
                      <button 
                        onClick={handleCall}
                        className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                      >
                        📞 Appeler l'agence
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      );
    }

    return null;
  };

  const waPhone = (agency?.website_settings?.whatsapp_phone || agency?.website_settings?.phone || agency?.phone || '').replace(/\D/g, '');

  return (
    <div 
      className="w-full select-none overflow-x-hidden antialiased bg-[var(--bg)] text-[var(--text)] transition-colors duration-300" 
      style={customVariables}
    >
      {/* CSS Animations */}
      <style>{`
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.05); opacity: 0.25; }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translateY(0px) scale(1.1); opacity: 0.12; }
          50% { transform: translateY(20px) scale(0.95); opacity: 0.22; }
        }
        @keyframes count-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .orb-1 { animation: float-orb 7s ease-in-out infinite; }
        .orb-2 { animation: float-orb-2 9s ease-in-out infinite; }
        .orb-3 { animation: float-orb 11s ease-in-out infinite 2s; }
        .ring-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid currentColor;
          animation: ring-pulse 2s ease-out infinite;
        }
        .trip-card:hover .trip-wa-btn { opacity: 1; transform: translateY(0); }
        .trip-wa-btn { opacity: 0; transform: translateY(8px); transition: all 0.25s ease; }
        .testimonials-scroll {
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .testimonial-item {
          scroll-snap-align: start;
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .mobile-menu-enter { animation: slide-in-right 0.3s ease forwards; }
      `}</style>

      {/* Header Fonts Load */}
      <link href={`https://fonts.googleapis.com/css2?family=${headingFont}:wght@400;600;700;800;900&family=${bodyFont}:wght@400;500;600&display=swap`} rel="stylesheet" />

      {/* ENHANCED NAVBAR */}
      {activeTemplateId !== 't-indonesia-charm' && (
        <nav className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b",
          activeTemplateId === 't-valora-luxe' 
            ? "bg-slate-950/80 border-slate-900 text-white backdrop-blur-xl shadow-lg shadow-black/20" 
            : "bg-white/90 border-[var(--border)] text-slate-800 shadow-sm"
        )}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Logo + Name */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              {(agency?.website_settings?.logo_url || config?.logo_url || config?.design?.logo_url) && (
                <div className="relative h-9 w-9 rounded-xl overflow-hidden shrink-0">
                  <Image src={agency?.website_settings?.logo_url || config?.logo_url || config?.design?.logo_url} alt="Logo" fill sizes="36px" className="object-cover" />
                </div>
              )}
              <span className="font-extrabold text-lg tracking-tight transition-colors duration-300" style={{ fontFamily: headingFont, color: activeTemplateId === 't-valora-luxe' ? '#c5a880' : primary }}>
                {agency?.company_name || 'Ephedia Travel'}
              </span>
            </div>

            {/* Desktop Nav */}
            <div className={cn(
              "hidden md:flex items-center gap-6 text-xs font-bold transition-colors duration-300",
              activeTemplateId === 't-valora-luxe' ? "text-slate-300" : "text-slate-500"
            )}>
              <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={cn("hover:text-[var(--primary)] transition", currentPage === 'home' && "text-[var(--primary)]")}>Accueil</button>
              <button onClick={() => { setCurrentPage('trips'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={cn("hover:text-[var(--primary)] transition", currentPage === 'trips' && "text-[var(--primary)]")}>Voyages</button>
              <button onClick={() => { setCurrentPage('visas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={cn("hover:text-[var(--primary)] transition", currentPage === 'visas' && "text-[var(--primary)]")}>Visas</button>
              <button onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={cn("hover:text-[var(--primary)] transition", currentPage === 'contact' && "text-[var(--primary)]")}>Contact</button>
              <button onClick={() => { setCurrentPage('trips'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={getButtonStyle()}>
                Explorer les circuits
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              id="navbar-mobile-toggle"
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      )}

      {/* Mobile Slide-in Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-72 bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <span className="font-extrabold text-base" style={{ color: primary }}>{agency?.company_name || 'Ephedia Travel'}</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <nav className="flex-1 p-5 space-y-2 text-sm font-semibold text-slate-700">
                {[
                  { label: 'Accueil', onClick: () => { setCurrentPage('home'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); } },
                  { label: 'Voyages', onClick: () => { setCurrentPage('trips'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); } },
                  { label: 'Visas', onClick: () => { setCurrentPage('visas'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); } },
                  { label: 'Contact', onClick: () => { setCurrentPage('contact'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); } },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="p-5 border-t border-slate-100">
                <button onClick={() => { setCurrentPage('trips'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className={`${getButtonStyle()} w-full justify-center`}>
                  Réserver maintenant
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* RENDER DYNAMIC SECTIONS LIST */}
      <div className="flex flex-col">
        {activeTemplateId === 't-indonesia-charm' ? (
          <IndonesiaCharmDashboard />
        ) : activeTemplateId === 't-routea-explorer' && (currentPage === 'home' || currentPage === 'trips') ? (
          <RouteaExplorerDashboard />
        ) : currentPage === 'trip-detail' && selectedTrip ? (
          <TripDetailPage />
        ) : (
          sections.map((section: any) => {
            // Check visibility
            if (!section.visibility?.desktop && !isEditing) return null;

            const sectionType = section.type;

            // Multi-page page filtering:
            if (currentPage === 'home') {
              // Hide Visas and Contact sections on the home page.
              if (sectionType === 'Visas' || sectionType === 'Contact') {
                return null;
              }
            } else if (currentPage === 'trips') {
              if (sectionType !== 'Trips') return null;
            } else if (currentPage === 'visas') {
              if (sectionType !== 'Visas') return null;
            } else if (currentPage === 'contact') {
              if (sectionType !== 'Contact') return null;
            } else {
              return null;
            }

            const isFeaturedOnly = currentPage === 'home' && sectionType === 'Trips';
            const tripsToRender = isFeaturedOnly 
              ? displayTrips.slice(0, 3) 
              : (section.variant === 'grid-3' ? grid3Trips : filteredTrips);
            const showFilters = !isFeaturedOnly;

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

              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* 1. HERO SECTION */}
                {section.type === 'Hero' && (
                  <>
                    {section.variant === 'valora-luxe' ? (
                      /* ── VALORA LUXE HERO ─────────────────────────── */
                      <div className="relative -mx-4 sm:-mx-6 -mt-[64px] px-4 sm:px-8 pt-32 pb-24 overflow-hidden min-h-[580px] flex flex-col justify-center bg-cover bg-center text-center"
                        style={{ backgroundImage: `linear-gradient(rgba(8, 12, 20, 0.65), rgba(8, 12, 20, 0.8)), url(${section.content.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600'})` }}
                      >
                        {/* Animated floating orbs */}
                        <div className="orb-1 absolute top-10 left-[10%] h-48 w-48 rounded-full bg-white pointer-events-none" style={{ opacity: 0.06 }} />
                        <div className="orb-2 absolute bottom-8 right-[8%] h-64 w-64 rounded-full bg-white pointer-events-none" style={{ opacity: 0.05 }} />

                        <div className="relative max-w-4xl mx-auto w-full space-y-6">
                          {section.content.badge && (
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase bg-white/5 text-[#c5a880] border border-white/10 backdrop-blur-sm">
                              {section.content.badge}
                            </span>
                          )}

                          <h1
                            className="font-extrabold tracking-tight text-white text-3xl sm:text-5xl max-w-3xl mx-auto leading-[1.1] drop-shadow-sm"
                            style={{ fontFamily: headingFont }}
                          >
                            <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Explorez le monde en toute élégance'} />
                          </h1>

                          <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-2xl mx-auto font-medium">
                            <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Redéfinissez le voyage de luxe. Service de conciergerie privée, hébergements d\'exception et circuits haut de gamme.'} multiline />
                          </p>

                          {/* Luxury booking widget - translucent glass */}
                          <div className="max-w-3xl mx-auto rounded-2xl p-4 shadow-2xl border border-white/10 text-left bg-slate-950/40 backdrop-blur-md mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-end">
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">🌍 Destination</label>
                                <input id="valora-dest" type="text" placeholder="Turquie, Omra, France..." className="w-full h-9 px-3 text-xs bg-white/5 border border-white/10 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#c5a880] focus:outline-none placeholder-white/35" />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">📅 Date de départ</label>
                                <input id="valora-date" type="date" className="w-full h-9 px-3 text-xs bg-white/5 border border-white/10 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#c5a880] focus:outline-none" />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">🏨 Hébergement</label>
                                <select id="valora-type" className="w-full h-9 px-2 text-xs bg-[#0b0f19] border border-white/10 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#c5a880] focus:outline-none">
                                  <option value="luxury">Hôtels 5★ Luxe</option>
                                  <option value="resort">Villas & Resorts</option>
                                  <option value="suite">Suites Exécutives</option>
                                </select>
                              </div>
                              <button
                                onClick={scrollToTrips}
                                className="h-9 w-full rounded-lg text-slate-950 text-xs font-black shadow bg-[#c5a880] hover:bg-[#b0946c] transition-all hover:scale-[1.01]"
                              >
                                {section.content.primary_cta || 'Réserver mon séjour'}
                              </button>
                            </div>
                          </div>

                          {/* Trust metrics */}
                          <div className="flex flex-wrap justify-center gap-5 pt-3 text-[10px] font-bold text-white/60">
                            <span className="flex items-center gap-1">⚜️ Conciergerie 24/7</span>
                            <span className="flex items-center gap-1">⚜️ Circuits VIP Privés</span>
                            <span className="flex items-center gap-1">⚜️ Hôtels d'exception</span>
                          </div>

                        </div>
                      </div>
                    ) : section.variant === 'traventure' ? (
                      /* ── ENHANCED TRAVENTURE HERO ─────────────────────────── */
                      <div className="relative -mx-4 sm:-mx-6 -mt-[64px] px-4 sm:px-8 pt-24 pb-16 overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
                      >
                        {/* Animated floating orbs */}
                        <div className="orb-1 absolute top-10 left-[10%] h-48 w-48 rounded-full bg-white pointer-events-none" style={{ opacity: 0.12 }} />
                        <div className="orb-2 absolute bottom-8 right-[8%] h-64 w-64 rounded-full bg-white pointer-events-none" style={{ opacity: 0.10 }} />
                        <div className="orb-3 absolute top-1/2 left-1/2 h-36 w-36 rounded-full bg-white pointer-events-none" style={{ opacity: 0.08 }} />

                        <div className="relative max-w-6xl mx-auto">
                          {/* Destination badge pills */}
                          <div className="flex flex-wrap gap-2 mb-6">
                            {[
                              { label: '🇹🇷 Turquie', id: 'pill-tr' },
                              { label: '🇲🇦 Maroc', id: 'pill-ma' },
                              { label: '🇸🇦 Omra', id: 'pill-sa' },
                              { label: '✈️ Monde', id: 'pill-world' },
                            ].map(pill => (
                              <span key={pill.id} id={pill.id} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm hover:bg-white/30 transition cursor-default">
                                {pill.label}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-6 space-y-6">
                              <h1
                                className="font-extrabold tracking-tight text-white text-4xl sm:text-5xl leading-[1.05] drop-shadow-sm"
                                style={{ fontFamily: headingFont }}
                              >
                                <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Explorez le monde'} />
                              </h1>
                              <p className="text-sm text-white/85 leading-relaxed max-w-lg">
                                <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Découvrez des voyages inoubliables, des services visa fiables et un accompagnement total.'} multiline />
                              </p>

                              {/* Glassy search widget */}
                              <div className="rounded-2xl p-3 shadow-2xl" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                  <div className="sm:col-span-3 grid grid-cols-3 gap-2">
                                    <input id="hero-dest-input" className="h-10 px-3 text-xs border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-[var(--primary)] focus:outline-none" placeholder="🌍 Destination" />
                                    <input id="hero-date-input" type="date" className="h-10 px-3 text-xs border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-[var(--primary)] focus:outline-none" />
                                    <input id="hero-budget-input" className="h-10 px-3 text-xs border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-[var(--primary)] focus:outline-none" placeholder="💰 Budget" />
                                  </div>
                                  <button
                                    id="hero-search-btn"
                                    onClick={scrollToTrips}
                                    className="h-10 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                                  >
                                    {section.content.primary_cta || 'Rechercher'}
                                  </button>
                                </div>
                              </div>

                              {/* Trust badges */}
                              <div className="flex flex-wrap gap-3">
                                {[
                                  { icon: '✅', label: 'Sans risque' },
                                  { icon: '📞', label: 'Support 24/7' },
                                  { icon: '⭐', label: '4.9/5 avis' },
                                ].map(badge => (
                                  <div key={badge.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold border border-white/25 backdrop-blur-sm">
                                    <span>{badge.icon}</span>
                                    <span>{badge.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="lg:col-span-6">
                              <div className="grid grid-cols-2 gap-3">
                                {(displayTrips.slice(0, 4)).map((trip: any) => (
                                  <div key={trip.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 bg-slate-100 group cursor-pointer"
                                    onClick={() => { setSelectedTrip(trip); setCurrentPage('trip-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                    <Image
                                      src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500'}
                                      alt={trip.title || 'Trip'}
                                      fill
                                      sizes="(max-width: 1024px) 50vw, 25vw"
                                      className="object-cover group-hover:scale-110 transition duration-500"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                      <p className="text-[10px] text-white font-bold line-clamp-1">{trip.title}</p>
                                      <p className="text-[9px] text-white/70">{trip.duration_days}J · {formatDZD(trip.price || 0)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : section.variant === 'carousel' ? (
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
                                  style={{ fontFamily: headingFont, lineHeight: 1.15 }}
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
                    ) : section.variant === 'booking_form' && agency?.business_type_slug === 'car_showroom' ? (
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
                            style={{ fontFamily: headingFont, fontSize: `${headingSize}px`, lineHeight: 1.15 }}
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
                              🚗 00km &amp; Garantie
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
                                  type="date" value={pickupDate} 
                                  onChange={e => setPickupDate(e.target.value)} 
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-50 font-semibold text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-500 uppercase tracking-wide">Heure départ</label>
                                <input 
                                  type="time" value={pickupTime} 
                                  onChange={e => setPickupTime(e.target.value)}
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-50 font-semibold text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-slate-500 uppercase tracking-wide">Date retour</label>
                                <input 
                                  type="date" value={returnDate} 
                                  onChange={e => setReturnDate(e.target.value)}
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 bg-slate-50 font-semibold text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-500 uppercase tracking-wide">Heure retour</label>
                                <input 
                                  type="time" value={pickupTime} disabled
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
                          style={{ fontFamily: headingFont, fontSize: `${headingSize}px`, lineHeight: 1.15 }}
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

                {/* 2. STATS BAR — enhanced with count-up animation */}
                {section.type === 'Stats' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {(section.content?.items || []).map((stat: any, idx: number) => {
                      const StatIcon = getSectionIcon(stat.icon);
                      return (
                        <div key={idx} className="relative flex flex-col items-center text-center space-y-3 p-6 rounded-2xl overflow-hidden group hover:scale-[1.03] transition duration-300 cursor-default"
                          style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                          {/* Pulsing ring background */}
                          <div className="relative ring-pulse" style={{ color: primary }}>
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-md transition group-hover:scale-110 duration-300"
                              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                              <StatIcon className="h-5 w-5" />
                            </div>
                          </div>
                          <span className="text-3xl font-black tracking-tight" style={{ fontFamily: headingFont, color: primary }}>
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

                {/* 3. WHY CHOOSE US — gradient borders + pulsing rings */}
                {section.type === 'WhyUs' && (
                  <div id="why-choose-us" className="space-y-10 text-left">
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
                            <div key={idx} className="relative p-6 rounded-2xl space-y-4 group hover:shadow-xl transition duration-300 overflow-hidden"
                              style={{ 
                                background: cardBg, 
                                border: `1px solid transparent`,
                                backgroundClip: 'padding-box',
                                boxShadow: `0 0 0 1px ${primary}22, 0 4px 24px rgba(0,0,0,0.06)`
                              }}>
                              {/* Gradient border overlay */}
                              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"
                                style={{ boxShadow: `0 0 0 2px ${primary}55, 0 8px 32px ${primary}22` }} />
                              
                              {/* Icon with pulsing ring */}
                              <div className="relative h-12 w-12">
                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition duration-300"
                                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                                  <CardIcon className="h-5 w-5" />
                                </div>
                                <div className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 animate-ping"
                                  style={{ borderColor: primary }} />
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
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || "Filtrez le catalogue en sélectionnant l'une de nos marques phares."} />
                      </p>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {[
                        { name: 'all', label: 'Toutes', logo: '🌐' },
                        { name: 'Hyundai', label: 'Hyundai', logo: '🚗' },
                        { name: 'Kia', label: 'Kia', logo: '🚙' },
                        { name: 'Seat', label: 'Seat', logo: '🏎️' },
                        { name: 'Toyota', label: 'Toyota', logo: '🚐' },
                        { name: 'Renault', label: 'Renault', logo: '🔷' },
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

                {/* 4. TRIPS SECTION — enhanced grid-3 */}
                {section.type === 'Trips' && (
                  <div ref={tripsRef} id="trips-grid" className="space-y-8">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle} />
                      </p>
                    </div>

                    {section.variant === 'grid-3' ? (
                      <>
                        {/* Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="flex-1 flex items-center gap-2 px-3 border border-slate-200 rounded-xl bg-slate-50">
                            <Search className="h-4 w-4 text-slate-400 shrink-0" />
                            <input
                              id="trip-search-input"
                              type="text"
                              placeholder="Rechercher un voyage..."
                              className="flex-1 bg-transparent border-0 text-xs font-medium focus:ring-0 focus:outline-none text-slate-700 py-2"
                              value={tripSearch}
                              onChange={e => setTripSearch(e.target.value)}
                            />
                          </div>
                          <select
                            id="trip-dest-filter"
                            value={tripDestFilter}
                            onChange={e => setTripDestFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          >
                            <option value="all">🌍 Toutes destinations</option>
                            {allDestinations.map((dest: string) => (
                              <option key={dest} value={dest}>{dest}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2 px-3 border border-slate-200 rounded-xl bg-slate-50">
                            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Max: {formatDZD(tripMaxPrice)}</span>
                            <input
                              id="trip-price-slider"
                              type="range"
                              min="50000"
                              max="600000"
                              step="10000"
                              value={tripMaxPrice}
                              onChange={e => setTripMaxPrice(Number(e.target.value))}
                              className="w-24 accent-[var(--primary)] cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Trips Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {tripsToRender.length === 0 ? (
                            <div className="col-span-full py-16 flex flex-col items-center text-center space-y-4">
                              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl">✈️</div>
                              <h3 className="text-base font-bold text-slate-700">Aucun voyage disponible</h3>
                              <p className="text-xs text-slate-500 max-w-xs">Essayez de modifier vos filtres ou consultez nos autres offres.</p>
                              <button onClick={() => { setTripSearch(''); setTripDestFilter('all'); setTripMaxPrice(500000); }}
                                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                                Réinitialiser les filtres
                              </button>
                            </div>
                          ) : (
                            tripsToRender.map((trip: any) => (
                              <div
                                key={trip.id}
                                className={cn(
                                  "trip-card group relative flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                                  activeTemplateId === 't-valora-luxe'
                                    ? "bg-slate-900 border-slate-800 text-white shadow-xl hover:shadow-[0_0_20px_rgba(197,168,128,0.15)] hover:border-[#c5a880]/30"
                                    : "bg-white border-slate-200 text-slate-850 hover:shadow-xl"
                                )}
                                style={{ borderRadius: `${cardRadius}px` }}
                                onClick={() => { setSelectedTrip(trip); setCurrentPage('trip-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              >
                                {/* Image */}
                                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                                  <Image
                                    src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600'}
                                    alt={trip.title || 'Voyage'}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    quality={80}
                                    className="object-cover group-hover:scale-110 transition duration-500"
                                  />
                                  {/* Destination badge */}
                                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/55 backdrop-blur-sm border border-white/20">
                                    {getCountryFlag(trip.destination)} {trip.destination || 'Algérie'}
                                  </span>
                                  {/* Duration */}
                                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/55 backdrop-blur-sm border border-white/20">
                                    {trip.duration_days}J
                                  </span>
                                  {/* WhatsApp hover button */}
                                  <div className="trip-wa-btn absolute inset-x-3 bottom-3">
                                    <a
                                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par le voyage: ${trip.title} - ${formatDZD(trip.price || 0)}`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl font-bold text-xs text-white shadow-lg"
                                      style={{ background: '#25D366' }}
                                    >
                                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                      Réserver sur WhatsApp
                                    </a>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col space-y-2">
                                  <h3 className={cn(
                                    "text-sm font-bold transition line-clamp-2 leading-snug",
                                    activeTemplateId === 't-valora-luxe' ? "text-slate-100 group-hover:text-[#c5a880]" : "text-slate-800 group-hover:text-[var(--primary)]"
                                  )}>
                                    {trip.title}
                                  </h3>
                                  <p className={cn(
                                    "text-[11px] leading-relaxed line-clamp-2 flex-1",
                                    activeTemplateId === 't-valora-luxe' ? "text-slate-400" : "text-slate-500"
                                  )}>
                                    {trip.description || 'Une expérience voyage inoubliable avec un service haut de gamme.'}
                                  </p>
                                  <div className={cn(
                                    "pt-3 flex items-center justify-between border-t mt-auto",
                                    activeTemplateId === 't-valora-luxe' ? "border-slate-800" : "border-slate-100"
                                  )}>
                                    <div>
                                      {trip.original_price && (
                                        <span className="text-[9px] text-slate-400 line-through font-semibold block">
                                          {formatDZD(trip.original_price)}
                                        </span>
                                      )}
                                      <span className="text-sm font-black" style={{ color: activeTemplateId === 't-valora-luxe' ? '#c5a880' : primary }}>
                                        {formatDZD(trip.price || 0)}
                                      </span>
                                    </div>
                                    <button
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow"
                                      style={{ background: activeTemplateId === 't-valora-luxe' ? '#c5a880' : `linear-gradient(135deg, ${primary}, ${secondary})`, color: activeTemplateId === 't-valora-luxe' ? '#080c14' : '#fff' }}
                                      onClick={e => { e.stopPropagation(); setSelectedTrip(trip); setCurrentPage('trip-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    >
                                      Voir détails
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Default trips view */}
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {tripsToRender.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-xs text-slate-500 font-bold">
                              Aucun circuit ne correspond à votre recherche.
                            </div>
                          ) : (
                            tripsToRender.map((trip: any) => {
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
                                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 font-semibold">
                                      <span>Départ: {trip.departure_city || 'Alger'}</span>
                                      <span>Transport: {trip.transport_type || 'Vol'}</span>
                                      <span>Hôtel: {trip.hotel_name || 'Inclus'}</span>
                                      <span>Niveau: {trip.difficulty_level || 'Standard'}</span>
                                    </div>
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
                                        <button
                                          onClick={() => { setSelectedTrip(trip); setCurrentPage('trip-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                          className="px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--secondary)] text-white text-[10px] font-black rounded-xl transition"
                                        >
                                          Réserver
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* VISAS SECTION — gorgeous new design */}
                {section.type === 'Visas' && (
                  <div id="visas" className="space-y-10">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Services Visa'} />
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Nous vous accompagnons dans toutes vos démarches visas'} />
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {displayVisas.slice(0, 8).map((visa: any) => {
                        const flag = getCountryFlag(visa.destination_country || visa.name);
                        const totalFee = Number(visa.government_fee || 0) + Number(visa.service_fee || 0);
                        const requirements = visa.requirements || ['Passeport valide', 'Formulaire rempli', 'Photos récentes', 'Justificatif bancaire'];
                        return (
                          <div key={visa.id} className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-[var(--primary)]/30"
                            style={{ borderRadius: `${cardRadius}px` }}>
                            {/* Header */}
                            <div className="p-5 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}20)` }}>
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
                                style={{ background: `linear-gradient(135deg, ${primary}25, ${secondary}30)` }} />
                              <span className="text-4xl relative z-10">{flag}</span>
                              <h3 className="text-xs font-black text-slate-800 mt-2 relative z-10">{visa.name || 'Visa Service'}</h3>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider relative z-10">{visa.destination_country || 'International'}</span>
                              {totalFee > 0 && (
                                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-black text-white relative z-10"
                                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                                  {formatDZD(totalFee)}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="p-4 flex-1 flex flex-col space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500">
                                <div>⏱️ <span className="font-bold">{visa.processing_time || 'N/A'}</span></div>
                                <div>📅 <span className="font-bold">{visa.validity || 'Selon consulat'}</span></div>
                                <div>🏠 <span className="font-bold">{visa.stay_duration || 'Variable'}</span></div>
                                <div>📋 <span className="font-bold">{visa.visa_type || visa.application_method || 'Standard'}</span></div>
                              </div>

                              {/* Requirements */}
                              <div className="space-y-1 flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Documents requis</p>
                                {requirements.slice(0, 4).map((req: string, ri: number) => (
                                  <div key={ri} className="flex items-start gap-1.5 text-[10px] text-slate-600 font-medium">
                                    <Check className="h-3 w-3 text-[#c5a880] shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">{req}</span>
                                  </div>
                                ))}
                              </div>

                              {/* CTA */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVisaForInquiry(visa);
                                }}
                                className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:shadow-lg transition-all hover:scale-102"
                                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                              >
                                Demander ce visa 🛂
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. TESTIMONIALS — horizontal scroll with glassmorphism */}
                {section.type === 'Testimonials' && (
                  <div className="space-y-8">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}>
                        <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Ce que disent nos clients'} />
                      </h2>
                    </div>

                    <div className="testimonials-scroll flex gap-5 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                      {(section.content?.items || [
                        { name: 'Achraf Amalou', location: 'Alger', quote: 'Le voyage en Turquie était exceptionnel ! Tout était parfaitement organisé, hôtel de luxe et guide professionnel.', rating: 5, avatar: 'AA' },
                        { name: 'Sarah Benzineb', location: 'Oran', quote: 'Excellent service pour l\'Omra. Très simple à réserver et un accompagnement du début à la fin. Je recommande!', rating: 5, avatar: 'SB' },
                        { name: 'Mourad Belkacem', location: 'Constantine', quote: 'Visa France obtenu en 10 jours seulement! Service rapide, équipe professionnelle et prix transparent.', rating: 5, avatar: 'MB' },
                        { name: 'Amina Kaci', location: 'Annaba', quote: 'Le séjour à Marrakech était magique. Je reviendrai sûrement réserver un autre voyage avec cette agence!', rating: 5, avatar: 'AK' },
                      ]).map((test: any, idx: number) => (
                        <div key={idx} className="testimonial-item shrink-0 w-72 sm:w-80 flex flex-col rounded-2xl p-5 space-y-4 border border-white/50"
                          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                          {/* Stars */}
                          <div className="flex items-center gap-1">
                            {[...Array(test.rating || 5)].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          {/* Quote */}
                          <p className="text-xs text-slate-600 leading-relaxed italic flex-1">
                            "<EditableText sectionId={section.id} contentKey={`items.${idx}.quote`} value={test.quote} multiline />"
                          </p>
                          {/* Author */}
                          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0"
                              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                              {test.avatar || 'AA'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                <EditableText sectionId={section.id} contentKey={`items.${idx}.name`} value={test.name} />
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold">{test.location || 'Algérie'}</p>
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
                        { q: 'Comment réserver un circuit ?', a: "Vous pouvez cliquer sur \"Réserver\" et compléter notre formulaire d'acompte sécurisé en ligne." },
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
                          <div className="h-12 w-12 rounded-full text-white flex items-center justify-center font-bold text-sm mx-auto"
                            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
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
                        { title: "Comment bien préparer son voyage d'Umrah ?", desc: 'Trousseau complet, formalités administratives et guides spirituels.' }
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

                {/* 10. CONTACT SECTION — split layout */}
                {section.type === 'Contact' && (
                  <div id="contact" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left: Contact Info */}
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                          <EditableText sectionId={section.id} contentKey="title" value={section.content.title || 'Contactez-nous'} />
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || 'Notre équipe est disponible pour vous aider à planifier votre voyage de rêve.'} multiline />
                        </p>
                      </div>

                      {/* WhatsApp CTA */}
                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                        >
                          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Chatter sur WhatsApp
                        </a>
                      )}

                      <div className="space-y-4">
                        {[
                          { Icon: Mail, value: section.content.email || agency?.email || 'contact@agency.dz', key: 'email' },
                          { Icon: Phone, value: section.content.phone || agency?.phone || '+213 555 12 34 56', key: 'phone' },
                          { Icon: MapPin, value: section.content.address || agency?.address || 'Alger Centre, Algérie', key: 'address' },
                          { Icon: Clock, value: 'Samedi – Jeudi: 09:00 – 18:00', key: 'hours' },
                        ].map(({ Icon, value, key }) => (
                          <div key={key} className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl text-white shrink-0 mt-0.5"
                              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 mt-1">
                              {key !== 'hours' 
                                ? <EditableText sectionId={section.id} contentKey={key} value={value} />
                                : value
                              }
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Map placeholder */}
                      <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <MapPin className="h-8 w-8 mx-auto text-slate-300" />
                          <p className="text-[10px] text-slate-400 font-semibold">Carte de localisation</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Contact Form */}
                    <form onSubmit={handleContactSubmit} className="bg-white border border-slate-200 p-7 rounded-2xl shadow-lg space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Formulaire de Contact</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Réponse garantie sous 24h</p>
                      </div>
                      <div className="space-y-3 text-xs">
                        {contactSuccess && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#c5a880] rounded-xl flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#c5a880]" />
                            <span className="font-semibold text-[10px]">Message envoyé avec succès! Notre équipe vous recontactera très rapidement.</span>
                          </div>
                        )}
                        {contactError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                            <span className="font-semibold text-[10px]">{contactError}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            id="contact-name" 
                            type="text" 
                            placeholder="Nom complet" 
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition" 
                            required
                          />
                          <input 
                            id="contact-phone" 
                            type="tel" 
                            placeholder="Téléphone" 
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition" 
                            required
                          />
                        </div>
                        <input 
                          id="contact-email" 
                          type="email" 
                          placeholder="Adresse Email" 
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition" 
                        />
                        <select 
                          id="contact-subject" 
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
                        >
                          <option value="">🗂️ Objet de la demande</option>
                          <option value="Renseignement voyage">Renseignement voyage</option>
                          <option value="Service visa">Service visa</option>
                          <option value="Demande de devis">Demande de devis</option>
                          <option value="Autre demande">Autre demande</option>
                        </select>
                        <textarea 
                          id="contact-message" 
                          placeholder="Votre message..." 
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 h-28 resize-none focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition" 
                          required
                        />
                        <button 
                          id="contact-submit" 
                          type="submit"
                          disabled={contactSubmitting}
                          className="w-full py-3 font-bold rounded-xl text-white shadow-md hover:shadow-lg transition hover:opacity-95 active:scale-98 flex items-center justify-center gap-1.5"
                          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                        >
                          {contactSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Envoi en cours...</span>
                            </>
                          ) : (
                            <span>Envoyer le Message ✉️</span>
                          )}
                        </button>
                      </div>
                    </form>
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
                  <div className="text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
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
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || "Découvrez nos véhicules neufs et d'occasion disponibles immédiatement."} />
                      </p>
                    </div>

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
                              <img src={car.cover_image_url || car.img} alt="" className="object-cover w-full h-full transition duration-700 group-hover:scale-110" />
                              <span className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${car.condition === 'new' ? 'bg-[#c5a880]' : 'bg-amber-600'}`}>
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

                        <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5">Dossier de Financement</span>
                          {(() => {
                            const principal = selectedSalesCarForLoan.price * (1 - loanDownPercent/100);
                            const annualRate = 0.065;
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
                                  <span className="text-sm font-black text-indigo-600">{Math.round(monthlyPayment).toLocaleString()} DZD / mois</span>
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

                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800">📅 Calculateur Express de Location</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] font-bold text-slate-600">
                          <div className="space-y-1">
                            <label className="text-slate-450 uppercase">Modèle Sélectionné</label>
                            <select value={selectedRentalCar} onChange={e => setSelectedRentalCar(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] font-semibold">
                              {rentalCars.map((car: any) => (
                                <option key={car.id} value={car.model}>{car.brand} {car.model} ({(car.daily_rate).toLocaleString()} DZD/J)</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-455 uppercase">Durée de location (Jours)</label>
                            <input type="number" min="1" max="30" value={rentalDays} onChange={e => setRentalDays(Math.max(1, Number(e.target.value)))} className="w-full rounded-xl border border-slate-200 bg-white p-2 text-[11px] font-bold" />
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const activeCar = rentalCars.find(c => c.model === selectedRentalCar) || rentalCars[0];
                        const dailyRate = activeCar?.daily_rate || 7500;
                        const securityDeposit = activeCar?.security_deposit || 80000;
                        const subtotal = dailyRate * rentalDays;
                        const insuranceFee = 1500 * rentalDays;
                        return (
                          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3 font-bold">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5">Estimation de Réservation</span>
                            <div className="space-y-2">
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Tarif Journalier:</span><span>{dailyRate.toLocaleString()} DZD</span>
                              </div>
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Durée totale:</span><span>{rentalDays} jours</span>
                              </div>
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Assurance collision (incluse):</span><span>{insuranceFee.toLocaleString()} DZD</span>
                              </div>
                              <div className="flex justify-between text-amber-600 text-[10px] border-t border-dashed border-slate-100 pt-1.5">
                                <span>Caution de garantie (Restituée):</span><span>{securityDeposit.toLocaleString()} DZD</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                                <span className="text-[10px] text-slate-400 uppercase">Total Estimé:</span>
                                <span className="text-sm font-black text-indigo-650">{(subtotal + insuranceFee).toLocaleString()} DZD</span>
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
                        <EditableText sectionId={section.id} contentKey="subtitle" value={section.content.subtitle || "Estimez en temps réel le coût total de dédouanement au port d'Alger."} />
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800">⚓ Simulateur Express Port d'Alger</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">Faites glisser le curseur pour simuler le prix d'achat du véhicule à l'étranger (FOB Europe) et calculer la taxe de dédouanement estimée en Algérie.</p>
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

                      {(() => {
                        const dd = Math.round(importFobPrice * 0.3);
                        const tva = Math.round((importFobPrice + dd) * 0.19);
                        const daccis = 100000;
                        const stat = 20000;
                        const transit = 50000;
                        const portFees = 75000;
                        const transport = 40000;
                        const totalCustoms = dd + tva + daccis + stat + transit + portFees + transport;
                        const totalDelivered = importFobPrice + totalCustoms;
                        return (
                          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-3 font-bold">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5">Estimation Droits et Taxes (Dédouanement)</span>
                            <div className="space-y-2 text-[10px]">
                              <div className="flex justify-between text-slate-500"><span>1. Droits de Douane (30%):</span><span>{dd.toLocaleString()} DZD</span></div>
                              <div className="flex justify-between text-slate-500"><span>2. TVA Douane (19%):</span><span>{tva.toLocaleString()} DZD</span></div>
                              <div className="flex justify-between text-slate-500"><span>3. Redevances & DACCIS:</span><span>{(daccis + stat).toLocaleString()} DZD</span></div>
                              <div className="flex justify-between text-slate-500"><span>4. Magasinage, Transit & Transport:</span><span>{(transit + portFees + transport).toLocaleString()} DZD</span></div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline text-xs">
                                <span className="text-[10px] text-slate-400 uppercase">Total Taxes Estimé:</span>
                                <span className="text-slate-800">{totalCustoms.toLocaleString()} DZD</span>
                              </div>
                              <div className="pt-2 border-t-2 border-double border-slate-200 flex justify-between items-baseline text-xs">
                                <span className="text-[10px] text-slate-400 uppercase">Coût Total Clé en main:</span>
                                <span className="text-sm font-black text-indigo-600">{totalDelivered.toLocaleString()} DZD</span>
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
        }))}
      </div>

      {/* ENHANCED FOOTER — 4-column grid */}
      <footer 
        style={{ 
          background: activeTemplateId === 't-indonesia-charm' ? 'rgba(7, 12, 22, 0.65)' : '#0f172a', 
          color: activeTemplateId === 't-indonesia-charm' ? '#e2e8f0' : '#94a3b8' 
        }} 
        className={cn(
          "border-t", 
          activeTemplateId === 't-indonesia-charm' ? "border-white/10 backdrop-blur-xl" : "border-slate-800"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: About */}
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2">
                {(agency?.website_settings?.logo_url || config?.logo_url || config?.design?.logo_url) && (
                  <div className="relative h-8 w-8 rounded-lg overflow-hidden shrink-0">
                    <Image src={agency?.website_settings?.logo_url || config?.logo_url || config?.design?.logo_url} alt="Logo" fill sizes="32px" className="object-cover" />
                  </div>
                )}
                <h4 className="text-white font-extrabold text-sm tracking-tight" style={{ fontFamily: headingFont }}>
                  {agency?.company_name || 'INDOTRAVI'}
                </h4>
              </div>
              <p className={cn("text-xs leading-relaxed", activeTemplateId === 't-indonesia-charm' ? "text-slate-400" : "text-slate-500")}>
                Circuits de haute qualité au départ d'Alger. Le meilleur rapport qualité-prix garanti pour vos voyages.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3 pt-2">
                {[
                  { label: 'Facebook', color: '#1877F2', svg: <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                  { label: 'Instagram', color: '#E1306C', svg: <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                  { label: 'TikTok', color: '#000000', svg: <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.85a8.17 8.17 0 004.78 1.52V6.92a4.85 4.85 0 01-1.01-.23z"/></svg> },
                  { label: 'WhatsApp', color: '#25D366', svg: <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
                ].map(s => (
                  <a key={s.label} href={s.label === 'WhatsApp' ? `https://wa.me/${waPhone}` : '#'}
                    target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white transition hover:scale-110"
                    style={{ background: s.color }}
                    aria-label={s.label}>
                    {s.svg}
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-4 text-left">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Liens Rapides</h4>
              <ul className={cn("space-y-2 text-xs", activeTemplateId === 't-indonesia-charm' ? "text-slate-400" : "text-slate-500")}>
                {[
                  { label: 'Nos Voyages', href: '#trips' },
                  { label: 'Services Visa', href: '#visas' },
                  { label: 'Offres Spéciales', href: '#' },
                  { label: 'À propos', href: '#why-choose-us' },
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="flex items-center gap-1.5 hover:text-white transition">
                      <ChevronRight className="h-3 w-3 shrink-0" style={{ color: activeTemplateId === 't-indonesia-charm' ? '#c5a880' : primary }} />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Services */}
            <div className="space-y-4 text-left">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Services</h4>
              <ul className={cn("space-y-2 text-xs", activeTemplateId === 't-indonesia-charm' ? "text-slate-400" : "text-slate-500")}>
                {[
                  { label: 'Voyages organisés', href: '#' },
                  { label: 'Visa & Formalités', href: '#visas' },
                  { label: 'Réservation hôtels', href: '#' },
                  { label: 'Transferts aéroport', href: '#' },
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="flex items-center gap-1.5 hover:text-white transition">
                      <ChevronRight className="h-3 w-3 shrink-0" style={{ color: activeTemplateId === 't-indonesia-charm' ? '#c5a880' : primary }} />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div className="space-y-4 text-left">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Contact</h4>
              <ul className={cn("space-y-3 text-xs", activeTemplateId === 't-indonesia-charm' ? "text-slate-400" : "text-slate-500")}>
                <li className="flex items-start gap-2">
                  <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: activeTemplateId === 't-indonesia-charm' ? '#c5a880' : primary }} />
                  <span>{agency?.phone || '+213 555 12 34 56'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: activeTemplateId === 't-indonesia-charm' ? '#c5a880' : primary }} />
                  <span>{agency?.email || 'contact@agency.dz'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: activeTemplateId === 't-indonesia-charm' ? '#c5a880' : primary }} />
                  <span>{agency?.address || 'Alger Centre, Algérie'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: activeTemplateId === 't-indonesia-charm' ? '#c5a880' : primary }} />
                  <span>Sam – Jeu: 09:00 – 18:00<br />Ven: Fermé</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={cn("border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]", activeTemplateId === 't-indonesia-charm' ? "border-white/10 text-slate-500" : "border-slate-800 text-slate-600")}>
            <p>© 2026 {agency?.company_name || 'INDOTRAVI'}. Tous droits réservés.</p>
            <p>Propulsé par <a href="#" className="text-slate-400 hover:text-slate-200 transition font-bold">Aventra SaaS</a></p>
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
                      alt="" fill sizes="60px" quality={75}
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

      {/* Visa Inquiry Modal */}
      <AnimatePresence>
        {selectedVisaForInquiry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedVisaForInquiry(null);
                setVisaSuccessCode(null);
                setVisaError('');
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-y-auto z-10 p-6 sm:p-8 border border-slate-100 text-left animate-fadeIn"
            >
              <button 
                onClick={() => {
                  setSelectedVisaForInquiry(null);
                  setVisaSuccessCode(null);
                  setVisaError('');
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0 font-bold">
                    🛂
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">Demande de Visa</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedVisaForInquiry.name} — {selectedVisaForInquiry.destination_country}</p>
                  </div>
                </div>

                {visaSuccessCode ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="h-14 w-14 rounded-full bg-emerald-100 text-[#c5a880] flex items-center justify-center mx-auto text-2xl font-bold">
                      ✓
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-slate-800">Demande Enregistrée !</h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Votre dossier de visa a bien été soumis. Notre agent spécialisé prendra contact avec vous rapidement.</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center max-w-xs mx-auto">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Code Ticket</span>
                      <span className="text-base font-black text-indigo-650 tracking-widest">{visaSuccessCode}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedVisaForInquiry(null);
                        setVisaSuccessCode(null);
                      }}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition hover:bg-slate-800"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVisaSubmit} className="space-y-3.5 text-xs">
                    {visaError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        <span className="font-semibold text-[10px]">{visaError}</span>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom Complet *</label>
                      <input 
                        type="text" 
                        required 
                        value={visaName}
                        onChange={(e) => setVisaName(e.target.value)}
                        placeholder="Ex: Mohamed Benali"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Téléphone *</label>
                      <input 
                        type="tel" 
                        required 
                        value={visaPhone}
                        onChange={(e) => setVisaPhone(e.target.value)}
                        placeholder="Ex: 0555 12 34 56"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Email (Optionnel)</label>
                      <input 
                        type="email" 
                        value={visaEmail}
                        onChange={(e) => setVisaEmail(e.target.value)}
                        placeholder="Ex: mohamed@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Notes ou exigences particulières</label>
                      <textarea 
                        value={visaNotes}
                        onChange={(e) => setVisaNotes(e.target.value)}
                        placeholder="Ajoutez des détails sur vos dates prévues de voyage, situation professionnelle, etc..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 h-20 resize-none focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={visaSubmitting}
                      className="w-full mt-2 py-3.5 font-bold rounded-xl text-white shadow-md hover:shadow-lg transition hover:opacity-95 active:scale-98 flex items-center justify-center gap-1.5"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                    >
                      {visaSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Soumission en cours...</span>
                        </>
                      ) : (
                        <span>Soumettre la Demande 🛂</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Form Deposit Modal (CCP) */}
      <AnimatePresence>
        {isOnlineBookingOpen && selectedTrip && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOnlineBookingOpen(false);
                setBookingSuccessCode(null);
                setBookingError('');
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto z-10 p-6 sm:p-8 border border-slate-100 text-left"
            >
              <button 
                onClick={() => {
                  setIsOnlineBookingOpen(false);
                  setBookingSuccessCode(null);
                  setBookingError('');
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center text-xl shrink-0 font-bold">
                    💳
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">Réservation & Paiement CCP</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedTrip.title}</p>
                  </div>
                </div>

                {bookingSuccessCode ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="h-14 w-14 rounded-full bg-emerald-100 text-[#c5a880] flex items-center justify-center mx-auto text-2xl font-bold">
                      ✓
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-slate-800">Demande de Réservation Envoyée !</h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Votre réservation avec acompte CCP a été transmise. Nos agents valideront votre reçu sous 12h.</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center max-w-xs mx-auto">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Code de Réservation</span>
                      <span className="text-base font-black text-indigo-600 tracking-widest">{bookingSuccessCode}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsOnlineBookingOpen(false);
                        setBookingSuccessCode(null);
                      }}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition hover:bg-slate-800"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                    {bookingError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        <span className="font-semibold text-[10px]">{bookingError}</span>
                      </div>
                    )}

                    {/* Copiable CCP Details */}
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                      <h4 className="font-extrabold text-[10px] text-indigo-850 uppercase tracking-wider flex items-center gap-1.5">
                        🏦 Coordonnées CCP pour Acompte (20%)
                      </h4>
                      <p className="text-[10px] text-slate-500">Veuillez effectuer un verirement de 20% sur le compte suivant et insérer la référence ou le nom du reçu ci-dessous.</p>
                      <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] text-slate-700 font-semibold">
                        <div className="bg-white p-2 rounded-lg border border-indigo-50">
                          <span className="text-[9px] text-slate-400 block">Titulaire de compte</span>
                          <span className="font-bold truncate block">{agency.company_name}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-indigo-50">
                          <span className="text-[9px] text-slate-400 block">N° Compte CCP</span>
                          <span className="font-mono font-bold block text-indigo-650">0007894561 Clé 12</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Room and Meals */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Hébergement</label>
                        <select 
                          value={selectedRoom} 
                          onChange={(e) => setSelectedRoom(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          {parseOptions(selectedTrip.room_type, 'Double').map((room: any, i: number) => (
                            <option key={i} value={room.name}>
                              {room.name} {room.price > 0 ? `(+${room.price} DZD)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Restauration</label>
                        <select 
                          value={selectedMeal} 
                          onChange={(e) => setSelectedMeal(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          {parseOptions(selectedTrip.meal_plan, 'Demi-pension').map((meal: any, i: number) => (
                            <option key={i} value={meal.name}>
                              {meal.name} {meal.price > 0 ? `(+${meal.price} DZD)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Departure Date and Travelers */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Date de Départ</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 15 Juillet 2026"
                          value={bookingDate} 
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Nombre Voyageurs</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={10}
                          value={bookingNumTravelers} 
                          onChange={(e) => setBookingNumTravelers(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>
                    </div>

                    {/* Traveler identity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Nom du Voyageur principal *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Nom complet"
                          value={bookingFullName} 
                          onChange={(e) => setBookingFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Téléphone *</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="N° Mobile"
                          value={bookingPhone} 
                          onChange={(e) => setBookingPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Email (Optionnel)</label>
                        <input 
                          type="email" 
                          placeholder="adresse@email.com"
                          value={bookingEmail} 
                          onChange={(e) => setBookingEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Nom/Réf du Reçu CCP *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Nom de fichier ou N° de reçu"
                          value={bookingReceiptName} 
                          onChange={(e) => setBookingReceiptName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Calculated Prices summary */}
                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-600">
                      <div>
                        <span>Prix total estimé: </span>
                        <span className="font-bold text-slate-800">{formatDZD(Number(selectedTrip.price) * bookingNumTravelers)}</span>
                      </div>
                      <div className="text-right">
                        <span>Acompte CCP requis (20%): </span>
                        <span style={{ color: primary }} className="font-black text-sm">{formatDZD(Math.round(Number(selectedTrip.price) * bookingNumTravelers * 0.20))}</span>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={bookingSubmitting}
                      className="w-full py-3.5 font-bold rounded-xl text-white shadow-md hover:shadow-lg transition hover:opacity-95 active:scale-98 flex items-center justify-center gap-1.5"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                    >
                      {bookingSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Soumission en cours...</span>
                        </>
                      ) : (
                        <span>Soumettre la Preuve de Paiement 💳</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trip Detail Modal */}
      <AnimatePresence>
        {selectedTripForModal && (
          <TripDetailModal
            trip={selectedTripForModal}
            agency={agency}
            isOpen={!!selectedTripForModal}
            onClose={() => setSelectedTripForModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      {waPhone && (
        <a
          id="whatsapp-float-btn"
          href={`https://wa.me/${waPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300"
          style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.5)' }}
          aria-label="Chat on WhatsApp"
        >
          <svg className="h-7 w-7 fill-white" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
