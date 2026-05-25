// src/lib/templates-data.ts

import { WebsiteTemplate, Section, GlobalStyles } from '@/types/builder';

// Helper to generate default sections for builder
const generateDefaultSections = (theme: string): Section[] => [
  {
    id: 'hero-1',
    type: 'Hero',
    variant: 'full',
    content: {
      badge: '✨ VOYAGES UNIQUES',
      title: 'Explorez le Monde avec Style',
      subtitle: 'Circuits organisés premium avec guides locaux experts, vols inclus et hôtels 4★/5★.',
      primary_cta: 'Découvrir nos Voyages',
      secondary_cta: 'Nous Contacter',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600'
    },
    styles: {
      bg_type: 'image',
      bg_color: '#0f172a',
      text_color: '#ffffff',
      padding_top: 20,
      padding_bottom: 20,
      animation: 'fade'
    },
    visibility: { desktop: true, mobile: true }
  },
  {
    id: 'stats-1',
    type: 'Stats',
    variant: 'grid',
    content: {
      items: [
        { number: '15+', label: 'Ans d\'Expérience', icon: 'Clock' },
        { number: '12k+', label: 'Clients Satisfaits', icon: 'Users' },
        { number: '250+', label: 'Destinations', icon: 'Compass' },
        { number: '4.9/5', label: 'Note Globale', icon: 'Star' }
      ]
    },
    styles: {
      bg_type: 'solid',
      bg_color: '#ffffff',
      text_color: '#1e293b',
      padding_top: 8,
      padding_bottom: 8,
      animation: 'slide'
    },
    visibility: { desktop: true, mobile: true }
  },
  {
    id: 'why-1',
    type: 'WhyUs',
    variant: 'cards',
    content: {
      title: 'Pourquoi Choisir Notre Agence ?',
      subtitle: 'Le confort et la sérénité assurés pour toutes vos vacances.',
      items: [
        { title: 'Circuits Sur Mesure', description: 'Des itinéraires pensés par nos experts pour maximiser vos découvertes.', icon: 'Compass' },
        { title: 'Paiements Sécurisés', description: 'Payez votre acompte de 20% par CCP / BaridiMob en toute sécurité.', icon: 'Shield' },
        { title: 'Support 24h/7j', description: 'Assistance francophone permanente via WhatsApp tout au long de votre séjour.', icon: 'HeartHandshake' }
      ]
    },
    styles: {
      bg_type: 'solid',
      bg_color: '#f8fafc',
      text_color: '#1e293b',
      padding_top: 12,
      padding_bottom: 12,
      animation: 'zoom'
    },
    visibility: { desktop: true, mobile: true }
  },
  {
    id: 'trips-1',
    type: 'Trips',
    variant: 'grid-3',
    content: {
      title: 'Nos Prochains Départs',
      subtitle: 'Sélection de circuits disponibles à la réservation immédiate.'
    },
    styles: {
      bg_type: 'solid',
      bg_color: '#ffffff',
      text_color: '#1e293b',
      padding_top: 16,
      padding_bottom: 16,
      animation: 'fade'
    },
    visibility: { desktop: true, mobile: true }
  },
  {
    id: 'testimonials-1',
    type: 'Testimonials',
    variant: 'slider',
    content: {
      title: 'Ce Que Disent Nos Voyageurs',
      items: [
        { name: 'Kamel, Alger', rating: 5, quote: 'Organisation irréprochable. L\'hôtel 5★ à Istanbul était magnifique.', avatar: 'KA' },
        { name: 'Sarah, Oran', rating: 5, quote: 'Le paiement d\'acompte en ligne est ultra rapide. Zéro stress !', avatar: 'SA' }
      ]
    },
    styles: {
      bg_type: 'solid',
      bg_color: '#f8fafc',
      text_color: '#1e293b',
      padding_top: 12,
      padding_bottom: 12,
      animation: 'slide'
    },
    visibility: { desktop: true, mobile: true }
  },
  {
    id: 'contact-1',
    type: 'Contact',
    variant: 'simple',
    content: {
      title: 'Contactez-Nous',
      subtitle: 'Une question ? Notre équipe vous répond instantanément.',
      email: 'contact@agence.dz',
      phone: '+213 555 12 34 56',
      address: 'Didouche Mourad, Alger Centre'
    },
    styles: {
      bg_type: 'solid',
      bg_color: '#ffffff',
      text_color: '#1e293b',
      padding_top: 16,
      padding_bottom: 16,
      animation: 'fade'
    },
    visibility: { desktop: true, mobile: true }
  }
];



// Helper to generate showroom sections
const generateShowroomSections = (templateId: string): Section[] => {
  if (templateId === 'automax-classic') {
    return [
      {
        id: 'hero-automax',
        type: 'Hero',
        variant: 'cinematic',
        content: {
          badge: '✨ DISPONIBLE EN ALGÉRIE',
          title: 'Dominez la Route avec Élégance',
          subtitle: 'Découvrez notre showroom exclusif de véhicules premium neufs et 00km importés avec garantie.',
          primary_cta: 'Voir le Showroom',
          secondary_cta: 'Estimer l\'Import',
          image_url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600'
        },
        styles: {
          bg_type: 'image',
          bg_color: '#1a1a1a',
          text_color: '#ffffff',
          padding_top: 24,
          padding_bottom: 24,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'stats-automax',
        type: 'Stats',
        variant: 'grid',
        content: {
          items: [
            { number: '100%', label: 'Garantie Import', icon: 'Shield' },
            { number: '24h', label: 'Dédouanement Express', icon: 'Clock' },
            { number: '45+', label: 'Modèles Disponibles', icon: 'Compass' },
            { number: '4.9/5', label: 'Note Clients', icon: 'Star' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1a1a1a',
          padding_top: 8,
          padding_bottom: 8,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'whyus-automax',
        type: 'WhyUs',
        variant: 'numbered',
        content: {
          title: 'Pourquoi Choisir AutoMax ?',
          subtitle: 'Le leader de l\'importation et de la vente de véhicules de prestige en Algérie.',
          items: [
            { title: '1. Véhicules Certifiés', description: 'Chaque voiture subit un contrôle rigoureux avant son départ d\'Europe.', icon: 'Shield' },
            { title: '2. Service Clé en Main', description: 'Nous gérons tout le processus, de l\'achat à la livraison à votre domicile.', icon: 'HeartHandshake' },
            { title: '3. Tarifs Transparents', description: 'Simulez vos droits et taxes douanières sans mauvaise surprise.', icon: 'Compass' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f9fafb',
          text_color: '#1a1a1a',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'inventory-automax',
        type: 'SalesInventory',
        variant: 'grid',
        content: {
          title: 'Showroom Disponible',
          subtitle: 'Consultez nos véhicules disponibles immédiatement dans notre parc à Alger.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1a1a1a',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'import-automax',
        type: 'ImportCalculator',
        variant: 'full',
        content: {
          title: 'Simulateur Dédouanement Algérie',
          subtitle: 'Calculez instantanément le coût total de dédouanement avec licence d\'importation moudjahid ou neuve.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#1a1a1a',
          text_color: '#ffffff',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'brandgrid-automax',
        type: 'BrandGrid',
        variant: 'logos',
        content: {
          title: 'Nos Marques Partenaires',
          items: ['Toyota', 'Hyundai', 'Kia', 'Volkswagen', 'Renault', 'Dacia']
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1a1a1a',
          padding_top: 12,
          padding_bottom: 12,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'testimonials-automax',
        type: 'Testimonials',
        variant: 'dark',
        content: {
          title: 'Avis de Nos Acheteurs',
          items: [
            { name: 'Sofiane, Alger', quote: 'Service d\'importation irréprochable. Ma Toyota RAV4 a été livrée en 3 semaines clé en main.', rating: 5, avatar: 'SO' },
            { name: 'Meriem, Oran', quote: 'La simulation de dédouanement était exacte au centime près. Très professionnels.', rating: 5, avatar: 'ME' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#111111',
          text_color: '#ffffff',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'banner-automax',
        type: 'Banner',
        variant: 'red_cta',
        content: {
          title: 'Commandez Votre Véhicule Sur Mesure',
          subtitle: 'Contactez nos conseillers commerciaux pour lancer votre commande d\'importation personnalisée dès aujourd\'hui.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#e31937',
          text_color: '#ffffff',
          padding_top: 10,
          padding_bottom: 10,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'contact-automax',
        type: 'Contact',
        variant: 'simple',
        content: {
          title: 'Contactez Notre Équipe',
          subtitle: 'Une question sur un véhicule ? Notre showroom d\'Alger vous accueille 6j/7.',
          email: 'showroom@automax.dz',
          phone: '+213 550 12 34 56',
          address: 'Rocade Sud, El Biar, Alger'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1a1a1a',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 'autobaraka-minimal') {
    return [
      {
        id: 'hero-baraka',
        type: 'Hero',
        variant: 'minimal',
        content: {
          badge: '✨ البركة للسيارات',
          title: 'سيارتك الجديدة بضغطة زر واحدة',
          subtitle: 'معرض البركة يوفر لكم أفضل السيارات المستوردة والمستعملة في الجزائر بأفضل الأسعار وبخدمة سريعة عبر الواتساب.',
          primary_cta: 'تصفح المعرض',
          secondary_cta: 'تواصل معنا',
          image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#0f172a',
          text_color: '#ffffff',
          padding_top: 24,
          padding_bottom: 24,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'whyus-baraka',
        type: 'WhyUs',
        variant: 'cards',
        content: {
          title: 'لماذا تختار معرض البركة ؟',
          subtitle: 'نضمن لكم الجودة والأمان في شراء سيارتكم القادمة.',
          items: [
            { title: 'خدمة سريعة عبر الواتساب', description: 'تواصل مباشر مع فريقنا للإجابة عن كل استفساراتكم وحجز سيارتكم.', icon: 'HeartHandshake' },
            { title: 'أسعار تنافسية ومدروسة', description: 'نقدم لكم أفضل العروض والأسعار في السوق الوطنية مع تسهيلات في الدفع.', icon: 'Compass' },
            { title: 'فحص تقني شامل', description: 'جميع سياراتنا تخضع لفحص شامل ودقيق قبل تسليمها للزبون.', icon: 'Shield' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0f172a',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'inventory-baraka',
        type: 'SalesInventory',
        variant: 'minimal',
        content: {
          title: 'السيارات المتوفرة حالياً',
          subtitle: 'احجز سيارتك الآن مباشرة عبر الواتساب بدون تعقيدات.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f8fafc',
          text_color: '#0f172a',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'contact-baraka',
        type: 'Contact',
        variant: 'simple',
        content: {
          title: 'اتصل بنا',
          subtitle: 'يسعدنا استقبالكم في معرضنا أو الإجابة على اتصالاتكم.',
          email: 'contact@autobaraka.com',
          phone: '+213 661 99 88 77',
          address: 'الطريق الوطني رقم 5، الدار البيضاء، الجزائر العاصمة'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0f172a',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 'importpro') {
    return [
      {
        id: 'hero-importpro',
        type: 'Hero',
        variant: 'split',
        content: {
          badge: '⚓ SPÉCIALISTE IMPORTATION & DÉDOUANEMENT',
          title: 'Votre Véhicule Importé en Toute Sérénité',
          subtitle: 'Profitez de notre expertise pour importer votre voiture d\'Europe. Nous gérons l\'achat hors taxes, le transport maritime et le dédouanement complet.',
          primary_cta: 'Estimer les Taxes',
          secondary_cta: 'Voir les Étapes',
          image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#0b132b',
          text_color: '#ffffff',
          padding_top: 24,
          padding_bottom: 24,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'timeline-importpro',
        type: 'Timeline',
        variant: 'steps-6',
        content: {
          title: 'Notre Processus en 6 Étapes',
          subtitle: 'Un accompagnement transparent de la commande jusqu\'à la livraison de vos clés.',
          items: [
            { title: '1. Choix du Véhicule', description: 'Sélectionnez le modèle idéal sur les sites européens ou via nos partenaires.' },
            { title: '2. Devis Détaillé', description: 'Réception d\'une offre claire incluant achat, logistique maritime et taxes estimées.' },
            { title: '3. Achat Hors Taxes', description: 'Nous achetons le véhicule en HT en Europe pour vous faire économiser 20% de TVA.' },
            { title: '4. Transport Maritime', description: 'Logistique sécurisée en conteneur ou navire roulier (Ro-Ro) vers le port d\'Alger.' },
            { title: '5. Dédouanement', description: 'Prise en charge par notre transitaire agréé au port d\'Alger (licence ou douane classique).' },
            { title: '6. Livraison Clé en Main', description: 'Nettoyage professionnel, contrôle de conformité et livraison à votre adresse.' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0b132b',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'calculator-importpro',
        type: 'ImportCalculator',
        variant: 'full',
        content: {
          title: 'Simulateur Dédouanement Complet',
          subtitle: 'Obtenez une estimation granulaire de tous les droits et taxes douanières applicables en Algérie.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f8fafc',
          text_color: '#0b132b',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'faq-importpro',
        type: 'FAQ',
        variant: 'accordion',
        content: {
          title: 'Questions Fréquentes sur l\'Importation',
          subtitle: 'Tout ce que vous devez savoir pour importer un véhicule de moins de 3 ans en Algérie.',
          items: [
            { q: 'Puis-je importer un véhicule diesel ?', a: 'Non, la loi de finances autorise uniquement l\'importation des véhicules touristiques essence, hybrides ou électriques de moins de 3 ans.' },
            { q: 'Qu\'est-ce que l\'avantage Licence Moudjahid ?', a: 'Cette licence accorde une exonération importante des droits de douane et de la TVA pour l\'importation de véhicules neufs ou d\'occasion.' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0b132b',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 'rentalfleet') {
    return [
      {
        id: 'hero-rentalfleet',
        type: 'Hero',
        variant: 'booking-search',
        content: {
          badge: '🚗 KILOMÉTRAGE ILLIMITÉ',
          title: 'Louez la Liberté de Voyager',
          subtitle: 'Large choix de citadines, berlines et SUV récents disponibles à la location au départ d\'Alger et des aéroports.',
          primary_cta: 'Réserver en Ligne',
          secondary_cta: 'Conditions de Location',
          image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1600'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#0284c7',
          text_color: '#ffffff',
          padding_top: 24,
          padding_bottom: 24,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'booking-rentalfleet',
        type: 'RentalBooking',
        variant: 'grid',
        content: {
          title: 'Notre Flotte de Location',
          subtitle: 'Des véhicules récents, climatisés et parfaitement entretenus avec assurance collision incluse.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0284c7',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'conditions-rentalfleet',
        type: 'WhyUs',
        variant: 'cards',
        content: {
          title: 'Nos Conditions de Location',
          subtitle: 'Des règles simples et claires pour louer votre véhicule en toute sérénité.',
          items: [
            { title: 'Âge Minimum 21 Ans', description: 'Le conducteur principal doit être âgé de 21 ans minimum et posséder un permis de plus de 2 ans.', icon: 'Clock' },
            { title: 'Caution de Garantie', description: 'Une caution par empreinte de carte ou espèces est requise lors de la prise en charge du véhicule.', icon: 'Shield' },
            { title: 'Assurance Incluse', description: 'Tous nos contrats incluent une assurance responsabilité civile et garantie collision basique.', icon: 'HeartHandshake' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f0f9ff',
          text_color: '#0284c7',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 'luxurymotors') {
    return [
      {
        id: 'hero-luxurymotors',
        type: 'Hero',
        variant: 'fullscreen-video',
        content: {
          badge: '👑 EXCLUSIVITÉ & PRESTIGE',
          title: 'L\'Art de l\'Automobile d\'Exception',
          subtitle: 'Une sélection minutieuse de supercars et de berlines de luxe destinées aux passionnés les plus exigeants. Sur rendez-vous uniquement.',
          primary_cta: 'Prendre Rendez-vous',
          secondary_cta: 'Découvrir la Collection',
          image_url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1600'
        },
        styles: {
          bg_type: 'image',
          bg_color: '#000000',
          text_color: '#ffffff',
          padding_top: 28,
          padding_bottom: 28,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'inventory-luxurymotors',
        type: 'SalesInventory',
        variant: 'masonry',
        content: {
          title: 'La Collection Privée',
          subtitle: 'Découvrez notre galerie de véhicules de prestige disponibles à l\'acquisition immédiate.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#050505',
          text_color: '#ffffff',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'appointment-luxurymotors',
        type: 'Contact',
        variant: 'vip',
        content: {
          title: 'Visite sur Rendez-vous Privé',
          subtitle: 'Bénéficiez d\'une présentation privée et personnalisée dans notre salon VIP d\'Alger.',
          email: 'vip@luxurymotors.dz',
          phone: '+213 560 99 99 99',
          address: 'Quartier d\'Affaires Bab Ezzouar, Alger'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#121212',
          text_color: '#ffffff',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 't-2s-oto') {
    return [
      {
        id: 'hero-2s-oto',
        type: 'Hero',
        variant: 'split',
        content: {
          badge: '✨ SPÉCIALISTE IMPORTATION',
          title: 'Votre Voiture, Notre Engagement',
          subtitle: 'Importation, vente et location de véhicules neufs et d\'occasion en Algérie. Service de dédouanement transparent et clé en main.',
          primary_cta: 'Voir Nos Véhicules',
          secondary_cta: 'Calculer Mon Import',
          image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1600'
        },
        styles: {
          bg_type: 'image',
          bg_color: '#ffffff',
          text_color: '#ffffff',
          padding_top: 24,
          padding_bottom: 24,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'services-2s-oto',
        type: 'WhyUs',
        variant: 'cards',
        content: {
          title: 'Nos Services Automobiles',
          subtitle: 'Une expertise globale et sécurisée pour vous guider en Algérie.',
          items: [
            { title: 'Achat & Vente', description: 'Achetez votre véhicule neuf ou d\'occasion garanti, sélectionné avec rigueur.', icon: 'Shield' },
            { title: 'Importation Clé en Main', description: 'Importez votre voiture depuis l\'Europe, Dubaï ou la Chine en toute sérénité.', icon: 'Ship' },
            { title: 'Location Souple', description: 'Profitez d\'un véhicule de prestige pour tous vos déplacements.', icon: 'Clock' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1e3a8a',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'inventory-2s-oto',
        type: 'SalesInventory',
        variant: 'grid',
        content: {
          title: 'Nos Véhicules Disponibles',
          subtitle: 'Consultez notre stock actuel disponible immédiatement dans notre parc.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f8fafc',
          text_color: '#1e293b',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'timeline-2s-oto',
        type: 'Timeline',
        variant: 'steps-4',
        content: {
          title: 'Comment Ça Marche ?',
          subtitle: 'Un processus d\'importation simple, sécurisé et transparent en 4 étapes.',
          items: [
            { title: '1. Choisissez', description: 'Sélectionnez votre modèle idéal sur notre site ou sur les plateformes européennes.' },
            { title: '2. Devis Détaillé', description: 'Obtenez une offre ferme incluant le transport, le transit portuaire et le dédouanement.' },
            { title: '3. Commande', description: 'Nous achetons le véhicule hors taxes en Europe et assurons sa logistique maritime.' },
            { title: '4. Livraison', description: 'Prenez livraison de votre véhicule clés en main à notre showroom ou chez vous.' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1e293b',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'stats-2s-oto',
        type: 'Stats',
        variant: 'grid',
        content: {
          items: [
            { number: '370+', label: 'Clients Satisfaits', icon: 'Users' },
            { number: '3.5 Mois', label: 'Délai Moyen d\'Import', icon: 'Clock' },
            { number: '100%', label: 'Transparence des Taxes', icon: 'Shield' },
            { number: '24/7', label: 'Support WhatsApp', icon: 'HeartHandshake' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#1e3a8a',
          text_color: '#ffffff',
          padding_top: 12,
          padding_bottom: 12,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'testimonials-2s-oto',
        type: 'Testimonials',
        variant: 'slider',
        content: {
          title: 'Ce Que Disent Nos Clients',
          items: [
            { name: 'Kamel, Alger', quote: 'Ma Toyota Corolla est arrivée en parfait état. La simulation douanière était exacte au dinar près.', rating: 5, avatar: 'KA' },
            { name: 'Amel, Constantine', quote: 'Un service d\'importation d\'un professionnalisme rare en Algérie. Je recommande 2S Oto !', rating: 5, avatar: 'AM' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1e293b',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'banner-2s-oto',
        type: 'Banner',
        variant: 'whatsapp_cta',
        content: {
          title: 'Besoin d\'un devis d\'importation ?',
          subtitle: 'Discutez en direct avec nos conseillers commerciaux sur WhatsApp pour estimer votre projet gratuitement.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#25D366',
          text_color: '#ffffff',
          padding_top: 10,
          padding_bottom: 10,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 't-auto-am') {
    return [
      {
        id: 'hero-auto-am',
        type: 'Hero',
        variant: 'fullscreen',
        content: {
          badge: '🔥 NOUVEAU STOCK 2026',
          title: 'Trouvez la Voiture de Vos Rêves',
          subtitle: 'Véhicules neufs 00km, occasions certifiées et importation directe livrés chez vous en Algérie.',
          primary_cta: 'Rechercher un Modèle',
          secondary_cta: 'Voir Notre Stock',
          image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600'
        },
        styles: {
          bg_type: 'image',
          bg_color: '#0f0f0f',
          text_color: '#ffffff',
          padding_top: 28,
          padding_bottom: 28,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'brandgrid-auto-am',
        type: 'BrandGrid',
        variant: 'logos',
        content: {
          title: 'Parcourir par Marque',
          items: ['Toyota', 'Hyundai', 'Renault', 'Peugeot', 'Kia', 'Dacia', 'Volkswagen', 'BMW']
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0f0f0f',
          padding_top: 12,
          padding_bottom: 12,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'featured-auto-am',
        type: 'SalesInventory',
        variant: 'featured',
        content: {
          title: 'Notre Sélection Premium',
          subtitle: 'Découvrez nos véhicules d\'exception, méticuleusement sélectionnés et inspectés.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#fafafa',
          text_color: '#0f0f0f',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'services-auto-am',
        type: 'WhyUs',
        variant: 'cards',
        content: {
          title: 'Nos Solutions Automobiles',
          subtitle: 'Un panel de prestations de prestige pour les passionnés d\'automobile.',
          items: [
            { title: 'Vente Premium', description: 'Achetez votre véhicule neuf ou d\'occasion certifiée avec garantie mécanique.', icon: 'Shield' },
            { title: 'Importation Directe', description: 'Importez de l\'Europe et des pays du Golfe au meilleur tarif douanier.', icon: 'Ship' },
            { title: 'Location VIP', description: 'Flotte de prestige disponible pour vos déplacements professionnels et privés.', icon: 'Clock' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#0f0f0f',
          text_color: '#ffffff',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'arrivals-auto-am',
        type: 'SalesInventory',
        variant: 'grid',
        content: {
          title: 'Derniers Arrivages',
          subtitle: 'Les nouveautés fraîches disponibles immédiatement dans notre showroom.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0f0f0f',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'about-auto-am',
        type: 'Text',
        variant: 'split',
        content: {
          title: 'Qui Sommes-Nous ?',
          text: 'Auto AM est votre partenaire de confiance en Algérie pour l\'acquisition de véhicules de prestige. Fort d\'un réseau international robuste, nous assurons l\'achat hors taxes, le transport maritime sécurisé et la conformité administrative complète de votre future voiture.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f5f5f5',
          text_color: '#0f0f0f',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 't-motob') {
    return [
      {
        id: 'hero-motob',
        type: 'Hero',
        variant: 'carousel',
        content: {
          items: [
            { title: 'Nouvelles Arrivées 2026', subtitle: 'Découvrez notre collection de SUV et berlines premium disponibles immédiatement.', image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600' },
            { title: 'Importation Express d\'Europe', subtitle: 'Bénéficiez de l\'achat HT et d\'une livraison clés en main en Algérie en moins de 30 jours.', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600' },
            { title: 'Location Flexible Premium', subtitle: 'Une flotte moderne de citadines et routières de luxe adaptées à vos besoins.', image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1600' }
          ]
        },
        styles: {
          bg_type: 'image',
          bg_color: '#1e293b',
          text_color: '#ffffff',
          padding_top: 24,
          padding_bottom: 24,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'trust-motob',
        type: 'WhyUs',
        variant: 'cards',
        content: {
          title: 'Pourquoi Nous Faire Confiance ?',
          subtitle: 'Des engagements clairs et des garanties solides pour votre futur achat.',
          items: [
            { title: 'Garantie 1 An', description: 'Tous nos véhicules vendus bénéficient d\'une garantie mécanique de 12 mois.', icon: 'Shield' },
            { title: 'Paiement CCP', description: 'Réglez vos acomptes facilement par CCP, BaridiMob ou virement bancaire.', icon: 'HeartHandshake' },
            { title: 'Livraison Algérie', description: 'Logistique sécurisée avec livraison sur plateau devant votre porte dans les 58 wilayas.', icon: 'Compass' },
            { title: 'Service Après-Vente', description: 'Atelier de maintenance agréé et pièces de rechange d\'origine garanties.', icon: 'Clock' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1e293b',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'catalog-motob',
        type: 'SalesInventory',
        variant: 'grid',
        content: {
          title: 'Notre Parc Automobile',
          subtitle: 'Parcourez notre catalogue et filtrez par marque pour trouver votre voiture idéale.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f8fafc',
          text_color: '#1e293b',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'blog-motob',
        type: 'Blog',
        variant: 'grid',
        content: {
          title: 'Actualités & Conseils Auto'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#1e293b',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'newsletter-motob',
        type: 'Banner',
        variant: 'newsletter',
        content: {
          title: 'Restez Informé des Nouveautés',
          subtitle: 'Abonnez-vous à notre newsletter pour recevoir en priorité nos arrivages et nos offres promotionnelles.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#1d4ed8',
          text_color: '#ffffff',
          padding_top: 12,
          padding_bottom: 12,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  if (templateId === 't-rentpro') {
    return [
      {
        id: 'hero-rentpro',
        type: 'Hero',
        variant: 'booking_form',
        content: {
          title: 'Louez une Voiture en Quelques Clics',
          subtitle: 'Livraison gratuite sur Alger · Annulation gratuite · Assurance collision incluse',
          image_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1600'
        },
        styles: {
          bg_type: 'image',
          bg_color: '#0284c7',
          text_color: '#ffffff',
          padding_top: 24,
          padding_bottom: 24,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'categories-rentpro',
        type: 'WhyUs',
        variant: 'categories_scroll',
        content: {
          title: 'Nos Catégories de Véhicules',
          subtitle: 'Trouvez la voiture idéale adaptée à votre budget et à vos trajets.',
          items: [
            { title: 'Économique', description: 'Citadines agiles, idéales pour la ville au meilleur tarif quotidien.', icon: 'Compass' },
            { title: 'Berline', description: 'Grand confort et habitabilité pour tous vos longs trajets.', icon: 'Shield' },
            { title: 'SUV & 4x4', description: 'Puissance, espace et motricité maximale sur toutes les routes.', icon: 'Award' },
            { title: 'Luxe', description: 'Des routières de prestige exceptionnelles pour vos grands événements.', icon: 'Star' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0284c7',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'fleet-rentpro',
        type: 'RentalBooking',
        variant: 'grid',
        content: {
          title: 'Nos Véhicules de Location',
          subtitle: 'Large flotte de voitures neuves ou très récentes disponibles immédiatement.'
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f0f9ff',
          text_color: '#0f172a',
          padding_top: 20,
          padding_bottom: 20,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'how-rentpro',
        type: 'Timeline',
        variant: 'steps-4',
        content: {
          title: 'Comment Réserver ?',
          subtitle: 'Un parcours simple, digital et rassurant pour prendre la route.',
          items: [
            { title: '1. Réservez en Ligne', description: 'Choisissez vos dates, durées et sélectionnez votre voiture préférée.' },
            { title: '2. Confirmez', description: 'Validez votre réservation par téléphone ou WhatsApp sous 10 minutes.' },
            { title: '3. Récupérez', description: 'Prenez possession du véhicule à notre agence ou à l\'aéroport d\'Alger.' },
            { title: '4. Restituez', description: 'Retournez le véhicule avec le plein en toute simplicité.' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0284c7',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'slide'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'conditions-rentpro',
        type: 'WhyUs',
        variant: 'cards',
        content: {
          title: 'Conditions de Location',
          subtitle: 'Des critères clairs, transparents et conformes à la législation algérienne.',
          items: [
            { title: 'Caution de Garantie', description: 'Caution réglementaire obligatoire de 100,000 DZD demandée par empreinte CB ou espèces.', icon: 'Shield' },
            { title: 'Âge & Permis requis', description: 'Le conducteur principal doit être âgé d\'au moins 23 ans et posséder son permis depuis plus de 2 ans.', icon: 'Clock' },
            { title: 'Assurance Collision', description: 'Une assurance responsabilité civile et garantie dommages collision basique est incluse.', icon: 'HeartHandshake' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#f0f9ff',
          text_color: '#0284c7',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'zoom'
        },
        visibility: { desktop: true, mobile: true }
      },
      {
        id: 'faq-rentpro',
        type: 'FAQ',
        variant: 'accordion',
        content: {
          title: 'Foire Aux Questions',
          subtitle: 'Retrouvez les réponses aux questions les plus fréquentes sur nos services de location.',
          items: [
            { q: 'Puis-je annuler ma réservation ?', a: 'Oui, l\'annulation est gratuite jusqu\'à 24 heures avant l\'heure de prise en charge prévue.' },
            { q: 'Puis-je récupérer la voiture à l\'aéroport d\'Alger ?', a: 'Oui, nous proposons un service de livraison gratuite de votre véhicule directement à l\'aéroport Houari Boumediene d\'Alger.' },
            { q: 'Quel est le kilométrage inclus ?', a: 'Tous nos forfaits de location incluent un forfait de 200 kilomètres par jour. Les kilomètres supplémentaires sont calculés au tarif de 15 DZD/km.' }
          ]
        },
        styles: {
          bg_type: 'solid',
          bg_color: '#ffffff',
          text_color: '#0f172a',
          padding_top: 16,
          padding_bottom: 16,
          animation: 'fade'
        },
        visibility: { desktop: true, mobile: true }
      }
    ];
  }

  return [];
};

export const showroomTemplatesList: WebsiteTemplate[] = [
  {
    id: 'a5a5a5a5-b5b5-c5c5-d5d5-e5e5e5e5e5e5',
    name: 'Auto AM',
    description: 'Algerian premier car marketplace template with auto Hero slider, dynamic Brand/Model compound filters, spec details popup, WhatsApp negation integration, and inbox leads submitting form.',
    thumbnail_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500',
    category: 'general',
    is_default: true,
    is_custom: false,
    business_type_slug: 'car_showroom',
    global_styles: {
      primary_color: '#0f0f0f',
      secondary_color: '#1f2937',
      accent_color: '#e31937',
      text_color: '#f3f4f6',
      bg_color: '#0f0f0f',
      card_bg_color: '#1f2937',
      border_color: '#374151',
      heading_font: 'Geist',
      body_font: 'Inter',
      base_font_size: 16,
      button_shape: 'Rounded',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 16,
      card_shadow: 'lg',
      card_hover_effect: true,
      section_gap: 20,
      content_width: 1250,
      page_padding: 24,
      global_animation_speed: 'Fast',
      stagger_delay: 80
    },
    structure: {
      sections: [
        {
          id: 'section-nav',
          type: 'Navbar',
          variant: 'center',
          content: {
            links: [
              { label: 'Accueil', url: '#' },
              { label: 'Stock Showroom', url: '#stock' },
              { label: 'Sur Commande', url: '#commande' },
              { label: 'Location', url: '#location' },
              { label: 'Contact', url: '#contact' }
            ],
            sticky: true,
            phoneButton: true
          },
          styles: { bg_type: 'solid', bg_color: '#0a0e17', text_color: '#ffffff', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-hero',
          type: 'Hero',
          variant: 'fullscreen',
          content: {
            badge: '⚡ IMPORTATION & SHOWROOM PREMIUM',
            headline: 'Trouvez Votre Véhicule de Rêve au Meilleur Prix',
            subtitle: 'Spécialiste de l\'importation de véhicules neufs et occasions certifiées d\'Europe et du Golfe.',
            primaryButtonText: 'Consulter le Stock',
            primaryButtonUrl: '#stock',
            secondaryButtonText: 'Commander un Véhicule',
            secondaryButtonUrl: '#commande',
            backgroundImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1920&q=80',
            enableOverlay: true,
            animation: 'fade-in-up'
          },
          styles: { bg_type: 'solid', bg_color: '#0a0e17', text_color: '#ffffff', padding_top: 24, padding_bottom: 24, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-stats',
          type: 'Stats',
          variant: 'grid',
          content: {
            title: 'Notre Agence en Chiffres',
            items: [
              { number: '150+', label: 'Véhicules Livrés' },
              { number: '15+', label: 'Années d\'Expérience' },
              { number: '99%', label: 'Clients Satisfaits' },
              { number: '24h', label: 'Assistance Client' }
            ]
          },
          styles: { bg_type: 'solid', bg_color: '#dc2626', text_color: '#ffffff', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-grid',
          type: 'Car Grid',
          variant: 'grid',
          content: {
            title: 'Véhicules Disponibles Immédiatement',
            subtitle: 'Découvrez nos nouveautés haut de gamme rigoureusement inspectées et garanties.',
            showFilters: true,
            showPrice: true,
            showSpecs: true,
            showWhatsApp: true,
            carsPerRow: 3,
            limit: 6
          },
          styles: { bg_type: 'solid', bg_color: '#ffffff', text_color: '#0a0e17', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-services',
          type: 'Services',
          variant: 'grid',
          content: {
            title: 'Nos Services d\'Exception',
            items: [
              { title: 'Achat Showroom', desc: 'Une sélection de voitures haut de gamme disponibles immédiatement en concession.', icon: 'Tag' },
              { title: 'Importation Sur Commande', desc: 'Nous gérons tout le processus d\'importation avec dédouanement clé en main.', icon: 'Plus' },
              { title: 'Location Premium', desc: 'Des véhicules d\'exception disponibles en location courte et longue durée.', icon: 'Clock' }
            ]
          },
          styles: { bg_type: 'solid', bg_color: '#f8fafc', text_color: '#0a0e17', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-testimonials',
          type: 'Testimonials',
          variant: 'slider',
          content: {
            title: 'Ce que disent nos clients',
            items: [
              { name: 'Kamel Redouane', quote: 'Service d\'importation d\'un professionnalisme rare en Algérie. Véhicule livré en parfait état avec tous les documents.', rating: 5 },
              { name: 'Amel Belkacem', quote: 'J\'ai loué une berline de luxe pour mon mariage. Le service était impeccable et la voiture impeccable.', rating: 5 }
            ]
          },
          styles: { bg_type: 'solid', bg_color: '#ffffff', text_color: '#0a0e17', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-contact',
          type: 'Contact',
          variant: 'split',
          content: {
            title: 'Contactez Nos Conseillers',
            subtitle: 'Une question ? Un projet d\'achat ? Remplissez le formulaire ci-dessous.',
            showForm: true,
            infoTitle: 'Coordonnées de l\'agence'
          },
          styles: { bg_type: 'solid', bg_color: '#f8fafc', text_color: '#0a0e17', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-map',
          type: 'Map',
          variant: 'interactive',
          content: {
            title: 'Localisation de Notre Concession'
          },
          styles: { bg_type: 'solid', bg_color: '#ffffff', text_color: '#0a0e17', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        },
        {
          id: 'section-footer',
          type: 'Footer',
          variant: 'minimal',
          content: {
            columns: [
              { title: 'Showroom', items: [{ label: 'Stock', url: '#stock' }, { label: 'Sur Commande', url: '#commande' }, { label: 'Location', url: '#location' }] },
              { title: 'Société', items: [{ label: 'À Propos', url: '#' }, { label: 'Services', url: '#' }, { label: 'Contact', url: '#contact' }] }
            ],
            copyrightText: '© 2026 Amine Auto. Conçu avec le Visual Website Builder.'
          },
          styles: { bg_type: 'solid', bg_color: '#0a0e17', text_color: '#ffffff', padding_top: 16, padding_bottom: 16, animation: 'none' },
          visibility: { desktop: true, mobile: true }
        }
      ]
    }
  }
];

// Combine standard and showroom templates list
export const templatesList: WebsiteTemplate[] = [
  ...showroomTemplatesList,
  {
    id: 't-aventra-classic',
    name: 'Aventra Classic',
    description: 'Clean, elegant corporate travel theme with spacious grids and image focus.',
    thumbnail_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500',
    category: 'general',
    is_default: true,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#3b82f6',
      secondary_color: '#1d4ed8',
      accent_color: '#6366f1',
      text_color: '#1e293b',
      bg_color: '#f8fafc',
      card_bg_color: '#ffffff',
      border_color: '#e2e8f0',
      heading_font: 'Inter',
      body_font: 'Inter',
      base_font_size: 16,
      button_shape: 'Rounded',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 16,
      card_shadow: 'md',
      card_hover_effect: true,
      section_gap: 16,
      content_width: 1200,
      page_padding: 24,
      global_animation_speed: 'Normal',
      stagger_delay: 100
    },
    structure: { sections: generateDefaultSections('Aventra Classic') }
  },
  {
    id: 't-desert-explorer',
    name: 'Desert Explorer',
    description: 'Warm sandy and terracotta presets with adventurous fonts designed for Saharan expeditions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500',
    category: 'adventure',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#d97706',
      secondary_color: '#b45309',
      accent_color: '#f59e0b',
      text_color: '#292524',
      bg_color: '#fffbeb',
      card_bg_color: '#ffffff',
      border_color: '#fde68a',
      heading_font: 'Cairo',
      body_font: 'Tajawal',
      base_font_size: 16,
      button_shape: 'Rounded',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 12,
      card_shadow: 'sm',
      card_hover_effect: true,
      section_gap: 20,
      content_width: 1100,
      page_padding: 20,
      global_animation_speed: 'Normal',
      stagger_delay: 150
    },
    structure: { sections: generateDefaultSections('Desert Explorer') }
  },
  {
    id: 't-luxury-jetsetter',
    name: 'Luxury Jetsetter',
    description: 'Dark navy blue paired with golden accents and high-end Serif fonts.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500',
    category: 'luxury',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#b45309',
      secondary_color: '#78350f',
      accent_color: '#d97706',
      text_color: '#f8fafc',
      bg_color: '#0f172a',
      card_bg_color: '#1e293b',
      border_color: '#334155',
      heading_font: 'Amiri',
      body_font: 'Cairo',
      base_font_size: 16,
      button_shape: 'Square',
      button_style: 'Filled',
      button_size: 'Large',
      card_border_radius: 8,
      card_shadow: 'lg',
      card_hover_effect: true,
      section_gap: 24,
      content_width: 1300,
      page_padding: 32,
      global_animation_speed: 'Slow',
      stagger_delay: 200
    },
    structure: { sections: generateDefaultSections('Luxury Jetsetter') }
  },
  {
    id: 't-family-fun',
    name: 'Family Fun',
    description: 'Vibrant, bright colors, rounded corners, and soft card shadow structures.',
    thumbnail_url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500',
    category: 'family',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#ec4899',
      secondary_color: '#db2777',
      accent_color: '#3b82f6',
      text_color: '#1e293b',
      bg_color: '#fdf2f8',
      card_bg_color: '#ffffff',
      border_color: '#fbcfe8',
      heading_font: 'Poppins',
      body_font: 'Inter',
      base_font_size: 16,
      button_shape: 'Pill',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 24,
      card_shadow: 'xl',
      card_hover_effect: true,
      section_gap: 16,
      content_width: 1150,
      page_padding: 24,
      global_animation_speed: 'Fast',
      stagger_delay: 80
    },
    structure: { sections: generateDefaultSections('Family Fun') }
  },
  {
    id: 't-ramadan-special',
    name: 'Ramadan Special',
    description: 'Emerald green themes decorated with historical patterns for Umrah/Hajj packages.',
    thumbnail_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500',
    category: 'religious',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#047857',
      secondary_color: '#065f46',
      accent_color: '#b45309',
      text_color: '#0f172a',
      bg_color: '#f0fdf4',
      card_bg_color: '#ffffff',
      border_color: '#a7f3d0',
      heading_font: 'Amiri',
      body_font: 'Tajawal',
      base_font_size: 16,
      button_shape: 'Rounded',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 16,
      card_shadow: 'md',
      card_hover_effect: true,
      section_gap: 20,
      content_width: 1200,
      page_padding: 24,
      global_animation_speed: 'Slow',
      stagger_delay: 150
    },
    structure: { sections: generateDefaultSections('Ramadan Special') }
  },
  {
    id: 't-summer-beach',
    name: 'Summer Beach',
    description: 'Ocean blue hues combined with pure whites to render breezy sea resorts packages.',
    thumbnail_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=500',
    category: 'general',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#06b6d4',
      secondary_color: '#0891b2',
      accent_color: '#f59e0b',
      text_color: '#0f172a',
      bg_color: '#ecfeff',
      card_bg_color: '#ffffff',
      border_color: '#c5f6fa',
      heading_font: 'Poppins',
      body_font: 'Inter',
      base_font_size: 16,
      button_shape: 'Pill',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 20,
      card_shadow: 'sm',
      card_hover_effect: true,
      section_gap: 16,
      content_width: 1200,
      page_padding: 24,
      global_animation_speed: 'Normal',
      stagger_delay: 100
    },
    structure: { sections: generateDefaultSections('Summer Beach') }
  },
  {
    id: 't-city-break',
    name: 'City Break',
    description: 'High-contrast bold headings, urban architectural lines, and flat solid cards.',
    thumbnail_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=500',
    category: 'general',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#0f172a',
      secondary_color: '#334155',
      accent_color: '#64748b',
      text_color: '#0f172a',
      bg_color: '#ffffff',
      card_bg_color: '#f8fafc',
      border_color: '#cbd5e1',
      heading_font: 'Geist',
      body_font: 'Inter',
      base_font_size: 16,
      button_shape: 'Square',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 0,
      card_shadow: 'none',
      card_hover_effect: false,
      section_gap: 28,
      content_width: 1250,
      page_padding: 28,
      global_animation_speed: 'Fast',
      stagger_delay: 80
    },
    structure: { sections: generateDefaultSections('City Break') }
  },
  {
    id: 't-adventure-pro',
    name: 'Adventure Pro',
    description: 'Fiery athletic red with dark backgrounds, dynamic edges, and high-contrast badges.',
    thumbnail_url: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?w=500',
    category: 'adventure',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#dc2626',
      secondary_color: '#991b1b',
      accent_color: '#f59e0b',
      text_color: '#f1f5f9',
      bg_color: '#0b0f19',
      card_bg_color: '#111827',
      border_color: '#1f2937',
      heading_font: 'Poppins',
      body_font: 'Inter',
      base_font_size: 16,
      button_shape: 'Rounded',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 12,
      card_shadow: 'md',
      card_hover_effect: true,
      section_gap: 16,
      content_width: 1200,
      page_padding: 24,
      global_animation_speed: 'Fast',
      stagger_delay: 100
    },
    structure: { sections: generateDefaultSections('Adventure Pro') }
  },
  {
    id: 't-cultural-heritage',
    name: 'Cultural Heritage',
    description: 'Elegant amber-brown combinations paired with classical fonts highlighting history.',
    thumbnail_url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=500',
    category: 'luxury',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#78350f',
      secondary_color: '#451a03',
      accent_color: '#b45309',
      text_color: '#27272a',
      bg_color: '#fffbeb',
      card_bg_color: '#fafafa',
      border_color: '#f4f4f5',
      heading_font: 'Amiri',
      body_font: 'Cairo',
      base_font_size: 16,
      button_shape: 'Rounded',
      button_style: 'Filled',
      button_size: 'Medium',
      card_border_radius: 16,
      card_shadow: 'sm',
      card_hover_effect: true,
      section_gap: 24,
      content_width: 1100,
      page_padding: 24,
      global_animation_speed: 'Slow',
      stagger_delay: 180
    },
    structure: { sections: generateDefaultSections('Cultural Heritage') }
  },
  {
    id: 't-minimal-zen',
    name: 'Minimal Zen',
    description: 'Maximum whitespace, extremely lightweight typography, clean borders, and soft transitions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500',
    category: 'general',
    is_default: false,
    is_custom: false,
    business_type_slug: 'travel',
    global_styles: {
      primary_color: '#1e293b',
      secondary_color: '#475569',
      accent_color: '#94a3b8',
      text_color: '#0f172a',
      bg_color: '#fafafa',
      card_bg_color: '#ffffff',
      border_color: '#f1f5f9',
      heading_font: 'Inter',
      body_font: 'Inter',
      base_font_size: 15,
      button_shape: 'Rounded',
      button_style: 'Filled',
      button_size: 'Small',
      card_border_radius: 6,
      card_shadow: 'sm',
      card_hover_effect: false,
      section_gap: 20,
      content_width: 1050,
      page_padding: 20,
      global_animation_speed: 'Normal',
      stagger_delay: 50
    },
    structure: { sections: generateDefaultSections('Minimal Zen') }
  }
];
