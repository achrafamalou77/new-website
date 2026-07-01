'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getConversationScope(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, agencyId: null, isPlatformOwner: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, is_platform_owner')
    .eq('id', user.id)
    .single()

  return {
    user,
    agencyId: profile?.agency_id || null,
    isPlatformOwner: profile?.is_platform_owner === true,
  }
}

async function getAccessibleConversation(supabase: any, conversationId: string) {
  const scope = await getConversationScope(supabase)
  if (!scope.user) return { success: false, error: 'Unauthorized', conversation: null, scope }
  if (!scope.isPlatformOwner && !scope.agencyId) {
    return { success: false, error: 'Agency not found', conversation: null, scope }
  }

  let query = supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)

  if (!scope.isPlatformOwner) {
    query = query.eq('agency_id', scope.agencyId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) return { success: false, error: error.message, conversation: null, scope }
  if (!data) return { success: false, error: 'Conversation not found', conversation: null, scope }

  return { success: true, error: null, conversation: data, scope }
}

// ─── 1. Fetch conversations ─────────────────────────────────────────────────
// Platform owners (is_platform_owner=true) see ALL conversations across all agencies.
// Regular agency admins/employees see only their own agency's conversations.
export async function getConversations() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized', data: [] }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('agency_id, is_platform_owner')
    .eq('id', user.id)
    .single()

  if (profErr || !profile) {
    return { success: false, error: 'Profile not found', data: [] }
  }

  const isPlatformOwner = (profile as any).is_platform_owner === true
  let businessTypeSlug = 'travel'

  if (profile.agency_id) {
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('business_type_slug')
      .eq('id', profile.agency_id)
      .maybeSingle()
    businessTypeSlug = (agencyData as any)?.business_type_slug || businessTypeSlug
  }

  let query = supabase
    .from('conversations')
    .select(`
      *,
      agencies:agency_id (
        company_name,
        subdomain,
        business_type_slug
      )
    `)
    .order('last_message_at', { ascending: false })

  if (!isPlatformOwner) {
    if (!profile.agency_id) {
      return { success: false, error: 'Agency not found', data: [] }
    }
    query = query.eq('agency_id', profile.agency_id) as any
  }

  const { data, error } = await query

  if (error) {
    console.error('getConversations error:', error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [], isPlatformOwner, businessTypeSlug }
}

// ─── 2. Fetch messages for a conversation ──────────────────────────────────
export async function getMessages(conversationId: string) {
  const supabase = await createClient()

  const access = await getAccessibleConversation(supabase, conversationId)
  if (!access.success) {
    return { success: false, error: access.error, data: [] }
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

// ─── 3. Toggle AI Chatbot status ───────────────────────────────────────────
// ai_status=true  → AI bot is active and will reply automatically
// ai_status=false → Human operator has taken over; processor will skip AI replies
export async function toggleAiStatus(conversationId: string, aiStatus: boolean) {
  const supabase = await createClient()

  const access = await getAccessibleConversation(supabase, conversationId)
  if (!access.success) {
    return { success: false, error: access.error }
  }

  const { error } = await (supabase as any)
    .from('conversations')
    .update({ ai_status: aiStatus })
    .eq('id', conversationId)
    .eq('agency_id', (access.conversation as any).agency_id)

  if (error) {
    console.error('Failed to toggle AI status:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ─── 4. Mark conversation as read ──────────────────────────────────────────
export async function markConversationRead(conversationId: string) {
  const supabase = await createClient()

  const access = await getAccessibleConversation(supabase, conversationId)
  if (!access.success) {
    return { success: false, error: access.error }
  }

  const { error } = await (supabase as any)
    .from('conversations')
    .update({ unread: false })
    .eq('id', conversationId)
    .eq('agency_id', (access.conversation as any).agency_id)

  if (error) {
    console.error('Failed to mark as read:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ─── 5. Update conversation lead score ────────────────────────────────────
export async function updateLeadScore(conversationId: string, score: 'hot' | 'warm' | 'cold') {
  const supabase = await createClient()

  const access = await getAccessibleConversation(supabase, conversationId)
  if (!access.success) {
    return { success: false, error: access.error }
  }

  const { error } = await (supabase as any)
    .from('conversations')
    .update({ lead_score: score })
    .eq('id', conversationId)
    .eq('agency_id', (access.conversation as any).agency_id)

  if (error) {
    console.error('Failed to update lead score:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ─── 6. Send a human reply via Meta API ───────────────────────────────────
// Sends the message to the customer's phone/messenger and records it in DB.
// The DB trigger on conversation_messages will auto-update conversations.last_message_at.
export async function sendHumanMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient() as any

  const access = await getAccessibleConversation(supabase, conversationId)
  if (!access.success || !access.conversation) {
    return { success: false, error: access.error || 'Conversation not found' }
  }

  const conv = access.conversation as any
  const agency_id = conv.agency_id
  const senderId = conv.customer_phone
  const platform = conv.platform

  // Load Meta credentials from meta_integrations (per-agency authoritative source)
  const { data: metaInt } = await adminSupabase
    .from('meta_integrations')
    .select('whatsapp_access_token, whatsapp_phone_number_id, facebook_page_access_token')
    .eq('agency_id', agency_id)
    .maybeSingle()

  const META_TOKEN =
    (platform === 'whatsapp' ? metaInt?.whatsapp_access_token : metaInt?.facebook_page_access_token) ||
    process.env.META_ACCESS_TOKEN

  const PHONE_NUM_ID =
    metaInt?.whatsapp_phone_number_id ||
    process.env.META_PHONE_NUMBER_ID

  if (!META_TOKEN) {
    return { success: false, error: 'No Meta access token configured for this agency.' }
  }

  const cleanForMeta = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1')
  const cleanForWhatsApp = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '*$1*')

  try {
    if (platform === 'whatsapp') {
      if (!PHONE_NUM_ID) return { success: false, error: 'WhatsApp phone number ID not configured.' }
      const resp = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUM_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: senderId,
          type: 'text',
          text: { body: cleanForWhatsApp(content) }
        })
      })
      const response = await resp.json()
      if (!resp.ok) throw new Error(response.error?.message || `Meta API error: ${resp.status}`)

    } else if (platform === 'instagram' || platform === 'facebook') {
      const resp = await fetch('https://graph.facebook.com/v19.0/me/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: cleanForMeta(content) }
        })
      })
      const response = await resp.json()
      if (!resp.ok) throw new Error(response.error?.message || `Meta API error: ${resp.status}`)
    }

    // Save human reply to conversation_messages — the Postgres trigger syncs it to messages table
    const { error: insertErr } = await (supabase as any)
      .from('conversation_messages')
      .insert({
        agency_id,
        sender_id: senderId,
        platform,
        role: 'human',
        content,
        message_type: 'text',
        metadata: {}
      })

    if (insertErr) {
      console.error('Failed to save message to DB:', insertErr)
      return { success: false, error: insertErr.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('sendHumanMessage error:', err.message)
    return { success: false, error: err.message }
  }
}
