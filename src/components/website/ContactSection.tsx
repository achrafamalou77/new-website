'use client'

import { motion } from 'framer-motion'
import { MessageCircle, PhoneCall, Zap, BadgeDollarSign, ShieldCheck } from 'lucide-react'

export function ContactSection({ agency }: { agency: any }) {
  const settings = agency.website_settings || {}
  const phone = settings.phone || ''

  const handleWhatsApp = () => {
    if (!phone) return
    const cleanPhone = phone.replace(/\D/g, '')
    const message = encodeURIComponent(`Hello ${agency.company_name}! I'd like to plan my next trip.`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  return (
    <section id="contact" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
            Let's Plan Your Perfect Trip
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Our travel experts are ready to customize the perfect itinerary for your budget. Available 24/7 on WhatsApp for any questions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleWhatsApp}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#25D366] text-white font-bold text-lg shadow-xl shadow-[#25D366]/20 hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </button>
            <button
              onClick={() => window.location.href = `tel:${phone}`}
              className="w-full sm:w-auto px-10 py-4 rounded-full border-2 border-slate-200 text-slate-900 font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-5 h-5" />
              Call Directly
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 text-slate-400 text-sm font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Instant Response</div>
            <div className="flex items-center gap-2"><BadgeDollarSign className="w-4 h-4" /> Best Price</div>
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Trusted Service</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
