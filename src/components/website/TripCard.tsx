'use client'

import { useState } from 'react'
import { MapPin, Clock, Users } from 'lucide-react'
import { TripDetailModal } from './TripDetailModal'

export function TripCard({ trip, agency }: { trip: any, agency: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Format price: 12,000,000 DZD
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US') + ' DZD'
  }

  const originalPrice = trip.price * 1.15 // Mock original price
  const savings = originalPrice - trip.price

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group cursor-pointer block"
      >
        <div className="space-y-4">
          {/* Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img 
              src={trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'} 
              alt={trip.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Badges on Image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                {trip.duration_days} days
              </span>
              <span className="px-3 py-1 rounded-full bg-white text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                18-30s
              </span>
            </div>
            {/* Savings Badge */}
            <div className="absolute bottom-4 right-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
                Save {savings.toLocaleString('en-US')} DZD
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <MapPin className="w-3 h-3" />
              Algiers to {trip.destination}
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">
              {trip.title}
            </h3>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-lg font-black text-slate-900">
                {formatPrice(trip.price)}
              </span>
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(Math.round(originalPrice))}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Departs on Jul 31, 2026
            </p>
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
