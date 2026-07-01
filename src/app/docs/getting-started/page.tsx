import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Démarrage Rapide — Snipe.dz Documentation',
  description: 'Configurez votre compte Snipe.dz en 5 étapes. De la création à la publication de votre chatbot IA en moins de 30 minutes.',
}

const steps = [
  {
    num: 1,
    title: 'Créez votre compte',
    icon: '👤',
    content: `Rendez-vous sur **snipe.dz** et cliquez sur **"Commencer"** ou **"Créer mon compte gratuit"**.

Lors de l'inscription, choisissez votre **type d'activité** :
- **Agence de voyage** : accès au catalogue de voyages, gestion des visas, module réservations.
- **Showroom automobile** : accès à l'inventaire véhicules, importation conteneur, module location.

Renseignez : nom de l'entreprise, e-mail professionnel, mot de passe sécurisé. Un e-mail de confirmation vous sera envoyé.`,
  },
  {
    num: 2,
    title: 'Complétez votre profil',
    icon: '🏢',
    content: `Accédez à **Paramètres → Agence** pour renseigner les informations de base :

- **Nom commercial** de votre agence/showroom
- **Numéro de téléphone** principal (avec indicatif +213)
- **Adresse** (wilaya, commune)
- **Logo** (recommandé : carré 400x400px, format PNG)
- **Sous-domaine** : votre adresse web sera du type votre-agence.snipe.dz

Ces informations apparaîtront sur votre site web public et dans votre chatbot.`,
  },
  {
    num: 3,
    title: 'Configurez votre chatbot IA',
    icon: '🤖',
    content: `Accédez à **Paramètres → Chatbot IA** :

**Personnalité :**
- Choisissez un **nom** pour votre bot (ex: "Rania", "Assistant Horizons")
- Sélectionnez la **langue** : Darja algérien (recommandé), Français, Arabe classique, ou détection automatique
- Rédigez un **message d'accueil** personnalisé

**Connexion WhatsApp Business :**
- Entrez votre **token d'accès WhatsApp Business API** (obtenu sur business.facebook.com)
- Configurez le **webhook URL** fourni par Snipe.dz dans votre console Meta
- Testez la connexion avec le bouton "Tester la connexion"

**Base de connaissances :**
- Sélectionnez quels voyages/véhicules le bot peut présenter
- Ajoutez des FAQ personnalisées`,
  },
  {
    num: 4,
    title: 'Lancez votre site web',
    icon: '🌐',
    content: `Accédez à **Paramètres → Constructeur de Site Web** :

**Template et design :**
- Choisissez parmi les templates disponibles
- Personnalisez les **couleurs** (palette principale, secondaire, texte)
- Uploadez votre **logo** et **favicon**

**Contenu :**
- Modifiez le **titre hero** et le **sous-titre** d'accroche
- Configurez les **sections** à afficher (statistiques, témoignages, contact)
- Renseignez vos **horaires d'ouverture** et **réseaux sociaux**

**Publication :**
- Cliquez sur **"Publier"** — votre site est immédiatement accessible sur votre-agence.snipe.dz
- Vos voyages/véhicules s'affichent automatiquement et se mettent à jour en temps réel`,
  },
  {
    num: 5,
    title: 'Importez vos données existantes',
    icon: '📂',
    content: `Accédez à **Importateur IA** (barre latérale gauche) :

**Clients :** Importez votre liste de clients depuis un fichier Excel/CSV. Le système détecte automatiquement les colonnes (nom, téléphone, email).

**Voyages (Agences) :** Ajoutez vos offres de voyage en masse via Excel, ou créez-les manuellement depuis le Catalogue Voyages.

**Véhicules (Showrooms) :** Importez votre inventaire de véhicules (marque, modèle, année, prix, couleur, kilométrage).

**Validation :** L'IA valide et corrige automatiquement les formats de téléphone, emails et données manquantes avant l'import.`,
  },
]

export default function GettingStartedPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
        <Link href="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
        <span>→</span>
        <span className="text-slate-600">Démarrage Rapide</span>
      </div>

      <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
        <span>🚀 Pour Commencer</span>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">Démarrage Rapide</h1>
      <p className="text-slate-500 font-medium mb-12 leading-relaxed">
        Configurez votre espace Snipe.dz en 5 étapes. De la création de compte à la mise en ligne de votre chatbot IA et site web — en moins de 30 minutes.
      </p>

      {/* Steps */}
      <div className="space-y-8">
        {steps.map((step, i) => (
          <div key={step.num} className="relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-slate-200 -mb-8" />
            )}

            <div className="flex gap-5">
              {/* Step indicator */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-blue-200 z-10">
                  {step.num}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{step.icon}</span>
                  <h2 className="text-lg font-bold text-slate-900">{step.title}</h2>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  {step.content.split('\n\n').map((block, j) => {
                    if (block.startsWith('- ')) {
                      const items = block.split('\n').filter(l => l.startsWith('- '))
                      return (
                        <ul key={j} className="space-y-1.5 my-3">
                          {items.map((item, k) => (
                            <li key={k} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                              <span dangerouslySetInnerHTML={{ __html: item.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>') }} />
                            </li>
                          ))}
                        </ul>
                      )
                    }
                    return (
                      <p
                        key={j}
                        className="text-sm text-slate-600 leading-relaxed font-medium mb-3 last:mb-0"
                        dangerouslySetInnerHTML={{
                          __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>')
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Done CTA */}
      <div className="mt-12 p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-bold text-emerald-900 mb-2">Votre espace est prêt !</h3>
        <p className="text-sm text-emerald-700 font-medium mb-5">
          Consultez le guide détaillé de votre activité pour explorer toutes les fonctionnalités.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/docs/travel" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors">
            ✈️ Guide Agence de Voyage
          </Link>
          <Link href="/docs/showroom" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors">
            🚗 Guide Showroom Auto
          </Link>
        </div>
      </div>
    </div>
  )
}
