'use client'

import { MessageCircle, Send, Camera } from 'lucide-react'

// Inline Facebook SVG
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function Footer({ agency }: { agency: any }) {
  const settings = agency.website_settings || {}
  const socialLinks = settings.social_links || {}

  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Col 1 — About */}
          <div className="space-y-6">
            <div className="text-xl font-bold tracking-tight">{agency.company_name}</div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              We specialize in creating unique travel experiences for Algerian explorers. From historic cities to luxury escapes.
            </p>
            <div className="flex gap-4">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} className="text-slate-400 hover:text-white transition-colors">
                  <FacebookIcon className="w-5 h-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} className="text-slate-400 hover:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </a>
              )}
              {settings.phone && (
                <a href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`} className="text-slate-400 hover:text-[#25D366] transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2 — Help */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider">Help & Support</h4>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Booking Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cancellation Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* Col 3 — Destinations */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider">Top Destinations</h4>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Istanbul, Turkey</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tunis, Tunisia</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dubai, UAE</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kuala Lumpur, Malaysia</a></li>
            </ul>
          </div>

          {/* Col 4 — Newsletter */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider">Newsletter</h4>
            <p className="text-slate-400 text-sm">Get the latest travel deals and destination guides.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-slate-700 transition-all pr-12"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
          <div>&copy; {new Date().getFullYear()} {agency.company_name}. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
