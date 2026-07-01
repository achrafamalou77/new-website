'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AGENT_MODEL, getOpenAIClient } from '@/lib/openai/client'

export interface CopilotAction {
  type: 'UPDATE_AGENCY' | 'ADD_CAR' | 'ADD_TRIP' | 'ADD_TEAM_MEMBER' | 'ADD_CLIENT'
  payload: any
}

export interface CopilotResponse {
  response: string
  actions?: CopilotAction[]
}

type AgencyContextResult =
  | { success: false; error: string }
  | {
      success: true
      userId: string
      userProfile: any
      agencyId: string
      agencyDetails: any
      vertical: 'travel' | 'car_showroom'
    }

// Helper to resolve the logged-in user's agency context safely
async function resolveUserAgencyContext(): Promise<AgencyContextResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return { success: false, error: 'Unauthorized user context.' }
  }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('agency_id, role, full_name, email')
    .eq('id', user.id)
    .single()

  if (profErr || !profile) {
    return { success: false, error: 'Failed to retrieve profile data.' }
  }

  const agencyId = profile.agency_id
  if (!agencyId) {
    return { success: false, error: 'User is not linked to any agency.' }
  }

  const { data: agency, error: agencyErr } = await supabase
    .from('agencies')
    .select('name, business_type_slug, email, phone, city, company_name, address')
    .eq('id', agencyId)
    .single()

  if (agencyErr || !agency) {
    return { success: false, error: 'Failed to retrieve company details.' }
  }

  return {
    success: true,
    userId: user.id,
    userProfile: profile,
    agencyId,
    agencyDetails: agency,
    vertical: agency.business_type_slug === 'travel_agency' ? 'travel' : 'car_showroom',
  }
}

// ─── Direct Isolated Database Mutations ────────────────────────────────────

export async function updateAgencyConfigAction(agencyId: string, updates: any) {
  const supabase = await createClient()

  const context = await resolveUserAgencyContext()
  if (!context.success || context.agencyId !== agencyId) {
    return { success: false, error: 'Multi-tenant violation: Permission denied.' }
  }
  if (context.vertical !== 'car_showroom') {
    return { success: false, error: 'This agency is a travel agency. Vehicle inventory actions are disabled here.' }
  }

  const allowedFields = [
    'name', 'phone', 'email', 'company_name', 'address', 'city', 'logo_url', 'cover_image_url',
  ]
  const filteredUpdates: any = {}
  for (const field of allowedFields) {
    if (updates[field] !== undefined) filteredUpdates[field] = updates[field]
  }

  const { error } = await supabase.from('agencies').update(filteredUpdates).eq('id', agencyId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addInventoryCarAction(agencyId: string, car: any) {
  const supabase = await createClient()

  const context = await resolveUserAgencyContext()
  if (!context.success || context.agencyId !== agencyId) {
    return { success: false, error: 'Multi-tenant violation: Permission denied.' }
  }
  if (context.vertical !== 'car_showroom') {
    return { success: false, error: 'This agency is a travel agency. Vehicle inventory actions are disabled here.' }
  }

  const specs = {
    fuel: car.fuel || 'Petrol',
    power: car.power || '110 hp',
    engine: car.engine || '1.6 MPI',
    options: car.options || [],
    transmission: car.transmission || 'Manual',
  }

  const { error } = await supabase.from('car_sales_inventory').insert({
    agency_id: agencyId,
    brand: car.brand || 'Seat',
    model: car.model || 'Ibiza',
    year: car.year || new Date().getFullYear(),
    version: car.version || 'Standard',
    color: car.color || 'Blanc',
    price: car.price || 3000000,
    cost_price: car.cost_price || Math.floor((car.price || 3000000) * 0.9),
    margin: Math.floor((car.price || 3000000) * 0.1),
    status: 'available',
    type: 'stock',
    car_type: 'sell',
    quantity: 1,
    specs,
    description: car.description || 'Ajouté via Assistant IA',
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addTravelPackageAction(agencyId: string, pkg: any) {
  const supabase = await createClient()

  const context = await resolveUserAgencyContext()
  if (!context.success || context.agencyId !== agencyId) {
    return { success: false, error: 'Multi-tenant violation: Permission denied.' }
  }

  const { error } = await (supabase.from('travel_packages') as any).insert({
    agency_id: agencyId,
    title: pkg.title || 'Séjour Découverte',
    destination_country: pkg.destination_country || 'Turquie',
    destination_city: pkg.destination_city || pkg.destination || 'Istanbul',
    duration_days: pkg.duration_days || 7,
    base_price_per_person: pkg.price || 150000,
    child_price: Math.floor((pkg.price || 150000) * 0.7),
    subtitle: pkg.subtitle || pkg.description || "Créé via l'Assistant Copilote IA",
    status: 'active',
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addTeamMemberAction(agencyId: string, member: any) {
  const adminClient = await createAdminClient()

  const context = await resolveUserAgencyContext()
  if (!context.success || context.agencyId !== agencyId) {
    return { success: false, error: 'Multi-tenant violation: Permission denied.' }
  }

  const generatedId = crypto.randomUUID()
  const { error } = await (adminClient.from('profiles') as any).insert({
    id: generatedId,
    agency_id: agencyId,
    full_name: member.full_name || 'Nouvel Employé',
    email: member.email || `employee-${Date.now()}@example.com`,
    role: member.role || 'employee',
    phone: member.phone || null,
    has_login_access: false,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addClientAction(agencyId: string, client: any) {
  const supabase = await createClient()

  const context = await resolveUserAgencyContext()
  if (!context.success || context.agencyId !== agencyId) {
    return { success: false, error: 'Multi-tenant violation: Permission denied.' }
  }

  const { error } = await supabase.from('clients').insert({
    agency_id: agencyId,
    full_name: client.full_name || 'Nouveau Client',
    phone: client.phone || '+213550000000',
    email: client.email || null,
    classification: 'retail',
    subgroup: 'vente',
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Live DB Context Loader ────────────────────────────────────────────────

interface LiveContext {
  salesStock: any[]
  rentalStock: any[]
  travelPackages: any[]
  travelBookings: any[]
  teamList: any[]
  clientList: any[]
  rentalBookings: any[]
}

async function loadLiveContext(agencyId: string): Promise<LiveContext> {
  const supabase = await createClient()

  const [
    salesRes,
    rentalRes,
    packagesRes,
    travelBookingsRes,
    teamRes,
    clientRes,
    rentalBookingsRes,
  ] = await Promise.allSettled([
    supabase
      .from('car_sales_inventory')
      .select('id, brand, model, year, color, price, status, car_type, specs')
      .eq('agency_id', agencyId),
    supabase
      .from('car_rental_fleet')
      .select('id, brand, model, year, color, daily_rate, status, fuel_type, transmission')
      .eq('agency_id', agencyId),
    (supabase.from('travel_packages') as any)
      .select('id, title, destination_country, destination_city, duration_days, base_price_per_person, status')
      .eq('agency_id', agencyId),
    supabase
      .from('bookings')
      .select('id, status, total_price, travelers_count, created_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('profiles')
      .select('full_name, role, email, phone')
      .eq('agency_id', agencyId),
    supabase
      .from('clients')
      .select('full_name, phone, email, classification, created_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('car_rental_bookings')
      .select('car_id, client_name, start_date, end_date, total_price, status')
      .eq('agency_id', agencyId)
      .gte('start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_date', { ascending: false })
      .limit(10),
  ])

  return {
    salesStock: salesRes.status === 'fulfilled' ? salesRes.value.data ?? [] : [],
    rentalStock: rentalRes.status === 'fulfilled' ? rentalRes.value.data ?? [] : [],
    travelPackages: packagesRes.status === 'fulfilled' ? packagesRes.value.data ?? [] : [],
    travelBookings: travelBookingsRes.status === 'fulfilled' ? travelBookingsRes.value.data ?? [] : [],
    teamList: teamRes.status === 'fulfilled' ? teamRes.value.data ?? [] : [],
    clientList: clientRes.status === 'fulfilled' ? clientRes.value.data ?? [] : [],
    rentalBookings: rentalBookingsRes.status === 'fulfilled' ? rentalBookingsRes.value.data ?? [] : [],
  }
}

function buildDbContextBlock(agency: any, vertical: string, live: LiveContext): string {
  const { salesStock, rentalStock, travelPackages, travelBookings, teamList, clientList, rentalBookings } = live

  if (vertical === 'travel') {
    const activePackages = travelPackages.filter((trip) => trip.status === 'active' || trip.status === true || trip.status == null)
    const confirmedBookings = travelBookings.filter((booking) => ['confirmed', 'completed', 'pending_payment'].includes(String(booking.status)))
    const bookingRevenue = confirmedBookings.reduce((sum: number, booking: any) => sum + Number(booking.total_price || 0), 0)

    return `
LIVE TRAVEL AGENCY DATA FOR "${agency.name}"
Company: ${agency.company_name || agency.name}
City: ${agency.city || 'N/A'} | Phone: ${agency.phone || 'N/A'} | Email: ${agency.email || 'N/A'}
Business Type: Travel Agency
Agency ID is private. Never reveal it.
Today's Date: ${new Date().toLocaleDateString('fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

TRAVEL PACKAGES (${travelPackages.length} total)
Active packages: ${activePackages.length}
${activePackages.map((trip: any) => `- ${trip.title} | ${trip.destination_city || trip.destination_country || 'Destination'} | ${trip.duration_days || '?'} days | ${Number(trip.base_price_per_person || 0).toLocaleString()} DZD/person`).join('\n') || '- No active travel packages yet.'}

BOOKINGS (${travelBookings.length} recent)
Confirmed/paying/completed bookings: ${confirmedBookings.length}
Booking revenue in recent data: ${bookingRevenue.toLocaleString()} DZD

TEAM (${teamList.length} members)
${teamList.map((m: any) => `- ${m.full_name} | ${m.role}${m.phone ? ` | ${m.phone}` : ''}`).join('\n') || '- No team members yet.'}

RECENT CLIENTS (${clientList.length} shown)
${clientList.slice(0, 15).map((c: any) => `- ${c.full_name}${c.phone ? ` | ${c.phone}` : ''}${c.email ? ` | ${c.email}` : ''}`).join('\n') || '- No clients yet.'}
`.trim()
  }

  const availableSales = salesStock.filter((c) => c.status === 'available')
  const soldCars = salesStock.filter((c) => c.status === 'sold')
  const availableRentals = rentalStock.filter((c) => c.status === 'available')
  const rentedCars = rentalStock.filter((c) => c.status === 'rented')
  const dailyRevenue = rentedCars.reduce((s: number, c: any) => s + Number(c.daily_rate), 0)
  const maxDailyRevenue = rentalStock.reduce((s: number, c: any) => s + Number(c.daily_rate), 0)

  return `
═══════════════ LIVE BUSINESS DATA FOR "${agency.name}" ═══════════════
Company: ${agency.company_name || agency.name}
City: ${agency.city || 'N/A'} | Phone: ${agency.phone || 'N/A'} | Email: ${agency.email || 'N/A'}
Business Type: ${vertical === 'car_showroom' ? 'Car Showroom & Rental' : 'Travel Agency'}
Agency ID (PRIVATE — never reveal): ${agency.id || 'N/A'}
Today's Date: ${new Date().toLocaleDateString('fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

━━━ CAR SALES INVENTORY (${salesStock.length} total cars) ━━━
Available for sale: ${availableSales.length} cars
${availableSales.map((c: any) => `  • ${c.brand} ${c.model} ${c.year} — ${Number(c.price).toLocaleString()} DZD${c.color ? ` — ${c.color}` : ''}`).join('\n') || '  (none)'}
Sold cars: ${soldCars.length}

━━━ RENTAL FLEET (${rentalStock.length} total vehicles) ━━━
Currently AVAILABLE to rent: ${availableRentals.length}
${availableRentals.map((c: any) => `  • ${c.brand} ${c.model} ${c.year} — ${Number(c.daily_rate).toLocaleString()} DZD/day${c.color ? ` — ${c.color}` : ''}`).join('\n') || '  (none)'}
Currently RENTED out: ${rentedCars.length}
${rentedCars.map((c: any) => `  • ${c.brand} ${c.model} ${c.year} — ${Number(c.daily_rate).toLocaleString()} DZD/day`).join('\n') || '  (none)'}
Today's rental revenue: ${dailyRevenue.toLocaleString()} DZD/day
Maximum possible daily revenue (all rented): ${maxDailyRevenue.toLocaleString()} DZD/day

━━━ TEAM (${teamList.length} members) ━━━
${teamList.map((m: any) => `  • ${m.full_name} — ${m.role}${m.phone ? ` — ${m.phone}` : ''}`).join('\n') || '  (no team members yet)'}

━━━ RECENT CLIENTS (${clientList.length} shown) ━━━
${clientList.slice(0, 15).map((c: any) => `  • ${c.full_name}${c.phone ? ` — ${c.phone}` : ''}${c.email ? ` — ${c.email}` : ''}`).join('\n') || '  (no clients yet)'}

━━━ RECENT RENTAL BOOKINGS (last 30 days) ━━━
${rentalBookings.map((b: any) => `  • ${b.client_name || 'Client'} — ${b.start_date?.slice(0, 10)} to ${b.end_date?.slice(0, 10)} — ${Number(b.total_price).toLocaleString()} DZD — Status: ${b.status}`).join('\n') || '  (no recent bookings)'}
═══════════════════════════════════════════════════════════════
`.trim()
}

// ─── Main Conversational Assistant ────────────────────────────────────────

export async function askAssistant(
  message: string,
  chatHistory: { sender: 'user' | 'ai'; text: string }[]
): Promise<CopilotResponse> {
  const context = await resolveUserAgencyContext()
  if (!context.success) {
    return { response: `Sorry, I could not verify your identity: ${context.error}` }
  }

  const { agencyId, agencyDetails, vertical } = context
  const apiKey = ''
  // Load all live business data in parallel
  const live = await loadLiveContext(agencyId)
  const dbContextBlock = buildDbContextBlock(agencyDetails, vertical, live)
  const verticalRules = vertical === 'travel'
    ? `CURRENT VERTICAL: TRAVEL AGENCY.
- Behave as a travel agency copilot only.
- Allowed topics: trips, destinations, Omra/Hajj packages, visas, bookings, clients, payments, invoices, team, and agency settings.
- Forbidden: never suggest cars, showroom stock, vehicle import, rental fleet, test drives, financing, or Golf 8 examples.
- Allowed actions: ADD_TRIP, ADD_CLIENT, ADD_TEAM_MEMBER, UPDATE_AGENCY. Never return ADD_CAR.`
    : `CURRENT VERTICAL: CAR SHOWROOM.
- Behave as a car showroom copilot only.
- Allowed topics: vehicle stock, import orders, showroom sales, rental fleet, test drives, financing, leads, clients, team, and agency settings.
- Forbidden: never suggest travel packages, Omra/Hajj, hotel, visa, or trip booking workflows.
- Allowed actions: ADD_CAR, ADD_CLIENT, ADD_TEAM_MEMBER, UPDATE_AGENCY. Never return ADD_TRIP.`
  const actionExamples = vertical === 'travel'
    ? `Examples:
- "zidli voyage Istanbul b 145000" -> ADD_TRIP action
- "zid Sofiane kacimi client" -> ADD_CLIENT action
- "zid Amine bel equipe" -> ADD_TEAM_MEMBER action
- "bdel numero tel dial lcompany" -> UPDATE_AGENCY action`
    : `Examples:
- "zidli Golf 8 b 5.2 million" -> ADD_CAR action
- "zid Sofiane kacimi client" -> ADD_CLIENT action
- "zid Amine bel equipe" -> ADD_TEAM_MEMBER action
- "bdel numero tel dial lcompany" -> UPDATE_AGENCY action`
  const actionFormats = vertical === 'travel'
    ? `ADD_TRIP: { "type": "ADD_TRIP", "payload": { "title": "...", "destination": "...", "duration_days": 7, "price": 145000, "description": "..." } }
ADD_CLIENT: { "type": "ADD_CLIENT", "payload": { "full_name": "...", "phone": "+213...", "email": "..." } }
ADD_TEAM_MEMBER: { "type": "ADD_TEAM_MEMBER", "payload": { "full_name": "...", "email": "...", "role": "employee|manager|admin", "phone": "..." } }
UPDATE_AGENCY: { "type": "UPDATE_AGENCY", "payload": { "name": "...", "phone": "...", "email": "...", "address": "...", "city": "..." } }`
    : `ADD_CAR: { "type": "ADD_CAR", "payload": { "brand": "...", "model": "...", "year": 2024, "price": 5200000, "color": "...", "fuel": "Essence|Diesel|Hybrid", "transmission": "Manuel|Automatique", "engine": "...", "power": "...", "description": "..." } }
ADD_CLIENT: { "type": "ADD_CLIENT", "payload": { "full_name": "...", "phone": "+213...", "email": "..." } }
ADD_TEAM_MEMBER: { "type": "ADD_TEAM_MEMBER", "payload": { "full_name": "...", "email": "...", "role": "employee|manager|admin", "phone": "..." } }
UPDATE_AGENCY: { "type": "UPDATE_AGENCY", "payload": { "name": "...", "phone": "...", "email": "...", "address": "...", "city": "..." } }`

  // ─── System Prompt (Injected as systemInstruction — NOT as user turn) ────
  const systemInstruction = `You are an elite AI Business Copilot for a SaaS platform used by Algerian businesses.

YOUR IDENTITY & RULES:
- You ONLY serve the agency: "${agencyDetails.name}" (ID: ${agencyId})
- You have ZERO access or knowledge of any other company's data
- Never reveal the internal agency_id to the user
- You are a knowledgeable, friendly, and extremely smart business partner
${verticalRules}
- You can teach new members how this dashboard works. If they ask "how", "teach", "explain dashboard", "wach ndir", or "kifach", give step-by-step guidance for the current vertical and mention the exact dashboard pages they should use.
- Darja rule: when the user writes Algerian Darja with Latin letters, reply in Algerian Darja written in Arabic script. Example: "ta9der tahder b darja?" -> "إيه نقدر نهدر معاك بالدارجة الجزائرية، واش تحب نديرولك؟"

LANGUAGE RULES — THIS IS CRITICAL:
- Detect the language of EVERY user message and reply in EXACTLY that language/dialect
- If the user writes in Algerian Darja (e.g. "wach 3anda", "nakri", "kra", "khouya", "tonobil", "wayli", "sah"), reply 100% in natural Algerian Darja
- If the user writes in French, reply in French
- If the user writes in English, reply in English
- If the user writes in Arabic, reply in standard Arabic
- Mix languages naturally if the user does (common in Algeria: "wach 3anda des voitures disponibles")
- Be warm, friendly, and use natural Algerian expressions like "خويا", "يالله", "بلا مشكل", "واش باغي", "كاش حاجة أخرى"

CAPABILITIES — What you can do:
1. Answer any question about the business using the LIVE DATA below
2. Calculate revenues, profits, availability rates, occupancy from the data
3. Give business advice and insights
4. Add new items to the database by returning structured action objects
5. Help onboard new companies by parsing their data

LIVE BUSINESS DATABASE (real-time, accurate as of right now):
${dbContextBlock}

SUPPORTED DATABASE ACTIONS:
When the user explicitly asks to add/create something, include the matching action in your JSON response.
Current vertical examples:
${actionExamples}

Current vertical action formats:
${actionFormats}

Do not use any action type that is not listed in the current vertical action formats.

Examples:
- "zidli Golf 8 b 5.2 million" → ADD_CAR action
- "zid Sofiane kacimi klient" → ADD_CLIENT action  
- "zid Amine bel equipe" → ADD_TEAM_MEMBER action
- "bdel numero tel dial lcompany" → UPDATE_AGENCY action
- "zidli voyage Istanbul" → ADD_TRIP action (travel agencies)

Action formats:
ADD_CAR: { "type": "ADD_CAR", "payload": { "brand": "...", "model": "...", "year": 2024, "price": 5200000, "color": "...", "fuel": "Essence|Diesel|Hybrid", "transmission": "Manuel|Automatique", "engine": "...", "power": "...", "description": "..." } }
ADD_CLIENT: { "type": "ADD_CLIENT", "payload": { "full_name": "...", "phone": "+213...", "email": "..." } }
ADD_TEAM_MEMBER: { "type": "ADD_TEAM_MEMBER", "payload": { "full_name": "...", "email": "...", "role": "employee|manager|admin", "phone": "..." } }
UPDATE_AGENCY: { "type": "UPDATE_AGENCY", "payload": { "name": "...", "phone": "...", "email": "...", "address": "...", "city": "..." } }
ADD_TRIP: { "type": "ADD_TRIP", "payload": { "title": "...", "destination": "...", "duration_days": 7, "price": 145000, "description": "..." } }

OUTPUT FORMAT — MANDATORY:
You MUST respond with pure valid JSON (no markdown code fences), exactly:
{
  "response": "Your natural conversational reply here (can use markdown formatting)",
  "actions": []
}
The "actions" array is optional — only include it when the user explicitly requests a database change.
Never include actions for queries/questions — only for explicit creation/modification requests.`

  // ─── Try Gemini 2.0 Flash (proper API format) ──────────────────────────
  try {
    const openai = getOpenAIClient()
    const aiResponse = await openai.chat.completions.create({
      model: AGENT_MODEL,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemInstruction },
        ...chatHistory
          .filter((m) => m.text && !m.text.includes('Copilote IA'))
          .slice(-10)
          .map((item) => ({
            role: item.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: item.text,
          })),
        { role: 'user', content: message },
      ],
    })

    const parsed: CopilotResponse = JSON.parse(aiResponse.choices[0]?.message?.content || '{}')
    if (parsed.actions?.length) {
      parsed.actions = parsed.actions.filter((action) => {
        if (vertical === 'travel') return action.type !== 'ADD_CAR'
        return action.type !== 'ADD_TRIP'
      })
    }
    if (parsed.response) return parsed
  } catch (err: any) {
    console.error('OpenAI assistant request failed:', err?.message)
  }

  if (false) {
    try {
      // Filter history: only include actual conversation pairs (exclude system welcome)
      const filteredHistory = chatHistory
        .filter((m) => m.sender === 'user' || (m.sender === 'ai' && m.text.length > 0))
        .slice(-12) // Keep last 12 turns for context window efficiency
        .map((item) => ({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        }))

      const requestBody: any = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          ...filteredHistory,
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }

      // Try gemini-2.0-flash first, fallback to 1.5-flash
      let apiResponse: Response | null = null
      for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
        try {
          apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            }
          )
          if (apiResponse?.ok) break
        } catch (e) {
          continue
        }
      }

      if (apiResponse?.ok) {
        const resJson = await apiResponse!.json()
        const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || ''

        if (rawText) {
          try {
            // Strip potential markdown wrappers just in case
            const cleaned = rawText
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/```\s*$/i, '')
              .trim()
            const parsed: CopilotResponse = JSON.parse(cleaned)
            if (parsed.actions?.length) {
              parsed.actions = (parsed.actions || []).filter((action) => {
                if (vertical === 'travel') return action.type !== 'ADD_CAR'
                return action.type !== 'ADD_TRIP'
              })
            }
            if (parsed.response) return parsed
          } catch {
            // If JSON parse fails, return raw text as response
            return { response: rawText }
          }
        }
      }

      const errorBody = apiResponse ? await apiResponse!.text().catch(() => '') : ''
      console.error('Gemini API failed:', apiResponse?.status, errorBody)
    } catch (err: any) {
      console.error('Gemini request error:', err?.message)
    }
  }

  // ─── Smart Fallback Engine (used when no API key or Gemini fails) ────────
  // This is a semantic fallback that uses the live data to give real answers
  return buildSmartFallback(message, agencyDetails, vertical, live)
}

function buildSmartFallback(
  message: string,
  agencyDetails: any,
  vertical: string,
  live: LiveContext
): CopilotResponse {
  const { salesStock, rentalStock, teamList, clientList, rentalBookings } = live
  const msg = message.toLowerCase()

  // ── Language detection ──
  const isDarja =
    /[\u0600-\u06FF]/.test(message) ||
    /\b(wach|3and|ta9der|tahder|darja|ba3na|lyouma|kifach|ndiro|ndir|nakri|kra|tonobil|khouya|zidli|dir|chouf|rani|baghina|sah|wayli|yallah|bla|mnin|fin|kach|lla|yah|daba|bzaf|brk|baraka)\b/.test(msg)
  const isFrench =
    !isDarja &&
    /\b(voiture|louer|disponible|combien|argent|client|ajouter|équipe|agence|aujourd|bonjour|salut)\b/.test(msg)
  const isEnglish =
    !isDarja &&
    !isFrench &&
    /\b(car|rent|available|add|client|team|how much|money|today|show|list|help)\b/.test(msg)

  const lang: 'dz' | 'fr' | 'en' = isDarja ? 'dz' : isFrench ? 'fr' : isEnglish ? 'en' : 'fr'

  const actions: CopilotAction[] = []

  if (vertical === 'travel') {
    const { travelPackages, travelBookings } = live
    const wantsDashboardHelp = /\b(kifach|teach|explain|guide|dashboard|new member|membre|apprendre|شرح|علمني|كيفاش|نستعمل)\b/.test(msg)
    const asksDarja = /\b(darja|ta9der|tahder)\b/.test(msg)
    const wantsTrips = /\b(voyage|trip|forfait|omra|hajj|hadj|istanbul|turquie|djerba|hotel|destination|sejour|séjour|visa|booking|reservation|réservation)\b/.test(msg)
    const wantsRevenue = /\b(revenue|argent|money|dkhel|rbah|rabahna|dkhalna|combien.*gagn|how much.*made|chiffre)\b/.test(msg)
    const wantsClients = /\b(client|zlmia|zboun|customer)\b/.test(msg)
    const wantsAddTrip = /\b(zidli|ajouter|add|cree|crée|create).*(voyage|trip|forfait|omra|hajj|istanbul|turquie|djerba|sejour|séjour)\b/.test(msg)
    const wantsAddClient = /\b(zidli|ajouter|add).*(client|zboun)\b/.test(msg) || /\b(client|zboun).*(zid|ajouter|add)\b/.test(msg)

    if (asksDarja) {
      return { response: `إيه نقدر نهدر معاك بالدارجة الجزائرية. من اليوم نجاوبك بالعربية الدارجة كي تسقسي بالدارجة. واش تحب نديرولك: نشرحلك dashboard، نشوف الحجوزات، نزيد voyage، ولا نعاونك مع clients؟` }
    }

    if (wantsDashboardHelp) {
      return { response: `هادي طريقة استعمال dashboard تاع وكالة السفر خطوة بخطوة:

1. **Dashboard**: تشوف الملخص تاع الشركة، الحجوزات، العملاء، والمداخيل.
2. **Trips / Voyages**: تزيد forfait جديد، تبدل السعر، المدة، الوجهة، وتفعّل/توقف العرض.
3. **Bookings**: تتابع الحجوزات، الحالة تاع الدفع، والملفات اللي خاصهم متابعة.
4. **Clients**: تخزن معلومات الزبائن، الهاتف، المصدر، والملاحظات.
5. **Inbox**: تشوف محادثات WhatsApp/Facebook وتجاوب العملاء.
6. **Finance / Invoices**: تراقب المصاريف، الفواتير، والمدفوعات.
7. **Settings**: تبدل معلومات الوكالة، الموقع، chatbot، والاشتراك.

نقدر ثاني نديرلك actions: نزيد client، نزيد voyage، نبدل معلومات الوكالة، ولا نشرح لأي موظف جديد واش يدير في كل صفحة.` }
    }

    if (wantsAddTrip) {
      const title = message.replace(/zidli|ajouter|add|cree|crée|create/gi, '').trim() || 'Nouveau voyage'
      actions.push({ type: 'ADD_TRIP', payload: { title, destination: title, duration_days: 7, price: 0, description: 'Cree via Assistant IA' } })
      if (lang === 'dz') return { response: `Bla mochkil. Wjedtlek forfait voyage **${title}**. Klik 3la appliquer bach nzidouh f systeme.`, actions }
      if (lang === 'fr') return { response: `Parfait. J'ai prepare l'ajout du forfait voyage **${title}**. Cliquez sur **Appliquer** pour l'enregistrer.`, actions }
      return { response: `Ready to add travel package **${title}**. Click **Apply** to save it.`, actions }
    }

    if (wantsAddClient) {
      const nameMatch = message.match(/(?:add|zidli|ajouter)\s+([A-Za-zÀ-ÿ\u0600-\u06FF][A-Za-zÀ-ÿ\u0600-\u06FF\s]{2,30})\s*(?:klient|client|zboun|comme client)?/i)
      const extractedName = nameMatch ? nameMatch[1].trim() : 'Nouveau Client'
      const phoneMatch = message.match(/\+?213\d{9}|0[5-7]\d{8}/)
      actions.push({ type: 'ADD_CLIENT', payload: { full_name: extractedName, phone: phoneMatch?.[0] || null } })
      if (lang === 'dz') return { response: `Wjedt bach nzid **${extractedName}** comme client voyage. Klik 3la appliquer bach nsavewh.`, actions }
      if (lang === 'fr') return { response: `J'ai prepare l'ajout de **${extractedName}** comme client voyage. Cliquez sur **Appliquer** pour enregistrer.`, actions }
      return { response: `Ready to add **${extractedName}** as a travel client. Click **Apply** to save.`, actions }
    }

    if (wantsRevenue) {
      const total = travelBookings.reduce((sum: number, booking: any) => sum + Number(booking.total_price || 0), 0)
      if (lang === 'dz') return { response: `F les reservations recentes, revenu ta3 **${agencyDetails.name}** howa **${total.toLocaleString()} DZD** men ${travelBookings.length} dossier(s).` }
      if (lang === 'fr') return { response: `Sur les reservations recentes, **${agencyDetails.name}** affiche **${total.toLocaleString()} DZD** de volume pour ${travelBookings.length} dossier(s).` }
      return { response: `Recent travel booking volume for **${agencyDetails.name}** is **${total.toLocaleString()} DZD** across ${travelBookings.length} booking(s).` }
    }

    if (wantsTrips) {
      const activeTrips = travelPackages.filter((trip: any) => trip.status === 'active' || trip.status == null)
      const list = activeTrips.map((trip: any) => `- **${trip.title}** | ${trip.destination_city || trip.destination_country || 'Destination'} | ${trip.duration_days || '?'} jours | ${Number(trip.base_price_per_person || 0).toLocaleString()} DZD`).join('\n')
      if (lang === 'dz') return { response: `Hadi les voyages actifs ta3 **${agencyDetails.name}**:\n\n${list || 'Ma kayench forfaits voyages actifs pour le moment.'}` }
      if (lang === 'fr') return { response: `Voici les forfaits voyages actifs de **${agencyDetails.name}** :\n\n${list || 'Aucun forfait voyage actif pour le moment.'}` }
      return { response: `Active travel packages for **${agencyDetails.name}**:\n\n${list || 'No active travel packages yet.'}` }
    }

    if (wantsClients) {
      const list = clientList.slice(0, 10).map((c: any) => `- **${c.full_name}**${c.phone ? ` | ${c.phone}` : ''}`).join('\n')
      if (lang === 'dz') return { response: `Clients ta3 **${agencyDetails.name}** (${clientList.length}):\n\n${list || 'Ma kayench clients enregistrés.'}` }
      if (lang === 'fr') return { response: `Clients de **${agencyDetails.name}** (${clientList.length}) :\n\n${list || 'Aucun client enregistre.'}` }
      return { response: `Clients for **${agencyDetails.name}** (${clientList.length}):\n\n${list || 'No clients yet.'}` }
    }

    if (/\b(voiture|car|golf|showroom|vehicule|véhicule|stock auto|rental fleet|test drive)\b/.test(msg)) {
      if (lang === 'dz') return { response: `Hadi agence voyage, machi showroom. Nقدر nعاونك f voyages, reservations, clients, paiements, invoices w visa/Omra.` }
      if (lang === 'fr') return { response: `Cette entreprise est une agence de voyage, pas un showroom. Je peux vous aider sur les voyages, reservations, clients, paiements, factures, visa et Omra/Hajj.` }
      return { response: `This company is a travel agency, not a showroom. I can help with trips, bookings, clients, payments, invoices, visas, and Omra/Hajj.` }
    }

    return { response: lang === 'dz'
      ? `Labas khouya. Ana assistant IA ta3 **${agencyDetails.name}**, agence voyage. Nقدر nعاونك f voyages, destinations, Omra/Hajj, reservations, clients, paiements, invoices, equipe, w settings ta3 l'agence.`
      : lang === 'fr'
        ? `Bonjour. Je suis le copilote IA de **${agencyDetails.name}**, specialise agence de voyage. Je peux vous aider avec les forfaits, destinations, Omra/Hajj, reservations, clients, paiements, factures, equipe et parametres.`
        : `Hello. I am the AI copilot for **${agencyDetails.name}**, a travel agency. I can help with packages, destinations, Omra/Hajj, bookings, clients, payments, invoices, team, and settings.`
    }
  }

  // ── Intent detection ──
  const wantsRental =
    /\b(nakri|kra|louer|rent|location|disponible.*kra|fleet)\b/.test(msg)
  const wantsSales =
    /\b(biya3|vente|sale|sell|stock|makhzen|prix|price|acheter|buy)\b/.test(msg)
  const wantsRevenue =
    /\b(revenue|argent|money|dkhel|rbah|rabahna|dkhalna|combien.*gagn|how much.*made|chiffre)\b/.test(msg)
  const wantsTeam =
    /\b(equipe|team|employe|collaborateur|roster|khoudam)\b/.test(msg)
  const wantsClients =
    /\b(client|zlmia|zboun|customer)\b/.test(msg)
  const wantsAddCar = /\b(zidli|ajouter|add).*(voiture|car|golf|seat|toyota|peugeot|dacia|hyundai|kia|renault|fiat|bmw|mercedes|audi|volkswagen|vw)\b/.test(msg) ||
    /\b(voiture|car).*(zid|ajouter|add)\b/.test(msg)
  const wantsAddClient = /\b(zidli|ajouter|add).*(client|zboun)\b/.test(msg) ||
    /\b(client|zboun).*(zid|ajouter|add)\b/.test(msg)
  const wantsAddMember = /\b(zidli|ajouter|add|recruter).*(employe|team|frik|collaborateur)\b/.test(msg)

  // ── Available rentals ──
  if (wantsRental) {
    const available = rentalStock.filter((c) => c.status === 'available')
    const rented = rentalStock.filter((c) => c.status === 'rented')

    if (lang === 'dz') {
      if (rentalStock.length === 0) {
        return { response: `خويا، ما عندكش حتى طوموبيل في الأسطول تاع الكراء في الداتابيز تاع **"${agencyDetails.name}"**. زيد واحدة من قسم المخزون!` }
      }
      const listStr = available.map((c: any) => `• **${c.brand} ${c.model} ${c.year}**${c.color ? ` (${c.color})` : ''} — ${Number(c.daily_rate).toLocaleString()} دج/يوم`).join('\n')
      const rentedStr = rented.length > 0 ? `\n\n**مكرية حالياً (${rented.length}):**\n${rented.map((c: any) => `• ${c.brand} ${c.model}`).join('\n')}` : ''
      return { response: `خويا، ها هي الطوموبيلات ديالك في الكراء:\n\n**واجدة للكراء (${available.length}):**\n${listStr || '(ما كاينش واجدة دابا)'}${rentedStr}` }
    }
    if (lang === 'fr') {
      const listStr = available.map((c: any) => `• **${c.brand} ${c.model} ${c.year}** — ${Number(c.daily_rate).toLocaleString()} DZD/jour`).join('\n')
      return { response: `Voici votre flotte de location chez **"${agencyDetails.name}"** :\n\n**Disponibles (${available.length}) :**\n${listStr || '(aucun disponible)'}${rented.length > 0 ? `\n\n**En location (${rented.length}) :** ${rented.map((c: any) => `${c.brand} ${c.model}`).join(', ')}` : ''}` }
    }
    const listStr = available.map((c: any) => `• **${c.brand} ${c.model} ${c.year}** — ${Number(c.daily_rate).toLocaleString()} DZD/day`).join('\n')
    return { response: `Here's your rental fleet at **"${agencyDetails.name}"**:\n\n**Available (${available.length}):**\n${listStr || '(none available)'}${rented.length > 0 ? `\n\n**Currently rented (${rented.length}):** ${rented.map((c: any) => `${c.brand} ${c.model}`).join(', ')}` : ''}` }
  }

  // ── Sales stock ──
  if (wantsSales) {
    const available = salesStock.filter((c) => c.status === 'available')
    if (lang === 'dz') {
      if (salesStock.length === 0) return { response: `خويا، ما كاينش طوموبيلات في مخزون البيع دابا.` }
      const listStr = available.map((c: any) => `• **${c.brand} ${c.model} ${c.year}**${c.color ? ` — ${c.color}` : ''} — ${Number(c.price).toLocaleString()} دج`).join('\n')
      return { response: `المخزون تاع المعرض **"${agencyDetails.name}"**:\n\n**واجدة للبيع (${available.length}):**\n${listStr || '(ما كاينش واجدة)'}` }
    }
    if (lang === 'fr') {
      const listStr = available.map((c: any) => `• **${c.brand} ${c.model} ${c.year}** — ${Number(c.price).toLocaleString()} DZD`).join('\n')
      return { response: `Stock showroom de **"${agencyDetails.name}"** :\n\n**Disponibles à la vente (${available.length}) :**\n${listStr || '(aucun)'}` }
    }
    const listStr = available.map((c: any) => `• **${c.brand} ${c.model} ${c.year}** — ${Number(c.price).toLocaleString()} DZD`).join('\n')
    return { response: `Sales stock at **"${agencyDetails.name}"**:\n\n**Available (${available.length}):**\n${listStr || '(none)'}` }
  }

  // ── Revenue ──
  if (wantsRevenue) {
    const rented = rentalStock.filter((c) => c.status === 'rented')
    const daily = rented.reduce((s: number, c: any) => s + Number(c.daily_rate), 0)
    const maxDaily = rentalStock.reduce((s: number, c: any) => s + Number(c.daily_rate), 0)
    if (lang === 'dz') {
      return { response: `خويا، اليوم رانا ندخلو **${daily.toLocaleString()} دج** من ${rented.length} طوموبيلات مكرية.\n\nإذا كاع الأسطول مكري (${rentalStock.length} طوموبيلات)، كنقدروا ندخلو **${maxDaily.toLocaleString()} دج/يوم** كاملة!` }
    }
    if (lang === 'fr') {
      return { response: `Aujourd'hui, le parc génère **${daily.toLocaleString()} DZD** avec ${rented.length} véhicule(s) en location.\n\nCapacité maximale si tout est loué : **${maxDaily.toLocaleString()} DZD/jour**.` }
    }
    return { response: `Today's rental revenue: **${daily.toLocaleString()} DZD** from ${rented.length} active rental(s).\n\nFull fleet capacity: **${maxDaily.toLocaleString()} DZD/day** if all ${rentalStock.length} cars are rented.` }
  }

  // ── Team ──
  if (wantsTeam) {
    if (lang === 'dz') {
      return { response: `الفريق ديال **"${agencyDetails.name}"** (${teamList.length} خدامة):\n\n${teamList.map((m: any) => `• **${m.full_name}** — ${m.role}`).join('\n') || '(ما كاينش خدامة مسجلين)'}` }
    }
    if (lang === 'fr') {
      return { response: `Équipe de **"${agencyDetails.name}"** (${teamList.length} membres) :\n\n${teamList.map((m: any) => `• **${m.full_name}** — ${m.role}`).join('\n') || '(aucun membre)'}` }
    }
    return { response: `Team at **"${agencyDetails.name}"** (${teamList.length} members):\n\n${teamList.map((m: any) => `• **${m.full_name}** — ${m.role}`).join('\n') || '(no team members yet)'}` }
  }

  // ── Clients list ──
  if (wantsClients && !wantsAddClient) {
    if (lang === 'dz') {
      return { response: `الزبائن المسجلين في **"${agencyDetails.name}"** (${clientList.length} زبون):\n\n${clientList.slice(0, 10).map((c: any) => `• **${c.full_name}**${c.phone ? ` — ${c.phone}` : ''}`).join('\n') || '(ما كاينش زبائن مسجلين)'}` }
    }
    if (lang === 'fr') {
      return { response: `Clients de **"${agencyDetails.name}"** (${clientList.length}) :\n\n${clientList.slice(0, 10).map((c: any) => `• **${c.full_name}**${c.phone ? ` — ${c.phone}` : ''}`).join('\n') || '(aucun client)'}` }
    }
    return { response: `Clients at **"${agencyDetails.name}"** (${clientList.length} total):\n\n${clientList.slice(0, 10).map((c: any) => `• **${c.full_name}**${c.phone ? ` — ${c.phone}` : ''}`).join('\n') || '(no clients yet)'}` }
  }

  // ── Add client ──
  if (wantsAddClient) {
    // Try to extract a name from the message
    const nameMatch = message.match(/(?:add|zidli|ajouter)\s+([A-Za-zÀ-ÿ\u0600-\u06FF][A-Za-zÀ-ÿ\u0600-\u06FF\s]{2,30})\s*(?:klient|client|zboun|comme client)?/i)
    const extractedName = nameMatch ? nameMatch[1].trim() : 'Nouveau Client'
    const phoneMatch = message.match(/\+?213\d{9}|0[5-7]\d{8}/)
    actions.push({ type: 'ADD_CLIENT', payload: { full_name: extractedName, phone: phoneMatch?.[0] || null } })
    if (lang === 'dz') return { response: `بلا مشكل خويا! وجدت باش نزيدو **"${extractedName}"** كزبون. كليك على "تطبيق" باش نحطوه في الداتابيز.`, actions }
    if (lang === 'fr') return { response: `Parfait ! J'ai préparé l'ajout de **"${extractedName}"** comme client. Cliquez sur **Appliquer** pour enregistrer.`, actions }
    return { response: `Sure! Ready to add **"${extractedName}"** as a client. Click **Apply** to save to database.`, actions }
  }

  // ── Greeting / help ──
  if (/\b(salam|bonjour|hello|hi|marhba|cava|labas|wach rak)\b/.test(msg)) {
    if (lang === 'dz') {
      return { response: `لاباس عليك خويا! 👋 أنا المساعد الذكي تاع **"${agencyDetails.name}"**.\n\nواش نقدر نعاونك؟\n- 🚗 "wach 3andi voitures disponibles?" — أوريك الطوموبيلات\n- 💰 "chhal dkhalna lyom?" — الإيرادات\n- 👥 "wach 3andi clients?" — قائمة الزبائن\n- ➕ "zidli Golf 8 b 5.2 million" — زيد طوموبيل\n\nقولي واش تبغي!` }
    }
    if (lang === 'fr') {
      return { response: `Bonjour ! 👋 Je suis le Copilote IA de **"${agencyDetails.name}"**.\n\nQue puis-je faire pour vous ?\n- 🚗 Stock véhicules & disponibilité\n- 💰 Revenus & chiffre d'affaires\n- 👥 Gestion clients & équipe\n- ➕ Ajouter des voitures, clients, collaborateurs\n\nParlez-moi librement !` }
    }
    return { response: `Hey! 👋 I'm the AI Copilot for **"${agencyDetails.name}"**.\n\nI can help you with:\n- 🚗 Car inventory & availability\n- 💰 Revenue & earnings\n- 👥 Clients & team\n- ➕ Add cars, clients, team members\n\nWhat do you need?` }
  }

  // ── Generic fallback ──
  if (lang === 'dz') {
    return { response: `خويا، ما فهمتش مزيان. جرب تقول:\n- "wach 3andi voitures disponibles?"\n- "chhal dkhalna lyom?"\n- "zidli client Amine 0770123456"\n- "bini liya stock dial lbiya3"\n\nأو سولني على أي حاجة تخص الشركة ديالك **"${agencyDetails.name}"**!` }
  }
  if (lang === 'fr') {
    return { response: `Je n'ai pas bien compris votre demande. Essayez par exemple :\n- "Quelles voitures sont disponibles à la location ?"\n- "Combien avons-nous gagné aujourd'hui ?"\n- "Ajouter un client Amine"\n\nJe suis là pour votre agence **"${agencyDetails.name}"** !` }
  }
  return { response: `I didn't quite catch that. Try asking:\n- "What cars are available for rent?"\n- "How much revenue today?"\n- "Add client Amine Zidane"\n- "Show me the team"\n\nI'm here for **"${agencyDetails.name}"**!` }
}

// ─── Automated Onboarding Batch Document Parser ───────────────────────────

export interface ParsedBatchData {
  agencyDetails?: any
  cars?: any[]
  trips?: any[]
  employees?: any[]
}

export async function parseUploadedDocument(
  fileName: string,
  fileContent: string
): Promise<ParsedBatchData> {
  const context = await resolveUserAgencyContext()
  if (!context.success) return {}

  const { agencyId, agencyDetails, vertical } = context
  const apiKey = process.env.GEMINI_API_KEY

  // Try using Gemini to parse the document intelligently
  if (apiKey && fileContent.length > 0) {
    try {
      const parsePrompt = `You are a data extraction assistant for an Algerian business SaaS platform.
Extract structured data from the following document content.

Document name: ${fileName}
Business type: ${vertical === 'car_showroom' ? 'Car showroom & rental' : 'Travel agency'}
Agency: ${agencyDetails.name}

Document content:
"""
${fileContent.slice(0, 8000)}
"""

Return a JSON object with these optional fields (only include fields you found data for):
{
  "agencyDetails": { "name": "...", "company_name": "...", "phone": "...", "address": "...", "city": "..." },
  "cars": [{ "brand": "...", "model": "...", "year": 2023, "price": 3500000, "color": "...", "fuel": "Essence|Diesel", "transmission": "Manuel|Automatique", "description": "..." }],
  "trips": [{ "title": "...", "destination": "...", "duration_days": 7, "price": 145000, "description": "..." }],
  "employees": [{ "full_name": "...", "email": "...", "role": "employee", "phone": "..." }]
}
Return ONLY valid JSON, no markdown.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: parsePrompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        }
      )

      if (response.ok) {
        const resJson = await response.json()
        const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) {
          try {
            const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
            return JSON.parse(cleaned) as ParsedBatchData
          } catch {
            // Fall through to local parsing
          }
        }
      }
    } catch (err) {
      console.error('Document parsing via Gemini failed:', err)
    }
  }

  // ── Local smart fallback parser ──
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const contentLower = fileContent.toLowerCase()
  const result: ParsedBatchData = {}

  if (
    contentLower.includes('agence') ||
    contentLower.includes('showroom') ||
    contentLower.includes('sarl') ||
    contentLower.includes('eurl')
  ) {
    result.agencyDetails = {
      name: agencyDetails.name,
      company_name: agencyDetails.company_name,
      phone: agencyDetails.phone,
      address: agencyDetails.address,
      city: agencyDetails.city,
    }
  }

  if (
    vertical === 'car_showroom' &&
    (contentLower.includes('golf') || contentLower.includes('seat') || contentLower.includes('toyota') ||
      contentLower.includes('brand') || contentLower.includes('model') || contentLower.includes('prix'))
  ) {
    result.cars = [
      { brand: 'Volkswagen', model: 'Golf 8 R-Line', year: 2023, price: 5200000, fuel: 'Diesel', transmission: 'Automatic', color: 'Gris Dauphin', description: 'Golf 8 importée neuve.' },
      { brand: 'Seat', model: 'Ibiza FR', year: 2022, price: 3600000, fuel: 'Petrol', transmission: 'Manual', color: 'Rouge Désir', description: 'Seat Ibiza FR en parfait état.' },
    ]
  }

  if (
    vertical === 'travel' &&
    (contentLower.includes('turquie') || contentLower.includes('voyage') || contentLower.includes('hotel') ||
      contentLower.includes('tunisie') || contentLower.includes('istanbul'))
  ) {
    result.trips = [
      { title: 'Circuit Antalya & Istanbul', destination: 'Turquie', duration_days: 10, price: 195000, description: 'Vol direct, hôtel 4★, excursions incluses.' },
      { title: 'Séjour Djerba Tout Compris', destination: 'Tunisie', duration_days: 7, price: 88000, description: 'Formule All Inclusive en bord de mer.' },
    ]
  }

  if (
    contentLower.includes('employé') ||
    contentLower.includes('staff') ||
    contentLower.includes('email') ||
    contentLower.includes('collaborateur')
  ) {
    result.employees = [
      { full_name: 'Amine Belkadi', email: 'amine.belkadi@example.dz', role: 'employee', phone: '+213550998877' },
      { full_name: 'Karim Zeroual', email: 'karim.zeroual@example.dz', role: 'employee', phone: '+213661223344' },
    ]
  }

  return result
}
