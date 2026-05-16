'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Users, Search, MessageCircle } from 'lucide-react'

export function HeroSection({ agency }: { agency: any }) {
  const settings = agency.website_settings || {}
  const heroImageUrl = settings.hero_image_url || 'https://images.unsplash.com/photo-1527838832700-5059252407fa'
  
  // Fix AAlgeria typo - strip duplicate first letter if it's 'A' followed by another 'A'
  const rawTitle = settings.hero_title || `Discover the world with ${agency.company_name}`
  const heroTitle = rawTitle.replace(/^A(?=A)/i, '')
  
  const heroSubtitle = settings.hero_subtitle || 'Handpicked destinations for Algerian explorers'
  
  // Search state
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('2')

  return (
    <section className="relative h-[70vh] flex items-center overflow-visible">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImageUrl} 
          alt="Travel Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold mb-6 tracking-wide uppercase">
              ✨ New Summer Destinations
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
              {heroTitle}
            </h1>
            <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-lg leading-relaxed">
              {heroSubtitle}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-6 z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-4 md:p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1">
                <MapPin className="w-3 h-3" /> Where to?
              </label>
              <input 
                type="text" 
                placeholder="Istanbul, Turkey"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1">
                <Calendar className="w-3 h-3" /> Dates
              </label>
              <input 
                type="text" 
                placeholder="Jul 31 - Aug 15"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1">
                <Users className="w-3 h-3" /> Guests
              </label>
              <select 
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all appearance-none"
              >
                <option value="1">1 Person</option>
                <option value="2">2 Persons</option>
                <option value="3">3 Persons</option>
                <option value="4">4+ Persons</option>
              </select>
            </div>

            <button className="h-[48px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
