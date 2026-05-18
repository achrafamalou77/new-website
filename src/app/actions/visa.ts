'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { VisaType, VisaApplication, VisaPayment, VisaTimelineEvent, EnhancedVisaApplication, DocumentStatus } from '@/types/visa'

// --- DEMO MOCK DATA FALLBACKS ---
let mockVisaTypes: VisaType[] = [
  {
    id: 'vt-turkey',
    agency_id: 'agency-demo',
    name: 'Turkey e-Visa',
    destination_country: 'Turkey',
    category: 'Tourism',
    processing_time: '1-2 business days',
    validity: '180 days',
    stay_duration: '30 days per entry',
    government_fee: 8500,
    service_fee: 5000,
    express_fee: 10000,
    application_method: 'Online',
    application_url: 'https://www.evisa.gov.tr/',
    biometric_required: false,
    interview_required: false,
    applicable_wilayas: Array.from({ length: 58 }, (_, i) => i + 1),
    documents_required: [
      { name: 'Passport copy', description: 'Bio-page scan, valid at least 6 months', required: true, notes: 'Must be clear' },
      { name: 'Algerian ID card (CNI)', description: 'National identity card scan', required: true, notes: 'Both sides' },
      { name: 'Hotel Booking', description: 'Simulated hotel voucher', required: false },
      { name: 'Flight Ticket', description: 'Round trip ticket reservation', required: false }
    ],
    special_notes: 'Usually approved instantly online. Fast and straightforward.',
    is_active: true
  },
  {
    id: 'vt-france',
    agency_id: 'agency-demo',
    name: 'Schengen - France',
    destination_country: 'France',
    category: 'Tourism',
    processing_time: '10-15 business days',
    validity: '90 days',
    stay_duration: '90 days per entry',
    government_fee: 12000,
    service_fee: 8000,
    express_fee: 15000,
    application_method: 'Embassy',
    biometric_required: true,
    interview_required: false,
    applicable_wilayas: Array.from({ length: 58 }, (_, i) => i + 1),
    documents_required: [
      { name: 'Passport scan', description: 'Copy of all pages containing visas or stamps', required: true },
      { name: 'National ID (CNI)', description: 'Algerian national ID card color copy', required: true },
      { name: 'Bank Statement (Euros/DZD)', description: '3-month detailed historical statement', required: true, notes: 'Min 1500€ equivalent' },
      { name: 'Affiliation CNAS or CASNOS', description: 'Social security registration proof', required: true },
      { name: 'Work Attestation', description: 'Employment letter signed and stamped', required: true },
      { name: 'Travel Insurance', description: 'Schengen approved travel insurance', required: true }
    ],
    special_notes: 'Requires biometric appointment at VFS Global. Highly regulated.',
    is_active: true
  },
  {
    id: 'vt-saudi',
    agency_id: 'agency-demo',
    name: 'Saudi Arabia (Umrah)',
    destination_country: 'Saudi Arabia',
    category: 'Umrah',
    processing_time: '2-5 business days',
    validity: '90 days',
    stay_duration: '90 days per entry',
    government_fee: 35000,
    service_fee: 10000,
    express_fee: 15000,
    application_method: 'Online',
    biometric_required: false,
    interview_required: false,
    applicable_wilayas: Array.from({ length: 58 }, (_, i) => i + 1),
    documents_required: [
      { name: 'Passport scan', description: 'Passport biometric page copy', required: true },
      { name: 'Meningitis Vaccination Certificate', description: 'Vaccin contre la méningite ACYW135', required: true },
      { name: 'National ID (CNI)', description: 'Algerian ID card', required: true },
      { name: 'Personal Photo', description: 'Biometric photo scan with white background', required: true }
    ],
    special_notes: 'Umrah visa processed in high volumes. Ramadan alert: apply 15 days in advance.',
    is_active: true
  }
]

let mockApplications: EnhancedVisaApplication[] = [
  {
    id: 'va-1',
    agency_id: 'agency-demo',
    client_id: 'client-1',
    visa_type_id: 'vt-france',
    status: 'documents_pending',
    service_level: 'standard',
    assigned_to: 'emp-1',
    group_id: null,
    group_name: null,
    government_fee: 12000,
    service_fee: 8000,
    extra_fee: 3000,
    total_fee: 23000,
    amount_paid: 10000,
    payment_status: 'partial',
    appointment_date: '2026-06-10T09:30:00Z',
    target_application_date: '2026-06-01',
    documents_status: [
      { name: 'Passport scan', status: 'received', received_at: '2026-05-15T10:00:00Z', file_url: '/demo-passport.pdf' },
      { name: 'National ID (CNI)', status: 'received', received_at: '2026-05-15T10:15:00Z', file_url: '/demo-cni.pdf' },
      { name: 'Bank Statement (Euros/DZD)', status: 'pending' },
      { name: 'Affiliation CNAS or CASNOS', status: 'pending' },
      { name: 'Work Attestation', status: 'received', received_at: '2026-05-16T11:00:00Z' },
      { name: 'Travel Insurance', status: 'pending' }
    ],
    client: {
      id: 'client-1',
      full_name: 'Yacine Benmansour',
      email: 'yacine@example.com',
      phone: '0550123456',
      cni_number: '123456789'
    },
    visa_type: {
      id: 'vt-france',
      agency_id: 'agency-demo',
      name: 'Schengen - France',
      destination_country: 'France',
      category: 'Tourism',
      processing_time: '10-15 business days',
      validity: '90 days',
      stay_duration: '90 days',
      government_fee: 12000,
      service_fee: 8000,
      express_fee: 15000,
      application_method: 'Embassy',
      biometric_required: true,
      interview_required: false,
      applicable_wilayas: [16, 31, 25],
      documents_required: []
    } as any,
    assignee: {
      id: 'emp-1',
      full_name: 'Amine Belkadi',
      avatar_url: ''
    },
    client_notes: 'Urgent Schengen tourism travel with family.',
    internal_notes: 'Awaiting CNAS affiliation and bank statement. Translation of CNI was done internally.',
    created_at: '2026-05-15T09:00:00Z',
    updated_at: '2026-05-17T12:00:00Z'
  },
  {
    id: 'va-2',
    agency_id: 'agency-demo',
    client_id: 'client-2',
    visa_type_id: 'vt-turkey',
    status: 'approved',
    service_level: 'express',
    assigned_to: 'emp-1',
    group_id: 'grp-1',
    group_name: 'Belkaid Couple Turkey',
    government_fee: 8500,
    service_fee: 10000, // Express fee applied
    extra_fee: 0,
    total_fee: 18500,
    amount_paid: 18500,
    payment_status: 'paid',
    appointment_date: null,
    target_application_date: '2026-05-20',
    decision_date: '2026-05-17',
    expiry_date: '2026-11-13',
    documents_status: [
      { name: 'Passport copy', status: 'received', received_at: '2026-05-16T14:00:00Z', file_url: '/passport-scan.pdf' },
      { name: 'Algerian ID card (CNI)', status: 'received', received_at: '2026-05-16T14:05:00Z', file_url: '/cni-scan.pdf' }
    ],
    client: {
      id: 'client-2',
      full_name: 'Riad Belkaid',
      email: 'riad@example.com',
      phone: '0661987654',
      cni_number: '987654321'
    },
    visa_type: {
      id: 'vt-turkey',
      agency_id: 'agency-demo',
      name: 'Turkey e-Visa',
      destination_country: 'Turkey',
      category: 'Tourism',
      processing_time: '1-2 business days',
      validity: '180 days',
      stay_duration: '30 days',
      government_fee: 8500,
      service_fee: 5000,
      express_fee: 10000,
      application_method: 'Online',
      biometric_required: false,
      interview_required: false,
      applicable_wilayas: [],
      documents_required: []
    } as any,
    assignee: {
      id: 'emp-1',
      full_name: 'Amine Belkadi'
    },
    internal_notes: 'Processed online. Payment received via CCP slip #99338.',
    created_at: '2026-05-16T13:30:00Z',
    updated_at: '2026-05-17T15:00:00Z'
  }
]

let mockPayments: VisaPayment[] = [
  {
    id: 'pay-1',
    application_id: 'va-1',
    amount: 10000,
    payment_method: 'Cash',
    payment_date: '2026-05-15',
    reference_number: 'REC-09228',
    notes: 'Advance service fee deposit.',
    received_by: 'emp-1',
    created_at: '2026-05-15T10:30:00Z'
  },
  {
    id: 'pay-2',
    application_id: 'va-2',
    amount: 18500,
    payment_method: 'CCP',
    payment_date: '2026-05-16',
    reference_number: 'CCP-8822019',
    receipt_url: '/mock-ccp.png',
    notes: 'Full amount paid via CCP post office transfer.',
    received_by: 'emp-1',
    created_at: '2026-05-16T15:00:00Z'
  }
]

let mockTimelineEvents: VisaTimelineEvent[] = [
  {
    id: 'evt-1',
    application_id: 'va-1',
    event_type: 'created',
    title: 'Application Created',
    description: 'Visa application created for Yacine Benmansour - Schengen France.',
    is_internal: false,
    created_at: '2026-05-15T09:00:00Z'
  },
  {
    id: 'evt-2',
    application_id: 'va-1',
    event_type: 'document_uploaded',
    title: 'Passport Received',
    description: 'Passport copy uploaded and marked as received.',
    is_internal: false,
    created_at: '2026-05-15T10:00:00Z'
  },
  {
    id: 'evt-3',
    application_id: 'va-2',
    event_type: 'status_changed',
    title: 'Visa Approved 🎉',
    description: 'Turkey e-Visa has been successfully approved! Validity: 180 days.',
    is_internal: false,
    created_at: '2026-05-17T15:00:00Z'
  }
]

// --- BUSINESS HELPER: Check if DB connection exists ---
const hasDb = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL

// --- MUTATIONS AND ACCESSORS ---

export async function getVisaTypes() {
  if (!hasDb()) return { success: true, data: mockVisaTypes }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('visa_types')
      .select('id, agency_id, name, destination_country, category, processing_time, validity, stay_duration, govt_fee, service_fee, express_fee, requires_appointment, requires_biometrics, required_documents, algerian_wilaya_availability, active, created_at')
      .order('name', { ascending: true })

    if (error) throw error
    return { success: true, data: data as VisaType[] }
  } catch (error: any) {
    console.error('Error fetching visa types:', error)
    return { success: false, error: error.message }
  }
}

export async function createVisaType(formData: any) {
  if (!hasDb()) {
    const newType: VisaType = {
      id: `vt-${Math.random().toString(36).substr(2, 9)}`,
      agency_id: 'agency-demo',
      name: formData.name,
      destination_country: formData.destination_country,
      category: formData.category,
      processing_time: formData.processing_time,
      validity: formData.validity,
      stay_duration: formData.stay_duration,
      government_fee: Number(formData.government_fee) || 0,
      service_fee: Number(formData.service_fee) || 0,
      express_fee: Number(formData.express_fee) || 0,
      application_method: formData.application_method || 'Embassy',
      application_url: formData.application_url,
      biometric_required: !!formData.biometric_required,
      interview_required: !!formData.interview_required,
      applicable_wilayas: formData.applicable_wilayas || Array.from({ length: 58 }, (_, i) => i + 1),
      documents_required: formData.documents_required || [],
      special_notes: formData.special_notes,
      is_active: true
    }
    mockVisaTypes.unshift(newType)
    return { success: true, data: newType }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await (supabase as any).from('profiles').select('agency_id').eq('id', user.id).single()
    if (!profile) return { success: false, error: 'Agency profile not found' }

    const { data, error } = await (supabase as any)
      .from('visa_types')
      .insert({
        agency_id: profile.agency_id,
        name: formData.name,
        destination_country: formData.destination_country,
        category: formData.category,
        processing_time: formData.processing_time,
        validity: formData.validity,
        stay_duration: formData.stay_duration,
        government_fee: Number(formData.government_fee) || 0,
        service_fee: Number(formData.service_fee) || 0,
        express_fee: Number(formData.express_fee) || 0,
        application_method: formData.application_method,
        application_url: formData.application_url,
        biometric_required: !!formData.biometric_required,
        interview_required: !!formData.interview_required,
        applicable_wilayas: formData.applicable_wilayas || [],
        documents_required: formData.documents_required || [],
        special_notes: formData.special_notes,
        is_active: true
      })
      .select()
      .single()


    if (error) throw error
    revalidatePath('/dashboard/visa/types')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getVisaApplications(filters?: {
  status?: string;
  country?: string;
  assigned_to?: string;
  payment_status?: string;
  search?: string;
}) {
  if (!hasDb()) {
    let filtered = [...mockApplications]
    if (filters?.status) filtered = filtered.filter(a => a.status === filters.status)
    if (filters?.country) filtered = filtered.filter(a => a.visa_type?.destination_country.toLowerCase().includes(filters.country!.toLowerCase()))
    if (filters?.assigned_to) filtered = filtered.filter(a => a.assigned_to === filters.assigned_to)
    if (filters?.payment_status) filtered = filtered.filter(a => a.payment_status === filters.payment_status)
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      filtered = filtered.filter(a => 
        a.client?.full_name.toLowerCase().includes(s) || 
        a.client?.phone?.includes(s) || 
        a.visa_type?.name.toLowerCase().includes(s)
      )
    }
    return { success: true, data: filtered }
  }

  try {
    const supabase = await createClient()
    let query = (supabase as any)
      .from('visa_applications')
      .select(`
        id, agency_id, client_id, visa_type_id, status, service_level, assigned_to, group_id, group_name, government_fee, service_fee, extra_fee, total_fee, amount_paid, payment_status, appointment_date, target_application_date, decision_date, expiry_date, rejection_reason, client_notes, internal_notes, documents_status, created_at, updated_at,
        client:clients(id, full_name, email, phone, avatar_url, cni_number),
        visa_type:visa_types(id, agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, application_url, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes, is_active, created_at, updated_at),
        assignee:profiles(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
    if (filters?.payment_status) query = query.eq('payment_status', filters.payment_status)

    const { data, error } = await query

    if (error) throw error

    let result = data as EnhancedVisaApplication[]
    // Client-side country and search filtering to support complex inner structures cleanly
    if (filters?.country) {
      result = result.filter(a => a.visa_type?.destination_country.toLowerCase().includes(filters.country!.toLowerCase()))
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(a => 
        a.client?.full_name.toLowerCase().includes(s) || 
        a.client?.phone?.includes(s) || 
        a.visa_type?.name.toLowerCase().includes(s)
      )
    }

    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getVisaApplicationById(id: string) {
  if (!hasDb()) {
    const app = mockApplications.find(a => a.id === id)
    if (!app) return { success: false, error: 'Application not found' }
    const payments = mockPayments.filter(p => p.application_id === id)
    const timeline = mockTimelineEvents.filter(t => t.application_id === id).sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    return { success: true, data: { application: app, payments, timeline } }
  }

  try {
    const supabase = await createClient()
    const { data: application, error: appError } = await (supabase as any)
      .from('visa_applications')
      .select(`
        id, agency_id, client_id, visa_type_id, status, service_level, assigned_to, group_id, group_name, government_fee, service_fee, extra_fee, total_fee, amount_paid, payment_status, appointment_date, target_application_date, decision_date, expiry_date, rejection_reason, client_notes, internal_notes, documents_status, created_at, updated_at,
        client:clients(id, full_name, email, phone, avatar_url, cni_number),
        visa_type:visa_types(id, agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, application_url, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes, is_active, created_at, updated_at),
        assignee:profiles(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (appError) throw appError

    const { data: payments } = await (supabase as any)
      .from('visa_payments')
      .select('id, application_id, amount, payment_method, payment_date, reference_number, receipt_url, notes, received_by, created_at')
      .eq('application_id', id)
      .order('payment_date', { ascending: false })

    const { data: timeline } = await (supabase as any)
      .from('visa_timeline_events')
      .select('id, application_id, event_type, title, description, created_by, is_internal, created_at')
      .eq('application_id', id)
      .order('created_at', { ascending: false })

    return { 
      success: true, 
      data: { 
        application: application as EnhancedVisaApplication, 
        payments: payments || [], 
        timeline: timeline || [] 
      } 
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createVisaApplication(data: {
  client_id: string;
  visa_type_id: string;
  service_level: 'standard' | 'express' | 'vip';
  assigned_to?: string;
  target_application_date?: string;
  appointment_date?: string;
  group_name?: string;
  extra_fee?: number;
  client_notes?: string;
  internal_notes?: string;
  custom_clients?: string[]; // Multiple clients linked for group visa
}) {
  const visaType = !hasDb() 
    ? mockVisaTypes.find(vt => vt.id === data.visa_type_id)
    : null

  let govFee = visaType?.government_fee || 0
  let servFee = visaType?.service_fee || 0
  if (data.service_level === 'express') servFee = visaType?.express_fee || visaType?.service_fee || 0
  if (data.service_level === 'vip') servFee = (visaType?.express_fee || visaType?.service_fee || 0) + 10000

  const extraFee = Number(data.extra_fee) || 0
  const totalFee = govFee + servFee + extraFee

  // Group handling
  const groupId = data.custom_clients && data.custom_clients.length > 0 ? `grp-${Math.random().toString(36).substr(2, 9)}` : null
  const groupNameStr = data.group_name || (groupId ? 'Group Visa' : null)

  if (!hasDb()) {
    // Demo flow
    const clientsToCreate = [data.client_id, ...(data.custom_clients || [])]
    const createdApps: VisaApplication[] = []

    for (const cId of clientsToCreate) {
      const newApp: EnhancedVisaApplication = {
        id: `va-${Math.random().toString(36).substr(2, 9)}`,
        agency_id: 'agency-demo',
        client_id: cId,
        visa_type_id: data.visa_type_id,
        status: 'inquiry',
        service_level: data.service_level,
        assigned_to: data.assigned_to || 'emp-1',
        group_id: groupId,
        group_name: groupNameStr,
        government_fee: govFee,
        service_fee: servFee,
        extra_fee: extraFee,
        total_fee: totalFee,
        amount_paid: 0,
        payment_status: 'unpaid',
        target_application_date: data.target_application_date || null,
        appointment_date: data.appointment_date || null,
        documents_status: (visaType?.documents_required || []).map(doc => ({
          name: doc.name,
          status: 'pending'
        })),
        client: {
          id: cId,
          full_name: cId === 'client-1' ? 'Yacine Benmansour' : cId === 'client-2' ? 'Riad Belkaid' : 'Assigned Client',
          phone: '0550123456'
        },
        visa_type: visaType as any,
        client_notes: data.client_notes,
        internal_notes: data.internal_notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      mockApplications.unshift(newApp)
      createdApps.push(newApp)

      // Add timeline event
      mockTimelineEvents.push({
        id: `evt-${Math.random().toString(36).substr(2, 9)}`,
        application_id: newApp.id,
        event_type: 'created',
        title: 'Application Initiated',
        description: `Visa application initiated. Service Level: ${data.service_level.toUpperCase()}. Total DZD: ${totalFee.toLocaleString()}`,
        is_internal: false,
        created_at: new Date().toISOString()
      })
    }

    return { success: true, data: createdApps[0] }
  }

  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await (supabase as any).from('profiles').select('agency_id').eq('id', user.id).single()
    if (!profile) return { success: false, error: 'Agency not found' }

    // Fetch real visa type fees
    const { data: realVisaType } = await (supabase as any).from('visa_types').select('id, agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, application_url, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes, is_active, created_at, updated_at').eq('id', data.visa_type_id).single()
    if (realVisaType) {
      govFee = (realVisaType as any).government_fee
      servFee = data.service_level === 'express' ? (realVisaType as any).express_fee : (realVisaType as any).service_fee
      if (data.service_level === 'vip') servFee = (realVisaType as any).express_fee + 10000
    }

    const finalTotalFee = govFee + servFee + extraFee
    const clientsToCreate = [data.client_id, ...(data.custom_clients || [])]
    const insertedApps: any[] = []

    for (const cId of clientsToCreate) {
      const documentsStatus = realVisaType?.documents_required
        ? ((realVisaType as any).documents_required as any[]).map(doc => ({
            name: doc.name,
            status: 'pending'
          }))
        : []

      const { data: newApp, error } = await (supabase as any)
        .from('visa_applications')
        .insert({
          agency_id: profile.agency_id,
          client_id: cId,
          visa_type_id: data.visa_type_id,
          status: 'inquiry',
          service_level: data.service_level,
          assigned_to: data.assigned_to || null,
          group_id: groupId,
          group_name: groupNameStr,
          government_fee: govFee,
          service_fee: servFee,
          extra_fee: extraFee,
          total_fee: finalTotalFee,
          amount_paid: 0,
          payment_status: 'unpaid',
          target_application_date: data.target_application_date || null,
          appointment_date: data.appointment_date || null,
          documents_status: documentsStatus,
          client_notes: data.client_notes,
          internal_notes: data.internal_notes
        })
        .select()
        .single()


      if (error) throw error
      insertedApps.push(newApp)

      // Insert default timeline event
      await (supabase as any).from('visa_timeline_events').insert({
        application_id: newApp.id,
        event_type: 'created',
        title: 'Application Created',
        description: `Visa process started for client. Service Level: ${data.service_level.toUpperCase()}. Fee: ${finalTotalFee.toLocaleString()} DZD.`,
        is_internal: false
      })
    }

    revalidatePath('/dashboard/visa')
    return { success: true, data: insertedApps[0] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateVisaApplicationStatus(
  id: string,
  status: 'inquiry' | 'documents_pending' | 'documents_received' | 'application_submitted' | 'under_review' | 'approved' | 'rejected' | 'completed',
  internalNotes?: string,
  rejectionReason?: string
) {
  if (!hasDb()) {
    const appIndex = mockApplications.findIndex(a => a.id === id)
    if (appIndex === -1) return { success: false, error: 'Application not found' }
    
    mockApplications[appIndex].status = status
    if (internalNotes) mockApplications[appIndex].internal_notes = internalNotes
    if (rejectionReason) mockApplications[appIndex].rejection_reason = rejectionReason
    mockApplications[appIndex].updated_at = new Date().toISOString()

    let title = `Status updated to ${status.replace('_', ' ')}`
    if (status === 'approved') title = 'Visa Approved 🎉'
    if (status === 'rejected') title = 'Visa Rejected ❌'

    mockTimelineEvents.push({
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      application_id: id,
      event_type: 'status_changed',
      title,
      description: status === 'rejected' ? `Reason: ${rejectionReason}` : `Updated successfully.`,
      is_internal: false,
      created_at: new Date().toISOString()
    })

    return { success: true, data: mockApplications[appIndex] }
  }

  try {
    const supabase = await createClient()
    
    const updateData: any = { status, updated_at: new Date().toISOString() }
    if (internalNotes) updateData.internal_notes = internalNotes
    if (rejectionReason) updateData.rejection_reason = rejectionReason
    if (status === 'approved') updateData.decision_date = new Date().toISOString().split('T')[0]
    if (status === 'rejected') updateData.decision_date = new Date().toISOString().split('T')[0]

    const { data, error } = await (supabase as any)
      .from('visa_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()


    if (error) throw error

    let title = `Status updated to ${status.replace('_', ' ')}`
    if (status === 'approved') title = 'Visa Approved 🎉'
    if (status === 'rejected') title = 'Visa Rejected ❌'

    await (supabase as any).from('visa_timeline_events').insert({
      application_id: id,
      event_type: 'status_changed',
      title,
      description: status === 'rejected' ? `Reason: ${rejectionReason}` : `Status adjusted programmatically.`,
      is_internal: false
    })

    revalidatePath(`/dashboard/visa/${id}`)
    revalidatePath('/dashboard/visa')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function recordVisaPayment(data: {
  application_id: string;
  amount: number;
  payment_method: 'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer' | 'Check';
  payment_date: string;
  reference_number?: string;
  receipt_url?: string;
  notes?: string;
}) {
  if (!hasDb()) {
    const newPayment: VisaPayment = {
      id: `pay-${Math.random().toString(36).substr(2, 9)}`,
      application_id: data.application_id,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      payment_date: data.payment_date,
      reference_number: data.reference_number,
      receipt_url: data.receipt_url,
      notes: data.notes,
      received_by: 'emp-1',
      created_at: new Date().toISOString()
    }
    mockPayments.push(newPayment)

    // Update amount_paid in application
    const appIndex = mockApplications.findIndex(a => a.id === data.application_id)
    if (appIndex !== -1) {
      const app = mockApplications[appIndex]
      app.amount_paid += newPayment.amount
      app.payment_status = app.amount_paid >= app.total_fee 
        ? 'paid' 
        : app.amount_paid > 0 ? 'partial' : 'unpaid'
    }

    mockTimelineEvents.push({
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      application_id: data.application_id,
      event_type: 'payment_received',
      title: `${data.payment_method} Payment Recorded`,
      description: `Amount: ${newPayment.amount.toLocaleString()} DZD. Ref: ${data.reference_number || 'N/A'}`,
      is_internal: false,
      created_at: new Date().toISOString()
    })

    return { success: true, data: newPayment }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: payment, error } = await (supabase as any)
      .from('visa_payments')
      .insert({
        application_id: data.application_id,
        amount: Number(data.amount),
        payment_method: data.payment_method,
        payment_date: data.payment_date,
        reference_number: data.reference_number || null,
        receipt_url: data.receipt_url || null,
        notes: data.notes || null,
        received_by: user?.id || null
      })
      .select()
      .single()

    if (error) throw error

    // Create payment timeline event
    await (supabase as any).from('visa_timeline_events').insert({
      application_id: data.application_id,
      event_type: 'payment_received',
      title: `Payment Received (${data.payment_method})`,
      description: `Recorded payment of ${Number(data.amount).toLocaleString()} DZD. Receipt slip Ref: ${data.reference_number || 'N/A'}.`,
      is_internal: false
    })

    revalidatePath(`/dashboard/visa/${data.application_id}`)
    return { success: true, data: payment }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateVisaApplicationChecklist(id: string, docs: DocumentStatus[]) {
  if (!hasDb()) {
    const appIndex = mockApplications.findIndex(a => a.id === id)
    if (appIndex !== -1) {
      mockApplications[appIndex].documents_status = docs
      mockApplications[appIndex].updated_at = new Date().toISOString()
    }
    return { success: true }
  }

  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('visa_applications')
      .update({
        documents_status: docs,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    revalidatePath(`/dashboard/visa/${id}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendVisaWhatsAppReminder(id: string, type: 'document_request' | 'appointment' | 'approval', docName?: string) {
  // Simulates sending dynamic template through WhatsApp API
  // logs notification trigger in the timeline
  let title = 'WhatsApp Reminder Dispatched'
  let text = ''
  
  if (type === 'document_request') {
    title = 'WhatsApp Doc Request Sent'
    text = `Simulated template: "Dear Client, please upload your missing document: *${docName || 'Required Papers'}* for your pending visa application."`
  } else if (type === 'appointment') {
    title = 'WhatsApp Appointment Notification'
    text = `Simulated template: "Assalamu alaykum, this is a reminder for your upcoming visa biometrics appointment scheduled for your travel."`
  } else if (type === 'approval') {
    title = 'WhatsApp Visa Approved Notification'
    text = `Simulated template: "Great news! Your visa application has been approved. Please visit our office to collect your passport."`
  }

  if (!hasDb()) {
    mockTimelineEvents.push({
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      application_id: id,
      event_type: 'whatsapp_reminder',
      title,
      description: text,
      is_internal: false,
      created_at: new Date().toISOString()
    })
    return { success: true, message: 'WhatsApp message simulated successfully' }
  }

  try {
    const supabase = await createClient()
    await (supabase as any).from('visa_timeline_events').insert({
      application_id: id,
      event_type: 'whatsapp_reminder',
      title,
      description: text,
      is_internal: false
    })
    revalidatePath(`/dashboard/visa/${id}`)
    return { success: true, message: 'WhatsApp message simulated successfully' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getVisaStats() {
  if (!hasDb()) {
    const active = mockApplications.filter(a => ['documents_pending', 'documents_received', 'application_submitted', 'under_review'].includes(a.status)).length
    const pendingDocs = mockApplications.filter(a => a.status === 'documents_pending').length
    const review = mockApplications.filter(a => a.status === 'under_review').length
    const approvedMonth = mockApplications.filter(a => a.status === 'approved').length
    
    // Revenue calculations
    const revTotal = mockPayments.reduce((sum, p) => sum + p.amount, 0)
    const ccpSplit = mockPayments.filter(p => p.payment_method === 'CCP').reduce((sum, p) => sum + p.amount, 0)
    const cashSplit = mockPayments.filter(p => p.payment_method === 'Cash').reduce((sum, p) => sum + p.amount, 0)

    return {
      success: true,
      stats: {
        activeApplications: active,
        pendingDocuments: pendingDocs,
        underReview: review,
        approvedThisMonth: approvedMonth,
        revenue: revTotal,
        ccpRevenue: ccpSplit,
        cashRevenue: cashSplit
      }
    }
  }

  try {
    const supabase = await createClient()
    
    // 1. Active applications count
    const { count: activeCount } = await (supabase as any)
      .from('visa_applications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['documents_pending', 'documents_received', 'application_submitted', 'under_review'])

    // 2. Pending docs count
    const { count: pendingCount } = await (supabase as any)
      .from('visa_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'documents_pending')

    // 3. Review count
    const { count: reviewCount } = await (supabase as any)
      .from('visa_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'under_review')

    // 4. Approved count (simulating current month)
    const { count: approvedCount } = await (supabase as any)
      .from('visa_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    // 5. Revenue tracking from payments
    const { data: paymentsData } = await (supabase as any)
      .from('visa_payments')
      .select('amount, payment_method')

    const revTotal = paymentsData?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
    const ccpSplit = paymentsData?.filter((p: any) => p.payment_method === 'CCP').reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
    const cashSplit = paymentsData?.filter((p: any) => p.payment_method === 'Cash').reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0


    return {
      success: true,
      stats: {
        activeApplications: activeCount || 0,
        pendingDocuments: pendingCount || 0,
        underReview: reviewCount || 0,
        approvedThisMonth: approvedCount || 0,
        revenue: revTotal,
        ccpRevenue: ccpSplit,
        cashRevenue: cashSplit
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
