'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to verify auth and retrieve profile role
async function getAuthSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  return { user, profile: profile as any }
}

// 1. Employees Actions
export async function getEmployees() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      profiles (
        full_name,
        email,
        phone,
        created_at
      )
    `)
    .eq('agency_id', session.profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return (data || []).map((emp: any) => ({
    ...emp,
    full_name: emp.profiles?.full_name || 'Guest',
    email: emp.profiles?.email || 'No email',
    phone: emp.profiles?.phone || 'No phone',
    joined_at: emp.profiles?.created_at || emp.created_at
  }))
}

export async function getEmployeeById(employeeId: string) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return null

  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      profiles (
        full_name,
        email,
        phone,
        created_at
      )
    `)
    .eq('id', employeeId)
    .eq('agency_id', session.profile.agency_id)
    .single()

  if (error || !data) {
    console.error('Error fetching employee:', error)
    return null
  }

  const emp = data as any
  return {
    ...emp,
    full_name: emp.profiles?.full_name || 'Guest',
    email: emp.profiles?.email || 'No email',
    phone: emp.profiles?.phone || 'No phone',
    joined_at: emp.profiles?.created_at || emp.created_at
  }
}

export async function updateEmployee(employeeId: string, payload: any) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  // Allow self-update or superadmin/manager edit
  const isSelf = session.user.id === employeeId
  const isAuthAdmin = session.profile.role === 'superadmin' || session.profile.role === 'manager'
  if (!isSelf && !isAuthAdmin) {
    return { success: false, error: 'You do not have permission to edit this employee.' }
  }

  // 1. Separate profiles fields and employees fields
  const profileFields: any = {}
  if (payload.full_name !== undefined) profileFields.full_name = payload.full_name
  if (payload.phone !== undefined) profileFields.phone = payload.phone

  if (Object.keys(profileFields).length > 0) {
    const profilesTable: any = supabase.from('profiles')
    const { error: profileError } = await profilesTable
      .update(profileFields)
      .eq('id', employeeId)
    
    if (profileError) return { success: false, error: profileError.message }
  }

  // 2. Filter employee specific fields
  const empFields = { ...payload }
  delete empFields.full_name
  delete empFields.phone
  delete empFields.email
  delete empFields.joined_at

  if (Object.keys(empFields).length > 0) {
    const employeesTable: any = supabase.from('employees')
    const { error: empError } = await employeesTable
      .update(empFields)
      .eq('id', employeeId)

    if (empError) return { success: false, error: empError.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 2. Roles Actions
export async function getRoles() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const { data, error } = await supabase
    .from('roles')
    .select('id, agency_id, name, permissions, created_at, updated_at')
    .eq('agency_id', session.profile.agency_id)
    .order('name', { ascending: true })

  if (error) return []
  return data || []
}

export async function createCustomRole(name: string, permissions: string[]) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || session.profile.role !== 'superadmin') {
    return { success: false, error: 'Only Superadmins can create custom roles' }
  }

  const rolesTable: any = supabase.from('roles')
  const { error } = await rolesTable
    .insert({
      agency_id: session.profile.agency_id,
      name,
      permissions
    })

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/team')
  return { success: true }
}

// 3. Attendance Actions
export async function getAttendanceRecords(year: number, month: number) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabase
    .from('attendance')
    .select('id, employee_id, agency_id, date, status, check_in, check_out, notes, created_at, updated_at')
    .eq('agency_id', session.profile.agency_id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) return []
  return data || []
}

export async function recordAttendance(employeeId: string, date: string, status: string, checkIn?: string, checkOut?: string, notes?: string) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const attendanceTable: any = supabase.from('attendance')
  const { error } = await attendanceTable
    .upsert({
      employee_id: employeeId,
      agency_id: session.profile.agency_id,
      date,
      status,
      check_in: checkIn || null,
      check_out: checkOut || null,
      notes: notes || ''
    }, {
      onConflict: 'employee_id,date'
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 4. Leave & Vacation Actions
export async function getLeaveRequests() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const { data, error } = await supabase
    .from('leaves')
    .select(`
      id, employee_id, agency_id, leave_type, start_date, end_date, reason, status, approved_by, approved_at, created_at, updated_at,
      profiles!leaves_employee_id_fkey (
        full_name
      )
    `)
    .eq('agency_id', session.profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leaves:', error)
    return []
  }

  return (data || []).map((l: any) => ({
    ...l,
    employee_name: l.profiles?.full_name || 'Guest'
  }))
}

export async function createLeaveRequest(payload: { leave_type: string, start_date: string, end_date: string, reason: string }) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const employeesTable: any = supabase.from('employees')
  const { data: employeeData } = await employeesTable
    .select('remaining_annual_leave, remaining_sick_leave')
    .eq('id', session.user.id)
    .single()

  const employee = employeeData as any

  const start = new Date(payload.start_date)
  const end = new Date(payload.end_date)
  const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  if (payload.leave_type === 'annual' && employee && employee.remaining_annual_leave < requestedDays) {
    return { success: false, error: `Insufficient Annual Leave. Remaining: ${employee.remaining_annual_leave} days, Requested: ${requestedDays} days.` }
  }
  if (payload.leave_type === 'sick' && employee && employee.remaining_sick_leave < requestedDays) {
    return { success: false, error: `Insufficient Sick Leave. Remaining: ${employee.remaining_sick_leave} days, Requested: ${requestedDays} days.` }
  }

  const leavesTable: any = supabase.from('leaves')
  const { error } = await leavesTable
    .insert({
      employee_id: session.user.id,
      agency_id: session.profile.agency_id,
      leave_type: payload.leave_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      reason: payload.reason,
      status: 'pending'
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function approveOrRejectLeave(leaveId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !['superadmin', 'manager'].includes(session.profile.role)) {
    return { success: false, error: 'Only admins/managers can approve or reject leaves' }
  }

  // 1. Get leave details
  const leavesTable: any = supabase.from('leaves')
  const { data: leaveData, error: fetchErr } = await leavesTable
    .select('id, employee_id, agency_id, leave_type, start_date, end_date, reason, status, approved_by, approved_at, created_at, updated_at')
    .eq('id', leaveId)
    .single()

  const leave = leaveData as any
  if (fetchErr || !leave) return { success: false, error: 'Leave request not found' }

  if (status === 'approved' && leave.status !== 'approved') {
    // 2. Calculate requested days
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)
    const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // 3. Deduct from employee leave balances
    const employeesTable: any = supabase.from('employees')
    const { data: employeeData } = await employeesTable
      .select('remaining_annual_leave, remaining_sick_leave')
      .eq('id', leave.employee_id)
      .single()

    const employee = employeeData as any

    if (employee) {
      const updateFields: any = {}
      if (leave.leave_type === 'annual') {
        updateFields.remaining_annual_leave = Math.max(0, employee.remaining_annual_leave - requestedDays)
      } else if (leave.leave_type === 'sick') {
        updateFields.remaining_sick_leave = Math.max(0, employee.remaining_sick_leave - requestedDays)
      }

      if (Object.keys(updateFields).length > 0) {
        const employeesTable: any = supabase.from('employees')
        await employeesTable
          .update(updateFields)
          .eq('id', leave.employee_id)
      }
    }
  }

  const { error } = await leavesTable
    .update({
      status,
      approved_by: session.user.id
    })
    .eq('id', leaveId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 5. Commission & Payroll Actions
export async function getPayrollRecords() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const { data, error } = await supabase
    .from('payroll')
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .eq('agency_id', session.profile.agency_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) return []
  return (data || []).map((p: any) => ({
    ...p,
    employee_name: p.profiles?.full_name || 'Guest'
  }))
}

export async function calculateClosedBookingsCommission(employeeId: string, month: number, year: number) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { total_commission: 0, closed_count: 0, total_volume: 0 }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31T23:59:59Z`

  // Fetch all completed bookings created during this month where conversation assignee is employeeId
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      total_price,
      conversations!inner (
        assignee_id
      )
    `)
    .eq('status', 'completed')
    .eq('conversations.assignee_id', employeeId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error || !bookings) {
    console.error('Error fetching bookings for commission:', error)
    return { total_commission: 0, closed_count: 0, total_volume: 0 }
  }

  // Get employee's commission details
  const employeesTable: any = supabase.from('employees')
  const { data: employeeData } = await employeesTable
    .select('commission_percent')
    .eq('id', employeeId)
    .single()

  const employee = employeeData as any

  const bookingsList = (bookings || []) as any[]
  const commPercent = Number(employee?.commission_percent || 0)
  const totalVolume = bookingsList.reduce((sum, b) => sum + (b.total_price || 0), 0)
  const totalCommission = Math.round((totalVolume * commPercent) / 100)

  return {
    total_commission: totalCommission,
    closed_count: bookingsList.length,
    total_volume: totalVolume
  }
}

export async function recordPayroll(payload: {
  employee_id: string,
  month: number,
  year: number,
  base_salary: number,
  commission: number,
  bonuses: number,
  deductions: number,
  net_salary: number,
  status: 'draft' | 'paid'
}) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !['superadmin', 'manager'].includes(session.profile.role)) {
    return { success: false, error: 'Unauthorized' }
  }

  const payrollTable: any = supabase.from('payroll')
  const { error } = await payrollTable
    .upsert({
      employee_id: payload.employee_id,
      agency_id: session.profile.agency_id,
      month: payload.month,
      year: payload.year,
      base_salary: payload.base_salary,
      commission: payload.commission,
      bonuses: payload.bonuses,
      deductions: payload.deductions,
      net_salary: payload.net_salary,
      status: payload.status
    }, {
      onConflict: 'employee_id,month,year'
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 6. Kanban Tasks Actions
export async function getKanbanTasks() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const { data, error } = await supabase
    .from('hr_tasks')
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .eq('agency_id', session.profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []).map((t: any) => ({
    ...t,
    assignee_name: t.profiles?.full_name || 'Unassigned'
  }))
}

export async function createKanbanTask(payload: { title: string, description: string, assignee_id?: string, due_date?: string, status?: string }) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const hrTasksTable: any = supabase.from('hr_tasks')
  const { error } = await hrTasksTable
    .insert({
      agency_id: session.profile.agency_id,
      title: payload.title,
      description: payload.description,
      assignee_id: payload.assignee_id || null,
      due_date: payload.due_date || null,
      status: payload.status || 'todo'
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function updateKanbanTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const hrTasksTable: any = supabase.from('hr_tasks')
  const { error } = await hrTasksTable
    .update({ status })
    .eq('id', taskId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 7. Announcements Actions
export async function getAnnouncements() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .eq('agency_id', session.profile.agency_id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []).map((a: any) => ({
    ...a,
    author_name: a.profiles?.full_name || 'System'
  }))
}

export async function createAnnouncement(content: string, isPinned: boolean = false) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !['superadmin', 'manager'].includes(session.profile.role)) {
    return { success: false, error: 'Only admins or managers can publish announcements' }
  }

  const announcementsTable: any = supabase.from('announcements')
  const { error } = await announcementsTable
    .insert({
      agency_id: session.profile.agency_id,
      author_id: session.user.id,
      content,
      is_pinned: isPinned,
      read_by: []
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function markAnnouncementAsRead(announcementId: string) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false }

  const announcementsTable: any = supabase.from('announcements')
  const { data: announcementData } = await announcementsTable
    .select('read_by')
    .eq('id', announcementId)
    .single()

  const announcement = announcementData as any

  const readBy = Array.isArray(announcement?.read_by) ? announcement.read_by : []
  if (!readBy.includes(session.user.id)) {
    const updated = [...readBy, session.user.id]
    const announcementsTable: any = supabase.from('announcements')
    await announcementsTable
      .update({ read_by: updated })
      .eq('id', announcementId)
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}
