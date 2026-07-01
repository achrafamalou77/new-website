import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chatbot IA WhatsApp — Snipe.dz Documentation',
  description: 'Comment configurer et utiliser le chatbot IA WhatsApp de Snipe.dz : connexion, personnalisation, crédits et FAQ.',
}

export default function ChatbotDocsPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
        <Link href="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
        <span>→</span>
        <span className="text-slate-600">Chatbot IA WhatsApp</span>
      </div>

      <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">🤖 Intelligence Artificielle</div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">Chatbot IA WhatsApp</h1>
      <p className="text-slate-500 font-medium mb-12 leading-relaxed">
        Comment fonctionne le chatbot IA de Snipe.dz, comment le configurer et optimiser ses performances.
      </p>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Qu'est-ce que le Chatbot IA Snipe.dz ?</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-4">
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Le chatbot IA Snipe.dz est un assistant conversationnel alimenté par <strong className="text-slate-800">Google Gemini</strong> et entraîné spécifiquement pour le contexte algérien. Il comprend et répond en <strong className="text-slate-800">Darja algérien</strong>, Français et Arabe classique — y compris les mélanges de langues (code-switching) courants en Algérie.
          </p>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Il se connecte à votre <strong className="text-slate-800">numéro WhatsApp Business</strong> et répond automatiquement aux messages de vos clients 24h/24, 7j/7. Il peut répondre aux questions sur vos voyages/véhicules, capturer des leads, et transférer les conversations complexes à un agent humain.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              { icon: '🧠', title: 'IA Contextuelle', desc: 'Comprend les messages ambigus, les abréviations Darja, et le contexte de la conversation' },
              { icon: '⚡', title: 'Réponse Instantanée', desc: 'Répond en moins de 3 secondes, même à 3h du matin pendant les pics de demandes' },
              { icon: '🔄', title: 'Transfert Humain', desc: 'Détecte quand passer la conversation à un agent humain (question complexe, plainte...)' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-xs font-black text-slate-700 mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connection */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Connexion WhatsApp Business API</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">⚠️ Pré-requis</p>
            <p className="text-sm text-amber-700 font-medium">Vous devez disposer d'un compte <strong>Meta Business Manager</strong> vérifié et d'un numéro de téléphone dédié (non utilisé sur l'application WhatsApp personnelle).</p>
          </div>

          <ol className="space-y-4">
            {[
              { n: 1, title: 'Créez une app Meta', desc: 'Sur business.facebook.com → Créer une application → Type "Business" → Ajoutez le produit "WhatsApp"' },
              { n: 2, title: 'Obtenez votre token', desc: 'Dans votre app Meta, section WhatsApp → Paramètres → générez un Token d\'accès permanent (pas temporaire)' },
              { n: 3, title: 'Configurez le webhook', desc: 'Dans Snipe.dz → Paramètres → Chatbot → copiez votre URL Webhook unique et collez-la dans votre app Meta. Token de vérification : fourni par Snipe.dz' },
              { n: 4, title: 'Entrez le numéro', desc: 'Saisissez votre numéro WhatsApp Business avec indicatif international (ex: +213 555 000 000)' },
              { n: 5, title: 'Testez', desc: 'Envoyez un message WhatsApp à votre numéro → le bot doit répondre en moins de 5 secondes' },
            ].map((step) => (
              <li key={step.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-black shrink-0">{step.n}</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{step.title}</p>
                  <p className="text-sm text-slate-500 font-medium">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Personalization */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Personnalisation du Bot</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-3">
          {[
            ['Nom du bot', 'Choisissez un prénom algérien pour votre bot (ex: "Rania", "Yacine"). Le client verra ce nom dans la conversation.'],
            ['Langue principale', 'Darja algérien (recommandé pour la plupart des agences), Français, Arabe classique, ou Détection automatique.'],
            ['Message d\'accueil', 'Le premier message envoyé à un nouveau contact. Rédigez-le dans la langue de votre clientèle.'],
            ['Ton et style', 'Formel, Semi-formel, ou Décontracté (Darja naturelle). Choisissez selon votre image de marque.'],
            ['Utilisation d\'emojis', 'Activez les emojis pour un ton plus chaleureux, désactivez pour un style plus professionnel.'],
            ['Horaires du bot', 'Définissez quand le bot répond seul vs quand il doit transférer à un humain.'],
          ].map(([label, desc]) => (
            <div key={label} className="flex gap-4 py-2 border-b border-slate-100 last:border-0">
              <div className="w-40 shrink-0">
                <p className="text-xs font-bold text-slate-700">{label}</p>
              </div>
              <p className="text-sm text-slate-500 font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Credits */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Crédits IA</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-7">
          <p className="text-sm text-slate-600 font-medium mb-6">Chaque réponse générée par l'IA consomme des <strong className="text-slate-800">crédits IA</strong>. Le nombre de crédits dépend de la longueur et complexité de la réponse (en moyenne 1 crédit = 1 message court).</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { plan: 'Starter', credits: '—', note: 'Chatbot non inclus' },
              { plan: 'Plus', credits: '—', note: 'Chatbot non inclus' },
              { plan: 'Pro Voyage', credits: '7 000', note: 'par mois' },
              { plan: 'Max Voyage', credits: '15 000', note: 'par mois' },
            ].map((p) => (
              <div key={p.plan} className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{p.plan}</p>
                <p className="text-2xl font-black text-slate-900">{p.credits}</p>
                <p className="text-xs text-slate-500 font-semibold">{p.note}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 font-medium mt-4">Les crédits non utilisés ne sont pas reportés sur le mois suivant. Des crédits supplémentaires peuvent être achetés depuis Paramètres → Abonnement.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">FAQ Chatbot</h2>
        <div className="space-y-4">
          {[
            ['Puis-je utiliser mon numéro WhatsApp personnel ?', 'Non. Le chatbot nécessite un numéro WhatsApp Business API dédié. Un numéro personnel utilisant l\'application WhatsApp ne peut pas être connecté à l\'API. Vous pouvez créer un nouveau numéro dédié via Meta Business.'],
            ['Le bot peut-il envoyer des images et des documents ?', 'Oui. Le bot peut envoyer des images de voyages/véhicules, des PDF de devis, et des documents. Ces envois consomment des crédits supplémentaires.'],
            ['Que se passe-t-il si mes crédits IA sont épuisés ?', 'Le bot continue de répondre avec des réponses génériques prédéfinies (non IA) jusqu\'au renouvellement mensuel. Vous pouvez acheter des crédits supplémentaires à tout moment.'],
            ['Puis-je voir toutes les conversations du bot ?', 'Oui. Toutes les conversations gérées par le bot apparaissent dans la Messagerie (Inbox) avec le tag "IA". Vous pouvez intervenir manuellement dans n\'importe quelle conversation à tout moment.'],
            ['Le bot peut-il prendre des réservations directement ?', 'Le bot peut qualifier le lead et collecter les informations (nom, voyage souhaité, dates, nombre de personnes). La confirmation finale et le paiement sont gérés par un agent humain ou via un lien de réservation.'],
          ].map(([q, a]) => (
            <div key={q as string} className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-2">❓ {q}</p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 flex gap-4">
        <Link href="/docs/billing" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:bg-blue-50 transition-all group">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Suivant</p>
          <p className="font-bold text-slate-800 group-hover:text-blue-700">💳 Abonnements & Facturation →</p>
        </Link>
      </div>
    </div>
  )
}
