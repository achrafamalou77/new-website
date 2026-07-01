import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'

const GRAPH_API_VERSION = 'v19.0'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')
  return new OpenAI({ apiKey })
}

async function sendWhatsAppText(phoneNumId: string, token: string, to: string, text: string) {
  const resp = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text.replace(/\*\*(.*?)\*\*/g, '*$1*') }
    })
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(`WhatsApp send failed: ${err?.error?.message || resp.status}`)
  }
  return resp.json()
}

async function sendFbMessengerText(pageToken: string, recipientId: string, text: string) {
  const resp = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${pageToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text.replace(/\*\*(.*?)\*\*/g, '$1') }
    })
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(`FB send failed: ${err?.error?.message || resp.status}`)
  }
  return resp.json()
}

// ─── Message type normalizer ──────────────────────────────────────────────────
function normalizeWhatsAppMessage(waMsg: any): { content: string; messageType: string; mediaUrl?: string; wamid: string } {
  const wamid = waMsg.id
  const type = waMsg.type
  if (type === 'text') return { content: waMsg.text?.body || '', messageType: 'text', wamid }
  if (type === 'image') return { content: '📷 [Image reçue]', messageType: 'image', mediaUrl: waMsg.image?.url, wamid }
  if (type === 'audio') return { content: '🎤 [Message vocal reçu]', messageType: 'audio', mediaUrl: waMsg.audio?.url, wamid }
  if (type === 'document') return { content: `📄 [Document: ${waMsg.document?.filename || 'fichier'}]`, messageType: 'document', mediaUrl: waMsg.document?.url, wamid }
  if (type === 'video') return { content: '🎬 [Vidéo reçue]', messageType: 'video', mediaUrl: waMsg.video?.url, wamid }
  if (type === 'sticker') return { content: '🎴 [Sticker]', messageType: 'sticker', wamid }
  if (type === 'location') {
    const loc = waMsg.location
    return { content: `📍 [Localisation: ${loc?.name || `${loc?.latitude},${loc?.longitude}`}]`, messageType: 'location', wamid }
  }
  if (type === 'contacts') return { content: '👤 [Contact partagé]', messageType: 'contacts', wamid }
  if (type === 'reaction') return { content: `${waMsg.reaction?.emoji || '❤️'} [Réaction]`, messageType: 'reaction', wamid }
  return { content: `[Message type "${type}" non supporté]`, messageType: 'unsupported', wamid }
}

// ─── Human handoff detection ──────────────────────────────────────────────────
const HANDOFF_TRIGGERS = [
  'humain', 'conseiller', 'agent', 'directeur', 'patron', 'parler à quelqu',
  'speak to', 'human agent', 'real person', 'talk to someone',
  'نبي نهدر مع شخص', 'نبي واحد حقيقي', 'مدير', 'responsable',
  'wach 3andi responsable', 'zid liya responsable', 'bdel l bot'
]
function isHumanHandoffRequest(text: string): boolean {
  const lower = text.toLowerCase()
  return HANDOFF_TRIGGERS.some(t => lower.includes(t))
}

// ─── Load live inventory context ─────────────────────────────────────────────
async function loadInventoryContext(agencyId: string, supabase: any): Promise<string> {
  const [salesRes, rentalRes, chatbotRes] = await Promise.allSettled([
    supabase.from('car_sales_inventory').select('brand,model,year,price,color,status,specs').eq('agency_id', agencyId).eq('status', 'available').order('brand'),
    supabase.from('car_rental_fleet').select('brand,model,year,daily_rate,color,status,fuel_type,transmission').eq('agency_id', agencyId).eq('status', 'available').order('brand'),
    supabase.from('agencies').select('company_name,phone,address,city,chatbot_config').eq('id', agencyId).single(),
  ])
  const sales = salesRes.status === 'fulfilled' ? salesRes.value.data || [] : []
  const rental = rentalRes.status === 'fulfilled' ? rentalRes.value.data || [] : []
  const agency = chatbotRes.status === 'fulfilled' ? chatbotRes.value.data : null
  const config = agency?.chatbot_config || {}
  const botName = config?.personality?.bot_name || 'Assistant'
  const handoffMsg = config?.behavior?.handoff_message || 'Je vous mets en contact avec un conseiller.'
  const knowledge = config?.knowledge || {}

  const salesList = sales.map((c: any) => {
    const specs = c.specs || {}
    const price = c.price || specs.selling_price || 0
    return `  • ${c.brand} ${c.model} (${c.year})${c.color ? ` — ${c.color}` : ''} — Prix: ${Number(price).toLocaleString('fr-DZ')} DZD${specs.mileage ? ` — ${Number(specs.mileage).toLocaleString()} km` : ''}`
  }).join('\n')

  const rentalList = rental.map((c: any) => {
    return `  • ${c.brand} ${c.model} (${c.year})${c.color ? ` — ${c.color}` : ''} — ${Number(c.daily_rate).toLocaleString('fr-DZ')} DZD/jour — ${c.fuel_type || ''} ${c.transmission || ''}`
  }).join('\n')

  return `
SOCIÉTÉ: ${agency?.company_name || 'Showroom'}
ADRESSE: ${agency?.address || 'Algérie'} — ${agency?.city || ''}
TÉLÉPHONE: ${agency?.phone || ''}
NOM BOT: ${botName}
MESSAGE HANDOFF: ${handoffMsg}
${knowledge.pricing_rules ? `RÈGLES TARIFAIRES: ${knowledge.pricing_rules}` : ''}

VÉHICULES EN VENTE (stock actuel — UNIQUEMENT ces véhicules existent, n'en inventez aucun autre):
${salesList || '  (aucun véhicule en vente disponible actuellement)'}

VÉHICULES EN LOCATION (disponibles MAINTENANT):
${rentalList || '  (aucun véhicule de location disponible actuellement)'}
`.trim()
}

// ─── AI reply generator ──────────────────────────────────────────────────────
async function generateAiReply(
  customerMessage: string,
  messageType: string,
  history: Array<{role: 'user'|'assistant', content: string}>,
  inventoryContext: string,
  platform: string
): Promise<string | null> {
  try {
    const openai = getOpenAI()

    const systemPrompt = `Tu es un assistant commercial expert pour un showroom automobile algérien. Tu communiques avec des clients via ${platform === 'whatsapp' ? 'WhatsApp' : platform === 'facebook' ? 'Facebook Messenger' : 'Instagram'}.\n\n${inventoryContext}\n\n═══════════════ RÈGLES ABSOLUES — NE JAMAIS ENFREINDRE ═══════════════\n\n1. INTERDICTION D'INVENTER:\n   - Ne cite JAMAIS un véhicule qui n'est PAS dans la liste ci-dessus\n   - Ne donne JAMAIS un prix que tu n'as pas vu dans les données\n   - Ne confirme JAMAIS la disponibilité d'un véhicule non listé comme "available"\n   - Ne dis JAMAIS "oui nous avons" pour un véhicule absent du stock\n   - Si le véhicule demandé n'est pas en stock: "Ce véhicule n'est pas disponible actuellement dans notre stock. Voici ce que nous avons: [liste]"\n\n2. VISA, DOUANE, PAIEMENT:\n   - Ne confirme JAMAIS le statut d'un visa, d'un dédouanement, ou d'un paiement\n   - Si on demande: "Pour toute information sur votre dossier douanier ou visa, veuillez contacter directement notre équipe."\n\n3. HANDOFF HUMAIN:\n   - Si le client demande un conseiller/agent/humain/responsable/directeur: réponds avec le message de handoff et RIEN D'AUTRE\n   - Handoff message: (utilise le message configuré dans le contexte ci-dessus)\n\n4. LANGUES (CRITIQUE):\n   - Détecte la langue de CHAQUE message et réponds EXACTEMENT dans la même langue/dialecte\n   - Darja algérien (ex: "wach 3andi", "nakri", "kra", "tonobil", "bzaf"): réponds en Darja arabe (écriture arabe)\n   - Si l'utilisateur mélange ("wach 3andi des voitures disponibles"): mélange aussi naturellement\n   - Français: réponds en français\n   - Anglais: réponds en anglais\n   - Arabe standard: réponds en arabe standard\n   - Accepte les fautes d'orthographe: "tonobil"="voiture", "diponible"="disponible", "karosa"="voiture", "besh"="combien"\n\n5. FORMAT:\n   - ${platform === 'whatsapp' ? 'WhatsApp: utilise *gras* (pas **), émojis modérés' : 'Texte simple, émojis modérés'}\n   - Réponses concises (max 5 lignes), amicales, professionnelles\n   - Termine toujours par une question pour qualifier le lead: budget? délai d'achat? financement?\n   - Ne révèle jamais que tu es une IA si l'utilisateur ne le demande pas explicitement\n\n6. MESSAGES MÉDIAS:\n   - Image reçue: "Merci pour la photo ! Que puis-je faire pour vous ?"\n   - Vocal/Audio: "Je ne peux pas écouter les messages vocaux. Pouvez-vous m'écrire votre question ?"\n   - Document: "Merci pour le document. Notre équipe va le traiter. Avez-vous des questions ?"\n   - Type non supporté: "Je n'ai pas pu lire ce message. Pouvez-vous l'écrire en texte ?"`

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: customerMessage }
    ]

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 400,
    })

    return completion.choices[0]?.message?.content?.trim() || null
  } catch (err: any) {
    console.error('[meta/process] OpenAI error:', err?.message)
    return null
  }
}

// ─── Main processor ───────────────────────────────────────────────────────────
async function loadBusinessAiContext(agencyId: string, supabase: any): Promise<{ context: string; vertical: string }> {
  const [agencyRes, productsRes, shippingRes, salesRes, rentalRes] = await Promise.allSettled([
    supabase.from('agencies').select('company_name,phone,address,city,chatbot_config,business_type_slug').eq('id', agencyId).single(),
    supabase.from('ecommerce_products').select('sku,name,description,category,brand,price,compare_at_price,stock_quantity,variants,status').eq('agency_id', agencyId).eq('status', 'active').order('is_featured', { ascending: false }).limit(30),
    supabase.from('ecommerce_shipping_zones').select('name,carrier,wilayas,base_fee,cod_enabled,estimated_days,is_active').eq('agency_id', agencyId).eq('is_active', true).limit(12),
    supabase.from('car_sales_inventory').select('brand,model,year,price,color,status,specs').eq('agency_id', agencyId).eq('status', 'available').order('brand'),
    supabase.from('car_rental_fleet').select('brand,model,year,daily_rate,color,status,fuel_type,transmission').eq('agency_id', agencyId).eq('status', 'available').order('brand'),
  ])

  const agency = agencyRes.status === 'fulfilled' ? agencyRes.value.data : null
  const products = productsRes.status === 'fulfilled' ? productsRes.value.data || [] : []
  const shippingZones = shippingRes.status === 'fulfilled' ? shippingRes.value.data || [] : []
  const sales = salesRes.status === 'fulfilled' ? salesRes.value.data || [] : []
  const rental = rentalRes.status === 'fulfilled' ? rentalRes.value.data || [] : []
  const config = agency?.chatbot_config || {}
  const knowledge = config?.knowledge || {}
  const vertical = agency?.business_type_slug || 'travel_agency'

  const shared = [
    `BUSINESS: ${agency?.company_name || 'Business'}`,
    `TYPE: ${vertical}`,
    `ADDRESS: ${agency?.address || 'Algerie'} ${agency?.city || ''}`.trim(),
    `PHONE: ${agency?.phone || ''}`,
    `BOT NAME: ${config?.personality?.bot_name || 'Assistant'}`,
    `HANDOFF MESSAGE: ${config?.behavior?.handoff_message || 'Un conseiller va vous contacter bientot.'}`,
    knowledge.pricing_rules ? `PRICING RULES: ${knowledge.pricing_rules}` : '',
    knowledge.faq ? `FAQ: ${knowledge.faq}` : '',
  ].filter(Boolean).join('\n')

  if (vertical === 'ecommerce') {
    const productList = products.map((p: any) => {
      const variants = Array.isArray(p.variants) ? p.variants : []
      const variantText = variants.length
        ? ` | variants: ${variants.map((v: any) => [v.size, v.color, v.name].filter(Boolean).join('/')).filter(Boolean).slice(0, 6).join(', ')}`
        : ''
      return `- ${p.name}${p.brand ? ` (${p.brand})` : ''} | ${Number(p.price || 0).toLocaleString('fr-DZ')} DZD | stock: ${Number(p.stock_quantity || 0)} | category: ${p.category || 'general'}${variantText}`
    }).join('\n')

    const shippingList = shippingZones.map((z: any) => {
      const wilayas = Array.isArray(z.wilayas) ? z.wilayas.join(', ') : String(z.wilayas || '')
      return `- ${z.name}${z.carrier ? ` (${z.carrier})` : ''} | ${Number(z.base_fee || 0).toLocaleString('fr-DZ')} DZD | COD: ${z.cod_enabled ? 'yes' : 'no'}${z.estimated_days ? ` | ${z.estimated_days}` : ''}${wilayas ? ` | wilayas: ${wilayas}` : ''}`
    }).join('\n')

    return {
      vertical,
      context: `${shared}

ACTIVE PRODUCTS:
${productList || '- No active products configured.'}

SHIPPING:
${shippingList || '- No shipping zones configured.'}

ECOMMERCE RULES:
- Qualify product, size/color, quantity, city, address, phone number, and payment preference.
- Never confirm payment, delivery, or stock that is not listed.
- If stock is 0 or unclear, say the team will confirm availability.
- Payment on delivery is only available when the shipping zone says COD yes.`
    }
  }

  if (vertical === 'car_showroom') {
    const salesList = sales.map((c: any) => {
      const specs = c.specs || {}
      const price = c.price || specs.selling_price || 0
      return `- ${c.brand} ${c.model} (${c.year})${c.color ? ` ${c.color}` : ''} | ${Number(price).toLocaleString('fr-DZ')} DZD`
    }).join('\n')
    const rentalList = rental.map((c: any) => `- ${c.brand} ${c.model} (${c.year}) | ${Number(c.daily_rate || 0).toLocaleString('fr-DZ')} DZD/day`).join('\n')

    return {
      vertical,
      context: `${shared}

AVAILABLE SALE CARS:
${salesList || '- No sale cars available.'}

AVAILABLE RENTAL CARS:
${rentalList || '- No rental cars available.'}`
    }
  }

  return {
    vertical,
    context: `${shared}

GENERAL AGENCY RULES:
- Help qualify the customer need.
- Do not invent prices, availability, payment status, bookings, or confirmations.
- If details are missing, ask a useful follow-up question.`
  }
}

async function generateVerticalAiReply(
  customerMessage: string,
  messageType: string,
  history: Array<{role: 'user'|'assistant', content: string}>,
  businessContext: string,
  platform: string,
  vertical: string
): Promise<string | null> {
  try {
    const openai = getOpenAI()
    const systemPrompt = `You are an Algerian sales assistant for a "${vertical}" business. You reply on ${platform === 'whatsapp' ? 'WhatsApp' : platform === 'facebook' ? 'Facebook Messenger' : 'Instagram'}.

${businessContext}

ABSOLUTE RULES:
1. Tenant isolation: use only this business context. Never mention another agency or another business type.
2. No hallucinations: never invent products, cars, prices, stock, delivery, payment, or booking confirmations.
3. If the data is missing, say the team will confirm and ask for the missing details.
4. For ecommerce, qualify: product, size/color, quantity, city, address, phone number, payment preference.
5. If the customer asks for a human/agent/responsable/directeur, send only the configured handoff message.
6. Language:
   - If the customer writes Algerian Darja, even in Latin letters, answer in Algerian Darja written with Arabic letters.
   - Use natural Algerian words: واش، كاين، شحال، تحب، نأكدلك، التوصيل، المقاس، اللون، الكمية، الولاية.
   - Do not switch to formal Arabic for Darja users. Prefer Algerian phrasing like: "كاين"، "السعر تاعو"، "الدليفري للعاصمة"، "تحب نأكدلك الطلب؟"، "ابعثلي الولاية والمقاس".
   - If the customer mixes Darja and French, answer mostly in Arabic-letter Darja with simple technical words if needed.
   - French to French, English to English, Modern Arabic to clear Arabic.
7. Style:
   - Keep replies under 5 lines.
   - Warm, useful, professional, like an Algerian seller.
   - Use 1 to 3 emojis maximum.
   - On WhatsApp use *bold* only when useful, never markdown double stars.
   - End with a useful question that moves the sale forward.
8. Media:
   - Image: "يعطيك الصحة على الصورة 📸 واش تحب نأكدلك عليها؟"
   - Audio: "ما نقدرش نسمع الفوكال هنا، اكتبلي واش تحتاج ونعاونك 😊"
   - Document: "وصلني الدوكيمون، الفريق يشوفو ونرجعولك. تحب نعاونك في حاجة اخرى؟"`

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: customerMessage }
    ]

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.35,
      max_tokens: 320,
    })

    return completion.choices[0]?.message?.content?.trim() || null
  } catch (err: any) {
    console.error('[meta/process] OpenAI error:', err?.message)
    return null
  }
}

async function processMessage(payload: any) {
  const supabase = createAdminClient() as any

  const agencyId = payload._agency_id
  const accessToken = payload._meta_access_token
  const phoneNumId = payload._whatsapp_phone_number_id

  if (!agencyId) { console.warn('[meta/process] No _agency_id in payload'); return }

  const { data: agencyGate } = await supabase
    .from('agencies')
    .select('status')
    .eq('id', agencyId)
    .maybeSingle()

  if (agencyGate?.status !== 'active') {
    console.warn(`[meta/process] Agency ${agencyId} is not active; skipping message processing`)
    return
  }

  const object = payload.object

  // ─── WhatsApp ────────────────────────────────────────────────────────────
  if (object === 'whatsapp_business_account') {
    const changes = payload.entry?.[0]?.changes || []
    for (const change of changes) {
      const value = change.value
      const messages = value?.messages || []
      for (const waMsg of messages) {
        const senderPhone = waMsg.from
        const normalized = normalizeWhatsAppMessage(waMsg)
        const { content, messageType, mediaUrl, wamid } = normalized

        // Deduplicate via wamid
        const { data: existing } = await supabase
          .from('conversation_messages')
          .select('id')
          .eq('wamid', wamid)
          .maybeSingle()
        if (existing) { console.log(`[meta/process] Duplicate wamid ${wamid}, skipping`); continue }

        // Insert customer message — trigger auto-creates/updates conversation
        await supabase.from('conversation_messages').insert({
          agency_id: agencyId,
          sender_id: senderPhone,
          platform: 'whatsapp',
          role: 'user',
          content,
          message_type: messageType,
          media_url: mediaUrl || null,
          wamid,
          metadata: waMsg
        })

        // Look up conversation to get ai_status
        const { data: conv } = await supabase
          .from('conversations')
          .select('id, ai_status')
          .eq('agency_id', agencyId)
          .eq('customer_phone', senderPhone)
          .eq('platform', 'whatsapp')
          .single()

        if (!conv || conv.ai_status === false) {
          console.log(`[meta/process] AI off for ${senderPhone}, skipping reply`)
          continue
        }

        // Human handoff check
        if (isHumanHandoffRequest(content)) {
          await supabase.from('conversations').update({ ai_status: false }).eq('id', conv.id)
          const { data: agencyData } = await supabase.from('agencies').select('chatbot_config').eq('id', agencyId).single()
          const handoffMsg = agencyData?.chatbot_config?.behavior?.handoff_message || 'Un conseiller va vous contacter bientôt. Merci de patienter.'
          await sendWhatsAppText(phoneNumId, accessToken, senderPhone, handoffMsg)
          await supabase.from('conversation_messages').insert({
            agency_id: agencyId, sender_id: senderPhone, platform: 'whatsapp',
            role: 'assistant', content: handoffMsg, message_type: 'text', metadata: {}
          })
          continue
        }

        // Build history for AI (last 8 messages from this conversation)
        const { data: history } = await supabase
          .from('conversation_messages')
          .select('content, role, created_at')
          .eq('agency_id', agencyId)
          .eq('sender_id', senderPhone)
          .eq('platform', 'whatsapp')
          .order('created_at', { ascending: false })
          .limit(8)
        const formattedHistory = (history || []).reverse().map((m: any) => ({
          role: (m.role === 'assistant' || m.role === 'system') ? 'assistant' as const : 'user' as const,
          content: m.content
        }))

        // Generate AI reply
        const { context, vertical } = await loadBusinessAiContext(agencyId, supabase)
        const aiReply = await generateVerticalAiReply(content, messageType, formattedHistory, context, 'whatsapp', vertical)
        if (!aiReply) { console.warn('[meta/process] No AI reply generated'); continue }

        // Save AI message before external delivery so failed Meta sends are still visible in the inbox.
        await supabase.from('conversation_messages').insert({
          agency_id: agencyId, sender_id: senderPhone, platform: 'whatsapp',
          role: 'assistant', content: aiReply, message_type: 'text', metadata: {}
        })

        try {
          await sendWhatsAppText(phoneNumId, accessToken, senderPhone, aiReply)
        } catch (err: any) {
          await supabase.from('conversation_messages').insert({
            agency_id: agencyId,
            sender_id: senderPhone,
            platform: 'whatsapp',
            role: 'system',
            content: `Meta Send Error: ${err?.message || 'Unknown send error'}`,
            message_type: 'system',
            metadata: { error: err?.message || String(err) }
          })
          throw err
        }
      }
    }
    return
  }

  // ─── Facebook Messenger ─────────────────────────────────────────────────
  if (object === 'page') {
    const entries = payload.entry || []
    for (const entry of entries) {
      const pageId = entry.id
      const messagings = entry.messaging || []
      for (const msg of messagings) {
        if (!msg.message || msg.message.is_echo) continue
        const senderId = msg.sender?.id
        const content = msg.message?.text || (msg.message?.attachments ? '📎 [Pièce jointe reçue]' : '[Message]')
        const messageType = msg.message?.attachments ? (msg.message.attachments[0]?.type || 'attachment') : 'text'
        const wamid = msg.message?.mid || `fb_${senderId}_${Date.now()}`

        const { data: existing } = await supabase.from('conversation_messages').select('id').eq('wamid', wamid).maybeSingle()
        if (existing) continue

        await supabase.from('conversation_messages').insert({
          agency_id: agencyId, sender_id: senderId, platform: 'facebook',
          role: 'user', content, message_type: messageType, wamid, metadata: msg
        })

        const { data: conv } = await supabase.from('conversations').select('id, ai_status').eq('agency_id', agencyId).eq('customer_phone', senderId).eq('platform', 'facebook').single()
        if (!conv || conv.ai_status === false) continue

        if (isHumanHandoffRequest(content)) {
          await supabase.from('conversations').update({ ai_status: false }).eq('id', conv.id)
          const { data: agencyData } = await supabase.from('agencies').select('chatbot_config').eq('id', agencyId).single()
          const handoffMsg = agencyData?.chatbot_config?.behavior?.handoff_message || 'Un conseiller va vous contacter bientôt.'
          await sendFbMessengerText(accessToken, senderId, handoffMsg)
          await supabase.from('conversation_messages').insert({
            agency_id: agencyId, sender_id: senderId, platform: 'facebook',
            role: 'assistant', content: handoffMsg, message_type: 'text', metadata: {}
          })
          continue
        }

        const { data: history } = await supabase.from('conversation_messages').select('content, role, created_at').eq('agency_id', agencyId).eq('sender_id', senderId).eq('platform', 'facebook').order('created_at', { ascending: false }).limit(8)
        const formattedHistory = (history || []).reverse().map((m: any) => ({ role: (m.role === 'assistant' || m.role === 'system') ? 'assistant' as const : 'user' as const, content: m.content }))

        const { context, vertical } = await loadBusinessAiContext(agencyId, supabase)
        const aiReply = await generateVerticalAiReply(content, messageType, formattedHistory, context, 'facebook', vertical)
        if (!aiReply) continue

        await sendFbMessengerText(accessToken, senderId, aiReply)
        await supabase.from('conversation_messages').insert({
          agency_id: agencyId, sender_id: senderId, platform: 'facebook',
          role: 'assistant', content: aiReply, message_type: 'text', metadata: {}
        })
      }
    }
    return
  }

  // ─── Instagram ──────────────────────────────────────────────────────────
  if (object === 'instagram') {
    const entries = payload.entry || []
    for (const entry of entries) {
      const messagings = entry.messaging || []
      for (const msg of messagings) {
        if (!msg.message || msg.message.is_echo) continue
        const senderId = msg.sender?.id
        const content = msg.message?.text || (msg.message?.attachments ? '📎 [Pièce jointe Instagram]' : '[Message Instagram]')
        const messageType = msg.message?.attachments ? 'attachment' : 'text'
        const wamid = msg.message?.mid || `ig_${senderId}_${Date.now()}`

        const { data: existing } = await supabase.from('conversation_messages').select('id').eq('wamid', wamid).maybeSingle()
        if (existing) continue

        await supabase.from('conversation_messages').insert({
          agency_id: agencyId, sender_id: senderId, platform: 'instagram',
          role: 'user', content, message_type: messageType, wamid, metadata: msg
        })

        const { data: conv } = await supabase.from('conversations').select('id, ai_status').eq('agency_id', agencyId).eq('customer_phone', senderId).eq('platform', 'instagram').single()
        if (!conv || conv.ai_status === false) continue

        if (isHumanHandoffRequest(content)) {
          await supabase.from('conversations').update({ ai_status: false }).eq('id', conv.id)
          const { data: agencyData } = await supabase.from('agencies').select('chatbot_config').eq('id', agencyId).single()
          const handoffMsg = agencyData?.chatbot_config?.behavior?.handoff_message || 'Un conseiller va vous contacter bientôt.'
          // Instagram uses same FB Messenger API endpoint
          await sendFbMessengerText(accessToken, senderId, handoffMsg)
          await supabase.from('conversation_messages').insert({
            agency_id: agencyId, sender_id: senderId, platform: 'instagram',
            role: 'assistant', content: handoffMsg, message_type: 'text', metadata: {}
          })
          continue
        }

        const { data: history } = await supabase.from('conversation_messages').select('content, role, created_at').eq('agency_id', agencyId).eq('sender_id', senderId).eq('platform', 'instagram').order('created_at', { ascending: false }).limit(8)
        const formattedHistory = (history || []).reverse().map((m: any) => ({ role: (m.role === 'assistant' || m.role === 'system') ? 'assistant' as const : 'user' as const, content: m.content }))

        const { context, vertical } = await loadBusinessAiContext(agencyId, supabase)
        const aiReply = await generateVerticalAiReply(content, messageType, formattedHistory, context, 'instagram', vertical)
        if (!aiReply) continue

        await sendFbMessengerText(accessToken, senderId, aiReply)
        await supabase.from('conversation_messages').insert({
          agency_id: agencyId, sender_id: senderId, platform: 'instagram',
          role: 'assistant', content: aiReply, message_type: 'text', metadata: {}
        })
      }
    }
    return
  }

  console.log(`[meta/process] Unknown object type: ${object}`)
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.META_PROCESS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    const providedSecret = request.headers.get('x-meta-process-secret')
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ status: 'forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ status: 'ok' })
    // Fire and forget — Meta requires 200 within 20s
    processMessage(body).catch(err => console.error('[meta/process] Unhandled error:', err))
    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('[meta/process] Route error:', err)
    return NextResponse.json({ status: 'ok' })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Native message processor active', version: '1.0' })
}
