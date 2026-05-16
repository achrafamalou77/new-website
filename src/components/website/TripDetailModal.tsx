'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Users, Check, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export function TripDetailModal({ isOpen, onClose, trip, agency }: { 
  isOpen: boolean, 
  onClose: () => void, 
  trip: any, 
  agency: any 
}) {
  const [activeImage, setActiveImage] = useState(0)
  const images = trip.image_urls && trip.image_urls.length > 0 
    ? trip.image_urls 
    : ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200']

  const handleWhatsApp = () => {
    const phone = agency.website_settings?.phone || ''
    if (!phone) return
    const cleanPhone = phone.replace(/\D/g, '')
    const message = encodeURIComponent(`Hello ${agency.company_name}! I'm interested in the trip: "${trip.title}" to ${trip.destination}.`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  // Format price: 12,000,000 DZD
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US') + ' DZD'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="overflow-y-auto flex-1">
            {/* Hero Gallery */}
            <div className="relative h-[40vh] sm:h-[50vh] bg-slate-100">
              <img 
                src={images[activeImage]} 
                alt={trip.title} 
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <button 
                      onClick={() => setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_img: string, i: number) => (
                      <button 
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`w-2 h-2 rounded-full transition-all ${activeImage === i ? 'w-6 bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Content Grid */}
            <div className="p-8 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left: Info */}
                <div className="lg:col-span-2 space-y-10">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest mb-4">
                      <MapPin className="w-4 h-4" /> {trip.destination}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                      {trip.title}
                    </h2>
                    <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        {trip.duration_days} Days Trip
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        Ages 18-30s
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">About this adventure</h3>
                    <p className="text-slate-600 leading-relaxed">
                      {trip.description || "Join us for an unforgettable journey to one of the world's most beautiful destinations. Our carefully curated itinerary ensures you see the best of what this location has to offer, from hidden gems to world-renowned landmarks."}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">What's included</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        "Standard accommodation",
                        "Expert local guides",
                        "Internal transportation",
                        "Daily breakfast",
                        "24/7 on-trip support"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Booking Card */}
                <div className="lg:col-span-1">
                  <div className="sticky top-0 bg-slate-50 rounded-3xl p-8 border border-slate-100">
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Price starts from</div>
                    <div className="text-3xl font-black text-slate-900 mb-8">
                      {formatPrice(trip.price)}
                    </div>
                    
                    <button 
                      onClick={handleWhatsApp}
                      className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 mb-4"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Book via WhatsApp
                    </button>
                    
                    <p className="text-center text-xs text-slate-500 leading-relaxed px-4">
                      No commitment required. Chat with our agents to finalize your booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
