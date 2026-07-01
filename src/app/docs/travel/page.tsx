import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Guide Agences de Voyage — Snipe.dz Documentation',
  description: 'Documentation complète pour les agences de voyage : messagerie, leads, clients, voyages, réservations, visas, factures, finance et équipe.',
}

const pages = [
  {
    icon: '📬',
    title: 'Messagerie (Inbox)',
    description: 'Toutes vos conversations centralisées',
    content: [
      'La **Messagerie** centralise toutes vos conversations entrantes depuis WhatsApp, Instagram et Facebook Messenger en un seul endroit.',
      '**Ce que vous pouvez faire :**',
      '- Lire et répondre aux messages de vos clients directement depuis le tableau de bord',
      '- Assigner une conversation à un employé spécifique pour suivi',
      '- Marquer une conversation comme "Résolu" une fois le client servi',
      '- Voir le **score de lead** automatique calculé par l\'IA pour chaque contact',
      '- Filtrer par statut : Non lu, En attente, Résolu',
      '**Astuce :** Le chatbot IA répond automatiquement en dehors de vos heures de travail. Les conversations nécessitant une intervention humaine sont automatiquement transférées et marquées comme prioritaires.',
    ]
  },
  {
    icon: '🔥',
    title: 'Tableau des Leads',
    description: 'Gérez vos prospects qualifiés',
    content: [
      'Le **Tableau des Leads** est un tableau kanban qui visualise l\'avancement de chaque prospect depuis le premier contact jusqu\'à la conversion.',
      '**Colonnes du tableau :**',
      '- **Froid** : Nouveau contact, pas encore qualifié',
      '- **Tiède** : A montré de l\'intérêt (demandé un devis, posé des questions)',
      '- **Chaud** : Prêt à réserver, en attente de confirmation',
      '- **Converti** : Réservation confirmée et acompte reçu',
      '**Fonctionnalités :**',
      '- Glissez-déposez les cartes d\'une colonne à l\'autre',
      '- Chaque lead affiche : nom, téléphone, voyage d\'intérêt, dernier message, score IA',
      '- Cliquez sur un lead pour ouvrir sa fiche complète et son historique de conversation',
    ]
  },
  {
    icon: '👥',
    title: 'Répertoire Clients',
    description: 'Base de données de vos clients',
    content: [
      'Le **Répertoire Clients** est votre base de données complète de tous les clients ayant effectué au moins une réservation ou interaction.',
      '**Fiche client inclut :**',
      '- Informations de contact (nom, téléphone, email, adresse)',
      '- Historique complet des réservations',
      '- Statut client (Standard, VIP, Bloqué)',
      '- Notes internes de l\'équipe',
      '- Documents associés (passeport, visa...)',
      '**Actions disponibles :**',
      '- Ajouter un client manuellement',
      '- Importer en masse depuis Excel/CSV',
      '- Exporter la liste pour campagne marketing',
      '- Envoyer un message WhatsApp directement depuis la fiche',
    ]
  },
  {
    icon: '🧳',
    title: 'Catalogue Voyages',
    description: 'Créez et gérez vos offres',
    content: [
      'Le **Catalogue Voyages** est l\'endroit où vous créez toutes vos offres. Chaque voyage créé ici apparaît automatiquement sur votre site web public.',
      '**Informations d\'un voyage :**',
      '- Titre, destination, description détaillée',
      '- Dates de départ et de retour',
      '- Prix adulte / enfant / bébé (en DZD)',
      '- Nombre de places disponibles',
      '- Photos (galerie jusqu\'à 10 images)',
      '- Programme jour par jour (itinéraire)',
      '- Inclusions et exclusions',
      '- Conditions générales de réservation',
      '**Types de voyages supportés :**',
      '- Omra et Hajj',
      '- Voyages internationaux (Europe, Turquie, Dubaï, Asie...)',
      '- Voyages domestiques (Sahara, côte, Tell...)',
      '- Voyages sur mesure / groupes',
    ]
  },
  {
    icon: '📋',
    title: 'Réservations',
    description: 'Gérez les confirmations et paiements',
    content: [
      'La page **Réservations** liste toutes les réservations confirmées avec leur statut de paiement.',
      '**Statuts d\'une réservation :**',
      '- **En attente** : Réservation créée, acompte non encore reçu',
      '- **Confirmée** : Acompte reçu, voyage assuré pour le client',
      '- **Soldée** : Paiement intégral reçu',
      '- **Annulée** : Voyage annulé (par l\'agence ou le client)',
      '- **Remboursée** : Montant remboursé au client',
      '**Pour chaque réservation :**',
      '- Nom du client, voyage réservé, nombre de personnes',
      '- Montant total, acompte versé, solde restant',
      '- Date de réservation et date de départ',
      '- Possibilité de générer et envoyer la facture PDF directement par WhatsApp',
    ]
  },
  {
    icon: '🛂',
    title: 'Services Visa',
    description: 'Suivez les dossiers visa par client',
    content: [
      'Le module **Services Visa** vous permet de suivre chaque demande de visa de vos clients, de la constitution du dossier jusqu\'à l\'obtention.',
      '**Informations suivies par dossier :**',
      '- Client concerné, type de visa, pays et ambassade',
      '- Date de dépôt du dossier, date du rendez-vous ambassade',
      '- Statut : En préparation, Déposé, En traitement, Accordé, Refusé',
      '- Notes internes et documents scannés',
      '**Statuts et alertes :**',
      '- Alertes automatiques pour les dossiers en attente depuis plus de 30 jours',
      '- Badge numérique dans la barre latérale indiquant le nombre de dossiers "En attente"',
    ]
  },
  {
    icon: '📄',
    title: 'Factures',
    description: 'Générez des factures professionnelles',
    content: [
      'La page **Factures** vous permet de générer des factures PDF professionnelles en DZD pour vos clients.',
      '**Fonctionnalités :**',
      '- Génération automatique depuis une réservation existante',
      '- Ou création manuelle libre (pour des prestations non standard)',
      '- Numérotation automatique (FA-2026-001, FA-2026-002...)',
      '- Entête avec votre logo et les informations de l\'agence',
      '- Détail des prestations, sous-total, TVA optionnelle, total DZD',
      '- **Envoi direct par WhatsApp** au client en un clic',
      '- Téléchargement PDF pour impression ou email',
      '- Suivi des statuts : Brouillon, Envoyée, Payée, En retard',
    ]
  },
  {
    icon: '💰',
    title: 'Finance & Trésorerie',
    description: 'Journal comptable et prévisions',
    content: [
      'La page **Finance & Trésorerie** est un journal comptable simplifié pour suivre vos recettes et dépenses.',
      '**Tableau de bord financier :**',
      '- Solde total actuel',
      '- Recettes du mois en cours',
      '- Dépenses du mois en cours',
      '- Dettes fournisseurs en retard',
      '**Journal des transactions :**',
      '- Enregistrez chaque recette (acompte client, solde voyage, commission) et chaque dépense (billet d\'avion, hôtel, fournisseur)',
      '- Catégorisez les transactions',
      '- Ajoutez des justificatifs photo (reçu, virement...)',
      '**Outils spéciaux :**',
      '- **Générateur de bordereau CCP** : Remplit automatiquement un bordereau officiel Algérie Poste imprimable',
      '- **Prévisions de trésorerie** : Simulation du cash disponible dans 30/60 jours basée sur les réservations en cours',
    ]
  },
  {
    icon: '👨‍💼',
    title: 'Équipe',
    description: 'Gérez vos employés et accès',
    content: [
      'La page **Équipe** vous permet d\'inviter et gérer vos agents et collaborateurs.',
      '**Rôles disponibles :**',
      '- **Superadmin (vous)** : Accès complet à tout, y compris les paramètres et la facturation',
      '- **Agent** : Accès au tableau de bord (messagerie, clients, réservations) mais pas aux paramètres ni à la facturation',
      '**Comment inviter un employé :**',
      '1. Cliquez sur "Inviter un employé"',
      '2. Entrez son adresse e-mail',
      '3. Il reçoit un e-mail avec un lien d\'activation',
      '4. Il crée son mot de passe et accède immédiatement',
      '**Limites par plan :**',
      '- Starter : 1 compte employé',
      '- Plus : 5 comptes employés',
      '- Pro : 10 comptes employés',
      '- Max : Illimité',
    ]
  },
]

export default function TravelGuidePage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
        <Link href="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
        <span>→</span>
        <span className="text-slate-600">Guide Agences de Voyage</span>
      </div>

      <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
        <span>✈️ Agences de Voyage</span>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">Guide Agences de Voyage</h1>
      <p className="text-slate-500 font-medium mb-12 leading-relaxed">
        Découvrez comment utiliser chaque page du tableau de bord pour gérer votre agence de voyage de A à Z.
      </p>

      {/* On this page */}
      <div className="bg-blue-50 rounded-2xl p-5 mb-12 border border-blue-100">
        <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Sur cette page</p>
        <div className="flex flex-wrap gap-2">
          {pages.map(p => (
            <a key={p.title} href={`#${p.title.toLowerCase().replace(/[^a-z]/g, '-')}`} className="text-xs font-semibold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-colors">
              {p.icon} {p.title}
            </a>
          ))}
        </div>
      </div>

      {/* Pages documentation */}
      <div className="space-y-14">
        {pages.map((page) => (
          <section key={page.title} id={page.title.toLowerCase().replace(/[^a-z]/g, '-')} className="scroll-mt-8">
            <div className="flex items-start gap-4 mb-5">
              <div className="text-3xl mt-0.5">{page.icon}</div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{page.title}</h2>
                <p className="text-sm text-slate-500 font-medium">{page.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-3">
              {page.content.map((block, i) => {
                if (block.startsWith('- ')) {
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium ml-4">
                      <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                      <span dangerouslySetInnerHTML={{ __html: block.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>') }} />
                    </li>
                  )
                }
                if (block.endsWith(':')) {
                  return (
                    <p key={i} className="text-xs font-black uppercase tracking-widest text-slate-400 mt-4 mb-1"
                      dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-600">$1</strong>') }}
                    />
                  )
                }
                return (
                  <p key={i} className="text-sm text-slate-600 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>') }}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Next steps */}
      <div className="mt-14 flex gap-4 flex-col sm:flex-row">
        <Link href="/docs/chatbot" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:bg-blue-50 transition-all group">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Suivant</p>
          <p className="font-bold text-slate-800 group-hover:text-blue-700">🤖 Guide Chatbot IA →</p>
        </Link>
        <Link href="/docs/billing" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:bg-blue-50 transition-all group">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Aussi</p>
          <p className="font-bold text-slate-800 group-hover:text-blue-700">💳 Abonnements & Paiements →</p>
        </Link>
      </div>
    </div>
  )
}
