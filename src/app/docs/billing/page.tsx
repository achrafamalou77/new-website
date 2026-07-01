import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Abonnements & Facturation — Snipe.dz Documentation',
  description: 'Comment fonctionne la facturation Snipe.dz : plans disponibles, paiement CIB/Edahabia via Chargily, upgrade et résiliation.',
}

export default function BillingDocsPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
        <Link href="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
        <span>→</span>
        <span className="text-slate-600">Abonnements & Facturation</span>
      </div>

      <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest mb-4">💳 Facturation</div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">Abonnements & Facturation</h1>
      <p className="text-slate-500 font-medium mb-12 leading-relaxed">
        Tout ce que vous devez savoir sur les plans, les paiements en DZD, et la gestion de votre abonnement.
      </p>

      {/* Plans */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Plans Disponibles</h2>

        <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm font-semibold text-blue-800">Les plans sont différents selon votre activité. Les tarifs ci-dessous sont pour les <strong>Agences de Voyage</strong>. Les showrooms auto ont des plans spécifiques légèrement différents.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              name: 'Starter', price: '0 DZD', period: 'À vie',
              features: ['1 compte utilisateur', 'Tableau de bord de base', 'Répertoire clients (50 max)', 'Factures DZD', 'Sous-domaine snipe.dz'],
              note: 'Aucune carte bancaire requise'
            },
            {
              name: 'Plus', price: '7 000 DZD', period: '/mois',
              features: ['5 comptes utilisateurs', 'Tout le plan Starter', 'Suivi des visas', 'Constructeur de site web', 'Sous-domaine personnalisé'],
              note: ''
            },
            {
              name: 'Pro', price: '20 000 DZD', period: '/mois',
              features: ['10 comptes utilisateurs', 'Tout le plan Plus', 'Chatbot IA WhatsApp', '7 000 crédits IA / mois', 'Support prioritaire'],
              note: 'Le plus populaire 🔥',
              highlight: true,
            },
            {
              name: 'Max', price: '32 000 DZD', period: '/mois',
              features: ['Utilisateurs illimités', 'Tout le plan Pro', 'CRM analytique avancé', '15 000 crédits IA / mois', 'Account Manager dédié'],
              note: ''
            },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-6 ${plan.highlight ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-black text-sm uppercase tracking-widest ${plan.highlight ? 'text-blue-400' : 'text-slate-400'}`}>{plan.name}</h3>
                {plan.note && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{plan.note}</span>}
              </div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className={`text-2xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                <span className={`text-xs font-bold ${plan.highlight ? 'text-slate-400' : 'text-slate-400'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className={`text-xs font-medium flex items-start gap-2 ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="text-emerald-500 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Payment */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Comment Payer</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-5">
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Snipe.dz utilise <strong className="text-slate-800">Chargily Pay</strong> pour le traitement des paiements. Chargily est la passerelle de paiement algérienne de référence, acceptant les cartes bancaires nationales.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="font-black text-sm text-blue-800 mb-2">💳 CIB (Carte Interbancaire)</p>
              <p className="text-xs text-blue-700 font-medium">Toutes les cartes CIB émises par les banques algériennes (BNA, BEA, BADR, CPA, BDL, AGB, CNEP, SGA, Al Baraka...)</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="font-black text-sm text-amber-800 mb-2">📱 Edahabia (Algérie Poste)</p>
              <p className="text-xs text-amber-700 font-medium">La carte de paiement électronique d'Algérie Poste, disponible dans tous les bureaux de poste.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Étapes de paiement</p>
            <ol className="space-y-2">
              {[
                'Dans Paramètres → Abonnement, cliquez sur "Mettre à niveau"',
                'Choisissez votre plan et cliquez sur "S\'abonner"',
                'Vous êtes redirigé vers la page de paiement sécurisée Chargily',
                'Saisissez les informations de votre carte CIB ou Edahabia',
                'Confirmez par le code OTP reçu sur votre téléphone',
                'L\'abonnement est activé immédiatement après validation',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shrink-0">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            🔒 Vos données de carte ne sont jamais stockées sur les serveurs de Snipe.dz. Le paiement est entièrement géré par Chargily (certifié PCI DSS).
          </p>
        </div>
      </section>

      {/* Manage subscription */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Gérer votre Abonnement</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-5">
          <div>
            <h3 className="text-sm font-black text-slate-700 mb-2">🔼 Upgrade (passage à un plan supérieur)</h3>
            <p className="text-sm text-slate-500 font-medium">Depuis Paramètres → Abonnement → "Mettre à niveau". Le nouveau plan est activé immédiatement. Vous ne payez que la différence proratisée pour le reste du mois en cours.</p>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-black text-slate-700 mb-2">🔽 Downgrade (passage à un plan inférieur)</h3>
            <p className="text-sm text-slate-500 font-medium">Le downgrade prend effet à la fin de la période de facturation en cours. Vos données restent intactes. Si votre usage dépasse les limites du nouveau plan, certaines fonctionnalités seront désactivées.</p>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-black text-slate-700 mb-2">❌ Résiliation</h3>
            <p className="text-sm text-slate-500 font-medium">Depuis Paramètres → Abonnement → "Résilier l'abonnement". L'abonnement reste actif jusqu'à la fin de la période payée. Aucun remboursement proratisé n'est effectué. Après résiliation, vous passez automatiquement au plan Starter.</p>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-black text-slate-700 mb-2">💾 Suppression du compte</h3>
            <p className="text-sm text-slate-500 font-medium">La suppression définitive du compte efface toutes vos données (clients, voyages, véhicules, conversations). Cette action est irréversible. Contactez contact@snipe.dz pour initier la suppression.</p>
          </div>
        </div>
      </section>

      {/* Policy */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">Politique de Remboursement</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            <strong>Snipe.dz n'effectue pas de remboursements</strong> sur les abonnements déjà activés, sauf en cas de défaillance technique avérée de notre infrastructure empêchant l'utilisation du service pendant plus de 72h consécutives. En cas de litige, contactez contact@snipe.dz dans les 7 jours suivant la facturation.
          </p>
        </div>
      </section>

      <div className="mt-10">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
          ← Retour au Centre d'aide
        </Link>
      </div>
    </div>
  )
}
