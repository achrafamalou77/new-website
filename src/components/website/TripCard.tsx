'use client'

import { useState } from 'react'
import { MapPin, Plane, Bus, Star, Compass, Ship, Flame, Calendar, Sparkles, Scale } from 'lucide-react'
import { TripDetailModal } from './TripDetailModal'
import Image from 'next/image'

interface TripCardProps {
  trip: any
  agency: any
  isCompared?: boolean
  onToggleCompare?: (trip: any) => void
}

export function TripCard({ trip, agency, isCompared = false, onToggleCompare }: TripCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Format price: e.g. 150,000 DZD
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US') + ' DZD'
  }

  const originalPrice = trip.price * 1.15 // Mock original price
  const savings = originalPrice - trip.price

  // Dynamic transport icon selection
  const getTransportIcon = () => {
    switch (trip.transport_type) {
      case 'Avion':
        return <Plane className="w-3.5 h-3.5" />
      case 'Bus (Car)':
        return <Bus className="w-3.5 h-3.5" />
      case 'Voiture Privée':
        return <Compass className="w-3.5 h-3.5" />
      case 'Ferry/Bateau':
        return <Ship className="w-3.5 h-3.5" />
      default:
        return <Compass className="w-3.5 h-3.5" />
    }
  }

  // Get hotel star rendering
  const renderStars = () => {
    if (!trip.accommodation_type) return null
    if (trip.accommodation_type.includes('5')) return '5★ Hôtel'
    if (trip.accommodation_type.includes('4')) return '4★ Hôtel'
    if (trip.accommodation_type.includes('3')) return '3★ Hôtel'
    if (trip.accommodation_type.includes('2')) return '2★ Hôtel'
    return trip.accommodation_type
  }

  // Mock remaining capacity urgency
  const mockSpotsLeft = trip.max_bookings ? Math.floor(Math.random() * 4) + 3 : 5

  const rawImg = trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'
  
  // Auto-format images to WebP
  const optimizedImgUrl = rawImg.includes('unsplash.com') 
    ? `${rawImg.split('?')[0]}?auto=format&fm=webp&w=800&fit=crop&q=75`
    : rawImg

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group cursor-pointer block bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative text-left"
      >
        {/* Compare Checkbox Overlay Top-Left */}
        {onToggleCompare && (
          <div 
            onClick={(e) => {
              e.stopPropagation()
              onToggleCompare(trip)
            }}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5"
          >
            <button 
              type="button"
              className={`h-7 w-7 rounded-xl flex items-center justify-center border shadow-md transition-all ${
                isCompared 
                  ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-750' 
                  : 'bg-white/80 backdrop-blur-md border-slate-300 text-slate-600 hover:bg-white'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Featured Tag (Only displayed if not comparing or if offset) */}
        {trip.is_featured && !onToggleCompare && (
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[10px] font-black text-white uppercase tracking-wider shadow-md flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> EN VEDETTE
            </span>
          </div>
        )}

        {/* Transport Type Badge top-right */}
        <div className="absolute top-4 right-4 z-10">
          <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
            {getTransportIcon()}
            {trip.transport_type || 'Avion'}
          </span>
        </div>

        {/* Image Frame Container (Lazy Loaded, optimized WebP) */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image 
            src={optimizedImgUrl} 
            alt={trip.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={75}
            loading="lazy"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Lower Badges overlay on image */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-800 shadow-sm">
              {trip.duration_days} Jours {trip.num_nights ? `/ ${trip.num_nights} Nuits` : (trip.duration_days > 1 ? `/ ${trip.duration_days - 1} Nuits` : '')}
            </span>

            {/* Remaining spots urgency */}
            <span className="px-2.5 py-1 rounded-full bg-red-500 text-[10px] font-black text-white uppercase tracking-wider shadow-md flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-white" /> {mockSpotsLeft} Places Restantes!
            </span>
          </div>
        </div>

        {/* Card Body Info Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            
            {/* Tag Badges row */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {renderStars() && (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {renderStars()}
                </span>
              )}
              {trip.meal_plan && (
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold uppercase tracking-wider">
                  {trip.meal_plan}
                </span>
              )}
              {trip.transport_details?.flight_type === 'Direct' && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider">
                  Vol Direct
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <MapPin className="w-3 h-3 text-slate-400" />
              {trip.transport_details?.departure_city || 'Alger'} vers {trip.destination_country || trip.destination}
            </div>

            <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-1 group-hover:text-indigo-600 transition duration-200">
              {trip.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {trip.description || 'Découvrez ce magnifique voyage organisé avec notre agence avec service VIP.'}
            </p>
          </div>

          {/* Pricing Row */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tarif par Personne</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  {formatPrice(trip.price)}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(Math.round(originalPrice))}
                </span>
              </div>
            </div>

            {/* Savings percentage tag */}
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-150 shadow-xs">
              Sauf -15%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Départs: {Array.isArray(trip.available_dates) && trip.available_dates.length > 0 ? trip.available_dates[0] : 'Samedis de cet Été'}</span>
          </div>
        </div>
      </div>

      <TripDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        trip={trip} 
        agency={agency} 
      />
    </>
  )
}
