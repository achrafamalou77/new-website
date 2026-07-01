'use server'

import { AGENT_MODEL, getOpenAIClient } from '@/lib/openai/client'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { revalidatePath } from 'next/cache'

export interface AgentAction {
  type: 'UPDATE_AGENCY' | 'ADD_TRIP' | 'UPDATE_TRIP' | 'DELETE_TRIP' | 'ADD_CLIENT' | 'UPDATE_BOOKING_STATUS'
  payload: Record<string, any>
  description: string
}

export interface AgentResponse {
  response: string
  actions?: AgentAction[]
  executedActions?: string[]
}

type ToolName =
  | 'modify_agency_details'
  | 'create_travel_trip'
  | 'update_travel_trip'
  | 'delete_travel_trip'
  | 'register_new_client'
  | 'update_booking_status'

function cleanObject(input: Record<string, any>, allowed: string[]) {
  return Object.fromEntries(
    Object.entries(input).filter(([key, value]) => allowed.includes(key) && value !== undefined && value !== null && value !== '')
  )
}

async function requireAgency() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) {
    return { success: false as const, error: 'Unauthorized. Please log in again.' }
  }
  if (context.role === 'employee') {
    return { success: false as const, error: 'Only owners/managers can use the autonomous business agent.' }
  }
  return { success: true as const, context: { ...context, agencyId: context.agencyId } }
}

async function getLiveBusinessContext(agencyId: string) {
  const supabase = await createClient()

  const [
    agencyRes,
    tripsRes,
    bookingsRes,
    clientsRes,
    conversationsRes,
    accountsRes,
    transactionsRes,
    carsRes,
    leadsRes,
    followUpsRes,
  ] = await Promise.allSettled([
    supabase.from('agencies').select('id, name, company_name, phone, email, address, city, business_type_slug').eq('id', agencyId).single(),
    supabase.from('trips').select('id, title, destination, price, duration_days, is_active, created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(40),
    supabase.from('bookings').select('id, trip_id, status, total_price, created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(40),
    supabase.from('clients').select('id, full_name, phone, email, classification, source, created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(40),
    supabase.from('conversations').select('id, customer_name, customer_phone, platform, lead_score, status, last_message_at').eq('agency_id', agencyId).order('last_message_at', { ascending: false }).limit(30),
    supabase.from('financial_accounts').select('id, name, type, current_balance, currency').eq('agency_id', agencyId),
    supabase.from('transactions').select('id, type, amount, description, transaction_date').eq('agency_id', agencyId).order('transaction_date', { ascending: false }).limit(20),
    supabase.from('car_sales_inventory').select('id, brand, model, year, price, status, type, car_type, quantity').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(40),
    supabase.from('leads').select('id, name, phone, car_interest, budget, score, stage, created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(40),
    (supabase as any).from('follow_up_tasks').select('id, title, priority, status, due_at, created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(20),
  ])

  const ok = <T,>(res: PromiseSettledResult<{ data: T }>, fallback: T): T =>
    res.status === 'fulfilled' ? (res.value.data ?? fallback) : fallback

  const accounts = ok<any[]>(accountsRes as any, [])
  const transactions = ok<any[]>(transactionsRes as any, [])
  const bookings = ok<any[]>(bookingsRes as any, [])
  const cars = ok<any[]>(carsRes as any, [])

  return {
    agency: ok<any>(agencyRes as any, null),
    trips: ok<any[]>(tripsRes as any, []),
    bookings,
    clients: ok<any[]>(clientsRes as any, []),
    conversations: ok<any[]>(conversationsRes as any, []),
    accounts,
    transactions,
    cars,
    leads: ok<any[]>(leadsRes as any, []),
    followUps: ok<any[]>(followUpsRes as any, []),
    metrics: {
      cashBalance: accounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0),
      bookingRevenue: bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
      availableCars: cars.filter(car => car.status === 'available').length,
      soldCars: cars.filter(car => car.status === 'sold').length,
    },
  }
}

export async function executeAgencyUpdate(agencyId: string, updates: Record<string, any>) {
  const guard = await requireAgency()
  if (!guard.success) return guard
  if (guard.context.agencyId !== agencyId) return { success: false as const, error: 'Permission denied: agency mismatch.' }

  const filtered = cleanObject(updates, ['name', 'phone', 'email', 'company_name', 'address', 'city', 'logo_url', 'cover_image_url'])
  if (Object.keys(filtered).length === 0) return { success: false as const, error: 'No valid agency fields were provided.' }

  const supabase = await createClient()
  const { error } = await supabase.from('agencies').update(filtered as any).eq('id', agencyId)
  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/agency')
  return { success: true as const }
}

export async function executeCreateTrip(agencyId: string, trip: Record<string, any>) {
  const guard = await requireAgency()
  if (!guard.success) return guard
  if (guard.context.agencyId !== agencyId) return { success: false as const, error: 'Permission denied: agency mismatch.' }
  if (guard.context.businessTypeSlug !== 'travel_agency') return { success: false as const, error: 'Travel trips are only available for travel agencies.' }

  const supabase = await createClient()
  const { error } = await supabase.from('trips').insert({
    agency_id: agencyId,
    title: String(trip.title || 'New travel package'),
    description: String(trip.description || 'Created by the AI Business Agent'),
    price: Number(trip.price || 0),
    destination: String(trip.destination || trip.destination_country || 'Destination'),
    duration_days: Number(trip.duration_days || 1),
    image_urls: Array.isArray(trip.image_urls) ? trip.image_urls : [],
    is_active: trip.is_active !== false,
    destination_country: String(trip.destination_country || trip.destination || 'Destination'),
    destination_cities: Array.isArray(trip.destination_cities) ? trip.destination_cities : [],
  } as any)
  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/trips')
  return { success: true as const }
}

export async function executeUpdateTrip(agencyId: string, tripId: string, updates: Record<string, any>) {
  const guard = await requireAgency()
  if (!guard.success) return guard
  if (guard.context.agencyId !== agencyId) return { success: false as const, error: 'Permission denied: agency mismatch.' }
  if (guard.context.businessTypeSlug !== 'travel_agency') return { success: false as const, error: 'Travel trips are only available for travel agencies.' }

  const filtered = cleanObject(updates, ['title', 'description', 'price', 'destination', 'duration_days', 'is_active', 'destination_country'])
  if (filtered.price !== undefined) filtered.price = Number(filtered.price)
  if (filtered.duration_days !== undefined) filtered.duration_days = Number(filtered.duration_days)

  const supabase = await createClient()
  const { data, error } = await supabase.from('trips').update(filtered as any).eq('id', tripId).eq('agency_id', agencyId).select('id').maybeSingle()
  if (error) return { success: false as const, error: error.message }
  if (!data) return { success: false as const, error: 'Trip not found in this agency.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/trips')
  return { success: true as const }
}

export async function executeDeleteTrip(agencyId: string, tripId: string) {
  const guard = await requireAgency()
  if (!guard.success) return guard
  if (guard.context.agencyId !== agencyId) return { success: false as const, error: 'Permission denied: agency mismatch.' }
  if (guard.context.businessTypeSlug !== 'travel_agency') return { success: false as const, error: 'Travel trips are only available for travel agencies.' }

  const supabase = await createClient()
  const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('trip_id', tripId).neq('status', 'cancelled')
  if (count && count > 0) return { success: false as const, error: 'Cannot delete trip because active bookings exist.' }

  const { data, error } = await supabase.from('trips').delete().eq('id', tripId).eq('agency_id', agencyId).select('id').maybeSingle()
  if (error) return { success: false as const, error: error.message }
  if (!data) return { success: false as const, error: 'Trip not found in this agency.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/trips')
  return { success: true as const }
}

export async function executeAddClient(agencyId: string, client: Record<string, any>) {
  const guard = await requireAgency()
  if (!guard.success) return guard
  if (guard.context.agencyId !== agencyId) return { success: false as const, error: 'Permission denied: agency mismatch.' }

  const fullName = String(client.full_name || client.name || '').trim()
  if (!fullName) return { success: false as const, error: 'Client full name is required.' }

  const supabase = await createClient()
  const { error } = await supabase.from('clients').insert({
    agency_id: agencyId,
    full_name: fullName,
    phone: client.phone || null,
    email: client.email || null,
    classification: client.classification || 'retail',
    source: client.source || 'ai_agent',
    notes: client.notes || 'Created by AI Business Agent',
  } as any)
  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/clients')
  return { success: true as const }
}

export async function executeUpdateBooking(agencyId: string, bookingId: string, status: string) {
  const guard = await requireAgency()
  if (!guard.success) return guard
  if (guard.context.agencyId !== agencyId) return { success: false as const, error: 'Permission denied: agency mismatch.' }
  if (!['pending_payment', 'completed', 'cancelled'].includes(status)) return { success: false as const, error: 'Invalid booking status.' }

  const supabase = await createClient()
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).eq('agency_id', agencyId).select('id').maybeSingle()
  if (error) return { success: false as const, error: error.message }
  if (!data) return { success: false as const, error: 'Booking not found in this agency.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/bookings')
  return { success: true as const }
}

function buildTools(vertical: 'travel_agency' | 'car_showroom' | 'ecommerce') {
  const commonTools = [
    {
      type: 'function',
      function: {
        name: 'modify_agency_details',
        description: 'Update safe public agency fields such as phone, email, address, city, name, and company_name.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            company_name: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'register_new_client',
        description: 'Create a new customer/client profile for this agency.',
        parameters: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            classification: { type: 'string', enum: ['retail', 'b2b', 'corporate'] },
            notes: { type: 'string' },
          },
          required: ['full_name'],
        },
      },
    },
  ]

  if (vertical === 'car_showroom' || vertical === 'ecommerce') return commonTools

  return [
    ...commonTools,
    {
      type: 'function',
      function: {
        name: 'create_travel_trip',
        description: 'Create a new travel package/trip for a travel agency.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            destination: { type: 'string' },
            destination_country: { type: 'string' },
            price: { type: 'number' },
            duration_days: { type: 'number' },
            description: { type: 'string' },
            is_active: { type: 'boolean' },
          },
          required: ['title', 'price', 'destination'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_travel_trip',
        description: 'Update an existing travel package by exact trip ID.',
        parameters: {
          type: 'object',
          properties: {
            tripId: { type: 'string' },
            title: { type: 'string' },
            destination: { type: 'string' },
            destination_country: { type: 'string' },
            price: { type: 'number' },
            duration_days: { type: 'number' },
            description: { type: 'string' },
            is_active: { type: 'boolean' },
          },
          required: ['tripId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_travel_trip',
        description: 'Delete a travel package by exact trip ID if it has no active bookings.',
        parameters: {
          type: 'object',
          properties: { tripId: { type: 'string' } },
          required: ['tripId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_booking_status',
        description: 'Update a travel booking status by exact booking ID.',
        parameters: {
          type: 'object',
          properties: {
            bookingId: { type: 'string' },
            status: { type: 'string', enum: ['pending_payment', 'completed', 'cancelled'] },
          },
          required: ['bookingId', 'status'],
        },
      },
    },
  ]
}

function actionFromTool(name: ToolName, args: Record<string, any>): AgentAction | null {
  const statusMapping: Record<string, string> = {
    pending_payment: 'في انتظار الدفع',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  }

  switch (name) {
    case 'modify_agency_details':
      return { 
        type: 'UPDATE_AGENCY', 
        payload: args, 
        description: `تحديث تفاصيل الوكالة: ${Object.keys(args).map(k => {
          const names: Record<string, string> = {
            name: 'الاسم',
            phone: 'الهاتف',
            email: 'البريد الإلكتروني',
            company_name: 'اسم الشركة',
            address: 'العنوان',
            city: 'المدينة'
          }
          return names[k] || k
        }).join('، ')}` 
      }
    case 'create_travel_trip':
      return { 
        type: 'ADD_TRIP', 
        payload: args, 
        description: `إنشاء عرض رحلة جديد: "${args.title}" بسعر (${Number(args.price || 0).toLocaleString()} دج)` 
      }
    case 'update_travel_trip':
      return { 
        type: 'UPDATE_TRIP', 
        payload: args, 
        description: `تحديث بيانات عرض الرحلة (رقم: ${args.tripId})` 
      }
    case 'delete_travel_trip':
      return { 
        type: 'DELETE_TRIP', 
        payload: args, 
        description: `حذف عرض الرحلة (رقم: ${args.tripId})` 
      }
    case 'register_new_client':
      return { 
        type: 'ADD_CLIENT', 
        payload: args, 
        description: `تسجيل زبون جديد باسم: "${args.full_name || args.name}"` 
      }
    case 'update_booking_status':
      const statusAr = statusMapping[args.status] || args.status
      return { 
        type: 'UPDATE_BOOKING_STATUS', 
        payload: args, 
        description: `تعديل حالة الحجز (رقم: ${args.bookingId}) إلى "${statusAr}"` 
      }
    default:
      return null
  }
}

async function executeTool(agencyId: string, name: ToolName, args: Record<string, any>) {
  if (name === 'modify_agency_details') return executeAgencyUpdate(agencyId, args)
  if (name === 'create_travel_trip') return executeCreateTrip(agencyId, args)
  if (name === 'update_travel_trip') return executeUpdateTrip(agencyId, args.tripId, args)
  if (name === 'delete_travel_trip') return executeDeleteTrip(agencyId, args.tripId)
  if (name === 'register_new_client') return executeAddClient(agencyId, args)
  if (name === 'update_booking_status') return executeUpdateBooking(agencyId, args.bookingId, args.status)
  return { success: false as const, error: 'أداة غير مدعومة.' }
}

export async function askAgent(
  message: string,
  chatHistory: { sender: 'user' | 'ai'; text: string }[],
  autopilot = false,
  locale = 'fr'
): Promise<AgentResponse> {
  const guard = await requireAgency()
  if (!guard.success) return { response: guard.error }

  const agencyId = guard.context.agencyId
  const vertical = guard.context.businessTypeSlug
  const live = await getLiveBusinessContext(agencyId)

  const systemInstruction = `You are Aventra AI, an exceptionally smart, professional, and autonomous ChatGPT-powered business copilot and strategist integrated into our multi-tenant SaaS workspace.

Hard security rules:
- Current agency_id is ${agencyId}. Never request, expose, modify, or infer another agency's data.
- You may only act through the provided tools. Never invent hidden database access.
- If Auto-Pilot is off, tool calls become proposed actions for human approval.
- If Auto-Pilot is on, tool calls are executed server-side after the same agency guard.
- Do not promise actions that are not available as tools.

Current business type: ${vertical === 'car_showroom' ? 'معرض سيارات (Car Showroom)' : 'وكالة سياحة وأسفار (Travel Agency)'}.
User role: ${guard.context.role}.

Language & Quality Directives:
- The user's active interface language is: ${locale === 'ar' ? 'Arabic' : locale === 'en' ? 'English' : 'French (Français)'}.
- ALWAYS reply in the user's active language:
  - If the active language is 'fr', ALWAYS write all your responses, descriptions, marketing suggestions, and structural insights in high-quality professional French. Keep your tone encouraging and professional.
  - If the active language is 'ar', ALWAYS reply in highly professional Arabic or beautiful Algerian Darja written in Arabic script.
  - If the active language is 'en', reply in clear, professional English.
- DO NOT just give simple flat replies. Be analytical and helpful! Provide dynamic marketing advice, strategic pricing recommendations, or logical next steps based on the current business snapshot.
- Format your replies beautifully using GitHub Markdown: use bold emphasis, structured bullet points, logical headers, and professional emojis.
- Represent DZD currency units dynamically:
  - "دج" or "دينار جزائري" when active language is Arabic.
  - "DA" or "DZD" (e.g. "180 000 DA") when active language is French or English.

Live business snapshot:
${JSON.stringify(live, null, 2)}
`

  try {
    const openai = getOpenAIClient()
    const messages = [
      { role: 'system' as const, content: systemInstruction },
      ...chatHistory.slice(-8).map(entry => ({
        role: entry.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: entry.text,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await openai.chat.completions.create({
      model: AGENT_MODEL,
      messages,
      tools: buildTools(vertical) as any,
      tool_choice: 'auto',
      temperature: 0.3,
    })

    const assistantMessage = response.choices[0]?.message
    const toolCalls = assistantMessage?.tool_calls || []
    const actions: AgentAction[] = []
    const executedActions: string[] = []

    for (const call of toolCalls) {
      if (call.type !== 'function') continue
      const name = call.function.name as ToolName
      const args = JSON.parse(call.function.arguments || '{}')
      const action = actionFromTool(name, args)
      if (!action) continue

      if (!autopilot) {
        actions.push(action)
        continue
      }

      const result = await executeTool(agencyId, name, args)
      executedActions.push(`${result.success ? '[تم بنجاح]' : '[فشل]'} ${action.description}${result.success ? '' : `: ${result.error}`}`)
    }

    if (actions.length > 0) {
      return {
        response: assistantMessage?.content || `لقد قمت بتحضير وإعداد عدد (${actions.length}) تعديل(ات) مقترحة على قاعدة البيانات بانتظار مراجعتك وتأكيدك.`,
        actions,
      }
    }

    if (executedActions.length > 0) {
      return {
        response: assistantMessage?.content || `ممتاز! لقد قمت بتنفيذ العمليات التالية بنجاح في قاعدة البيانات مباشرة:\n${executedActions.join('\n')}`,
        executedActions,
      }
    }

    return { response: assistantMessage?.content || 'أنا جاهز تماماً لمساعدتك اليوم. ما الذي ترغب في إنجازه للوكالة؟' }
  } catch (error: any) {
    console.error('Agent OpenAI call failed:', error)
    const message = String(error?.message || error)
    if (message.includes('OPENAI_API_KEY')) {
      return { response: 'مفتاح OpenAI API Key غير مهيأ بعد. يرجى إضافته إلى ملف البيئة .env.local وإعادة تشغيل خادم التطبيق ثم المحاولة مجدداً.' }
    }
    return { response: `عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي حالياً: ${message}` }
  }
}
