'use client'

import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function WhatsAppButton({ agency }: { agency: any }) {
  const phone = agency.website_settings?.phone || ''
  if (!phone) return null

  const handleWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '')
    const message = encodeURIComponent(`Hello ${agency.company_name}! I'm interested in your trips.`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] group">
      {/* Tooltip */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
        Chat with us
        {/* Triangle arrow */}
        <div className="absolute top-1/2 -translate-y-1/2 left-full border-4 border-transparent border-l-slate-900" />
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleWhatsApp}
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#25D366]/30 transition-shadow hover:shadow-[#25D366]/50"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </motion.button>
    </div>
  )
}
