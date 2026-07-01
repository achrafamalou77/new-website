import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Centre d\'aide — Snipe.dz',
  description: 'Documentation complète pour utiliser la plateforme Snipe.dz — agences de voyage et showrooms automobiles.',
}

const cards = [
  {
    emoji: '🚀',
    title: 'Démarrage Rapide',
    description: 'Configurez votre compte en 5 étapes. De la création à la publication en moins de 30 minutes.',
    href: '/docs/getting-started',
    color: 'from-blue-500 to-blue-600',
  },
  {
    emoji: '✈️',
    title: 'Guide Agences de Voyage',
    description: 'Comment utiliser chaque page du tableau de bord : voyages, réservations, visas, factures.',
    href: '/docs/travel',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    emoji: '🚗',
    title: 'Guide Showrooms Auto',
    description: 'Gestion des véhicules, importation conteneur, location, finances et dédouanement.',
    href: '/docs/showroom',
    color: 'from-red-500 to-red-600',
  },
  {
    emoji: '🤖',
    title: 'Chatbot IA WhatsApp',
    description: 'Comment connecter WhatsApp Business, configurer l\'IA Darja, et gérer les crédits.',
    href: '/docs/chatbot',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    emoji: '🌐',
    title: 'Constructeur de Site Web',
    description: 'Guide du constructeur de site : templates, couleurs, sections, et publication.',
    href: '#',
    disabled: true,
    color: 'from-slate-400 to-slate-500',
  },
  {
    emoji: '💳',
    title: 'Abonnements & Facturation',
    description: 'Comprendre les plans, payer avec CIB/Edahabia via Chargily, et gérer votre abonnement.',
    href: '/docs/billing',
    color: 'from-amber-500 to-amber-600',
  },
]

export default function DocsIndexPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
          <span>Documentation</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
          Centre d'aide Snipe.dz
        </h1>
        <p className="text-slate-500 text-lg font-medium leading-relaxed">
          Tout ce dont vous avez besoin pour lancer et gérer votre activité sur la plateforme.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => {
          const inner = (
            <div className={`group rounded-2xl border p-6 transition-all duration-200 h-full flex flex-col ${
              card.disabled
                ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
            }`}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-5 shadow-sm`}>
                {card.emoji}
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {card.title}
                {card.disabled && <span className="ml-2 text-xs text-slate-400 font-semibold">(Bientôt)</span>}
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">{card.description}</p>
              {!card.disabled && (
                <div className="mt-4 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  Lire le guide →
                </div>
              )}
            </div>
          )

          return card.disabled ? (
            <div key={card.title}>{inner}</div>
          ) : (
            <Link key={card.title} href={card.href} className="block h-full">
              {inner}
            </Link>
          )
        })}
      </div>

      {/* Popular questions */}
      <div className="mt-16">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Questions fréquentes</h2>
        <div className="space-y-3">
          {[
            { q: 'Comment connecter mon numéro WhatsApp Business ?', href: '/docs/chatbot' },
            { q: 'Comment ajouter mes voyages au catalogue ?', href: '/docs/travel' },
            { q: 'Comment payer mon abonnement avec CIB ?', href: '/docs/billing' },
            { q: 'Comment inviter un employé ?', href: '/docs/travel' },
            { q: 'Comment créer mon premier dossier d\'importation ?', href: '/docs/showroom' },
          ].map((faq) => (
            <Link
              key={faq.q}
              href={faq.href}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{faq.q}</span>
              <span className="text-blue-500 text-sm font-bold">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
