// src/lib/car-showroom-builder-template.ts
// The ONE perfect car showroom template with complete features

export interface ShowroomSection {
  id: string
  type: ShowroomSectionType
  content: Record<string, any>
  styles: {
    bgColor: string
    textColor: string
    paddingTop: number
    paddingBottom: number
    backgroundImage?: string
    backgroundOverlay?: number
  }
  visible: boolean
}

export type ShowroomSectionType =
  | 'Navbar'
  | 'Hero'
  | 'Stats'
  | 'SalesInventory'
  | 'RentalFleet'
  | 'ImportCalculator'
  | 'Timeline'
  | 'Services'
  | 'Testimonials'
  | 'BrandGrid'
  | 'Contact'
  | 'Footer'

export interface ShowroomGlobalConfig {
  primaryColor: string        // Main accent color (e.g. #e11d48 red)
  secondaryColor: string      // Secondary accent (e.g. #f59e0b gold)
  bgColor: string             // Page background
  cardBgColor: string         // Card backgrounds
  textColor: string           // Body text
  headingColor: string        // Heading text
  fontFamily: 'Inter' | 'Outfit' | 'Poppins' | 'Cairo' | 'Raleway'
  logoUrl: string
  companyName: string
  phone: string
  whatsapp: string
  address: string
  email: string
  socialFacebook: string
  socialInstagram: string
  socialWhatsapp: string
  seoTitle: string
  seoDescription: string
  faviconUrl: string
  buttonStyle: 'filled' | 'outline' | 'pill'
}

export interface ShowroomBuilderConfig {
  global: ShowroomGlobalConfig
  sections: ShowroomSection[]
}

// ─── PERFECT DEFAULT TEMPLATE ────────────────────────────────────────────────

export const PERFECT_SHOWROOM_TEMPLATE: ShowroomBuilderConfig = {
  global: {
    primaryColor: '#e11d48',
    secondaryColor: '#f59e0b',
    bgColor: '#0a0a0a',
    cardBgColor: '#141414',
    textColor: '#cbd5e1',
    headingColor: '#f1f5f9',
    fontFamily: 'Outfit',
    logoUrl: '',
    companyName: 'Auto Premium',
    phone: '+213 560 00 31 06',
    whatsapp: '+213560003106',
    address: 'Chéraga, Alger, Algérie',
    email: 'contact@autopremium.dz',
    socialFacebook: 'https://facebook.com',
    socialInstagram: 'https://instagram.com',
    socialWhatsapp: 'https://wa.me/213560003106',
    seoTitle: 'Auto Premium | Importation & Showroom Premium en Algérie',
    seoDescription: 'Spécialiste de l\'importation et vente de véhicules neufs, occasions, et location de voitures premium en Algérie.',
    faviconUrl: '/favicon.ico',
    buttonStyle: 'filled'
  },
  sections: [
    // ── 1. NAVBAR ──────────────────────────────────────────────────
    {
      id: 'navbar',
      type: 'Navbar',
      content: {
        links: [
          { label: 'Accueil', href: '#hero' },
          { label: 'En Vente', href: '#sales' },
          { label: 'Location', href: '#rental' },
          { label: 'Importation', href: '#import' },
          { label: 'Contact', href: '#contact' }
        ],
        sticky: true,
        showPhoneButton: true,
        showWhatsappButton: true
      },
      styles: { bgColor: '#080808', textColor: '#ffffff', paddingTop: 0, paddingBottom: 0 },
      visible: true
    },

    // ── 2. HERO ────────────────────────────────────────────────────
    {
      id: 'hero',
      type: 'Hero',
      content: {
        badge: '⚡ IMPORTATION · VENTE · LOCATION',
        headline: 'Trouvez Votre Voiture de Rêve',
        subheadline: 'Spécialiste de l\'importation de véhicules neufs depuis l\'Europe et le Golfe. Dédouanement clé en main. Livraison sur toute l\'Algérie.',
        primaryCTA: 'Voir le Stock',
        primaryCTAHref: '#sales',
        secondaryCTA: 'Importer un Véhicule',
        secondaryCTAHref: '#import',
        backgroundImage: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1920&q=85',
        overlayOpacity: 0.65,
        showTrustBadges: true,
        trustBadges: ['✅ Garantie 12 mois', '🚚 Livraison Algérie', '📋 Dédouanement Inclus']
      },
      styles: {
        bgColor: '#0a0a0a',
        textColor: '#ffffff',
        paddingTop: 0,
        paddingBottom: 0,
        backgroundImage: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1920&q=85',
        backgroundOverlay: 0.65
      },
      visible: true
    },

    // ── 3. STATS ───────────────────────────────────────────────────
    {
      id: 'stats',
      type: 'Stats',
      content: {
        items: [
          { number: '500+', label: 'Véhicules Livrés', icon: 'Car' },
          { number: '8 ans', label: 'D\'Expérience', icon: 'Award' },
          { number: '99%', label: 'Clients Satisfaits', icon: 'Star' },
          { number: '24h', label: 'Support Client', icon: 'Clock' }
        ]
      },
      styles: { bgColor: '#e11d48', textColor: '#ffffff', paddingTop: 12, paddingBottom: 12 },
      visible: true
    },

    // ── 4. SALES INVENTORY ─────────────────────────────────────────
    {
      id: 'sales',
      type: 'SalesInventory',
      content: {
        title: 'Véhicules en Vente',
        subtitle: 'Notre sélection de véhicules disponibles immédiatement. Neufs, occasions garanties et sur commande.',
        showFilters: true,
        showPrice: true,
        showWhatsapp: true,
        cardsPerRow: 3,
        limit: 9,
        filterTypes: ['all', 'sell', 'sur_command'],
        filterLabels: {
          all: 'Tous',
          sell: 'En Stock',
          sur_command: 'Sur Commande'
        }
      },
      styles: { bgColor: '#0a0a0a', textColor: '#ffffff', paddingTop: 20, paddingBottom: 20 },
      visible: true
    },

    // ── 5. RENTAL FLEET ────────────────────────────────────────────
    {
      id: 'rental',
      type: 'RentalFleet',
      content: {
        title: 'Location de Véhicules',
        subtitle: 'Des voitures récentes, climatisées et parfaitement entretenues. Kilométrage illimité, assurance incluse.',
        showDailyRate: true,
        showWhatsapp: true,
        cardsPerRow: 3,
        limit: 6,
        features: ['🔑 Kilométrage illimité', '🛡️ Assurance incluse', '⛽ Carburant non inclus', '📍 Livraison Alger & aéroports']
      },
      styles: { bgColor: '#111111', textColor: '#ffffff', paddingTop: 20, paddingBottom: 20 },
      visible: true
    },

    // ── 6. IMPORT CALCULATOR ───────────────────────────────────────
    {
      id: 'import',
      type: 'ImportCalculator',
      content: {
        title: 'Simulateur d\'Importation',
        subtitle: 'Calculez le coût total de dédouanement de votre véhicule importé d\'Europe ou des Émirats en quelques secondes.',
        showTimeline: true,
        timelineSteps: [
          { step: '01', title: 'Choix du Véhicule', desc: 'Sélectionnez le modèle de vos rêves depuis l\'Europe ou le Golfe.' },
          { step: '02', title: 'Devis & Contrat', desc: 'Obtenez un devis détaillé avec tous les frais inclus. Signature du contrat.' },
          { step: '03', title: 'Achat & Transit', desc: 'Nous achetons le véhicule en HT. Transport sécurisé par navire vers Alger.' },
          { step: '04', title: 'Dédouanement', desc: 'Notre transitaire agrée gère toutes les formalités douanières au port.' },
          { step: '05', title: 'Livraison Clé en Main', desc: 'Contrôle final, nettoyage, et remise des clés où vous voulez en Algérie.' }
        ]
      },
      styles: { bgColor: '#0f0f0f', textColor: '#ffffff', paddingTop: 20, paddingBottom: 20 },
      visible: true
    },

    // ── 7. SERVICES ────────────────────────────────────────────────
    {
      id: 'services',
      type: 'Services',
      content: {
        title: 'Nos Services',
        subtitle: 'Un accompagnement complet pour tous vos projets automobile.',
        items: [
          { icon: 'ShoppingCart', title: 'Achat & Vente', desc: 'Vehicules neufs, occasions garanties disponibles immédiatement dans notre showroom à Alger.' },
          { icon: 'Ship', title: 'Importation Clé en Main', desc: 'Service complet d\'importation depuis l\'Europe, Dubaï ou la Chine avec dédouanement inclus.' },
          { icon: 'Car', title: 'Location Premium', desc: 'Flotte de véhicules récents disponibles à la location à la journée ou à la semaine.' },
          { icon: 'FileText', title: 'Conseils & Expertise', desc: 'Nos experts vous guident pour choisir le meilleur véhicule selon votre budget et vos besoins.' }
        ]
      },
      styles: { bgColor: '#141414', textColor: '#ffffff', paddingTop: 20, paddingBottom: 20 },
      visible: true
    },

    // ── 8. TESTIMONIALS ────────────────────────────────────────────
    {
      id: 'testimonials',
      type: 'Testimonials',
      content: {
        title: 'Ce que disent nos clients',
        subtitle: 'Plus de 500 clients nous font confiance chaque année.',
        items: [
          { name: 'Kamel Redouane', city: 'Alger', rating: 5, text: 'Service impeccable. Ma Toyota RAV4 est arrivée parfaite en 6 semaines. Le dédouanement a été géré sans aucun stress. Je recommande vivement !', avatar: 'KR' },
          { name: 'Amel Bensalem', city: 'Oran', rating: 5, text: 'J\'ai loué une berline pour un mariage. Véhicule impeccable, livré à l\'heure. Prix très correct. Merci Auto Premium !', avatar: 'AB' },
          { name: 'Sofiane Gharbi', city: 'Constantine', rating: 5, text: 'Le simulateur de dédouanement est très précis. Le prix annoncé correspondait exactement au montant final payé à la douane. Super transparent.', avatar: 'SG' }
        ]
      },
      styles: { bgColor: '#0a0a0a', textColor: '#ffffff', paddingTop: 20, paddingBottom: 20 },
      visible: true
    },

    // ── 9. BRAND GRID ──────────────────────────────────────────────
    {
      id: 'brands',
      type: 'BrandGrid',
      content: {
        title: 'Marques Disponibles',
        subtitle: 'Nous importons et vendons toutes les grandes marques mondiales.',
        brands: ['Toyota', 'Hyundai', 'Kia', 'Volkswagen', 'Renault', 'Dacia', 'BMW', 'Mercedes', 'Seat', 'Skoda']
      },
      styles: { bgColor: '#111111', textColor: '#ffffff', paddingTop: 16, paddingBottom: 16 },
      visible: true
    },

    // ── 10. CONTACT ────────────────────────────────────────────────
    {
      id: 'contact',
      type: 'Contact',
      content: {
        title: 'Contactez-Nous',
        subtitle: 'Notre équipe est disponible 6j/7 pour répondre à toutes vos questions.',
        showForm: true,
        showMap: true,
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3197!2d3.05!3d36.77!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDQ2JzEyLjAiTiAzwrAwMycwMC4wIkU!5e0!3m2!1sfr!2sdz!4v1234567890',
        formFields: ['name', 'phone', 'email', 'message'],
        cta: 'Envoyer le Message'
      },
      styles: { bgColor: '#0f0f0f', textColor: '#ffffff', paddingTop: 20, paddingBottom: 20 },
      visible: true
    },

    // ── 11. FOOTER ─────────────────────────────────────────────────
    {
      id: 'footer',
      type: 'Footer',
      content: {
        columns: [
          {
            title: 'Auto Premium',
            items: [
              { label: 'À Propos', href: '#' },
              { label: 'Nos Services', href: '#services' },
              { label: 'Témoignages', href: '#testimonials' }
            ]
          },
          {
            title: 'Véhicules',
            items: [
              { label: 'En Vente', href: '#sales' },
              { label: 'Location', href: '#rental' },
              { label: 'Sur Commande', href: '#import' }
            ]
          },
          {
            title: 'Importation',
            items: [
              { label: 'Simulateur Taxes', href: '#import' },
              { label: 'Comment ça marche', href: '#import' },
              { label: 'FAQ', href: '#' }
            ]
          }
        ],
        copyrightText: `© ${new Date().getFullYear()} Auto Premium. Tous droits réservés.`,
        showSocials: true,
        showWhatsappFloat: true
      },
      styles: { bgColor: '#080808', textColor: '#94a3b8', paddingTop: 16, paddingBottom: 8 },
      visible: true
    }
  ]
}

// ─── SECTION LIBRARY ─────────────────────────────────────────────────────────
// All available section types for the car showroom builder

export const SHOWROOM_SECTION_LIBRARY = [
  {
    type: 'Navbar' as ShowroomSectionType,
    label: 'Barre de Navigation',
    description: 'Menu sticky avec liens, logo et bouton téléphone',
    icon: 'Navigation',
    category: 'layout'
  },
  {
    type: 'Hero' as ShowroomSectionType,
    label: 'Bannière Héro',
    description: 'Grande bannière avec image de fond, titre et boutons CTA',
    icon: 'Layout',
    category: 'content'
  },
  {
    type: 'Stats' as ShowroomSectionType,
    label: 'Compteurs / Stats',
    description: 'Bande de statistiques animées (véhicules livrés, années d\'expérience...)',
    icon: 'BarChart',
    category: 'content'
  },
  {
    type: 'SalesInventory' as ShowroomSectionType,
    label: 'Catalogue Vente',
    description: 'Grille de voitures disponibles à la vente depuis votre inventaire',
    icon: 'Car',
    category: 'dynamic'
  },
  {
    type: 'RentalFleet' as ShowroomSectionType,
    label: 'Flotte Location',
    description: 'Voitures de location avec tarifs journaliers depuis votre flotte',
    icon: 'Key',
    category: 'dynamic'
  },
  {
    type: 'ImportCalculator' as ShowroomSectionType,
    label: 'Simulateur Import',
    description: 'Calculateur interactif de dédouanement avec le processus d\'importation',
    icon: 'Calculator',
    category: 'interactive'
  },
  {
    type: 'Timeline' as ShowroomSectionType,
    label: 'Processus / Timeline',
    description: 'Étapes du processus d\'importation ou de commande',
    icon: 'GitBranch',
    category: 'content'
  },
  {
    type: 'Services' as ShowroomSectionType,
    label: 'Nos Services',
    description: 'Cartes de services (achat, import, location, conseil...)',
    icon: 'Briefcase',
    category: 'content'
  },
  {
    type: 'Testimonials' as ShowroomSectionType,
    label: 'Témoignages Clients',
    description: 'Avis et témoignages de clients satisfaits avec étoiles',
    icon: 'Star',
    category: 'content'
  },
  {
    type: 'BrandGrid' as ShowroomSectionType,
    label: 'Grille Marques',
    description: 'Logos des marques disponibles dans votre showroom',
    icon: 'Grid',
    category: 'content'
  },
  {
    type: 'Contact' as ShowroomSectionType,
    label: 'Section Contact',
    description: 'Formulaire de contact avec coordonnées et carte Google Maps',
    icon: 'Phone',
    category: 'interactive'
  },
  {
    type: 'Footer' as ShowroomSectionType,
    label: 'Pied de Page',
    description: 'Footer complet avec colonnes de liens, réseaux sociaux et copyright',
    icon: 'AlignJustify',
    category: 'layout'
  }
]

// Default content for each section type when adding new
export function getDefaultSectionContent(type: ShowroomSectionType, global: ShowroomGlobalConfig): ShowroomSection {
  const base = {
    id: `${type.toLowerCase()}-${Date.now()}`,
    type,
    visible: true,
    styles: {
      bgColor: global.bgColor,
      textColor: global.headingColor,
      paddingTop: 16,
      paddingBottom: 16
    }
  }

  switch (type) {
    case 'Navbar':
      return { ...base, content: {
        links: [
          { label: 'Accueil', href: '#hero' },
          { label: 'En Vente', href: '#sales' },
          { label: 'Location', href: '#rental' },
          { label: 'Contact', href: '#contact' }
        ],
        sticky: true, showPhoneButton: true, showWhatsappButton: true
      }, styles: { ...base.styles, bgColor: '#080808', textColor: '#ffffff', paddingTop: 0, paddingBottom: 0 } }

    case 'Hero':
      return { ...base, content: {
        badge: '⚡ VOTRE SHOWROOM PREMIUM',
        headline: 'Titre Principal',
        subheadline: 'Description de votre showroom et de vos services...',
        primaryCTA: 'Voir le Stock', primaryCTAHref: '#sales',
        secondaryCTA: 'Nous Contacter', secondaryCTAHref: '#contact',
        backgroundImage: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1920&q=85',
        overlayOpacity: 0.65,
        showTrustBadges: false, trustBadges: []
      }, styles: { bgColor: '#000000', textColor: '#ffffff', paddingTop: 0, paddingBottom: 0, backgroundImage: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1920&q=85', backgroundOverlay: 0.65 } }

    case 'Stats':
      return { ...base, content: {
        items: [
          { number: '100+', label: 'Véhicules Livrés', icon: 'Car' },
          { number: '5 ans', label: 'D\'Expérience', icon: 'Award' },
          { number: '99%', label: 'Satisfaction', icon: 'Star' }
        ]
      }, styles: { ...base.styles, bgColor: global.primaryColor, textColor: '#ffffff' } }

    case 'SalesInventory':
      return { ...base, content: {
        title: 'Véhicules en Vente',
        subtitle: 'Notre sélection disponible immédiatement.',
        showFilters: true, showPrice: true, showWhatsapp: true, cardsPerRow: 3, limit: 6
      } }

    case 'RentalFleet':
      return { ...base, content: {
        title: 'Location de Véhicules',
        subtitle: 'Des voitures récentes disponibles à la location.',
        showDailyRate: true, showWhatsapp: true, cardsPerRow: 3, limit: 6,
        features: ['🔑 Kilométrage illimité', '🛡️ Assurance incluse']
      }, styles: { ...base.styles, bgColor: '#111111' } }

    case 'ImportCalculator':
      return { ...base, content: {
        title: 'Simulateur d\'Importation',
        subtitle: 'Calculez votre budget d\'importation en quelques secondes.',
        showTimeline: true,
        timelineSteps: [
          { step: '01', title: 'Choix du Véhicule', desc: 'Sélectionnez le modèle.' },
          { step: '02', title: 'Devis', desc: 'Obtenez un devis détaillé.' },
          { step: '03', title: 'Achat & Transit', desc: 'Nous achetons et livrons.' },
          { step: '04', title: 'Livraison', desc: 'Remise des clés.' }
        ]
      }, styles: { ...base.styles, bgColor: '#0f0f0f' } }

    case 'Services':
      return { ...base, content: {
        title: 'Nos Services',
        subtitle: 'Un accompagnement complet pour tous vos projets.',
        items: [
          { icon: 'ShoppingCart', title: 'Achat & Vente', desc: 'Vehicules disponibles immédiatement.' },
          { icon: 'Ship', title: 'Importation', desc: 'Service clé en main depuis l\'Europe.' },
          { icon: 'Car', title: 'Location', desc: 'Flotte disponible à la journée.' }
        ]
      }, styles: { ...base.styles, bgColor: '#141414' } }

    case 'Testimonials':
      return { ...base, content: {
        title: 'Témoignages Clients',
        subtitle: 'Ils nous font confiance.',
        items: [
          { name: 'Client 1', city: 'Alger', rating: 5, text: 'Excellent service !', avatar: 'C1' },
          { name: 'Client 2', city: 'Oran', rating: 5, text: 'Je recommande vivement.', avatar: 'C2' }
        ]
      } }

    case 'BrandGrid':
      return { ...base, content: {
        title: 'Nos Marques',
        subtitle: 'Toutes les grandes marques disponibles.',
        brands: ['Toyota', 'Hyundai', 'Kia', 'Renault', 'Volkswagen', 'Dacia']
      }, styles: { ...base.styles, bgColor: '#111111' } }

    case 'Contact':
      return { ...base, content: {
        title: 'Contactez-Nous',
        subtitle: 'Notre équipe est disponible pour vous aider.',
        showForm: true, showMap: false,
        formFields: ['name', 'phone', 'email', 'message'],
        cta: 'Envoyer'
      }, styles: { ...base.styles, bgColor: '#0f0f0f' } }

    case 'Footer':
      return { ...base, content: {
        columns: [
          { title: 'Showroom', items: [{ label: 'En Vente', href: '#sales' }, { label: 'Location', href: '#rental' }] },
          { title: 'Importation', items: [{ label: 'Simulateur', href: '#import' }, { label: 'Contact', href: '#contact' }] }
        ],
        copyrightText: `© ${new Date().getFullYear()} ${global.companyName}. Tous droits réservés.`,
        showSocials: true,
        showWhatsappFloat: false
      }, styles: { ...base.styles, bgColor: '#080808', textColor: '#94a3b8', paddingBottom: 4 } }

    default:
      return { ...base, content: { title: 'Nouvelle Section' } }
  }
}
