import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamClient } from '@/components/dashboard/TeamClient'
import { 
  getEmployees, 
  getRoles, 
  getAttendanceRecords, 
  getLeaveRequests, 
  getPayrollRecords, 
  getKanbanTasks, 
  getAnnouncements 
} from '@/app/actions/employees'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as any
  if (!profile) {
    redirect('/login')
  }

  // Block standard employees if needed, but let's allow them to view directories and requests in Read Only!
  // It says: "Only superadmins can manage team members, but guides/employees can use the hub to see read-only tasks/announcements."
  // So we let them access it but pass their role down so the UI handles permissions beautifully!

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Fetch all parallel data from the database
  const [
    employees,
    roles,
    attendance,
    leaves,
    payroll,
    tasks,
    announcements
  ] = await Promise.all([
    getEmployees(),
    getRoles(),
    getAttendanceRecords(year, month),
    getLeaveRequests(),
    getPayrollRecords(),
    getKanbanTasks(),
    getAnnouncements()
  ])

  return (
    <TeamClient 
      initialEmployees={employees}
      initialRoles={roles}
      initialAttendance={attendance}
      initialLeaves={leaves}
      initialPayroll={payroll}
      initialTasks={tasks}
      initialAnnouncements={announcements}
      currentUserRole={profile.role} 
      currentUserId={user.id} 
    />
  )
}
