'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { revalidatePath } from 'next/cache'

export interface LeadActivity {
  id: string
  action: string
  timestamp: string
  user: string
}

export interface LeadMessage {
  id: string
  sender: 'user' | 'client' | 'ai'
  text: string
  timestamp: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  interest: string // Polymorphic interest field
  budget: number
  source: 'whatsapp' | 'instagram' | 'facebook' | 'walk_in' | 'phone' | 'website'
  score: 'HOT' | 'WARM' | 'COLD'
  stage: string
  assignedTo: string
  lastContacted: string
  notes?: string
  activityLog: LeadActivity[]
  messages: LeadMessage[]
  customerTone?: string
  customerFacts?: string[]
  crossTenantAgencies?: string[]
  conversationId?: string
}

function timeAgo(dateString: string) {
  try {
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)))
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch (e) {
    return '1 hour ago'
  }
}

// Mock leads fallbacks by vertical
const MOCK_LEADS: Record<string, Lead[]> = {
  car_showroom: [
    {
      id: 'lead-1',
      name: 'Yacine Bouazza',
      phone: '+213 550 44 88 12',
      interest: 'Toyota Tucson 2024 Hybrid',
      budget: 6800000,
      source: 'whatsapp',
      score: 'HOT',
      stage: 'new',
      assignedTo: 'Achraf Amalou',
      lastContacted: '2h ago',
      notes: 'Very interested in Hybrid variants. Asks if there is a 30% down payment plan matching BADR bank networks.',
      customerTone: 'Decisive, technical, asking detailed financing options',
      customerFacts: [
        'Prefers Polar White or Phantom Black exterior color',
        'Has BADR Bank account and wants 30% down payment plan',
        'Inquires about CCP wire transfers speed'
      ],
      crossTenantAgencies: ['A2S Auto Algérie'],
      activityLog: [
        { id: 'act-1-1', action: 'Lead captured via WhatsApp Chatbot', timestamp: '2026-06-13 10:15', user: 'AI Assistant' },
        { id: 'act-1-2', action: 'Auto-qualified as HOT due to competitor overlap', timestamp: '2026-06-13 10:17', user: 'System' }
      ],
      messages: [
        { id: 'msg-1-1', sender: 'client', text: 'Salam, is the Toyota Tucson 2024 in stock?', timestamp: '10:14 AM' },
        { id: 'msg-1-2', sender: 'ai', text: 'Waalikoum Salam! Yes, we have 2 units of the Tucson 2024 Hybrid available in Polar White and Phantom Black. Would you like to check the price or financing?', timestamp: '10:15 AM' },
        { id: 'msg-1-3', sender: 'client', text: 'Yes, what are the bank financing rates for CCP or BADR Bank? Can I do a 30% down payment?', timestamp: '10:17 AM' }
      ]
    },
    {
      id: 'lead-2',
      name: 'Amel Mansouri',
      phone: '+213 661 99 22 34',
      interest: 'Hyundai Creta 2023 Certified',
      budget: 4200000,
      source: 'instagram',
      score: 'WARM',
      stage: 'contacted',
      assignedTo: 'Amine Belkadi',
      lastContacted: '1d ago',
      notes: 'Negotiating a trade-in option for her older 2018 Kia Picanto.',
      customerTone: 'Polite, hesitant, price-sensitive',
      customerFacts: [
        'Wants a trade-in (reprise) value for 2018 Kia Picanto',
        'Looking for certified pre-owned with warranty',
        'Budget is fixed at 4.2M DZD maximum'
      ],
      activityLog: [
        { id: 'act-2-1', action: 'Lead captured from Instagram DM ad', timestamp: '2026-06-12 14:20', user: 'Marketing' },
        { id: 'act-2-2', action: 'Stage updated to CONTACTED', timestamp: '2026-06-12 16:40', user: 'Amine Belkadi' }
      ],
      messages: [
        { id: 'msg-2-1', sender: 'client', text: 'Do you accept trade-in (reprise) for Kia Picanto?', timestamp: '2:19 PM' },
        { id: 'msg-2-2', sender: 'user', text: 'Hello! Yes, we offer trade-in assessments. Please bring the Picanto by our showroom in Algiers for our mechanics to inspect and value it.', timestamp: '4:40 PM' }
      ]
    },
    {
      id: 'lead-3',
      name: 'Kamel Rezgui',
      phone: '+213 770 12 34 56',
      interest: 'Audi A4 2.0 TDI S-Line',
      budget: 9200000,
      source: 'walk_in',
      score: 'HOT',
      stage: 'test_drive',
      assignedTo: 'Achraf Amalou',
      lastContacted: '3h ago',
      notes: 'Test drive scheduled and completed. Customer was extremely happy with performance, s-line trim level matches his budget.',
      customerTone: 'Enthusiastic, premium seeker, demanding specs details',
      customerFacts: [
        'Completed test drive of Audi A4 2.0 TDI',
        'Extremely satisfied with S-Line trim package',
        'Ready to wire CCP cash once final invoice is sent'
      ],
      activityLog: [
        { id: 'act-3-1', action: 'Lead created manually via Walk-in', timestamp: '2026-06-11 11:00', user: 'Achraf Amalou' },
        { id: 'act-3-2', action: 'Test Drive Scheduled for Audi A4', timestamp: '2026-06-12 10:00', user: 'Achraf Amalou' },
        { id: 'act-3-3', action: 'Moved to TEST DRIVE column', timestamp: '2026-06-12 11:30', user: 'Achraf Amalou' }
      ],
      messages: [
        { id: 'msg-3-1', sender: 'client', text: 'The Audi felt amazing. Let me review the final CCP wire transfer details.', timestamp: 'Yesterday' }
      ]
    }
  ],
  travel: [
    {
      id: 'lead-travel-1',
      name: 'Yacine Bouazza',
      phone: '+213 550 44 88 12',
      interest: 'Turkey (Antalya) Beach Package',
      budget: 380000,
      source: 'whatsapp',
      score: 'HOT',
      stage: 'new',
      assignedTo: 'Achraf Amalou',
      lastContacted: '2h ago',
      notes: 'Wants all-inclusive 5-star hotel near Lara beach. Travel dates: late August for 2 adults and 1 child.',
      customerTone: 'Direct, demanding, family-focused, comparing options',
      customerFacts: [
        'Travelers: 2 Adults + 1 Child (8 years old)',
        'Preferred destination: Antalya, Turkey',
        'Timeline: August 20th - August 28th',
        'Appeared on GoldenBird Voyages and VoyagePro'
      ],
      crossTenantAgencies: ['GoldenBird Voyages E.U.R.L', 'VoyagePro Algérie S.A.R.L'],
      activityLog: [
        { id: 'act-t1-1', action: 'Captured from WhatsApp travel chatbot', timestamp: '2026-06-13 11:02', user: 'AI Assistant' },
        { id: 'act-t1-2', action: 'Upgraded to HOT: Active at 2 other travel agencies', timestamp: '2026-06-13 11:05', user: 'System' }
      ],
      messages: [
        { id: 'msg-t1-1', sender: 'client', text: 'Salam, do you have packages to Antalya for late August?', timestamp: '11:00 AM' },
        { id: 'msg-t1-2', sender: 'ai', text: 'Waalikoum Salam! Yes, we have standard 5-star and 4-star Lara beach packages. For how many people?', timestamp: '11:02 AM' },
        { id: 'msg-t1-3', sender: 'client', text: '2 adults and 1 child. We prefer a resort with waterpark and family suites. What is the budget?', timestamp: '11:05 AM' }
      ]
    },
    {
      id: 'lead-travel-2',
      name: 'Amel Mansouri',
      phone: '+213 661 99 22 34',
      interest: 'Malaysia (Kuala Lumpur & Langkawi) Honeymoon',
      budget: 520000,
      source: 'instagram',
      score: 'WARM',
      stage: 'proposal',
      assignedTo: 'Amine Belkadi',
      lastContacted: '1d ago',
      notes: 'Honeymoon itinerary requested. Prefers private tours, private pool villas, and flight via Qatar Airways.',
      customerTone: 'Romantic, luxury seeker, specific design taste',
      customerFacts: [
        'Purpose: Honeymoon trip',
        'Stays: Kuala Lumpur (2 nights) + Langkawi (5 nights)',
        'Requested private pool villa at Ritz Carlton Langkawi'
      ],
      activityLog: [
        { id: 'act-t2-1', action: 'Lead captured from Instagram DM', timestamp: '2026-06-12 12:00', user: 'AI Assistant' },
        { id: 'act-t2-2', action: 'Itinerary proposal sent by Amine', timestamp: '2026-06-12 15:45', user: 'Amine Belkadi' }
      ],
      messages: [
        { id: 'msg-t2-1', sender: 'client', text: 'Hi, I saw your Malaysian honeymoon package. Can we customize the Langkawi hotel?', timestamp: '12:00 PM' },
        { id: 'msg-t2-2', sender: 'user', text: 'Hi Amel! Absolutely, we can upgrade you to the Ritz-Carlton beachfront villa. Let me send a revised proposal.', timestamp: '3:45 PM' }
      ]
    },
    {
      id: 'lead-travel-3',
      name: 'Kamel Rezgui',
      phone: '+213 770 12 34 56',
      interest: 'France (Paris) Visa Appointment & Trip',
      budget: 180000,
      source: 'walk_in',
      score: 'HOT',
      stage: 'negotiation',
      assignedTo: 'Achraf Amalou',
      lastContacted: '3h ago',
      notes: 'Need urgent Schengen visa appointment slot booking and premium medical insurance.',
      customerTone: 'Impatient, business-oriented, results-focused',
      customerFacts: [
        'Requires VFS Global Paris slot booking urgently',
        'Has previous Schengen visa history',
        'Requires premium travel health insurance coverage'
      ],
      crossTenantAgencies: ['chahinez.agency'],
      activityLog: [
        { id: 'act-t3-1', action: 'Registered via Walk-in office', timestamp: '2026-06-12 09:30', user: 'Achraf Amalou' },
        { id: 'act-t3-2', action: 'VFS slot search initialized', timestamp: '2026-06-12 10:15', user: 'System' }
      ],
      messages: [
        { id: 'msg-t3-1', sender: 'client', text: 'Any luck with the Paris slot for next week? Money is not an issue.', timestamp: '3h ago' }
      ]
    }
  ],
  ecommerce: [
    {
      id: 'lead-eco-1',
      name: 'Yacine Bouazza',
      phone: '+213 550 44 88 12',
      interest: 'iPhone 15 Pro Max 256GB Titanium',
      budget: 215000,
      source: 'whatsapp',
      score: 'HOT',
      stage: 'new',
      assignedTo: 'Achraf Amalou',
      lastContacted: '2h ago',
      notes: 'Wants to confirm cash on delivery in Oran. Inquires about warranty period and invoice.',
      customerTone: 'Price-conscious but decisive, cautious about online shipping security',
      customerFacts: [
        'Product: iPhone 15 Pro Max 256GB Natural Titanium',
        'Delivery: Oran (wants home delivery)',
        'Payment: Cash on Delivery (COD)'
      ],
      crossTenantAgencies: ['Amine Auto'],
      activityLog: [
        { id: 'act-e1-1', action: 'Checkout started via store portal', timestamp: '2026-06-13 11:20', user: 'Web' },
        { id: 'act-e1-2', action: 'Inquired via WhatsApp for COD validation', timestamp: '2026-06-13 11:25', user: 'AI Assistant' }
      ],
      messages: [
        { id: 'msg-e1-1', sender: 'client', text: 'Salam, can I pay cash on delivery in Oran? Does the iPhone have Apple warranty?', timestamp: '11:24 AM' },
        { id: 'msg-e1-2', sender: 'ai', text: 'Waalikoum Salam! Yes, we deliver to Oran with Yalidine for 800 DZD and support cash on delivery. All our phones have a 12-month store warranty. Shall I confirm your order?', timestamp: '11:25 AM' }
      ]
    },
    {
      id: 'lead-eco-2',
      name: 'Amel Mansouri',
      phone: '+213 661 99 22 34',
      interest: 'Glow Skin Cosmetics Kit',
      budget: 14500,
      source: 'instagram',
      score: 'WARM',
      stage: 'cart_abandoned',
      assignedTo: 'Amine Belkadi',
      lastContacted: '1d ago',
      notes: 'Abandoned checkout. Coupon code "GLOW10" failed to apply.',
      customerTone: 'Polite, slightly frustrated with website experience',
      customerFacts: [
        'Cart: Glow Cosmetics Kit + Face Serum',
        'Attempted to apply expired discount code GLOW10',
        'Needs direct discount coupon adjustment'
      ],
      activityLog: [
        { id: 'act-e2-1', action: 'Cart abandoned at checkout page', timestamp: '2026-06-12 15:10', user: 'Web' },
        { id: 'act-e2-2', action: 'Auto recovery coupon email sent', timestamp: '2026-06-12 16:30', user: 'System' }
      ],
      messages: [
        { id: 'msg-e2-1', sender: 'client', text: 'Hello, the promo code GLOW10 is not working on checkout. Can you help?', timestamp: '4:15 PM' }
      ]
    }
  ]
}

export async function getLeadsBoardData() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) {
    return { success: false, error: 'Unauthorized', leads: [], businessTypeSlug: 'travel' }
  }

  // Normalize vertical name for frontend
  const vertical = context.businessTypeSlug === 'travel_agency' ? 'travel' : context.businessTypeSlug

  try {
    const supabase = (await createClient()) as any

    // 1. Fetch leads from "leads" table
    const { data: dbLeads, error: leadsErr } = await supabase
      .from('leads')
      .select('*')
      .eq('agency_id', context.agencyId)
      .order('created_at', { ascending: false })

    if (leadsErr) throw leadsErr

    // 2. Fetch conversations to catch chatbot qualified leads that might not be in leads table
    const { data: dbConvs, error: convsErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('agency_id', context.agencyId)
      .not('lead_score', 'is', null)
      .order('last_message_at', { ascending: false })

    if (convsErr) throw convsErr

    // 3. Compile list of leads. Start with database leads.
    let leadsList: Lead[] = []

    // Map DB leads
    if (dbLeads && dbLeads.length > 0) {
      for (const lead of dbLeads) {
        // Fetch matching conversation analysis if exists
        let customerTone = undefined
        let customerFacts: string[] = []
        let messages: LeadMessage[] = []
        let convId = undefined

        const { data: matchedConv } = await supabase
          .from('conversations')
          .select('id, lead_summary')
          .eq('customer_phone', lead.phone)
          .eq('agency_id', context.agencyId)
          .maybeSingle()

        if (matchedConv) {
          convId = matchedConv.id
          // Get latest analysis
          const { data: analysisData } = await supabase
            .from('conversation_analysis')
            .select('intent, lead_score_reason, customer_snapshot, analysis')
            .eq('conversation_id', matchedConv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (analysisData) {
            const snap = (analysisData.customer_snapshot as any) || {}
            const mainAnalysis = (analysisData.analysis as any) || {}
            
            customerTone = mainAnalysis.sentiment ? `Sentiment: ${mainAnalysis.sentiment}. Urgency: ${mainAnalysis.urgency || 'medium'}` : undefined
            
            // Generate structured facts
            if (snap.destination) customerFacts.push(`Prefers destination: ${snap.destination}`)
            if (snap.budget) customerFacts.push(`Budget details: ${snap.budget}`)
            if (snap.interest) customerFacts.push(`Interested item: ${snap.interest}`)
            if (snap.preferred_dates) customerFacts.push(`Preferred dates: ${snap.preferred_dates}`)
            if (snap.travelers_count) customerFacts.push(`Travelers: ${snap.travelers_count}`)
          }

          // Fetch message transcripts
          const { data: msgData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', matchedConv.id)
            .order('created_at', { ascending: true })

          if (msgData) {
            messages = msgData.map((m: any) => ({
              id: m.id,
              sender: m.role === 'assistant' ? 'ai' : m.role === 'human' ? 'user' : 'client',
              text: m.content || '',
              timestamp: new Date(m.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
          }
        }

        leadsList.push({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          interest: lead.car_interest || lead.notes || 'General Inquiry',
          budget: lead.budget || 0,
          source: (lead.source as any) || 'website',
          score: (lead.score?.toUpperCase() as any) || 'WARM',
          stage: lead.stage || 'new',
          assignedTo: 'Achraf Amalou',
          lastContacted: lead.last_contacted_at ? timeAgo(lead.last_contacted_at as string) : 'Just now',
          notes: lead.notes || '',
          activityLog: [
            { id: `act-init-${lead.id}`, action: 'Lead record synced to dashboard CRM', timestamp: new Date(lead.created_at).toISOString().replace('T', ' ').slice(0, 16), user: 'System' }
          ],
          messages,
          customerTone,
          customerFacts: customerFacts.length ? customerFacts : undefined,
          conversationId: convId
        })
      }
    }

    // Map qualified conversations that aren't represented in leadsList yet
    if (dbConvs && dbConvs.length > 0) {
      for (const conv of dbConvs) {
        // Skip if already in list by phone
        if (leadsList.some(l => l.phone === conv.customer_phone)) continue

        let customerFacts: string[] = []
        let customerTone = undefined
        let messages: LeadMessage[] = []

        // Get latest analysis
        const { data: analysisData } = await supabase
          .from('conversation_analysis')
          .select('intent, lead_score_reason, customer_snapshot, analysis')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (analysisData) {
          const snap = (analysisData.customer_snapshot as any) || {}
          const mainAnalysis = (analysisData.analysis as any) || {}
          
          customerTone = mainAnalysis.sentiment ? `Sentiment: ${mainAnalysis.sentiment}. Urgency: ${mainAnalysis.urgency || 'medium'}` : undefined
          
          // Generate facts
          if (snap.destination) customerFacts.push(`Prefers destination: ${snap.destination}`)
          if (snap.budget) customerFacts.push(`Budget details: ${snap.budget}`)
          if (snap.interest) customerFacts.push(`Interested item: ${snap.interest}`)
          if (snap.preferred_dates) customerFacts.push(`Preferred dates: ${snap.preferred_dates}`)
          if (snap.travelers_count) customerFacts.push(`Travelers: ${snap.travelers_count}`)
        }

        // Fetch messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true })

        if (msgData) {
          messages = msgData.map((m: any) => ({
            id: m.id,
            sender: m.role === 'assistant' ? 'ai' : m.role === 'human' ? 'user' : 'client',
            text: m.content || '',
            timestamp: new Date(m.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
        }

        leadsList.push({
          id: conv.id, // Use conv.id as lead ID
          name: conv.customer_name || conv.customer_phone || 'Client Chat',
          phone: conv.customer_phone,
          interest: conv.lead_summary?.split('|').find((s: any) => s.trim().startsWith('Brand:') || s.trim().startsWith('Destination:') || s.trim().startsWith('Model:'))?.split(':')[1]?.trim() || conv.lead_summary || 'Chat Inquiry',
          budget: parseInt(conv.lead_summary?.split('|').find((s: any) => s.trim().startsWith('Budget:'))?.split(':')[1]?.replace(/[^0-9]/g, '') || '0') || 0,
          source: (conv.platform as any) || 'whatsapp',
          score: (conv.lead_score?.toUpperCase() as any) || 'WARM',
          stage: 'new', // Default starting stage
          assignedTo: 'Achraf Amalou',
          lastContacted: conv.last_message_at ? timeAgo(conv.last_message_at as string) : 'Just now',
          notes: conv.lead_summary || '',
          activityLog: [
            { id: `act-chat-${conv.id}`, action: 'Lead imported automatically from chatbot conversation', timestamp: new Date(conv.created_at).toISOString().replace('T', ' ').slice(0, 16), user: 'AI Bot' }
          ],
          messages,
          customerTone,
          customerFacts: customerFacts.length ? customerFacts : undefined,
          conversationId: conv.id
        })
      }
    }

    // 4. PERFORM CROSS-TENANT LOOKUP
    // Fetch other agencies of the SAME business_type_slug
    const { data: siblingAgencies } = await supabase
      .from('agencies')
      .select('id, company_name')
      .eq('business_type_slug', context.businessTypeSlug)
      .neq('id', context.agencyId)

    if (siblingAgencies && siblingAgencies.length > 0 && leadsList.length > 0) {
      const siblingIds = siblingAgencies.map((a: any) => a.id)

      for (const lead of leadsList) {
        // Query other agencies to see if phone matches
        // Check in leads table
        const { data: otherLeads } = await supabase
          .from('leads')
          .select('agency_id')
          .in('agency_id', siblingIds)
          .eq('phone', lead.phone)

        // Check in conversations table
        const { data: otherConvs } = await supabase
          .from('conversations')
          .select('agency_id')
          .in('agency_id', siblingIds)
          .eq('customer_phone', lead.phone)

        const matchedAgencies = new Set<string>()
        if (otherLeads) {
          otherLeads.forEach((ol: any) => {
            const agency = siblingAgencies.find((sa: any) => sa.id === ol.agency_id)
            if (agency) matchedAgencies.add(agency.company_name)
          })
        }
        if (otherConvs) {
          otherConvs.forEach((oc: any) => {
            const agency = siblingAgencies.find((sa: any) => sa.id === oc.agency_id)
            if (agency) matchedAgencies.add(agency.company_name)
          })
        }

        if (matchedAgencies.size > 0) {
          lead.crossTenantAgencies = Array.from(matchedAgencies)
          lead.score = 'HOT' // Dynamic override to HOT lead!
          
          // Add system activity notification if not already present
          if (!lead.activityLog.some(a => a.action.includes('competitor shopping'))) {
            lead.activityLog.push({
              id: `cross-tenant-${lead.id}`,
              action: `🚨 System Alert: Shopping around. Active on: ${lead.crossTenantAgencies.join(', ')}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              user: 'System Bot'
            })
          }
        }
      }
    }

    // If database returned no leads, use realistic vertical-specific mock fallback
    if (leadsList.length === 0) {
      leadsList = MOCK_LEADS[vertical] || MOCK_LEADS.travel
    }

    return { success: true, leads: leadsList, businessTypeSlug: vertical }
  } catch (error: any) {
    console.error('getLeadsBoardData error:', error)
    return {
      success: false,
      error: error.message,
      leads: MOCK_LEADS[vertical] || MOCK_LEADS.travel,
      businessTypeSlug: vertical
    }
  }
}

// Action to update lead stage
export async function updateLeadStageAction(leadId: string, newStage: string) {
  const context = await getCurrentAgencyContext()
  if (!context.agencyId) return { success: false, error: 'Unauthorized' }

  try {
    const supabase = (await createClient()) as any

    // Try to update in leads table if UUID matches
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leadId)
    
    if (isUuid) {
      // Check if it's a lead
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('agency_id', context.agencyId)
        .maybeSingle()

      if (existingLead) {
        const { error } = await supabase
          .from('leads')
          .update({ stage: newStage, updated_at: new Date().toISOString() })
          .eq('id', leadId)
        
        if (error) throw error
        revalidatePath('/dashboard/leads')
        return { success: true }
      }

      // Check if it's a conversation instead
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', leadId)
        .eq('agency_id', context.agencyId)
        .maybeSingle()

      if (existingConv) {
        const { error } = await supabase
          .from('conversations')
          .update({ status: newStage })
          .eq('id', leadId)
        
        if (error) throw error
        revalidatePath('/dashboard/leads')
        return { success: true }
      }
    }

    return { success: true, info: 'Local state updated' }
  } catch (error: any) {
    console.error('updateLeadStageAction error:', error)
    return { success: false, error: error.message }
  }
}

// Action to send message from details drawer
export async function sendLeadMessageAction(leadId: string, text: string) {
  const context = await getCurrentAgencyContext()
  if (!context.agencyId) return { success: false, error: 'Unauthorized' }

  try {
    const supabase = (await createClient()) as any

    // Resolve matching conversation ID
    let convId = leadId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leadId)

    if (isUuid) {
      // Check if leadId belongs to leads table and get phone
      const { data: lead } = await supabase
        .from('leads')
        .select('phone')
        .eq('id', leadId)
        .eq('agency_id', context.agencyId)
        .maybeSingle()

      if (lead) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('customer_phone', lead.phone)
          .eq('agency_id', context.agencyId)
          .maybeSingle()

        if (conv) convId = conv.id
      }

      // Record in conversation_messages if we have a valid conversation ID
      const { data: convObj } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .eq('agency_id', context.agencyId)
        .maybeSingle()

      if (convObj) {
        // Insert message
        const { error } = await supabase
          .from('conversation_messages')
          .insert({
            agency_id: context.agencyId,
            sender_id: (convObj as any).customer_phone,
            platform: (convObj as any).platform || 'whatsapp',
            role: 'human',
            content: text,
            message_type: 'text'
          })

        if (error) throw error
        revalidatePath('/dashboard/leads')
        return { success: true }
      }
    }

    return { success: true, info: 'Simulated reply scheduled' }
  } catch (error: any) {
    console.error('sendLeadMessageAction error:', error)
    return { success: false, error: error.message }
  }
}
