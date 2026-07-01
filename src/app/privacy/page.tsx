import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — Snipe.dz',
  description: 'Comment SARL SNIPE SAAS collecte, utilise et protège vos données personnelles conformément à la Loi algérienne 18-07.',
}

const sections_fr = [
  {
    id: 'collecte',
    title: '1. Données Collectées',
    content: `Lors de l'utilisation de la plateforme Snipe.dz, nous collectons les catégories de données suivantes :

**Données d'identification :** Nom complet, raison sociale de l'entreprise, numéro de téléphone, adresse e-mail, adresse postale.

**Données de connexion :** Identifiants de compte, mots de passe (chiffrés via bcrypt), adresses IP et journaux de connexion.

**Données métier :** Informations clients saisies par l'agence (noms, téléphones, e-mails clients), dossiers de voyages, véhicules, réservations, factures, dossiers visa.

**Données de conversation :** Messages échangés via le chatbot IA WhatsApp, y compris le contenu des conversations et les horodatages.

**Données de paiement :** Informations de transaction via Chargily Pay (nous ne stockons pas les données de carte bancaire — celles-ci sont traitées directement par Chargily).

**Données techniques :** Cookies de session, journaux d'accès, informations du navigateur et système d'exploitation.`
  },
  {
    id: 'utilisation',
    title: '2. Utilisation des Données',
    content: `Les données collectées sont utilisées exclusivement aux fins suivantes :

- **Fourniture du service :** Permettre le fonctionnement du tableau de bord, du chatbot IA, du constructeur de site web et de tous les modules de la plateforme.
- **Communication :** Envoi de notifications de service, alertes de sécurité, et communications liées au compte.
- **Amélioration du service :** Analyse anonymisée des usages pour améliorer les fonctionnalités de la plateforme.
- **Support client :** Résolution des incidents techniques et assistance opérationnelle.
- **Facturation :** Gestion des abonnements et traitement des paiements via Chargily Pay.
- **Conformité légale :** Respect des obligations légales et réglementaires algériennes.

Nous n'utilisons pas vos données à des fins publicitaires, ni ne les vendons ou partageons avec des tiers à des fins commerciales.`
  },
  {
    id: 'tiers',
    title: '3. Services Tiers',
    content: `Pour fournir ses services, Snipe.dz fait appel aux prestataires tiers suivants :

**Supabase (Database & Auth) :** Hébergement de la base de données PostgreSQL et gestion de l'authentification. Les données sont hébergées sur des serveurs sécurisés en Europe (AWS eu-west). Politique de confidentialité : supabase.com/privacy.

**OpenAI / Google Gemini (Intelligence Artificielle) :** Traitement des requêtes du chatbot IA. Les conversations peuvent être transmises pour traitement. Ces prestataires ne conservent pas vos données au-delà du traitement de la requête. Nous utilisons les paramètres de confidentialité stricts (no training data opt-out).

**Meta WhatsApp Business API :** Acheminement des messages WhatsApp via l'API officielle Meta. Politique de confidentialité : facebook.com/privacy/policy.

**Chargily Pay :** Traitement des paiements en DZD (CIB/Edahabia). Les données de carte bancaire ne transitent jamais par nos serveurs. Politique : chargily.com/privacy.

**Vercel (Hébergement) :** Infrastructure d'hébergement de l'application web.

Chaque prestataire est contractuellement tenu de respecter la confidentialité de vos données.`
  },
  {
    id: 'conservation',
    title: '4. Conservation et Suppression',
    content: `**Durée de conservation :** Vos données sont conservées pendant toute la durée de votre abonnement, plus une période maximale de 12 mois après la résiliation de votre compte.

**Suppression sur demande :** Vous pouvez demander la suppression définitive de votre compte et de toutes les données associées à tout moment en contactant contact@snipe.dz. La suppression sera effectuée dans un délai de 30 jours.

**Suppression automatique :** Les comptes inactifs depuis plus de 24 mois sans abonnement actif peuvent être supprimés automatiquement, avec préavis de 30 jours par e-mail.

**Données de facturation :** Conformément aux obligations comptables algériennes, certaines données de transaction peuvent être conservées jusqu'à 10 ans.`
  },
  {
    id: 'droits',
    title: '5. Vos Droits (Loi 18-07)',
    content: `Conformément à la Loi algérienne n°18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, vous disposez des droits suivants :

**Droit d'accès :** Obtenir une copie de toutes vos données personnelles que nous détenons.

**Droit de rectification :** Corriger des données inexactes ou incomplètes.

**Droit à l'effacement :** Demander la suppression de vos données personnelles.

**Droit d'opposition :** Vous opposer au traitement de vos données pour certaines finalités.

**Droit à la portabilité :** Recevoir vos données dans un format structuré et lisible par machine.

Pour exercer ces droits, contactez-nous à : **contact@snipe.dz** en précisant votre identité et la nature de votre demande. Nous répondrons dans un délai maximum de 30 jours.`
  },
  {
    id: 'securite',
    title: '6. Sécurité des Données',
    content: `Nous mettons en œuvre les mesures de sécurité suivantes :

- **Chiffrement en transit :** Toutes les communications utilisent le protocole HTTPS/TLS.
- **Chiffrement au repos :** Les bases de données sont chiffrées au repos.
- **Isolation des données :** Chaque agence dispose de ses propres données isolées par Row Level Security (RLS) — aucune agence ne peut accéder aux données d'une autre.
- **Mots de passe :** Les mots de passe sont chiffrés via bcrypt, nous n'avons jamais accès à votre mot de passe en clair.
- **Authentification :** Système d'authentification sécurisé avec tokens JWT à durée de vie limitée.
- **Journalisation :** Les accès et modifications sont journalisés à des fins d'audit.`
  },
  {
    id: 'cookies',
    title: '7. Cookies',
    content: `Snipe.dz utilise les types de cookies suivants :

**Cookies essentiels :** Nécessaires au fonctionnement de la plateforme (session utilisateur, préférences de langue). Ces cookies ne peuvent pas être désactivés.

**Cookies d'analyse :** Optionnels. Nous pouvons utiliser des outils d'analyse anonymisée (ex: Vercel Analytics) pour comprendre l'utilisation de la plateforme. Aucune donnée personnelle identifiable n'est collectée via ces cookies.

Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités de la plateforme.`
  },
  {
    id: 'contact',
    title: '8. Contact & DPO',
    content: `Pour toute question relative à cette politique de confidentialité ou à vos données personnelles :

**SARL SNIPE SAAS**
ADDL CNEP 2000 REGHAIA, ALGER, Algérie
E-mail : contact@snipe.dz
WhatsApp : +213 555 100 200

Toute réclamation relative au traitement de vos données peut également être adressée à l'**Autorité Nationale de Protection des Données Personnelles (ANPDP)** d'Algérie.

*Dernière mise à jour : Juin 2026*`
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="text-xl font-black">Snipe<span className="text-blue-400">.dz</span></span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Politique de Confidentialité</h1>
          <p className="text-slate-400 text-lg font-medium">
            SARL SNIPE SAAS — Dernière mise à jour : Juin 2026
          </p>
          <p className="text-slate-500 text-sm mt-3">
            Conformément à la Loi algérienne n°18-07 relative à la protection des données personnelles
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Table of contents */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-12 border border-slate-200">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Table des matières</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections_fr.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-12 p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-slate-700 text-sm leading-relaxed font-medium">
            La présente Politique de Confidentialité décrit comment <strong>SARL SNIPE SAAS</strong> (ci-après «&nbsp;Snipe.dz&nbsp;», «&nbsp;nous&nbsp;») collecte, utilise, stocke et protège les données personnelles des utilisateurs de la plateforme snipe.dz. En utilisant nos services, vous acceptez les termes de cette politique.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections_fr.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">
                {section.title}
              </h2>
              <div className="prose prose-slate max-w-none">
                {section.content.split('\n\n').map((paragraph, i) => {
                  if (paragraph.startsWith('-')) {
                    const items = paragraph.split('\n').filter(l => l.startsWith('-'))
                    return (
                      <ul key={i} className="space-y-2 my-4">
                        {items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                            <span className="text-blue-500 mt-1">•</span>
                            <span dangerouslySetInnerHTML={{ __html: item.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </li>
                        ))}
                      </ul>
                    )
                  }
                  return (
                    <p
                      key={i}
                      className="text-sm text-slate-600 leading-relaxed font-medium mb-4"
                      dangerouslySetInnerHTML={{
                        __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>')
                      }}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 p-8 bg-slate-900 rounded-3xl text-center">
          <h3 className="text-white font-bold text-xl mb-3">Des questions sur vos données ?</h3>
          <p className="text-slate-400 text-sm mb-6 font-medium">
            Notre équipe répond à toutes vos questions relatives à la confidentialité dans les 24h ouvrées.
          </p>
          <a
            href="mailto:contact@snipe.dz"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-full text-sm transition-colors"
          >
            Contacter contact@snipe.dz
          </a>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors">
            ← Retour à snipe.dz
          </Link>
          <span className="mx-3 text-slate-300">·</span>
          <Link href="/docs" className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors">
            Centre d'aide →
          </Link>
        </div>
      </div>
    </div>
  )
}
