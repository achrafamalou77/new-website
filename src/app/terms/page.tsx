import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service - Snipe.dz',
  description: 'Terms that govern the use of the Snipe.dz SaaS platform.',
}

const sections = [
  {
    title: '1. Service',
    body: 'Snipe.dz provides CRM, booking, website, ecommerce, vehicle showroom, and AI messaging tools for Algerian businesses. Each customer account is responsible for the business data, offers, conversations, and public content it publishes through the platform.',
  },
  {
    title: '2. Account Approval',
    body: 'New agency accounts are subject to platform owner review before activation. Snipe.dz may approve, suspend, reactivate, or terminate access when required for security, compliance, abuse prevention, or platform integrity.',
  },
  {
    title: '3. Acceptable Use',
    body: 'Users must not use the platform for fraud, spam, illegal products or services, misleading advertising, unauthorized scraping, harassment, malware, or any activity that violates applicable law, Meta policies, or third-party platform rules.',
  },
  {
    title: '4. Customer Data',
    body: 'Agency customers remain responsible for the accuracy and legality of the personal data they upload or collect. Snipe.dz processes that data only to provide the service, secure the platform, support users, and comply with legal obligations.',
  },
  {
    title: '5. AI and Messaging',
    body: 'AI replies are generated from the agency data and settings available to the system. Agencies must review their chatbot configuration, inventory, pricing, and policies. AI must not be used to confirm payments, legal status, visa decisions, or unavailable products unless verified by a human operator.',
  },
  {
    title: '6. Integrations',
    body: 'Meta, WhatsApp, Facebook, Instagram, Supabase, OpenAI, Google Gemini, Vercel, and payment providers are third-party services governed by their own terms. Access can be interrupted if a third-party token, policy approval, or business verification is missing.',
  },
  {
    title: '7. Payments',
    body: 'Payment functionality may be enabled separately. Subscription fees, invoices, refunds, and taxes are handled under the commercial agreement or invoice issued to the customer.',
  },
  {
    title: '8. Security',
    body: 'Users must keep credentials confidential, use only authorized accounts, and report suspected compromise immediately. Snipe.dz may temporarily restrict access to protect the platform or other users.',
  },
  {
    title: '9. Changes',
    body: 'We may update these terms to reflect product, legal, or operational changes. Continued use of the platform after an update means acceptance of the updated terms.',
  },
  {
    title: '10. Contact',
    body: 'For legal, support, or account questions, contact SARL SNIPE SAAS at contact@snipe.dz.',
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="text-xl font-black">Snipe<span className="text-blue-400">.dz</span></span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-sm font-medium text-slate-400">Last updated: July 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="mb-10 rounded-lg border border-blue-100 bg-blue-50 p-5 text-sm font-medium leading-relaxed text-slate-700">
          These terms are designed for demo and launch readiness. A final commercial contract or local legal review can add customer-specific clauses before paid rollout.
        </div>
        <div className="space-y-9">
          {sections.map(section => (
            <section key={section.title}>
              <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">{section.title}</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-14 rounded-lg bg-slate-950 p-7 text-center text-white">
          <h2 className="text-lg font-bold">Need help with these terms?</h2>
          <a href="mailto:contact@snipe.dz" className="mt-4 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500">
            Contact contact@snipe.dz
          </a>
        </div>
      </section>
    </main>
  )
}
