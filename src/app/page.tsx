'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Globe, BarChart3, Shield, Zap, CheckCircle2,
  ChevronRight, Check, Star, ArrowRight, Phone, Mail, MapPin,
  TrendingUp, Bot, FileText, Car, Plane, Lock, HeartHandshake,
  ChevronDown, ShoppingBag, X, Menu
} from 'lucide-react'

// ─── WhatsApp CTA ───────────────────────────────────────────────────────────
const WA_NUMBER = '213555100200'
const WA_DEMO_MSG = encodeURIComponent('Bonjour ! Je souhaite une démo de la plateforme Snipe.dz pour mon activité.')
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${WA_DEMO_MSG}`

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─── Pricing data ───────────────────────────────────────────────────────────
const travelPlans = [
  { name: 'Starter', price: '0 DZD', period: 'à vie', desc: "Parfait pour commencer. Gestion d'équipe, facturation de base, et répertoire clients.", features: ['Tableau de bord', 'Répertoire clients', 'Factures DZD', '1 compte employé', 'Sous-domaine inclus'], cta: 'Démarrer Gratuitement', popular: false },
  { name: 'Plus', price: '7 000 DZD', period: 'mois', desc: 'Tout Starter + suivi de visas, constructeur de site web premium et plus de comptes.', features: ['Tout Starter inclus', 'Suivi des visas', 'Constructeur de site web', '5 comptes employés', 'Sous-domaine personnalisé'], cta: 'Passer à Plus', popular: false },
  { name: 'Pro', price: '20 000 DZD', period: 'mois', desc: 'Tout Plus + chatbot IA WhatsApp comprenant le Darja et 7 000 crédits IA par mois.', features: ['Tout Plus inclus', 'Chatbot IA WhatsApp', '7 000 crédits IA / mois', 'Compréhension Darja & Arabe', 'Support prioritaire'], cta: 'Activer Pro', popular: true },
  { name: 'Max', price: '32 000 DZD', period: 'mois', desc: 'Tout Pro + CRM analytique avancé, tableau de leads, et 15 000 crédits IA par mois.', features: ['Tout Pro inclus', 'CRM & Analytique avancée', '15 000 crédits IA / mois', 'Analyse du tableau de leads', 'Compte manager dédié'], cta: 'Débloquer Max', popular: false },
]

const ecommercePlans = [
  { name: 'Launch', price: '0 DZD', period: '14 jours', desc: 'Lancez votre boutique avec catalogue produits, commandes test et page vitrine moderne.', features: ['Catalogue produits', 'Commandes & clients', 'Gestion stock simple', 'Sous-domaine boutique', 'Landing page inclus'], cta: 'Lancer ma Boutique', popular: false },
  { name: 'Growth', price: '9 500 DZD', period: 'mois', desc: 'Pour boutiques actives : variantes, promos, livraison nationale et relance WhatsApp.', features: ['Tout Launch inclus', 'Variantes taille/couleur', 'Codes promo & bundles', 'Livraison 58 wilayas', 'Relance panier WhatsApp'], cta: 'Activer Growth', popular: false },
  { name: 'Pro Store', price: '24 000 DZD', period: 'mois', desc: 'Automatisez les ventes avec IA, COD confirmation, tracking colis et analytics.', features: ['Tout Growth inclus', 'Chatbot IA boutique', '3 000 crédits IA / mois', 'Confirmation COD', 'Analytics produits avancés'], cta: 'Passer Pro Store', popular: true },
  { name: 'Scale', price: '38 000 DZD', period: 'mois', desc: 'Pour marques multi-catégories : équipe, marketplace, prédiction stock et priorité support.', features: ['Tout Pro inclus', 'Multi-catégories avancé', 'Prévision rupture stock', 'Exports marketplace', 'Account Manager dédié'], cta: 'Scaler ma Marque', popular: false },
]

const carPlans = [
  { name: 'Essai Gratuit', price: '0 DZD', period: '7 jours', desc: "Testez toutes les fonctionnalités de base : finance, inventaire, importation et location.", features: ['Finance & comptabilité', "Répertoire d'équipe", 'Inventaire véhicules', 'Suivi conteneur import', 'Module location'], cta: "Commencer l'Essai", popular: false },
  { name: 'Plus', price: '10 000 DZD', period: 'mois', desc: 'Tout Essai + constructeur de site web premium et véhicules illimités en catalogue.', features: ['Tout Essai inclus', 'Constructeur de site web', 'Sous-domaine personnalisé', 'Véhicules illimités', 'Contrôle opérationnel complet'], cta: 'Passer à Plus', popular: false },
  { name: 'Pro', price: '23 000 DZD', period: 'mois', desc: 'Tout Plus + chatbot IA WhatsApp comprenant le Darja et 2 000 crédits IA par mois.', features: ['Tout Plus inclus', 'Chatbot IA WhatsApp', '2 000 crédits IA / mois', 'Support Darja & Dialecte', 'Assistance configuration prioritaire'], cta: 'Activer Pro', popular: true },
  { name: 'Max', price: '35 000 DZD', period: 'mois', desc: 'Tout Pro + analytique tendances leads, outils de consignation et 10 000 crédits IA.', features: ['Tout Pro inclus', 'Analytique Leads avancée', '10 000 crédits IA / mois', 'Outils contrat de consignation', 'Account Manager dédié'], cta: 'Débloquer Max', popular: false },
]

const faqs = [
  { q: 'Est-ce que le chatbot comprend vraiment le Darja algérien ?', a: "Oui. Notre IA est entraînée spécifiquement sur le Darja algérien, le Français et l'Arabe classique. Elle comprend les abréviations courantes, les mélanges de langues (code-switching), et répond naturellement comme un agent humain algérien." },
  { q: 'Comment fonctionne la facturation ? Dois-je payer en USD ou en EUR ?', a: 'Non. Toute la facturation se fait en Dinars Algériens (DZD) via Chargily Pay. Vous pouvez payer avec votre carte CIB ou Edahabia directement. Aucun virement international requis.' },
  { q: 'Mes données clients sont-elles sécurisées ?', a: "Vos données sont hébergées sur Supabase (infrastructure PostgreSQL chiffrée). Chaque agence a ses propres données isolées par Row Level Security (RLS). Personne d'autre ne peut accéder à vos données client." },
  { q: 'Puis-je utiliser mon propre numéro WhatsApp Business existant ?', a: "Oui. Vous pouvez connecter votre numéro WhatsApp Business API existant via les paramètres du chatbot. Si vous n'en avez pas encore, notre équipe vous guide dans la procédure Meta Business." },
  { q: "Y a-t-il un contrat d'engagement ?", a: "Non. Tous nos abonnements sont mensuels, sans engagement. Vous pouvez annuler à tout moment avant le renouvellement. La suppression de compte efface définitivement toutes vos données." },
  { q: 'Comment fonctionne le constructeur de site web ?', a: "Le constructeur de site est un éditeur visuel sans code. Vous personnalisez les couleurs, le logo, les textes et les sections. Votre site est hébergé automatiquement sur votre-agence.snipe.dz ou votre propre domaine." },
  { q: 'Quel support est disponible en cas de problème ?', a: "Support disponible sur WhatsApp 7j/7 de 8h à 22h pour tous les abonnés. Les clients Pro et Max bénéficient d'une réponse prioritaire sous 2h. Un centre d'aide complet est disponible sur snipe.dz/docs." },
]

const features = [
  { icon: MessageSquare, color: '#2563eb', bg: '#eff6ff', title: 'Chatbot IA WhatsApp', description: "Notre IA comprend le Darja, le Français et l'Arabe. Elle répond aux questions, capture les leads et prend des réservations — 24h/24, 7j/7 sur WhatsApp." },
  { icon: Globe, color: '#8b5cf6', bg: '#f5f3ff', title: 'Constructeur de Site Web', description: "Obtenez un site web professionnel et mobile en quelques minutes. Aucun code requis. Vos voyages, véhicules ou produits s'affichent automatiquement." },
  { icon: BarChart3, color: '#0891b2', bg: '#ecfeff', title: 'Tableau de Bord Unifié', description: 'Gérez toutes vos conversations, réservations, employés et finances en un seul endroit. Analytique pour suivre votre croissance.' },
  { icon: FileText, color: '#059669', bg: '#ecfdf5', title: 'Factures & Finance DZD', description: 'Générez des factures PDF en DZD. Journal de trésorerie, générateur de bordereau CCP officiel, et prévisions de revenus.' },
  { icon: HeartHandshake, color: '#d97706', bg: '#fffbeb', title: 'CRM & Leads Board', description: 'Chaque lead entrant WhatsApp est scoré automatiquement. Tableau kanban pour suivre du contact à la conversion.' },
  { icon: Shield, color: '#64748b', bg: '#f8fafc', title: 'Sécurité & Isolation Données', description: "Vos données sont isolées par Row Level Security (RLS). Personne d'autre ne peut y accéder. Conformité avec la Loi 18-07 algérienne." },
]

const stats = [
  { icon: '🇩🇿', stat: '100%', label: 'Algérien de A à Z' },
  { icon: '🤖', stat: 'Darja IA', label: 'Comprend votre dialecte' },
  { icon: '💳', stat: 'DZD', label: 'Facturation en dinars' },
  { icon: '🔒', stat: 'RLS', label: 'Données isolées & sécurisées' },
]

export default function LandingPage() {
  const [selectedVertical, setSelectedVertical] = useState<'travel' | 'car' | 'ecommerce'>('travel')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const plans = selectedVertical === 'travel' ? travelPlans : selectedVertical === 'car' ? carPlans : ecommercePlans

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* ─── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100/80 bg-white/96 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-[11px] flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">
              Snipe<span className="text-blue-600">.dz</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-[13.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-[13.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">Tarifs</a>
            <a href="#testimonials" className="text-[13.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">Avis Clients</a>
            <a href="#faq" className="text-[13.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            <Link href="/docs" className="text-[13.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">Documentation</Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden sm:block text-[13.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              Connexion
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 h-9 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-600 hover:border-green-400 hover:text-green-700 transition-all">
                <WhatsAppIcon className="h-3.5 w-3.5 text-green-500" />
                Demo
              </button>
            </a>
            <Link href="/onboarding">
              <button className="flex items-center gap-1.5 bg-blue-600 rounded-xl h-9 px-4 text-[13px] font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all">
                Commencer
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Menu ──────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white/98 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-[11px] flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900">
                Snipe<span className="text-blue-600">.dz</span>
              </span>
            </div>
            <button
              className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {[
              { href: '#features', label: 'Fonctionnalités' },
              { href: '#pricing', label: 'Tarifs' },
              { href: '#testimonials', label: 'Avis Clients' },
              { href: '#faq', label: 'FAQ' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3.5 text-[15px] font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3.5 text-[15px] font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              Documentation
            </Link>
          </nav>
          <div className="mt-8 space-y-3">
            <Link href="/onboarding" className="block">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 rounded-xl h-12 px-4 text-[14px] font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all">
                Créer mon compte gratuit
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="block">
              <button className="w-full flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-700 hover:border-green-400 hover:text-green-700 transition-all">
                <WhatsAppIcon className="h-4 w-4 text-green-500" />
                Demander une démo
              </button>
            </a>
            <Link href="/login" className="block">
              <button className="w-full flex items-center justify-center h-12 px-4 rounded-xl text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Connexion
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 pointer-events-none" />
        {/* Dramatic blur blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-indigo-400/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-blue-400/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-7 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Plateforme SaaS 100% Algérienne — Darja IA Inclus
          </div>

          <h1 className="text-[52px] md:text-[68px] font-black tracking-[-0.03em] text-gray-900 mb-5 max-w-4xl mx-auto leading-[1.05]">
            Automatisez votre agence.{' '}
            <span className="text-blue-600">
              Développez votre activité.
            </span>
          </h1>

          <p className="text-lg text-gray-500 mb-9 max-w-2xl mx-auto leading-relaxed font-medium">
            La plateforme tout-en-un pour les <strong className="text-gray-700">agences de voyage</strong>, <strong className="text-gray-700">showrooms auto</strong> et <strong className="text-gray-700">boutiques en ligne</strong> algériens. Chatbot IA WhatsApp, site web professionnel, et tableau de bord complet — en DZD.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/onboarding">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-8 text-[14px] font-bold text-white transition-all shadow-lg shadow-blue-600/25 group">
                Créer mon compte gratuit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 rounded-xl h-12 px-8 bg-white text-[14px] font-semibold text-gray-700 transition-all">
                <WhatsAppIcon className="h-4 w-4 text-green-500" />
                Demander une démo
              </button>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Démarrage gratuit</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Aucune carte requise</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Facturation en DZD</span>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ───────────────────────────────────────────────────────── */}
      <section className="py-12 bg-[#f8f9fb] border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Pourquoi les professionnels algériens nous font confiance</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-[28px] mb-2">{item.icon}</div>
                <div className="text-[22px] font-black text-gray-900 mb-1">{item.stat}</div>
                <div className="text-xs text-gray-500 font-semibold">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ───────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-3xl md:text-[44px] font-black mt-3 mb-4 tracking-tight text-gray-900 leading-tight">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base font-medium">Arrêtez les cahiers et les Excel. Passez à un workflow 100% digital conçu pour l'Algérie.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-[20px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group">
                <div
                  className="w-11 h-11 rounded-[13px] flex items-center justify-center mb-5"
                  style={{ backgroundColor: f.bg }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm font-medium">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Vertical Specifics */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <Plane className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Pour Agences de Voyage</h3>
              </div>
              <ul className="space-y-2.5">
                {['Catalogue de voyages (Omra, international, domestique)', 'Suivi des demandes de visa par ambassade', 'Gestion des réservations avec acomptes & soldes', 'Importateur de données clients & voyages en masse'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-gray-700">
                    <Check className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <Car className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-bold text-white">Pour Showrooms Automobiles</h3>
              </div>
              <ul className="space-y-2.5">
                {["Inventaire véhicules avec photos & statuts", "Suivi d'importation conteneur 30/30/40", 'Calculateur droits douaniers Algérie', 'Module location & flotte de véhicules'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-gray-300">
                    <Check className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <ShoppingBag className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Pour Boutiques en Ligne</h3>
              </div>
              <ul className="space-y-2.5">
                {['Catalogue multi-catégories : vêtements, beauté, électronique, maison', 'Commandes COD, paniers abandonnés et relances WhatsApp', 'Gestion stock, variantes taille/couleur et alertes rupture', 'Livraison 58 wilayas, codes promo et pages collection'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-gray-700">
                    <Check className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Avis Clients</span>
            <h2 className="text-3xl md:text-[44px] font-black mt-3 mb-3 tracking-tight text-gray-900 leading-tight">Ce qu'ils en disent</h2>
            <p className="text-gray-500 max-w-md mx-auto font-medium">Des professionnels algériens qui ont transformé leur activité avec Snipe.dz</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Rachid Benali', role: 'Directeur — Agence Horizons, Alger', avatar: 'RB', avatarBg: '#eff6ff', avatarColor: '#2563eb', stars: 5, quote: "Le chatbot comprend vraiment le Darja. Mes clients écrivent en arabe dialectal et il répond parfaitement. J'ai économisé 3h de réponses WhatsApp par jour." },
              { name: 'Imane Kerboua', role: 'Gérante — ShowRoom AutoLux, Oran', avatar: 'IK', avatarBg: '#fef2f2', avatarColor: '#ef4444', stars: 5, quote: "Le module d'importation est exactement ce dont on avait besoin. Le suivi 30/30/40, le calcul des droits douaniers — tout est là. Plus d'Excel compliqués." },
              { name: 'Lina Haddad', role: 'Fondatrice — ModeDZ Online, Alger', avatar: 'LH', avatarBg: '#f5f3ff', avatarColor: '#8b5cf6', stars: 5, quote: "Les commandes COD, le stock par taille et les relances WhatsApp ont changé notre façon de vendre. On lance une collection en une matinée." },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed font-medium mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: t.avatarBg, color: t.avatarColor }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white select-none">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Tarifs</span>
            <h2 className="text-3xl md:text-[44px] font-black mt-3 mb-3 tracking-tight text-gray-900 leading-tight">
              Tarifs transparents en DZD
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto font-medium">
              Choisissez le forfait adapté à votre activité. Évoluez à tout moment sans engagement.
            </p>

            {/* Vertical Toggle */}
            <div className="mt-7 inline-flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200/60">
              {[
                { key: 'travel', label: '✈️ Agences de Voyage' },
                { key: 'car', label: '🚗 Showrooms Auto' },
                { key: 'ecommerce', label: '🛍️ Boutiques en Ligne' },
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setSelectedVertical(v.key as 'travel' | 'car' | 'ecommerce')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    selectedVertical === v.key
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col p-6 transition-all duration-200 ${
                  plan.popular
                    ? 'bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/25'
                    : 'bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-4 right-4 bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Populaire
                  </span>
                )}
                <h3 className={`text-[10px] font-black tracking-[0.1em] uppercase ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-[22px] font-black tracking-tight">{plan.price}</span>
                  <span className={`text-[10px] font-semibold ${plan.popular ? 'text-blue-200' : 'text-gray-400'}`}>/ {plan.period}</span>
                </div>
                <p className={`mt-2.5 text-xs leading-relaxed font-medium ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>
                  {plan.desc}
                </p>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start gap-2 text-xs font-medium">
                      <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${plan.popular ? 'text-blue-200' : 'text-emerald-500'}`} />
                      <span className={plan.popular ? 'text-blue-50' : 'text-gray-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/onboarding" className="mt-6 block">
                  <button
                    className={`w-full rounded-xl h-10 text-[12.5px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      plan.popular
                        ? 'bg-white hover:bg-blue-50 text-blue-600 shadow-sm'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 font-medium mt-7">
            Tous les prix incluent la TVA. Facturation mensuelle, résiliation sans pénalité.{' '}
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Questions sur les tarifs ? WhatsApp →
            </a>
          </p>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl md:text-[40px] font-black mt-3 mb-3 tracking-tight text-gray-900 leading-tight">Questions fréquentes</h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:border-gray-300 transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <span className="text-[14px] font-semibold text-gray-800">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed font-medium border-t border-gray-100 pt-3.5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

            <h2 className="text-3xl md:text-[44px] font-black text-white mb-4 relative z-10 leading-tight">
              Prêt à automatiser votre activité ?
            </h2>
            <p className="text-blue-100 text-base mb-9 max-w-xl mx-auto relative z-10 font-medium">
              Rejoignez les professionnels algériens qui utilisent déjà Snipe.dz. La configuration prend moins de 5 minutes.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/onboarding">
                <button className="flex items-center gap-2 h-12 px-7 rounded-full bg-white hover:bg-blue-50 text-blue-600 text-sm font-bold transition-all shadow-lg">
                  Créer mon compte gratuit
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-2 h-12 px-7 rounded-full border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-all">
                  <WhatsAppIcon className="h-4 w-4 text-white" />
                  Discuter sur WhatsApp
                </button>
              </a>
            </div>

            <p className="relative z-10 mt-5 text-xs text-blue-200 font-medium">
              <CheckCircle2 className="inline h-3.5 w-3.5 text-blue-300 mr-1" />
              Démarrage gratuit · Sans carte bancaire · Facturation en DZD
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                </div>
                <span className="text-base font-black tracking-tight text-gray-900">Snipe<span className="text-blue-600">.dz</span></span>
              </div>
              <p className="text-[12.5px] text-gray-500 leading-relaxed font-medium mb-4">
                Plateforme SaaS multi-verticale pour les professionnels algériens. Chatbot IA Darja, site web, CRM & finance — tout en DZD.
              </p>
              <div className="space-y-1.5 text-[12.5px] text-gray-500 font-medium">
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3 shrink-0" /> ADDL CNEP 2000 REGHAIA, ALGER</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0" /> +213 555 100 200</div>
                <div className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0" /> contact@snipe.dz</div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Produit</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Tarifs</a></li>
                <li><Link href="/docs" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Documentation</Link></li>
                <li><Link href="/docs/getting-started" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Démarrage rapide</Link></li>
                <li><Link href="/onboarding" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Créer un compte</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Solutions</h4>
              <ul className="space-y-2">
                <li><Link href="/docs/travel" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Agences de Voyage</Link></li>
                <li><Link href="/docs/showroom" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Showrooms Automobiles</Link></li>
                <li><Link href="/docs/chatbot" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Chatbot IA WhatsApp</Link></li>
                <li><Link href="/docs/billing" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Abonnements</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Légal & Support</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">Politique de Confidentialité</Link></li>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-medium text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1.5">
                    <WhatsAppIcon className="h-3 w-3 text-green-500" />
                    Support WhatsApp
                  </a>
                </li>
                <li><a href="mailto:contact@snipe.dz" className="text-[12.5px] font-medium text-gray-500 hover:text-blue-600 transition-colors">contact@snipe.dz</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-7 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-[12.5px] text-gray-500 font-semibold">
            <span>© 2026 SARL SNIPE SAAS — Tous droits réservés.</span>
            <span className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Confidentialité</Link>
              <span>·</span>
              <span>RC: En cours d'immatriculation</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
