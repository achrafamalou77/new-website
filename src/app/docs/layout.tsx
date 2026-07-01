import Link from 'next/link'
import { Zap } from 'lucide-react'

const WA_LINK = 'https://wa.me/213555100200?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20avec%20la%20plateforme%20Snipe.dz'

const navGroups = [
  {
    title: 'Pour commencer',
    items: [
      { href: '/docs', label: '📖 Vue d\'ensemble' },
      { href: '/docs/getting-started', label: '🚀 Démarrage Rapide' },
    ]
  },
  {
    title: 'Guides Métier',
    items: [
      { href: '/docs/travel', label: '✈️ Agences de Voyage' },
      { href: '/docs/showroom', label: '🚗 Showrooms Auto' },
    ]
  },
  {
    title: 'Fonctionnalités',
    items: [
      { href: '/docs/chatbot', label: '🤖 Chatbot IA WhatsApp' },
      { href: '/docs/billing', label: '💳 Abonnements & Paiements' },
    ]
  },
  {
    title: 'Légal',
    items: [
      { href: '/privacy', label: '🔒 Politique de Confidentialité' },
    ]
  }
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 bg-slate-50/60 sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="p-5 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">Snipe<span className="text-blue-600">.dz</span></span>
          </Link>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1.5 ml-10">Documentation</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* WhatsApp Help */}
        <div className="p-4 border-t border-slate-200">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-green-50 border border-green-200 hover:bg-green-100 rounded-2xl px-4 py-3 transition-colors"
          >
            <svg className="h-5 w-5 fill-green-600 shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-green-800">Besoin d'aide ?</p>
              <p className="text-[10px] text-green-700 font-medium">Contactez-nous</p>
            </div>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
