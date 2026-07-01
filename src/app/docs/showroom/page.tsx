import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Guide Showrooms Automobiles — Snipe.dz Documentation',
  description: 'Documentation pour les showrooms auto : inventaire, ventes, location, importation conteneur, dédouanement et finance.',
}

const pages = [
  {
    icon: '🚗',
    title: 'Ventes de Véhicules',
    description: 'Inventaire et gestion des ventes',
    content: [
      'Le module **Ventes de Véhicules** est votre inventaire digital complet. Chaque véhicule créé ici apparaît sur votre site web public.',
      '**Informations par véhicule :**',
      '- Marque, modèle, année, version/trim',
      '- Carburant (Essence, Diesel, Hybride, Électrique)',
      '- Kilométrage, couleur extérieure, couleur intérieure',
      '- Prix de vente (DZD), prix barré optionnel',
      '- Photos (jusqu\'à 15 images par véhicule)',
      '- Équipements et options',
      '**Statuts disponibles :**',
      '- **Disponible** : Visible sur le site, peut être réservé',
      '- **Réservé** : Acompte reçu, en attente de finalisation',
      '- **Vendu** : Transaction finalisée, retiré du catalogue',
      '- **Caché** : Non visible sur le site (maintenance, préparation...)',
    ]
  },
  {
    icon: '📅',
    title: 'Location de Véhicules',
    description: 'Gestion de la flotte de location',
    content: [
      'Le module **Location** vous permet de gérer une flotte dédiée à la location courte/longue durée.',
      '**Configuration d\'un véhicule de location :**',
      '- Tarifs : par jour, par semaine, par mois',
      '- Dépôt de garantie requis',
      '- Kilométrage journalier inclus, frais de dépassement',
      '- État du véhicule (Excellent, Bon, À entretenir)',
      '**Gestion des contrats :**',
      '- Créez un contrat de location pour chaque client',
      '- Dates de prise en charge et de retour',
      '- Photographiez l\'état du véhicule à la remise',
      '- Suivez les véhicules actuellement loués vs disponibles',
      '**Calendrier de disponibilité :**',
      '- Vue calendrier pour chaque véhicule',
      '- Évitez les doubles réservations automatiquement',
    ]
  },
  {
    icon: '🚢',
    title: 'Importation Auto',
    description: 'Suivi conteneur et dossiers d\'importation',
    content: [
      'Le module **Importation Auto** est conçu spécifiquement pour les showrooms qui importent des véhicules de l\'étranger.',
      '**Cycle d\'un dossier d\'importation :**',
      '1. **Commande fournisseur** : Saisie du bon de commande, pays d\'origine, fournisseur, véhicule(s)',
      '2. **Paiement 30%** : Premier acompte enregistré (30% du prix d\'achat)',
      '3. **Expédition maritime** : Numéro de conteneur, port de départ, port d\'Alger, ETA',
      '4. **Paiement 30%** : Deuxième tranche au départ du bateau',
      '5. **Arrivée au port** : Notification d\'arrivée, remise aux transitaires',
      '6. **Dédouanement** : Calcul automatique des droits (DTP, TIC, TVA 19%, honoraires transitaire)',
      '7. **Paiement 40%** : Solde final à la livraison',
      '8. **Réception** : Véhicule transféré au stock Ventes',
      '**Copilote IA :**',
      '- Collez une facture fournisseur → l\'IA extrait automatiquement tous les champs (modèle, valeur FOB, quantité...)',
      '- Calculateur de droits douaniers Algérie en temps réel',
    ]
  },
  {
    icon: '🏛️',
    title: 'Customs & Finance',
    description: 'Dédouanement, trésorerie et CCP',
    content: [
      'La page **Customs & Finance** regroupe la comptabilité et les outils douaniers spécifiques aux showrooms.',
      '**Journal financier :**',
      '- Recettes (ventes de véhicules, locations, services)',
      '- Dépenses (achats, dédouanement, transport, entretien)',
      '- Solde total, revenus du mois, dépenses du mois',
      '**Calculateur douanier Algérie :**',
      '- Entrez : valeur FOB en EUR + taux de change + type de moteur + âge du véhicule',
      '- Résultat : DTP, TIC, TVA 19%, honoraires transitaire',
      '- Total des droits à payer avant livraison',
      '**Générateur de bordereau CCP :**',
      '- Remplit un bordereau officiel Algérie Poste pour les virements fournisseurs ou clients',
      '- Imprimable directement depuis la plateforme',
      '**Prévisions de trésorerie :**',
      '- Basées sur les dossiers d\'importation en cours et leur étape de paiement',
      '- Cash prévu à 30, 60 et 90 jours',
    ]
  },
  {
    icon: '🔥',
    title: 'Leads Board',
    description: 'Qualifiez et convertissez vos prospects',
    content: [
      'Le **Leads Board** des showrooms est optimisé pour les prospects WhatsApp qui cherchent un véhicule spécifique.',
      '**Données capturées par l\'IA pour chaque lead :**',
      '- Modèle de véhicule recherché',
      '- Budget disponible',
      '- Financement souhaité (comptant, CPA, BADR, AGB)',
      '- Délai d\'achat (immédiat, 1-3 mois, plus tard)',
      '**Colonnes du tableau :**',
      '- **Froid** : Vient de contacter, pas encore qualifié',
      '- **Qualifié** : Budget et modèle confirmés',
      '- **Essai planifié** : Test drive organisé',
      '- **Offre envoyée** : Devis transmis, en attente de réponse',
      '- **Vendu** : Acompte reçu et contrat signé',
    ]
  },
  {
    icon: '👥',
    title: 'Clients & Équipe',
    description: 'Répertoire et gestion des agents',
    content: [
      '**Répertoire Clients :**',
      '- Chaque acheteur ou locataire devient automatiquement un client dans la base',
      '- Historique d\'achat complet par client (véhicules achetés, locations effectuées)',
      '- Segmentation : acheteur particulier, revendeur (B2B)',
      '- Communication directe par WhatsApp depuis la fiche client',
      '**Gestion de l\'équipe :**',
      '- Invitez vos commerciaux avec des comptes agents',
      '- Chaque agent a accès aux leads et clients qui lui sont assignés',
      '- Tableau de bord de performance par agent (nombre de leads convertis, CA généré)',
      '- L\'administrateur (vous) garde le contrôle des paramètres et de la facturation',
    ]
  },
]

export default function ShowroomGuidePage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
        <Link href="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
        <span>→</span>
        <span className="text-slate-600">Guide Showrooms Auto</span>
      </div>

      <div className="inline-flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest mb-4">
        <span>🚗 Showrooms Auto</span>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">Guide Showrooms Automobiles</h1>
      <p className="text-slate-500 font-medium mb-12 leading-relaxed">
        Tout ce qu'il faut savoir pour gérer votre showroom auto : inventaire, importation, dédouanement, location et finance.
      </p>

      <div className="bg-red-50 rounded-2xl p-5 mb-12 border border-red-100">
        <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-3">Sur cette page</p>
        <div className="flex flex-wrap gap-2">
          {pages.map(p => (
            <a key={p.title} href={`#${p.title.toLowerCase().replace(/[^a-z]/g, '-')}`} className="text-xs font-semibold text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-600 hover:text-white transition-colors">
              {p.icon} {p.title}
            </a>
          ))}
        </div>
      </div>

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
                      <span className="text-red-400 mt-0.5 shrink-0">•</span>
                      <span dangerouslySetInnerHTML={{ __html: block.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>') }} />
                    </li>
                  )
                }
                if (/^\d+\./.test(block)) {
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium ml-4">
                      <span className="text-red-400 mt-0.5 shrink-0 font-bold">{block.match(/^\d+/)?.[0]}.</span>
                      <span dangerouslySetInnerHTML={{ __html: block.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>') }} />
                    </li>
                  )
                }
                if (block.endsWith(':')) {
                  return <p key={i} className="text-xs font-black uppercase tracking-widest text-slate-400 mt-4 mb-1" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                }
                return <p key={i} className="text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>') }} />
              })}
            </div>
          </section>
        ))}
      </div>

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
