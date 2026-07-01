import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Trash2, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions - Snipe.dz',
  description: 'How users can request deletion of their Snipe.dz account and data.',
}

export default function DataDeletionPage() {
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
          <h1 className="text-4xl font-extrabold tracking-tight">Data Deletion Instructions</h1>
          <p className="mt-3 text-sm font-medium text-slate-400">For account, Meta, WhatsApp, Facebook, and Instagram related data.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="rounded-lg border border-red-100 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Request deletion by email</h2>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-700">
                Send a deletion request to <a className="font-bold text-red-700 underline" href="mailto:contact@snipe.dz">contact@snipe.dz</a> from the email address linked to your account. Include your company name, account email, phone number, and the data you want deleted.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">What we delete</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
              We delete or anonymize account profile data, agency records, imported customer records, conversations, chatbot history, connected Meta integration tokens, and related operational data unless retention is legally required.
            </p>
          </section>
          <section>
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">Timeline</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
              We acknowledge deletion requests within 7 business days and complete eligible deletion within 30 days after verifying the requester. Some invoices, logs, security records, or accounting data may be retained only as required by law.
            </p>
          </section>
          <section>
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">Meta data</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
              If you connected Facebook, Instagram, or WhatsApp Business, we revoke and remove stored integration tokens during deletion. You can also remove the app from your Meta account settings at any time.
            </p>
          </section>
          <section>
            <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">Questions</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
              For privacy questions or deletion status, contact SARL SNIPE SAAS at contact@snipe.dz.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
