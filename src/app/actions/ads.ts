'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOpenAIClient, AGENT_MODEL } from '@/lib/openai/client'
import { getCurrentAgencyContext, type BusinessTypeSlug } from '@/lib/server/agency-context'
import {
  ADS_VERTICALS,
  META_PAUSED_STATUS,
  buildMetaTargeting,
  firstImage,
  metaOptimizationGoal,
  validateFirstMetaTestPublish,
  type MetaObjective,
} from '@/lib/meta-ads'

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v25.0'}`
const admin = () => createAdminClient() as any

const generationSchema = z.object({
  catalogItemKey: z.string().min(1),
  objective: z.enum(['OUTCOME_TRAFFIC', 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_ENGAGEMENT']),
  offer: z.string().max(800).default(''),
  audienceNotes: z.string().max(800).default(''),
  tone: z.enum(['professional', 'premium', 'friendly', 'urgent', 'educational']).default('professional'),
  languages: z.array(z.enum(['fr', 'ar', 'en'])).min(1).max(3).default(['fr']),
  variantCount: z.coerce.number().int().min(1).max(3).default(3),
})

const editSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(120),
  objective: z.enum(['OUTCOME_TRAFFIC', 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_ENGAGEMENT']),
  primaryText: z.string().min(10).max(2200),
  headline: z.string().min(3).max(255),
  description: z.string().max(500),
  imageUrl: z.string().url().nullable().optional(),
  destinationUrl: z.string().url(),
  callToAction: z.enum(['LEARN_MORE', 'CONTACT_US', 'SHOP_NOW', 'BOOK_TRAVEL', 'GET_OFFER']),
  dailyBudget: z.coerce.number().min(500).max(100000),
  durationDays: z.coerce.number().int().min(1).max(90),
  ageMin: z.coerce.number().int().min(18).max(65),
  ageMax: z.coerce.number().int().min(18).max(65),
  country: z.string().length(2).default('DZ'),
  audienceSummary: z.string().max(800),
  interests: z.array(z.string().max(80)).max(20),
  excludedAudiences: z.array(z.string().max(120)).max(20).default([]),
  languages: z.array(z.enum(['fr', 'ar', 'en'])).min(1).max(3),
  placements: z.array(z.enum(['facebook_feed', 'facebook_marketplace', 'facebook_reels', 'instagram_feed', 'instagram_stories', 'instagram_reels'])).min(1),
  bidStrategy: z.enum(['LOWEST_COST_WITHOUT_CAP', 'COST_CAP']),
  costCap: z.coerce.number().min(0).max(100000).default(0),
  startDate: z.string().max(40).default(''),
  primaryTextVariants: z.array(z.string().max(2200)).max(3).default([]),
  headlineVariants: z.array(z.string().max(255)).max(3).default([]),
})

const profileSchema = z.object({
  brandVoice: z.string().min(3).max(1000),
  preferredLanguages: z.array(z.enum(['fr', 'ar', 'en'])).min(1).max(3),
  requiredPhrases: z.array(z.string().max(150)).max(20),
  forbiddenPhrases: z.array(z.string().max(150)).max(20),
})

const feedbackSchema = z.object({
  campaignId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  notes: z.string().max(1200).default(''),
  metrics: z.object({
    spend: z.coerce.number().min(0).max(100000000).default(0),
    impressions: z.coerce.number().int().min(0).max(1000000000).default(0),
    clicks: z.coerce.number().int().min(0).max(1000000000).default(0),
    leads: z.coerce.number().int().min(0).max(1000000000).default(0),
    sales: z.coerce.number().int().min(0).max(1000000000).default(0),
  }),
})

async function requireManager() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) throw new Error('Unauthorized')
  if (context.role !== 'superadmin') throw new Error('Only business owners can manage ad campaigns')
  return context as typeof context & { userId: string; agencyId: string }
}

async function getCatalog(agencyId: string, businessType: BusinessTypeSlug) {
  const db = admin()
  if (businessType === 'travel_agency') {
    const { data, error } = await db.from('trips')
      .select('id,title,description,price,destination,duration_days,image_urls,is_active')
      .eq('agency_id', agencyId).eq('is_active', true).order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return (data || []).map((item: any) => ({
      key: `trip:${item.id}`, type: 'trip', id: item.id, title: item.title,
      subtitle: `${item.destination} · ${Number(item.price).toLocaleString()} DZD · ${item.duration_days} days`,
      image: firstImage(item.image_urls), raw: item,
    }))
  }
  if (businessType === 'car_showroom') {
    const [sales, rentals] = await Promise.all([
      db.from('car_sales_inventory').select('id,brand,model,year,price,status,type,description,images,specs')
        .eq('agency_id', agencyId).neq('status', 'sold').order('created_at', { ascending: false }).limit(35),
      db.from('car_rental_fleet').select('id,brand,model,year,daily_rate,status,images,specs')
        .eq('agency_id', agencyId).neq('status', 'maintenance').order('created_at', { ascending: false }).limit(20),
    ])
    if (sales.error) throw sales.error
    if (rentals.error) throw rentals.error
    return [
      ...(sales.data || []).map((item: any) => ({
        key: `vehicle_sale:${item.id}`, type: 'vehicle_sale', id: item.id,
        title: `${item.brand} ${item.model} ${item.year}`,
        subtitle: `${Number(item.price).toLocaleString()} DZD · ${item.type === 'sur_commande' ? 'Import order' : 'For sale'}`,
        image: firstImage(item.images), raw: item,
      })),
      ...(rentals.data || []).map((item: any) => ({
        key: `vehicle_rental:${item.id}`, type: 'vehicle_rental', id: item.id,
        title: `${item.brand} ${item.model} ${item.year}`,
        subtitle: `${Number(item.daily_rate).toLocaleString()} DZD/day · Rental`,
        image: firstImage(item.images), raw: item,
      })),
    ]
  }
  const { data, error } = await db.from('ecommerce_products')
    .select('id,sku,name,description,category,brand,price,compare_at_price,stock_quantity,images,status')
    .eq('agency_id', agencyId).eq('status', 'active').order('created_at', { ascending: false }).limit(50)
  if (error) throw error
  return (data || []).map((item: any) => ({
    key: `product:${item.id}`, type: 'product', id: item.id, title: item.name,
    subtitle: `${Number(item.price).toLocaleString()} DZD · ${item.stock_quantity} in stock`,
    image: firstImage(item.images), raw: item,
  }))
}

export async function getAdsStudioData() {
  try {
    const context = await requireManager()
    const db = admin()
    const [catalog, campaignsResult, integrationResult, agencyResult, profileResult] = await Promise.all([
      getCatalog(context.agencyId, context.businessTypeSlug),
      db.from('ai_ad_campaigns').select('*').eq('agency_id', context.agencyId)
        .order('created_at', { ascending: false }).limit(100),
      db.from('meta_integrations')
        .select('facebook_connected,facebook_page_id,facebook_page_name,instagram_connected,instagram_username,ads_connected,meta_ad_accounts,selected_ad_account_id,meta_pixels,selected_pixel_id,meta_token_expires_at')
        .eq('agency_id', context.agencyId).maybeSingle(),
      db.from('agencies').select('company_name,subdomain').eq('id', context.agencyId).single(),
      db.from('ai_ad_profiles').select('*').eq('agency_id', context.agencyId).maybeSingle(),
    ])
    if (campaignsResult.error) throw campaignsResult.error
    return {
      success: true as const,
      data: {
        businessType: context.businessTypeSlug,
        vertical: ADS_VERTICALS[context.businessTypeSlug],
        catalog,
        campaigns: campaignsResult.data || [],
        integration: integrationResult.data || null,
        agency: agencyResult.data,
        learningProfile: profileResult.data || {
          brand_voice: 'clear, trustworthy and locally relevant',
          preferred_languages: ['fr', 'ar'],
          required_phrases: [],
          forbidden_phrases: [],
          generation_count: 0,
          feedback_count: 0,
        },
      },
    }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Unable to load Ads Studio' }
  }
}

export async function generateAdCampaign(input: unknown) {
  try {
    const context = await requireManager()
    const parsed = generationSchema.parse(input)
    const catalog = await getCatalog(context.agencyId, context.businessTypeSlug)
    const item = catalog.find((entry: any) => entry.key === parsed.catalogItemKey)
    if (!item) throw new Error('Catalog item not found')

    const db = admin()
    const [{ data: agency }, { data: learningProfile }, { data: learningExamples }] = await Promise.all([
      db.from('agencies').select('company_name,subdomain').eq('id', context.agencyId).single(),
      db.from('ai_ad_profiles').select('*').eq('agency_id', context.agencyId).maybeSingle(),
      db.from('ai_ad_feedback').select('rating,notes,after_snapshot,metrics,feedback_type')
        .eq('agency_id', context.agencyId).order('created_at', { ascending: false }).limit(12),
    ])
    const vertical = ADS_VERTICALS[context.businessTypeSlug]
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const destinationUrl = agency?.subdomain
      ? `${siteUrl.replace('://', `://${agency.subdomain}.`)}`
      : siteUrl

    const completion = await getOpenAIClient().chat.completions.create({
      model: AGENT_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content: `You are a senior Meta ads strategist for an Algerian ${context.businessTypeSlug.replace('_', ' ')}. Create factual, specific ad copy using only supplied data. Focus on ${vertical.promptFocus}. Brand voice: ${learningProfile?.brand_voice || 'clear, trustworthy and locally relevant'}. Required phrases: ${JSON.stringify(learningProfile?.required_phrases || [])}. Forbidden phrases or claims: ${JSON.stringify(learningProfile?.forbidden_phrases || [])}. Learn from the supplied approved edits, ratings and performance, prioritizing high-rated/high-converting examples and ignoring poor ones. Never invent discounts, availability, guarantees, financing or features. Write in the requested languages and tone. Return JSON only with: name, strategy_summary, primary_text, primary_text_variants (array), headline, headline_variants (array), description, audience_summary, interests (array), excluded_audiences (array), age_min, age_max, country (ISO-2), daily_budget_dzd, duration_days, call_to_action, recommended_placements (array).`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            business: agency?.company_name,
            objective: parsed.objective,
            catalog_item: item.raw,
            offer_or_angle: parsed.offer,
            audience_notes: parsed.audienceNotes,
            tone: parsed.tone,
            languages: parsed.languages,
            variant_count: parsed.variantCount,
            business_learning_examples: learningExamples || [],
            defaults: { country: 'DZ', minimum_daily_budget_dzd: 500, maximum_daily_budget_dzd: 100000 },
          }),
        },
      ],
    })
    const generated = JSON.parse(completion.choices[0]?.message?.content || '{}')
    const dailyBudget = Math.max(500, Math.min(100000, Number(generated.daily_budget_dzd) || 2000))
    const durationDays = Math.max(1, Math.min(90, Number(generated.duration_days) || 7))
    const ageMin = Math.max(18, Math.min(65, Number(generated.age_min) || 21))
    const ageMax = Math.max(ageMin, Math.min(65, Number(generated.age_max) || 55))
    const cta = ['LEARN_MORE', 'CONTACT_US', 'SHOP_NOW', 'BOOK_TRAVEL', 'GET_OFFER'].includes(generated.call_to_action)
      ? generated.call_to_action
      : vertical.defaultCta
    const allowedPlacements = ['facebook_feed', 'facebook_marketplace', 'facebook_reels', 'instagram_feed', 'instagram_stories', 'instagram_reels']
    const generatedPlacements = Array.isArray(generated.recommended_placements)
      ? generated.recommended_placements.filter((value: unknown) => typeof value === 'string' && allowedPlacements.includes(value)).slice(0, 6)
      : []

    const { data, error } = await db.from('ai_ad_campaigns').insert({
      agency_id: context.agencyId,
      created_by: context.userId,
      business_type_slug: context.businessTypeSlug,
      name: String(generated.name || `${item.title} campaign`).slice(0, 120),
      objective: parsed.objective,
      catalog_item_type: item.type,
      catalog_item_id: item.id,
      catalog_item_title: item.title,
      strategy: { summary: String(generated.strategy_summary || ''), offer: parsed.offer, tone: parsed.tone },
      creative: {
        primary_text: String(generated.primary_text || '').slice(0, 2200),
        headline: String(generated.headline || item.title).slice(0, 255),
        description: String(generated.description || '').slice(0, 500),
        image_url: item.image,
        primary_text_variants: Array.isArray(generated.primary_text_variants) ? generated.primary_text_variants.slice(0, parsed.variantCount) : [],
        headline_variants: Array.isArray(generated.headline_variants) ? generated.headline_variants.slice(0, parsed.variantCount) : [],
        generated_snapshot: generated,
      },
      targeting: {
        audience_summary: String(generated.audience_summary || parsed.audienceNotes),
        interests: Array.isArray(generated.interests) ? generated.interests.slice(0, 20) : [],
        age_min: ageMin, age_max: ageMax, country: String(generated.country || 'DZ').slice(0, 2).toUpperCase(),
        languages: parsed.languages,
        excluded_audiences: Array.isArray(generated.excluded_audiences) ? generated.excluded_audiences.slice(0, 20) : [],
        placements: generatedPlacements.length ? generatedPlacements : ['facebook_feed', 'instagram_feed', 'instagram_stories'],
      },
      budget: { daily_budget_dzd: dailyBudget, duration_days: durationDays, bid_strategy: 'LOWEST_COST_WITHOUT_CAP', cost_cap_dzd: 0, start_date: '' },
      destination_url: destinationUrl,
      call_to_action: cta,
      generated_by: AGENT_MODEL,
    }).select('*').single()
    if (error) throw error
    await db.from('ai_ad_profiles').upsert({
      agency_id: context.agencyId,
      generation_count: Number(learningProfile?.generation_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id' })
    revalidatePath('/dashboard/ads')
    return { success: true as const, data }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Campaign generation failed' }
  }
}

export async function updateAdCampaign(input: unknown) {
  try {
    const context = await requireManager()
    const parsed = editSchema.parse(input)
    if (parsed.ageMax < parsed.ageMin) throw new Error('Maximum age must be greater than minimum age')
    const db = admin()
    const { data: before } = await db.from('ai_ad_campaigns').select('*')
      .eq('id', parsed.id).eq('agency_id', context.agencyId).single()
    const { data, error } = await db.from('ai_ad_campaigns').update({
      name: parsed.name,
      objective: parsed.objective,
      status: 'ready',
      creative: {
        primary_text: parsed.primaryText,
        headline: parsed.headline,
        description: parsed.description,
        image_url: parsed.imageUrl || null,
        primary_text_variants: parsed.primaryTextVariants,
        headline_variants: parsed.headlineVariants,
        generated_snapshot: before?.creative?.generated_snapshot || null,
      },
      targeting: {
        audience_summary: parsed.audienceSummary,
        interests: parsed.interests,
        age_min: parsed.ageMin,
        age_max: parsed.ageMax,
        country: parsed.country.toUpperCase(),
        excluded_audiences: parsed.excludedAudiences,
        languages: parsed.languages,
        placements: parsed.placements,
      },
      budget: {
        daily_budget_dzd: parsed.dailyBudget,
        duration_days: parsed.durationDays,
        bid_strategy: parsed.bidStrategy,
        cost_cap_dzd: parsed.costCap,
        start_date: parsed.startDate,
      },
      destination_url: parsed.destinationUrl,
      call_to_action: parsed.callToAction,
      approved_at: new Date().toISOString(),
      meta_error: null,
    }).eq('id', parsed.id).eq('agency_id', context.agencyId).select('*').single()
    if (error) throw error
    await db.from('ai_ad_feedback').insert({
      agency_id: context.agencyId,
      campaign_id: parsed.id,
      created_by: context.userId,
      feedback_type: 'approved_edit',
      before_snapshot: before,
      after_snapshot: data,
    })
    revalidatePath('/dashboard/ads')
    return { success: true as const, data }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Unable to save campaign' }
  }
}

export async function saveAdsLearningProfile(input: unknown) {
  try {
    const context = await requireManager()
    const parsed = profileSchema.parse(input)
    const { data, error } = await admin().from('ai_ad_profiles').upsert({
      agency_id: context.agencyId,
      brand_voice: parsed.brandVoice,
      preferred_languages: parsed.preferredLanguages,
      required_phrases: parsed.requiredPhrases,
      forbidden_phrases: parsed.forbiddenPhrases,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id' }).select('*').single()
    if (error) throw error
    revalidatePath('/dashboard/ads')
    return { success: true as const, data }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Unable to save AI learning settings' }
  }
}

export async function submitAdFeedback(input: unknown) {
  try {
    const context = await requireManager()
    const parsed = feedbackSchema.parse(input)
    const db = admin()
    const { data: campaign } = await db.from('ai_ad_campaigns').select('*')
      .eq('id', parsed.campaignId).eq('agency_id', context.agencyId).single()
    if (!campaign) throw new Error('Campaign not found')
    const { error } = await db.from('ai_ad_feedback').insert({
      agency_id: context.agencyId,
      campaign_id: parsed.campaignId,
      created_by: context.userId,
      feedback_type: Object.values(parsed.metrics).some((value) => value > 0) ? 'performance' : 'rating',
      rating: parsed.rating,
      notes: parsed.notes,
      after_snapshot: campaign,
      metrics: parsed.metrics,
    })
    if (error) throw error
    const { data: profile } = await db.from('ai_ad_profiles').select('feedback_count').eq('agency_id', context.agencyId).maybeSingle()
    await db.from('ai_ad_profiles').upsert({
      agency_id: context.agencyId,
      feedback_count: Number(profile?.feedback_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id' })
    return { success: true as const }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Unable to save campaign feedback' }
  }
}

export async function deleteAdCampaign(id: string) {
  try {
    const context = await requireManager()
    const campaignId = z.string().uuid().parse(id)
    const { error } = await admin().from('ai_ad_campaigns').delete()
      .eq('id', campaignId).eq('agency_id', context.agencyId).in('status', ['draft', 'ready', 'error'])
    if (error) throw error
    revalidatePath('/dashboard/ads')
    return { success: true as const }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Unable to delete campaign' }
  }
}

export async function saveAdsConnectionSettings(input: { adAccountId: string; pixelId?: string }) {
  try {
    const context = await requireManager()
    const db = admin()
    const { data: integration } = await db.from('meta_integrations')
      .select('meta_ad_accounts,meta_pixels').eq('agency_id', context.agencyId).single()
    const accounts = Array.isArray(integration?.meta_ad_accounts) ? integration.meta_ad_accounts : []
    const pixels = Array.isArray(integration?.meta_pixels) ? integration.meta_pixels : []
    if (!accounts.some((account: any) => account.id === input.adAccountId)) throw new Error('Invalid ad account')
    if (input.pixelId && !pixels.some((pixel: any) => pixel.id === input.pixelId)) throw new Error('Invalid pixel')
    const { error } = await db.from('meta_integrations').update({
      selected_ad_account_id: input.adAccountId,
      selected_pixel_id: input.pixelId || null,
    }).eq('agency_id', context.agencyId)
    if (error) throw error
    revalidatePath('/dashboard/ads')
    return { success: true as const }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Unable to save Meta settings' }
  }
}

async function graphPost(path: string, token: string, body: Record<string, string>) {
  const form = new URLSearchParams({ ...body, access_token: token })
  const response = await fetch(`${GRAPH}/${path}`, { method: 'POST', body: form, cache: 'no-store' })
  const payload = await response.json()
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.error_user_msg || payload.error?.message || 'Meta API request failed')
  }
  return payload
}

export async function publishAdCampaignPaused(id: string) {
  const campaignId = z.string().uuid().parse(id)
  let context: Awaited<ReturnType<typeof requireManager>> | null = null
  try {
    context = await requireManager()
    const db = admin()
    const [{ data: campaign, error: campaignError }, { data: integration, error: integrationError }] = await Promise.all([
      db.from('ai_ad_campaigns').select('*').eq('id', campaignId).eq('agency_id', context.agencyId).single(),
      db.from('meta_integrations').select('*').eq('agency_id', context.agencyId).single(),
    ])
    if (campaignError) throw campaignError
    if (integrationError) throw integrationError
    if (!integration.meta_user_access_token || !integration.selected_ad_account_id || !integration.facebook_page_id) {
      throw new Error('Reconnect Meta with ads permission and select an ad account first')
    }
    if (campaign.objective === 'OUTCOME_SALES' && !integration.selected_pixel_id) {
      throw new Error('Select a Meta Pixel before publishing a sales campaign')
    }
    if (!['draft', 'ready', 'error'].includes(campaign.status)) throw new Error('This campaign cannot be published again')
    const budget = Number(campaign.budget?.daily_budget_dzd)
    const duration = Number(campaign.budget?.duration_days)
    if (budget < 500 || budget > 100000 || duration < 1 || duration > 90) throw new Error('Review the campaign budget and duration')
    const { count: previousMetaPublishCount, error: previousMetaPublishError } = await db
      .from('ai_ad_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', context.agencyId)
      .not('meta_campaign_id', 'is', null)
    if (previousMetaPublishError) throw previousMetaPublishError
    validateFirstMetaTestPublish({
      hasPreviousMetaPublish: Number(previousMetaPublishCount || 0) > 0,
      dailyBudgetDzd: budget,
      durationDays: duration,
    })

    await db.from('ai_ad_campaigns').update({ status: 'publishing', meta_error: null })
      .eq('id', campaignId).eq('agency_id', context.agencyId)

    const token = integration.meta_user_access_token
    const accountId = integration.selected_ad_account_id.startsWith('act_')
      ? integration.selected_ad_account_id
      : `act_${integration.selected_ad_account_id}`
    const createdCampaign = await graphPost(`${accountId}/campaigns`, token, {
      name: campaign.name,
      objective: campaign.objective,
      status: META_PAUSED_STATUS,
      special_ad_categories: '[]',
    })
    const targeting = buildMetaTargeting({ ...campaign.targeting, placements: campaign.targeting?.placements })
    const adSetBody: Record<string, string> = {
      name: `${campaign.name} - Audience`,
      campaign_id: createdCampaign.id,
      daily_budget: String(Math.round(budget * 100)),
      billing_event: 'IMPRESSIONS',
      optimization_goal: metaOptimizationGoal(campaign.objective as MetaObjective),
      bid_strategy: campaign.budget?.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
      targeting: JSON.stringify(targeting),
      start_time: campaign.budget?.start_date
        ? new Date(campaign.budget.start_date).toISOString()
        : new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + (duration * 86400000)).toISOString(),
      status: META_PAUSED_STATUS,
    }
    if (campaign.budget?.bid_strategy === 'COST_CAP' && Number(campaign.budget?.cost_cap_dzd) > 0) {
      adSetBody.bid_amount = String(Math.round(Number(campaign.budget.cost_cap_dzd) * 100))
    }
    if (campaign.objective === 'OUTCOME_SALES') {
      adSetBody.promoted_object = JSON.stringify({ pixel_id: integration.selected_pixel_id })
    }
    const createdAdSet = await graphPost(`${accountId}/adsets`, token, adSetBody)
    const objectStorySpec: any = {
      page_id: integration.facebook_page_id,
      link_data: {
        link: campaign.destination_url,
        message: campaign.creative?.primary_text,
        name: campaign.creative?.headline,
        description: campaign.creative?.description,
        call_to_action: {
          type: campaign.call_to_action,
          value: { link: campaign.destination_url },
        },
      },
    }
    if (integration.instagram_business_account_id) {
      objectStorySpec.instagram_actor_id = integration.instagram_business_account_id
    }
    if (campaign.creative?.image_url) objectStorySpec.link_data.picture = campaign.creative.image_url
    const createdCreative = await graphPost(`${accountId}/adcreatives`, token, {
      name: `${campaign.name} - Creative`,
      object_story_spec: JSON.stringify(objectStorySpec),
    })
    const createdAd = await graphPost(`${accountId}/ads`, token, {
      name: `${campaign.name} - Ad`,
      adset_id: createdAdSet.id,
      creative: JSON.stringify({ creative_id: createdCreative.id }),
      status: META_PAUSED_STATUS,
    })
    const { data, error } = await db.from('ai_ad_campaigns').update({
      status: 'paused',
      meta_campaign_id: createdCampaign.id,
      meta_adset_id: createdAdSet.id,
      meta_creative_id: createdCreative.id,
      meta_ad_id: createdAd.id,
      published_at: new Date().toISOString(),
    }).eq('id', campaignId).eq('agency_id', context.agencyId).select('*').single()
    if (error) throw error
    revalidatePath('/dashboard/ads')
    return { success: true as const, data }
  } catch (error: any) {
    if (context?.agencyId) {
      await admin().from('ai_ad_campaigns').update({ status: 'error', meta_error: error.message })
        .eq('id', campaignId).eq('agency_id', context.agencyId)
    }
    return { success: false as const, error: error.message || 'Meta publishing failed' }
  }
}
