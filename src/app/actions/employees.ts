'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasPermission, isManagerRole, isOwnerRole } from '@/lib/permissions'

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

  return { user, profile: profile }
}

async function employeeBelongsToAgency(supabase: Awaited<ReturnType<typeof createClient>>, employeeId: string, agencyId: string) {
  const employeesTable: any = supabase.from('employees')
  const { data } = await employeesTable
    .select('id')
    .eq('id', employeeId)
    .eq('agency_id', agencyId)
    .maybeSingle()

  return Boolean(data?.id)
}

// 1. Employees Actions
export async function getEmployees() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id) return []

  const agencyId = session.profile.agency_id as string

  const { data, error } = await (supabase
    .from('employees') as any)
    .select(`
      *,
      profiles (
        full_name,
        email,
        phone,
        created_at,
        has_login_access
      )
    `)
    .eq('agency_id', agencyId)
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
    has_login_access: emp.profiles?.has_login_access !== false,
    joined_at: emp.profiles?.created_at || emp.created_at
  }))
}

export async function getEmployeeById(employeeId: string) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id) return null

  const agencyId = session.profile.agency_id as string

  const { data, error } = await (supabase
    .from('employees') as any)
    .select(`
      *,
      profiles (
        full_name,
        email,
        phone,
        created_at,
        has_login_access
      )
    `)
    .eq('id', employeeId)
    .eq('agency_id', agencyId)
    .single()

  if (error || !data) {
    console.error('Error fetching employee:', error)
    return null
  }

  const emp = data
  return {
    ...emp,
    full_name: emp.profiles?.full_name || 'Guest',
    email: emp.profiles?.email || 'No email',
    phone: emp.profiles?.phone || 'No phone',
    has_login_access: emp.profiles?.has_login_access !== false,
    joined_at: emp.profiles?.created_at || emp.created_at
  }
}

export async function updateEmployee(employeeId: string, payload: any) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id) return { success: false, error: 'Unauthorized' }

  const agencyId = session.profile.agency_id as string
  const isSelf = session.user.id === employeeId
  const canManageTeam = hasPermission(session.profile.role, 'team:manage') || hasPermission(session.profile.role, 'hr:manage')
  if (!isSelf && !canManageTeam) {
    return { success: false, error: 'You do not have permission to edit this employee.' }
  }
  if (!(await employeeBelongsToAgency(supabase, employeeId, agencyId))) {
    return { success: false, error: 'Employee not found in this company.' }
  }

  const profileFields: any = {}
  if (payload.full_name !== undefined) profileFields.full_name = payload.full_name
  if (payload.phone !== undefined) profileFields.phone = payload.phone

  if (isSelf && !canManageTeam) {
    const blockedKeys = Object.keys(payload).filter((key) => !['full_name', 'phone'].includes(key))
    if (blockedKeys.length > 0) {
      return { success: false, error: 'Restricted users can only update their own name and phone.' }
    }
  }

  if (Object.keys(profileFields).length > 0) {
    const profilesTable: any = supabase.from('profiles')
    const { error: profileError } = await profilesTable
      .update(profileFields)
      .eq('id', employeeId)
      .eq('agency_id', agencyId)
    
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
      .eq('agency_id', agencyId)

    if (empError) return { success: false, error: empError.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 2. Roles Actions
export async function getRoles() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id) return []

  const agencyId = session.profile.agency_id as string

  const { data, error } = await supabase
    .from('roles')
    .select('id, agency_id, name, permissions, created_at, updated_at')
    .eq('agency_id', agencyId)
    .order('name', { ascending: true })

  if (error) return []
  return data || []
}

export async function createCustomRole(name: string, permissions: string[]) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id || !isOwnerRole(session.profile.role)) {
    return { success: false, error: 'Only owners can create custom roles' }
  }

  const agencyId = session.profile.agency_id as string

  const rolesTable: any = supabase.from('roles')
  const { error } = await rolesTable
    .insert({
      agency_id: agencyId,
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
  if (!session.user || !session.profile || !session.profile.agency_id) return []

  const agencyId = session.profile.agency_id as string

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabase
    .from('attendance')
    .select('id, employee_id, agency_id, date, status, check_in, check_out, notes, created_at, updated_at')
    .eq('agency_id', agencyId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) return []
  return data || []
}

export async function recordAttendance(employeeId: string, date: string, status: string, checkIn?: string, checkOut?: string, notes?: string) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id) return { success: false, error: 'Unauthorized' }

  const agencyId = session.profile.agency_id as string
  if (!hasPermission(session.profile.role, 'hr:manage')) {
    return { success: false, error: 'Only owners or managers can record attendance.' }
  }
  if (!(await employeeBelongsToAgency(supabase, employeeId, agencyId))) {
    return { success: false, error: 'Employee not found in this company.' }
  }

  const attendanceTable: any = supabase.from('attendance')
  const { error } = await attendanceTable
    .upsert({
      employee_id: employeeId,
      agency_id: agencyId,
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
  if (!session.user || !session.profile || !session.profile.agency_id) return []

  const agencyId = session.profile.agency_id as string

  const { data, error } = await supabase
    .from('leaves')
    .select(`
      id, employee_id, agency_id, leave_type, start_date, end_date, reason, status, approved_by, created_at, updated_at,
      profiles!leaves_employee_id_fkey (
        full_name
      )
    `)
    .eq('agency_id', agencyId)
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
  if (!session.user || !session.profile || !session.profile.agency_id) return { success: false, error: 'Unauthorized' }

  const agencyId = session.profile.agency_id as string

  const employeesTable: any = supabase.from('employees')
  const { data: employeeData } = await employeesTable
    .select('remaining_annual_leave, remaining_sick_leave')
    .eq('id', session.user.id)
    .eq('agency_id', agencyId)
    .single()

  const employee = employeeData

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
      agency_id: agencyId,
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
  if (!session.user || !session.profile || !session.profile.agency_id || !hasPermission(session.profile.role, 'hr:manage')) {
    return { success: false, error: 'Only admins/managers can approve or reject leaves' }
  }
  const agencyId = session.profile.agency_id as string

  // 1. Get leave details
  const leavesTable: any = supabase.from('leaves')
  const { data: leaveData, error: fetchErr } = await leavesTable
    .select('id, employee_id, agency_id, leave_type, start_date, end_date, reason, status, approved_by, created_at, updated_at')
    .eq('id', leaveId)
    .eq('agency_id', agencyId)
    .single()

  const leave = leaveData
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
      .eq('agency_id', agencyId)
      .single()

    const employee = employeeData

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
          .eq('agency_id', agencyId)
      }
    }
  }

  const { error } = await leavesTable
    .update({
      status,
      approved_by: session.user.id
    })
    .eq('id', leaveId)
    .eq('agency_id', agencyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 5. Commission & Payroll Actions
export async function getPayrollRecords() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id) return []

  const agencyId = session.profile.agency_id as string

  const { data, error } = await supabase
    .from('payroll')
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .eq('agency_id', agencyId)
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
  if (!session.user || !session.profile || !session.profile.agency_id) return { total_commission: 0, closed_count: 0, total_volume: 0 }
  if (!hasPermission(session.profile.role, 'hr:manage')) return { total_commission: 0, closed_count: 0, total_volume: 0 }
  if (!(await employeeBelongsToAgency(supabase, employeeId, session.profile.agency_id as string))) return { total_commission: 0, closed_count: 0, total_volume: 0 }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31T23:59:59Z`

  // Get business type slug to isolate DB tables between travel agency and car showroom
  let businessTypeSlug = 'travel_agency'
  const { data: agencyData } = await supabase
    .from('agencies')
    .select('business_type_slug')
    .eq('id', session.profile.agency_id)
    .single()
  if (agencyData?.business_type_slug) {
    businessTypeSlug = agencyData.business_type_slug
  }

  // Get employee's commission details
  const employeesTable: any = supabase.from('employees')
  const { data: employeeData } = await employeesTable
    .select('commission_percent')
    .eq('id', employeeId)
    .eq('agency_id', session.profile.agency_id)
    .single()

  const employee = employeeData
  const commPercent = Number(employee?.commission_percent || 0)

  if (businessTypeSlug === 'car_showroom') {
    // 1. Fetch completed car sales orders
    const { data: orders, error } = await (supabase
      .from('car_sales_orders') as any)
      .select('id, sale_price, client_id')
      .eq('agency_id', session.profile.agency_id)
      .eq('status', 'completed')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)

    if (error || !orders) {
      console.error('Error fetching car sales orders:', error)
      return { total_commission: 0, closed_count: 0, total_volume: 0 }
    }

    // 2. Fetch conversations assigned to the employee
    const { data: conversations } = await (supabase
      .from('conversations') as any)
      .select('client_id')
      .eq('assignee_id', employeeId)

    const assignedClientIds = new Set((conversations || []).map((c: any) => c.client_id).filter(Boolean))
    const filteredOrders = (orders || []).filter((o: any) => assignedClientIds.has(o.client_id))

    const totalVolume = filteredOrders.reduce((sum: number, o: any) => sum + Number(o.sale_price || 0), 0)
    const totalCommission = Math.round((totalVolume * commPercent) / 100)

    return {
      total_commission: totalCommission,
      closed_count: filteredOrders.length,
      total_volume: totalVolume
    }
  } else {
    // Travel agency: Fetch all completed bookings created during this month where conversation assignee is employeeId
    const { data: bookings, error } = await (supabase
      .from('bookings') as any)
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

    const bookingsList = (bookings || [])
    const totalVolume = bookingsList.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0)
    const totalCommission = Math.round((totalVolume * commPercent) / 100)

    return {
      total_commission: totalCommission,
      closed_count: bookingsList.length,
      total_volume: totalVolume
    }
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
  if (!session.user || !session.profile || !session.profile.agency_id || !hasPermission(session.profile.role, 'hr:manage')) {
    return { success: false, error: 'Unauthorized' }
  }

  const agencyId = session.profile.agency_id as string
  if (!(await employeeBelongsToAgency(supabase, payload.employee_id, agencyId))) {
    return { success: false, error: 'Employee not found in this company.' }
  }

  const payrollTable: any = supabase.from('payroll')
  const { error } = await payrollTable
    .upsert({
      employee_id: payload.employee_id,
      agency_id: agencyId,
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
  if (!session.user || !session.profile || !session.profile.agency_id) return []

  const agencyId = session.profile.agency_id as string

  const { data, error } = await supabase
    .from('hr_tasks')
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .eq('agency_id', agencyId)
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
  if (!session.user || !session.profile || !session.profile.agency_id) return { success: false, error: 'Unauthorized' }

  const agencyId = session.profile.agency_id as string
  if (!hasPermission(session.profile.role, 'team:manage')) {
    return { success: false, error: 'Only team managers can create team tasks.' }
  }
  if (payload.assignee_id && !(await employeeBelongsToAgency(supabase, payload.assignee_id, agencyId))) {
    return { success: false, error: 'Assignee not found in this company.' }
  }

  const hrTasksTable: any = supabase.from('hr_tasks')
  const { error } = await hrTasksTable
    .insert({
      agency_id: agencyId,
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
  if (!session.user || !session.profile || !session.profile.agency_id) return { success: false, error: 'Unauthorized' }
  const agencyId = session.profile.agency_id as string

  const tasksTable: any = supabase.from('hr_tasks')
  const { data: task } = await tasksTable
    .select('id, assignee_id, agency_id')
    .eq('id', taskId)
    .eq('agency_id', agencyId)
    .maybeSingle()

  if (!task) return { success: false, error: 'Task not found in this company.' }
  if (task.assignee_id !== session.user.id && !hasPermission(session.profile.role, 'team:manage')) {
    return { success: false, error: 'You can only update your own assigned tasks.' }
  }

  const hrTasksTable: any = supabase.from('hr_tasks')
  const { error } = await hrTasksTable
    .update({ status })
    .eq('id', taskId)
    .eq('agency_id', agencyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}

// 7. Announcements Actions
export async function getAnnouncements() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile || !session.profile.agency_id) return []

  const agencyId = session.profile.agency_id as string

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .eq('agency_id', agencyId)
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
  if (!session.user || !session.profile || !session.profile.agency_id || !isManagerRole(session.profile.role)) {
    return { success: false, error: 'Only admins or managers can publish announcements' }
  }

  const agencyId = session.profile.agency_id as string

  const announcementsTable: any = supabase.from('announcements')
  const { error } = await announcementsTable
    .insert({
      agency_id: agencyId,
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
  if (!session.user || !session.profile || !session.profile.agency_id) return { success: false }
  const agencyId = session.profile.agency_id as string

  const announcementsTable: any = supabase.from('announcements')
  const { data: announcementData } = await announcementsTable
    .select('read_by')
    .eq('id', announcementId)
    .eq('agency_id', agencyId)
    .single()

  const announcement = announcementData

  const readBy = Array.isArray(announcement?.read_by) ? announcement.read_by : []
  if (!readBy.includes(session.user.id)) {
    const updated = [...readBy, session.user.id]
    const announcementsTable: any = supabase.from('announcements')
    await announcementsTable
      .update({ read_by: updated })
      .eq('id', announcementId)
      .eq('agency_id', agencyId)
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}
