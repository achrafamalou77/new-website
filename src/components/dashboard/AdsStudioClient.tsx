'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AlertCircle, Brain, CheckCircle2, ExternalLink, Loader2, Megaphone,
  Save, Send, Sparkles, Star, Trash2,
} from 'lucide-react'
import {
  deleteAdCampaign, generateAdCampaign, publishAdCampaignPaused,
  saveAdsConnectionSettings, saveAdsLearningProfile, submitAdFeedback, updateAdCampaign,
} from '@/app/actions/ads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type StudioData = {
  businessType: 'travel_agency' | 'car_showroom' | 'ecommerce'
  vertical: any
  catalog: any[]
  campaigns: any[]
  integration: any
  agency: any
  learningProfile: any
}

const objectives: Record<string, string> = {
  OUTCOME_LEADS: 'Get qualified leads',
  OUTCOME_TRAFFIC: 'Send website traffic',
  OUTCOME_SALES: 'Drive sales',
  OUTCOME_ENGAGEMENT: 'Build engagement',
}

function editorFromCampaign(campaign: any) {
  return {
    id: campaign.id,
    name: campaign.name || '',
    objective: campaign.objective || 'OUTCOME_LEADS',
    primaryText: campaign.creative?.primary_text || '',
    headline: campaign.creative?.headline || '',
    description: campaign.creative?.description || '',
    imageUrl: campaign.creative?.image_url || null,
    destinationUrl: campaign.destination_url || '',
    callToAction: campaign.call_to_action || 'LEARN_MORE',
    dailyBudget: campaign.budget?.daily_budget_dzd || 2000,
    durationDays: campaign.budget?.duration_days || 7,
    ageMin: campaign.targeting?.age_min || 21,
    ageMax: campaign.targeting?.age_max || 55,
    country: campaign.targeting?.country || 'DZ',
    audienceSummary: campaign.targeting?.audience_summary || '',
    interestsText: Array.isArray(campaign.targeting?.interests) ? campaign.targeting.interests.join(', ') : '',
    excludedAudiencesText: Array.isArray(campaign.targeting?.excluded_audiences) ? campaign.targeting.excluded_audiences.join(', ') : '',
    languages: campaign.targeting?.languages || ['fr'],
    placements: campaign.targeting?.placements || ['facebook_feed', 'instagram_feed', 'instagram_stories'],
    bidStrategy: campaign.budget?.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
    costCap: campaign.budget?.cost_cap_dzd || 0,
    startDate: campaign.budget?.start_date || '',
    primaryTextVariants: campaign.creative?.primary_text_variants || [],
    headlineVariants: campaign.creative?.headline_variants || [],
  }
}

export default function AdsStudioClient({ initialData }: { initialData: StudioData }) {
  const [campaigns, setCampaigns] = useState(initialData.campaigns)
  const [selectedId, setSelectedId] = useState(initialData.campaigns[0]?.id || null)
  const selected = campaigns.find((campaign) => campaign.id === selectedId) || null
  const [editor, setEditor] = useState(selected ? editorFromCampaign(selected) : null)
  const [catalogItemKey, setCatalogItemKey] = useState(initialData.catalog[0]?.key || '')
  const [objective, setObjective] = useState(initialData.vertical.defaultObjective)
  const [offer, setOffer] = useState('')
  const [audienceNotes, setAudienceNotes] = useState('')
  const [tone, setTone] = useState('professional')
  const [generationLanguages, setGenerationLanguages] = useState<string[]>(initialData.learningProfile?.preferred_languages || ['fr', 'ar'])
  const [variantCount, setVariantCount] = useState(3)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const integration = initialData.integration
  const accounts = Array.isArray(integration?.meta_ad_accounts) ? integration.meta_ad_accounts : []
  const pixels = Array.isArray(integration?.meta_pixels) ? integration.meta_pixels : []
  const [accountId, setAccountId] = useState(integration?.selected_ad_account_id || accounts[0]?.id || '')
  const [pixelId, setPixelId] = useState(integration?.selected_pixel_id || '')
  const [learning, setLearning] = useState({
    brandVoice: initialData.learningProfile?.brand_voice || 'clear, trustworthy and locally relevant',
    preferredLanguages: initialData.learningProfile?.preferred_languages || ['fr', 'ar'],
    requiredPhrasesText: (initialData.learningProfile?.required_phrases || []).join(', '),
    forbiddenPhrasesText: (initialData.learningProfile?.forbidden_phrases || []).join(', '),
  })
  const [feedback, setFeedback] = useState({ rating: 5, notes: '', spend: 0, impressions: 0, clicks: 0, leads: 0, sales: 0 })

  const estimatedSpend = useMemo(() => {
    if (!editor) return 0
    return Number(editor.dailyBudget || 0) * Number(editor.durationDays || 0)
  }, [editor])

  const selectCampaign = (campaign: any) => {
    setSelectedId(campaign.id)
    setEditor(editorFromCampaign(campaign))
    setMessage(null)
  }

  const replaceCampaign = (campaign: any) => {
    setCampaigns((current) => current.map((item) => item.id === campaign.id ? campaign : item))
    setSelectedId(campaign.id)
    setEditor(editorFromCampaign(campaign))
  }

  const run = (work: () => Promise<any>, successText: string, onSuccess?: (data: any) => void) => {
    setMessage(null)
    startTransition(async () => {
      const result = await work()
      if (!result.success) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      onSuccess?.(result.data)
      setMessage({ type: 'success', text: successText })
    })
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#f6f7fb] p-4 [scrollbar-gutter:stable] md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Business-aware AI
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">AI Ads Studio</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                Generate campaigns from your real {initialData.vertical.itemLabel} catalog, edit every detail,
                then send a paused draft to Meta for final review.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3">
                <div className="text-2xl font-black">{campaigns.length}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Campaigns</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3">
                <div className="text-2xl font-black">{initialData.catalog.length}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Ad-ready items</div>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Megaphone className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-black text-slate-900">Meta connection</h2>
                  <p className="text-xs text-slate-500">{integration?.facebook_page_name || 'Not connected for ads'}</p>
                </div>
              </div>
              {integration?.ads_connected && accounts.length ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-600">Ad account</label>
                  <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {accounts.map((account: any) => <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>)}
                  </select>
                  {pixels.length > 0 && (
                    <>
                      <label className="block text-xs font-bold text-slate-600">Pixel (optional)</label>
                      <select value={pixelId} onChange={(event) => setPixelId(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                        <option value="">No pixel</option>
                        {pixels.map((pixel: any) => <option key={pixel.id} value={pixel.id}>{pixel.name}</option>)}
                      </select>
                    </>
                  )}
                  <Button variant="outline" className="w-full rounded-xl" disabled={isPending} onClick={() => run(
                    () => saveAdsConnectionSettings({ adAccountId: accountId, pixelId }),
                    'Meta ad account saved.'
                  )}><Save className="mr-2 h-4 w-4" /> Save account</Button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Ads permission is required</p>
                  <p className="mt-1 text-xs leading-5">Reconnect Facebook to authorize your Page and ad accounts. Meta may require App Review for live customers.</p>
                  <Link href="/api/meta/connect/facebook" className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-[#1877F2] px-4 text-sm font-semibold text-white hover:bg-[#166fe5]">
                    <Megaphone className="mr-2 h-4 w-4" /> Connect Meta for ads
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-900">Generate campaign</h2>
                <Sparkles className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-600">Choose {initialData.vertical.itemLabel}</label>
                <select value={catalogItemKey} onChange={(event) => setCatalogItemKey(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  {initialData.catalog.map((item) => <option key={item.key} value={item.key}>{item.title} · {item.subtitle}</option>)}
                </select>
                <label className="block text-xs font-bold text-slate-600">Goal</label>
                <select value={objective} onChange={(event) => setObjective(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  {initialData.vertical.objectives.map((value: string) => <option key={value} value={value}>{objectives[value]}</option>)}
                </select>
                <Textarea value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Offer or campaign angle (optional)" className="min-h-20 rounded-xl" />
                <Textarea value={audienceNotes} onChange={(event) => setAudienceNotes(event.target.value)} placeholder="Who should this reach?" className="min-h-20 rounded-xl" />
                <Button className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700" disabled={isPending || !catalogItemKey} onClick={() => run(
                  () => generateAdCampaign({ catalogItemKey, objective, offer, audienceNotes, tone, languages: generationLanguages, variantCount }),
                  'AI campaign generated. Review every field before publishing.',
                  (campaign) => {
                    setCampaigns((current) => [campaign, ...current])
                    selectCampaign(campaign)
                  }
                )}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate with AI
                </Button>
                {!initialData.catalog.length && <p className="text-xs text-amber-700">Add an active catalog item before generating ads.</p>}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tone">
                    <select value={tone} onChange={(event) => setTone(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                      {['professional', 'premium', 'friendly', 'urgent', 'educational'].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </Field>
                  <Field label="AI variants">
                    <select value={variantCount} onChange={(event) => setVariantCount(Number(event.target.value))} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                      {[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </Field>
                </div>
                <ChoiceGroup label="Languages" values={['fr', 'ar', 'en']} selected={generationLanguages} onChange={setGenerationLanguages} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2"><Brain className="h-5 w-5 text-violet-600" /><h2 className="font-black text-slate-900">AI learning</h2></div>
              <p className="mt-2 text-xs leading-5 text-slate-500">The AI uses your approved edits and results for future campaigns. This memory belongs only to this business.</p>
              <div className="mt-4 space-y-3">
                <Field label="Brand voice"><Textarea value={learning.brandVoice} onChange={(e) => setLearning({ ...learning, brandVoice: e.target.value })} className="min-h-20 rounded-xl" /></Field>
                <ChoiceGroup label="Default languages" values={['fr', 'ar', 'en']} selected={learning.preferredLanguages} onChange={(values) => setLearning({ ...learning, preferredLanguages: values })} />
                <Field label="Always include (comma separated)"><Input value={learning.requiredPhrasesText} onChange={(e) => setLearning({ ...learning, requiredPhrasesText: e.target.value })} className="rounded-xl" /></Field>
                <Field label="Never say / forbidden claims"><Input value={learning.forbiddenPhrasesText} onChange={(e) => setLearning({ ...learning, forbiddenPhrasesText: e.target.value })} className="rounded-xl" /></Field>
                <Button variant="outline" className="w-full rounded-xl" disabled={isPending} onClick={() => run(
                  () => saveAdsLearningProfile({
                    brandVoice: learning.brandVoice,
                    preferredLanguages: learning.preferredLanguages,
                    requiredPhrases: splitList(learning.requiredPhrasesText),
                    forbiddenPhrases: splitList(learning.forbiddenPhrasesText),
                  }),
                  'AI learning profile saved.'
                )}><Brain className="mr-2 h-4 w-4" /> Save AI rules</Button>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <Stat value={initialData.learningProfile?.generation_count || 0} label="Generations" />
                  <Stat value={initialData.learningProfile?.feedback_count || 0} label="Lessons" />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="font-black text-slate-900">Campaigns</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{campaigns.length}</span>
              </div>
              <div className="max-h-[460px] space-y-2 overflow-y-auto">
                {campaigns.map((campaign) => (
                  <button key={campaign.id} onClick={() => selectCampaign(campaign)} className={`w-full rounded-2xl border p-3 text-left transition ${
                    selectedId === campaign.id ? 'border-indigo-300 bg-indigo-50' : 'border-transparent bg-slate-50 hover:border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{campaign.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{campaign.catalog_item_title}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                        campaign.status === 'paused' ? 'bg-blue-100 text-blue-700' :
                        campaign.status === 'error' ? 'bg-red-100 text-red-700' :
                        campaign.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>{campaign.status}</span>
                    </div>
                  </button>
                ))}
                {!campaigns.length && <p className="p-5 text-center text-sm text-slate-500">Your generated campaigns will appear here.</p>}
              </div>
            </section>
          </aside>

          <main className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            {!editor || !selected ? (
              <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
                <div className="rounded-3xl bg-indigo-50 p-5 text-indigo-600"><Megaphone className="h-10 w-10" /></div>
                <h2 className="mt-5 text-xl font-black text-slate-900">Create your first controlled campaign</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Select a real catalog item and let AI prepare the strategy, copy, audience and budget. Nothing goes live automatically.</p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{selected.status}</span>
                      <span className="text-xs text-slate-400">{objectives[editor.objective]}</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">Campaign control room</h2>
                  </div>
                  {selected.meta_campaign_id && (
                    <a className="inline-flex items-center gap-2 text-sm font-bold text-blue-600" href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${accountId.replace('act_', '')}`} target="_blank" rel="noreferrer">
                      Open Ads Manager <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <Tabs defaultValue="creative" className="mt-6">
                  <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-slate-100 p-1">
                    <TabsTrigger value="creative" className="px-3 py-2">Creative</TabsTrigger>
                    <TabsTrigger value="audience" className="px-3 py-2">Audience</TabsTrigger>
                    <TabsTrigger value="delivery" className="px-3 py-2">Delivery</TabsTrigger>
                    <TabsTrigger value="learning" className="px-3 py-2">Results & learning</TabsTrigger>
                  </TabsList>
                  <TabsContent value="creative" className="mt-5 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Creative</h3>
                    <Field label="Campaign name"><Input value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} className="rounded-xl" /></Field>
                    <Field label="Primary text"><Textarea value={editor.primaryText} onChange={(e) => setEditor({ ...editor, primaryText: e.target.value })} className="min-h-36 rounded-xl" /></Field>
                    <Field label="Headline"><Input value={editor.headline} onChange={(e) => setEditor({ ...editor, headline: e.target.value })} className="rounded-xl" /></Field>
                    <Field label="Description"><Textarea value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })} className="rounded-xl" /></Field>
                    <Field label="Destination URL"><Input value={editor.destinationUrl} onChange={(e) => setEditor({ ...editor, destinationUrl: e.target.value })} className="rounded-xl" /></Field>
                    <Field label="Call to action">
                      <select value={editor.callToAction} onChange={(e) => setEditor({ ...editor, callToAction: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                        {['LEARN_MORE', 'CONTACT_US', 'SHOP_NOW', 'BOOK_TRAVEL', 'GET_OFFER'].map((cta) => <option key={cta} value={cta}>{cta.replaceAll('_', ' ')}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">AI copy alternatives</h3>
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 p-3">
                        <Field label={`Primary text variant ${index + 1}`}><Textarea value={editor.primaryTextVariants[index] || ''} onChange={(e) => {
                          const values = [...editor.primaryTextVariants]; values[index] = e.target.value
                          setEditor({ ...editor, primaryTextVariants: values })
                        }} className="min-h-20 rounded-xl" /></Field>
                        <div className="mt-2"><Field label={`Headline variant ${index + 1}`}><Input value={editor.headlineVariants[index] || ''} onChange={(e) => {
                          const values = [...editor.headlineVariants]; values[index] = e.target.value
                          setEditor({ ...editor, headlineVariants: values })
                        }} className="rounded-xl" /></Field></div>
                      </div>
                    ))}
                  </div>
                  </TabsContent>
                  <TabsContent value="audience" className="mt-5 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Audience</h3>
                    <Field label="Objective">
                      <select value={editor.objective} onChange={(e) => setEditor({ ...editor, objective: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                        {initialData.vertical.objectives.map((value: string) => <option key={value} value={value}>{objectives[value]}</option>)}
                      </select>
                    </Field>
                    <Field label="Audience summary"><Textarea value={editor.audienceSummary} onChange={(e) => setEditor({ ...editor, audienceSummary: e.target.value })} className="min-h-24 rounded-xl" /></Field>
                    <Field label="Interest ideas (comma separated)"><Input value={editor.interestsText} onChange={(e) => setEditor({ ...editor, interestsText: e.target.value })} className="rounded-xl" /></Field>
                    <Field label="Exclude audiences"><Input value={editor.excludedAudiencesText} onChange={(e) => setEditor({ ...editor, excludedAudiencesText: e.target.value })} placeholder="Existing customers, employees..." className="rounded-xl" /></Field>
                    <ChoiceGroup label="Ad languages" values={['fr', 'ar', 'en']} selected={editor.languages} onChange={(values) => setEditor({ ...editor, languages: values })} />
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Country"><Input maxLength={2} value={editor.country} onChange={(e) => setEditor({ ...editor, country: e.target.value.toUpperCase() })} className="rounded-xl" /></Field>
                      <Field label="Min age"><Input type="number" value={editor.ageMin} onChange={(e) => setEditor({ ...editor, ageMin: e.target.value })} className="rounded-xl" /></Field>
                      <Field label="Max age"><Input type="number" value={editor.ageMax} onChange={(e) => setEditor({ ...editor, ageMax: e.target.value })} className="rounded-xl" /></Field>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Placements</h3>
                    <ChoiceGroup label="Meta placements" values={['facebook_feed', 'facebook_marketplace', 'facebook_reels', 'instagram_feed', 'instagram_stories', 'instagram_reels']} selected={editor.placements} onChange={(values) => setEditor({ ...editor, placements: values })} />
                    <p className="rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-800">Interest names are strategy guidance. Meta requires verified interest IDs, so this first release publishes safe demographic and placement targeting while preserving your interest plan for Ads Manager review.</p>
                  </div>
                  </TabsContent>
                  <TabsContent value="delivery" className="mt-5 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Budget and schedule</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Daily budget (DZD)"><Input type="number" value={editor.dailyBudget} onChange={(e) => setEditor({ ...editor, dailyBudget: e.target.value })} className="rounded-xl" /></Field>
                      <Field label="Duration (days)"><Input type="number" value={editor.durationDays} onChange={(e) => setEditor({ ...editor, durationDays: e.target.value })} className="rounded-xl" /></Field>
                    </div>
                    <Field label="Start date and time"><Input type="datetime-local" value={editor.startDate} onChange={(e) => setEditor({ ...editor, startDate: e.target.value })} className="rounded-xl" /></Field>
                    <Field label="Bid strategy">
                      <select value={editor.bidStrategy} onChange={(e) => setEditor({ ...editor, bidStrategy: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                        <option value="LOWEST_COST_WITHOUT_CAP">Lowest cost</option><option value="COST_CAP">Cost cap</option>
                      </select>
                    </Field>
                    {editor.bidStrategy === 'COST_CAP' && <Field label="Cost cap (DZD)"><Input type="number" value={editor.costCap} onChange={(e) => setEditor({ ...editor, costCap: e.target.value })} className="rounded-xl" /></Field>}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Spend guardrail</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Stat value={`${Number(editor.dailyBudget || 0).toLocaleString()} DZD`} label="Daily maximum" />
                      <Stat value={`${estimatedSpend.toLocaleString()} DZD`} label="Planned maximum" />
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-900">Maximum planned spend</span>
                        <span className="text-lg font-black text-indigo-700">{estimatedSpend.toLocaleString()} DZD</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-indigo-700">This is a plan estimate. Meta billing and delivery remain controlled in Ads Manager.</p>
                    </div>
                    {selected.meta_error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{selected.meta_error}</div>}
                  </div>
                  </TabsContent>
                  <TabsContent value="learning" className="mt-5">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Rate this campaign</h3>
                        <div className="flex gap-2">{[1,2,3,4,5].map((rating) => <button key={rating} onClick={() => setFeedback({ ...feedback, rating })} className="p-1"><Star className={`h-7 w-7 ${rating <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}</div>
                        <Field label="What should the AI learn?"><Textarea value={feedback.notes} onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })} placeholder="Strong hook, too formal, avoid this angle..." className="min-h-28 rounded-xl" /></Field>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Optional real results</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {(['spend','impressions','clicks','leads','sales'] as const).map((key) => <Field key={key} label={key}><Input type="number" value={feedback[key]} onChange={(e) => setFeedback({ ...feedback, [key]: Number(e.target.value) })} className="rounded-xl" /></Field>)}
                        </div>
                        <Button className="w-full rounded-xl bg-violet-600 hover:bg-violet-700" disabled={isPending} onClick={() => run(
                          () => submitAdFeedback({ campaignId: selected.id, rating: feedback.rating, notes: feedback.notes, metrics: { spend: feedback.spend, impressions: feedback.impressions, clicks: feedback.clicks, leads: feedback.leads, sales: feedback.sales } }),
                          'Feedback saved. Future campaigns will use this lesson.'
                        )}><Brain className="mr-2 h-4 w-4" /> Teach the AI</Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
                  <Button variant="outline" className="rounded-xl text-red-600 hover:bg-red-50" disabled={isPending || selected.status === 'paused'} onClick={() => run(
                    () => deleteAdCampaign(selected.id),
                    'Campaign deleted.',
                    () => {
                      const remaining = campaigns.filter((campaign) => campaign.id !== selected.id)
                      setCampaigns(remaining)
                      setSelectedId(remaining[0]?.id || null)
                      setEditor(remaining[0] ? editorFromCampaign(remaining[0]) : null)
                    }
                  )}><Trash2 className="mr-2 h-4 w-4" /> Delete draft</Button>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="rounded-xl" disabled={isPending || selected.status === 'paused'} onClick={() => run(
                      () => updateAdCampaign({
                        ...editor,
                        interests: splitList(editor.interestsText),
                        excludedAudiences: splitList(editor.excludedAudiencesText),
                      }),
                      'Campaign saved and ready for review.',
                      replaceCampaign
                    )}><Save className="mr-2 h-4 w-4" /> Save changes</Button>
                    <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isPending || selected.status === 'paused' || !integration?.ads_connected} onClick={() => run(
                      async () => {
                        const saved = await updateAdCampaign({
                          ...editor,
                          interests: splitList(editor.interestsText),
                          excludedAudiences: splitList(editor.excludedAudiencesText),
                        })
                        if (!saved.success) return saved
                        return publishAdCampaignPaused(selected.id)
                      },
                      'Campaign created in Meta as PAUSED. Review it in Ads Manager before activation.',
                      replaceCampaign
                    )}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publish paused to Meta</Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">{label}</span>{children}</label>
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function ChoiceGroup({ label, values, selected, onChange }: { label: string; values: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  return <div><p className="mb-2 text-xs font-bold text-slate-600">{label}</p><div className="flex flex-wrap gap-2">{values.map((value) => {
    const checked = selected.includes(value)
    return <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${checked ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-600'}`}>
      <Checkbox checked={checked} onCheckedChange={() => onChange(checked ? selected.filter((item) => item !== value) : [...selected, value])} />
      {value.replaceAll('_', ' ')}
    </label>
  })}</div></div>
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><div className="text-lg font-black text-slate-900">{value}</div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div></div>
}
