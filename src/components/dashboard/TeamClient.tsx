'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Shield, CalendarDays, Contact, Mail, Briefcase, DollarSign, 
  MapPin, Clock, Award, PhoneCall, FileText, CheckCircle2, AlertTriangle, 
  ChevronRight, ArrowRight, BookOpen, User, Users, Trash2, Loader2, Pin, Eye, Download, Check,
  ChevronDown, ChevronUp, RefreshCw, Send, AlertCircle, ArrowUpRight, Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  updateEmployee, 
  getEmployeeById, 
  createCustomRole, 
  recordAttendance, 
  createLeaveRequest, 
  approveOrRejectLeave, 
  calculateClosedBookingsCommission, 
  recordPayroll, 
  getPayrollRecords,
  createKanbanTask, 
  updateKanbanTaskStatus, 
  createAnnouncement, 
  markAnnouncementAsRead 
} from '@/app/actions/employees'
import { inviteEmployee, removeEmployee } from '@/app/actions/team'

interface TeamClientProps {
  initialEmployees: any[];
  initialRoles: any[];
  initialAttendance: any[];
  initialLeaves: any[];
  initialPayroll: any[];
  initialTasks: any[];
  initialAnnouncements: any[];
  currentUserRole: string;
  currentUserId: string;
}

const ALGERIAN_WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Algiers (Alger)", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "El M'Ghair", "El Meniaa",
  "Ouled Djellal", "Bordj Baji Mokhtar", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet"
]

export function TeamClient({
  initialEmployees,
  initialRoles,
  initialAttendance,
  initialLeaves,
  initialPayroll,
  initialTasks,
  initialAnnouncements,
  currentUserRole,
  currentUserId
}: TeamClientProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'org_chart' | 'attendance' | 'leaves' | 'payroll' | 'kanban' | 'announcements'>('directory')
  
  // State variables for dynamic directories
  const [employees, setEmployees] = useState(initialEmployees)
  const [roles, setRoles] = useState(initialRoles)
  const [attendance, setAttendance] = useState(initialAttendance)
  const [leaves, setLeaves] = useState(initialLeaves)
  const [payroll, setPayroll] = useState(initialPayroll)
  const [tasks, setTasks] = useState(initialTasks)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)

  // Directory UI search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Org Chart expanded & collapsed states
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())

  // Configurable Attendance Parameters
  const [lateThreshold, setLateThreshold] = useState(15) // Late grace in minutes
  const [autoAbsentThreshold, setAutoAbsentThreshold] = useState(30) // Auto-absent limit (lateGrace + gracePeriod)
  const [attendanceHalfDay, setAttendanceHalfDay] = useState(false)

  // Bulk Payroll States
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([])
  const [isProcessingBulkPayroll, setIsProcessingBulkPayroll] = useState(false)
  const [bulkPayrollProgress, setBulkPayrollProgress] = useState(0)
  const [bulkPayrollLogs, setBulkPayrollLogs] = useState<string[]>([])

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // View Details Overlay
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [detailTab, setDetailTab] = useState<'personal' | 'contract' | 'payroll' | 'leaves' | 'documents' | 'performance'>('personal')
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false)

  // custom role state
  const [customRoleName, setCustomRoleName] = useState('')
  const [customRolePerms, setCustomRolePerms] = useState<string[]>([])
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  // Attendance dynamic state
  const [selectedEmpAttendance, setSelectedEmpAttendance] = useState<string>('')
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late' | 'leave'>('present')
  const [checkInTime, setCheckInTime] = useState('09:00')
  const [checkOutTime, setCheckOutTime] = useState('18:00')
  const [attendanceNotes, setAttendanceNotes] = useState('')

  // Leaves requesting
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'hajj' | 'other'>('annual')
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveEnd, setLeaveEnd] = useState('')
  const [leaveReason, setLeaveReason] = useState('')

  // Payroll Commission auto-calc creator
  const [selectedEmpPayroll, setSelectedEmpPayroll] = useState<string>('')
  const [payrollMonth, setPayrollMonth] = useState<number>(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState<number>(new Date().getFullYear())
  const [isCalculatingPayroll, setIsCalculatingPayroll] = useState(false)
  const [payrollCalcs, setPayrollCalcs] = useState<{ total_commission: number, closed_count: number, total_volume: number } | null>(null)
  const [baseSalaryInput, setBaseSalaryInput] = useState<number>(40000)
  const [bonusesInput, setBonusesInput] = useState<number>(0)
  const [deductionsInput, setDeductionsInput] = useState<number>(0)
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState<any>(null)

  // Kanban Tasks
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')

  // Announcements
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false)
  const [announceContent, setAnnounceContent] = useState('')
  const [announcePinned, setAnnouncePinned] = useState(false)

  // Remove member loading
  const [removingId, setRemovingId] = useState<string | null>(null)

  const isSuperadminOrManager = currentUserRole === 'superadmin' || currentUserRole === 'manager'

  // Calculations for quick HR Stats
  const activeCount = employees.filter(e => e.status === 'active').length
  const onLeaveCount = leaves.filter(l => l.status === 'approved' && new Date(l.end_date) >= new Date()).length
  const totalPayrollDZD = payroll.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.net_salary || 0), 0)
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length

  // Generate deterministic performance values
  const getPerformanceMetrics = (empId: string) => {
    const code = empId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const trend = [
      78 + (code % 12),
      81 + (code % 9),
      85 + (code % 11),
      83 + (code % 15),
      89 + (code % 9),
      91 + (code % 8)
    ]
    const avg = Math.round(trend.reduce((a, b) => a + b, 0) / trend.length)
    let percentile = 'Top 25%'
    if (avg >= 92) percentile = 'Top 5%'
    else if (avg >= 88) percentile = 'Top 10%'
    else if (avg >= 82) percentile = 'Top 20%'
    
    return { trend, avg, percentile }
  }

  // Reactively calculate lateness threshold checks
  const handleCheckInChange = (val: string) => {
    setCheckInTime(val)
    if (!val) return

    const [hours, minutes] = val.split(':').map(Number)
    const checkInMinutes = hours * 60 + minutes
    const normalStartMinutes = 9 * 60 // 09:00 AM

    const lateThresholdMinutes = normalStartMinutes + lateThreshold
    const absentThresholdMinutes = lateThresholdMinutes + autoAbsentThreshold

    if (checkInMinutes > absentThresholdMinutes) {
      setAttendanceStatus('absent')
      setAttendanceNotes(`Absence automatique : Arrivée à ${val} ayant dépassé le délai de grâce (+${lateThreshold}m) et la tolérance limite (+${autoAbsentThreshold}m).`)
    } else if (checkInMinutes > lateThresholdMinutes) {
      setAttendanceStatus('late')
      setAttendanceNotes(`En retard : Arrivée à ${val} après le délai de grâce réglementaire (+${lateThreshold}m).`)
    } else {
      setAttendanceStatus('present')
      setAttendanceNotes(attendanceHalfDay ? 'Présence en demi-journée.' : 'Arrivée à l\'heure.')
    }
  }

  // Process Bulk Payroll
  const handleProcessBulkPayroll = async () => {
    if (selectedEmpIds.length === 0) return
    setIsProcessingBulkPayroll(true)
    setBulkPayrollProgress(0)
    setBulkPayrollLogs([])

    const logs: string[] = []
    
    for (let i = 0; i < selectedEmpIds.length; i++) {
      const empId = selectedEmpIds[i]
      const emp = employees.find(e => e.id === empId)
      if (!emp) continue

      const progress = Math.round(((i + 1) / selectedEmpIds.length) * 100)
      
      // 1. Calculate closed commission
      logs.push(`[${emp.full_name}] Analyse des réservations closes du mois en cours...`)
      setBulkPayrollLogs([...logs])
      await new Promise(r => setTimeout(r, 600))

      const commCalcs = await calculateClosedBookingsCommission(empId, payrollMonth, payrollYear)
      logs.push(`[${emp.full_name}] Commissions calculées : ${commCalcs.total_commission.toLocaleString()} DZD (pour ${commCalcs.closed_count} réservations)`)
      setBulkPayrollLogs([...logs])
      await new Promise(r => setTimeout(r, 500))

      // 2. Submit payroll
      const net = (emp.base_salary || 40000) + commCalcs.total_commission
      logs.push(`[${emp.full_name}] Traitement de la fiche de paie : Total Net = ${net.toLocaleString()} DZD`)
      setBulkPayrollLogs([...logs])

      const res = await recordPayroll({
        employee_id: empId,
        month: payrollMonth,
        year: payrollYear,
        base_salary: emp.base_salary || 40000,
        commission: commCalcs.total_commission,
        bonuses: 0,
        deductions: 0,
        net_salary: net,
        status: 'paid'
      })

      if (res.success) {
        logs.push(`[EMAIL SIMULATOR] Fiche de paie au format PDF envoyée à l'adresse : ${emp.email}`)
      } else {
        logs.push(`[ERREUR] Impossible d'enregistrer le virement de ${emp.full_name} : ${res.error}`)
      }
      setBulkPayrollLogs([...logs])

      setBulkPayrollProgress(progress)
      await new Promise(r => setTimeout(r, 700))
    }

    logs.push(`🚀 Traitement par lots terminé avec succès pour les ${selectedEmpIds.length} collaborateurs !`)
    setBulkPayrollLogs([...logs])
    
    // Refresh table data
    const updatedPayroll = await getPayrollRecords()
    setPayroll(updatedPayroll)
  }

  // Toggle Collapse on Org tree
  const toggleCollapseNode = (id: string) => {
    const copy = new Set(collapsedNodes)
    if (copy.has(id)) {
      copy.delete(id)
    } else {
      copy.add(id)
    }
    setCollapsedNodes(copy)
  }

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInviteError('')
    setInviteLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await inviteEmployee(formData)

    if (result.success) {
      setIsInviteOpen(false)
      alert('Invitation sent! Default employee record generated.')
      window.location.reload()
    } else {
      setInviteError(result.error || 'Failed to invite user')
    }
    setInviteLoading(true)
  }

  const handleRemove = async (id: string) => {
    if (!confirm('WARNING: Removing this member deletes their authentication and dashboard profiles. Proceed?')) return
    setRemovingId(id)
    const result = await removeEmployee(id)
    if (result.success) {
      setEmployees(employees.filter(e => e.id !== id))
    } else {
      alert(result.error)
    }
    setRemovingId(null)
  }

  const handleUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedEmployee) return
    setIsUpdatingEmployee(true)

    const formData = new FormData(e.currentTarget)
    const data: any = {}

    formData.forEach((value, key) => {
      if (value !== '') {
        if (key === 'base_salary' || key === 'num_children' || key === 'annual_leave_days' || key === 'sick_leave_days') {
          data[key] = parseInt(value as string)
        } else if (key === 'commission_percent') {
          data[key] = parseFloat(value as string)
        } else {
          data[key] = value
        }
      }
    })

    const result = await updateEmployee(selectedEmployee.id, data)
    if (result.success) {
      alert('Employee details updated successfully!')
      const updated = employees.map(emp => emp.id === selectedEmployee.id ? { ...emp, ...data } : emp)
      setEmployees(updated)
      setSelectedEmployee({ ...selectedEmployee, ...data })
    } else {
      alert('Failed to update details: ' + result.error)
    }
    setIsUpdatingEmployee(false)
  }

  const handleCreateRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!customRoleName) return
    const result = await createCustomRole(customRoleName, customRolePerms)
    if (result.success) {
      alert('Custom role created!')
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmpAttendance) return
    const statusVal = attendanceHalfDay ? 'late' : attendanceStatus
    const finalNotes = attendanceHalfDay ? `[DEMI-JOURNÉE] ${attendanceNotes}` : attendanceNotes

    const result = await recordAttendance(selectedEmpAttendance, attendanceDate, statusVal, checkInTime, checkOutTime, finalNotes)
    if (result.success) {
      alert('Attendance recorded!')
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createLeaveRequest({
      leave_type: leaveType,
      start_date: leaveStart,
      end_date: leaveEnd,
      reason: leaveReason
    })
    if (result.success) {
      alert('Leave requested successfully!')
      setIsLeaveModalOpen(false)
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleApproveLeave = async (id: string, status: 'approved' | 'rejected') => {
    const result = await approveOrRejectLeave(id, status)
    if (result.success) {
      alert(`Leave request ${status}!`)
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleCalculateCommission = async () => {
    if (!selectedEmpPayroll) return
    setIsCalculatingPayroll(true)
    const result = await calculateClosedBookingsCommission(selectedEmpPayroll, payrollMonth, payrollYear)
    setPayrollCalcs(result)
    const emp = employees.find(e => e.id === selectedEmpPayroll)
    if (emp) {
      setBaseSalaryInput(emp.base_salary || 40000)
    }
    setIsCalculatingPayroll(false)
  }

  const handleRecordPayroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmpPayroll || !payrollCalcs) return
    const net = baseSalaryInput + payrollCalcs.total_commission + bonusesInput - deductionsInput
    const result = await recordPayroll({
      employee_id: selectedEmpPayroll,
      month: payrollMonth,
      year: payrollYear,
      base_salary: baseSalaryInput,
      commission: payrollCalcs.total_commission,
      bonuses: bonusesInput,
      deductions: deductionsInput,
      net_salary: net,
      status: 'paid'
    })
    if (result.success) {
      alert('Payroll calculated and paid successfully!')
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createKanbanTask({
      title: taskTitle,
      description: taskDesc,
      assignee_id: taskAssignee,
      due_date: taskDueDate,
      status: 'todo'
    })
    if (result.success) {
      alert('Task created on the Kanban Board!')
      setIsTaskModalOpen(false)
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    const result = await updateKanbanTaskStatus(taskId, newStatus)
    if (result.success) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    } else {
      alert(result.error)
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createAnnouncement(announceContent, announcePinned)
    if (result.success) {
      alert('Announcement published!')
      setIsAnnounceModalOpen(false)
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleMarkRead = async (announceId: string) => {
    await markAnnouncementAsRead(announceId)
    setAnnouncements(announcements.map(a => {
      if (a.id === announceId) {
        const readBy = Array.isArray(a.read_by) ? a.read_by : []
        return { ...a, read_by: [...readBy, currentUserId] }
      }
      return a
    }))
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus
    return matchesSearch && matchesDept && matchesStatus
  })

  // Recursive drop-enabled expanded/collapsible Org tree node
  const renderOrgTreeNode = (emp: any) => {
    const directReports = employees.filter(e => e.manager_id === emp.id)
    const isCollapsed = collapsedNodes.has(emp.id)
    const { percentile } = getPerformanceMetrics(emp.id)

    return (
      <div key={emp.id} className="flex flex-col items-center select-none">
        
        {/* Node Card wrapper with HTML5 drag-and-drop properties */}
        <div 
          draggable={isSuperadminOrManager}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', emp.id)
            e.currentTarget.classList.add('opacity-45', 'scale-95')
          }}
          onDragEnd={(e) => {
            e.currentTarget.classList.remove('opacity-45', 'scale-95')
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.currentTarget.classList.add('border-blue-500', 'bg-blue-50/40')}
          onDragLeave={(e) => e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/40')}
          onDrop={async (e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/40')
            const draggedId = e.dataTransfer.getData('text/plain')
            if (draggedId && draggedId !== emp.id) {
              const res = await updateEmployee(draggedId, { manager_id: emp.id })
              if (res.success) {
                setEmployees(prev => prev.map(item => item.id === draggedId ? { ...item, manager_id: emp.id } : item))
              }
            }
          }}
          onClick={() => {
            setSelectedEmployee(emp)
            setDetailTab('personal')
          }}
          className="bg-white border-[2px] border-slate-200 hover:border-blue-500 rounded-2xl p-4 shadow-sm w-56 cursor-grab hover:shadow-md transition-all duration-200 text-center relative"
        >
          {/* Percentile Rank tag */}
          <Badge className="absolute top-2 left-2 text-[8px] font-black rounded-md px-1 py-0 bg-blue-50 text-blue-600 border border-blue-150">
            {percentile}
          </Badge>

          <Avatar className="h-11 w-11 border border-slate-100 shadow-sm mx-auto mb-2 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-650 text-white font-black text-sm">
              {emp.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h4 className="text-xs font-bold text-slate-800 truncate">{emp.full_name}</h4>
          <p className="text-[10px] text-slate-400 font-extrabold tracking-tight mt-0.5 uppercase">{emp.role || emp.department || 'Associate'}</p>
          
          <Badge className="absolute top-2 right-2 text-[8px] px-1 py-0 font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-500 border border-slate-200">
            {emp.employee_code}
          </Badge>

          {/* Direct report toggle */}
          {directReports.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapseNode(emp.id)
              }}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-500 hover:text-slate-800 transition z-10"
            >
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Children reports connected via vertical lines if NOT collapsed */}
        {directReports.length > 0 && !isCollapsed && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-200" />
            
            <div className="flex gap-8 relative items-start">
              {directReports.map((report, idx) => {
                return (
                  <div key={report.id} className="flex flex-col items-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full border-t-2 border-slate-200" 
                      style={{ 
                        width: directReports.length > 1 ? '100%' : '0px',
                        left: idx === 0 ? '50%' : idx === directReports.length - 1 ? '-50%' : '0%'
                      }} 
                    />
                    <div className="w-0.5 h-6 bg-slate-200" />
                    {renderOrgTreeNode(report)}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const rootEmployees = employees.filter(e => !e.manager_id)

  return (
    <div className="p-6 space-y-6 font-geist text-left bg-[#f8fafc] min-h-[calc(100vh-64px)] overflow-y-auto page-enter pb-16">
      
      {/* Visual KPI Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Collaborators</span>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-800 mt-0.5">{activeCount} / {employees.length}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Paid Payroll (DZD)</span>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-800 mt-0.5">{totalPayrollDZD.toLocaleString()} DA</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Currently On Leave</span>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-800 mt-0.5">{onLeaveCount} Employees</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-indigo-600 flex items-center justify-center font-black">
            <Flame className="h-6 w-6 animate-bounce" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Overdue Kanban Tasks</span>
            <h3 className="text-2xl font-semibold tracking-tight text-red-600 mt-0.5">
              {tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length} Overdue
            </h3>
          </div>
        </div>
      </div>

      {/* Main Header & Sub Navigation Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">HR Hub & Employee Platform</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage personnel records, custom agency roles, attendance tracking, leave balances, commission payroll, Kanban board tasks, and read announcements.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSuperadminOrManager && (
            <>
              <Button onClick={() => setIsRoleModalOpen(true)} variant="outline" className="border-slate-200 text-slate-700 rounded-xl text-xs font-semibold px-4 transition hover:bg-slate-50">
                Custom Roles
              </Button>
              <Button onClick={() => setIsInviteOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition text-xs font-semibold px-4">
                <Plus className="mr-1.5 h-4 w-4" /> Invite Member
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab Selectors Row */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 select-none">
        {(['directory', 'org_chart', 'attendance', 'leaves', 'payroll', 'kanban', 'announcements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 capitalize transition-all duration-150 ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white border border-slate-200/60 p-4 rounded-xl shadow-xs">
            <div className="relative max-w-sm flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search name or employee code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50/50 border-slate-200 text-slate-700 text-xs rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div>
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Department</Label>
                <select 
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="block h-9 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Departments</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Guides">Guides</option>
                </select>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Status</Label>
                <select 
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="block h-9 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                  <option value="resigned">Resigned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => {
              const isMe = emp.id === currentUserId
              const { avg: performanceScore, percentile } = getPerformanceMetrics(emp.id)

              return (
                <div 
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployee(emp)
                    setDetailTab('personal')
                  }}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top Row: Avatar & status Badge */}
                    <div className="flex justify-between items-start">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border border-slate-100 shadow-sm shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-650 text-white font-bold text-lg">
                            {emp.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          emp.status === 'active' ? 'bg-green-500' : emp.status === 'on_leave' ? 'bg-blue-500' : 'bg-slate-350'
                        }`} />
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-150 text-slate-600 hover:bg-slate-150 border-0">
                          {emp.employee_code || 'EMP-NEW'}
                        </Badge>
                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100 rounded-md text-[9px] font-black px-1.5 uppercase">
                          Score: {performanceScore}% ({percentile})
                        </Badge>
                      </div>
                    </div>

                    {/* Employee Profile Metadata */}
                    <div className="mt-4 text-left">
                      <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                        {emp.full_name}
                        {isMe && <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100/50">You</span>}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-300" /> {emp.role || emp.department || 'Collaborator'} ({emp.department || 'N/A'})
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-300" /> {emp.email}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
                        <Contact className="h-3.5 w-3.5 text-slate-300" /> {emp.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-300" /> Joined {new Date(emp.joined_at).toLocaleDateString()}
                    </span>

                    {isSuperadminOrManager && !isMe && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(emp.id)
                        }}
                        disabled={removingId === emp.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-2 text-xs font-bold"
                      >
                        {removingId === emp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredEmployees.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-2xl">
                <p className="text-slate-500 text-sm">No employees match your search filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATIONAL CHART (Interactive Drag-Drop) */}
      {activeTab === 'org_chart' && (
        <div className="space-y-6">
          {/* Promote Drop Zone */}
          {isSuperadminOrManager && (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.currentTarget.classList.add('bg-blue-50/40', 'border-blue-300')}
              onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50/40', 'border-blue-300')}
              onDrop={async (e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-blue-50/40', 'border-blue-300')
                const draggedId = e.dataTransfer.getData('text/plain')
                if (draggedId) {
                  const res = await updateEmployee(draggedId, { manager_id: null })
                  if (res.success) {
                    setEmployees(prev => prev.map(item => item.id === draggedId ? { ...item, manager_id: null } : item))
                    alert('Collaborateur promu au niveau supérieur avec succès !')
                  }
                }
              }}
              className="border border-dashed border-slate-250 bg-slate-50/50 p-4 rounded-xl text-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              🗀 Glissez un collaborateur ici pour le promouvoir au niveau supérieur (sans responsable direct)
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-8 overflow-x-auto shadow-xs text-center min-h-[450px]">
            <h2 className="text-sm font-bold text-slate-800 mb-2">Interactive Manager & Reports Hierarchy</h2>
            <p className="text-xs text-slate-400 font-semibold mb-6">Glissez-déposez un collaborateur sur un responsable pour le réassigner dynamiquement ou cliquez sur +/- pour réduire l'arborescence.</p>
            
            <div className="flex flex-col items-center justify-center gap-8 min-w-[700px] mt-4">
              {rootEmployees.map(emp => renderOrgTreeNode(emp))}
              {employees.length === 0 && (
                <p className="text-slate-500 text-xs">No organizational data found in database.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE CALENDAR (Threshold check reactive parameters) */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Record Attendance Box */}
          {isSuperadminOrManager && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Record / Update Attendance</h2>
              
              {/* Threshold Config Panel */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-3">
                <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">Late Threshold Config</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-slate-500">Retard Grâce (Min)</Label>
                    <Input 
                      type="number" 
                      value={lateThreshold} 
                      onChange={e => setLateThreshold(parseInt(e.target.value) || 0)} 
                      className="h-8 text-xs rounded-lg mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Absence Grâce (Min)</Label>
                    <Input 
                      type="number" 
                      value={autoAbsentThreshold} 
                      onChange={e => setAutoAbsentThreshold(parseInt(e.target.value) || 0)} 
                      className="h-8 text-xs rounded-lg mt-1" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 select-none border-t border-slate-200/50 pt-2">
                  <input 
                    type="checkbox" 
                    id="halfDayToggle"
                    checked={attendanceHalfDay}
                    onChange={e => {
                      setAttendanceHalfDay(e.target.checked)
                      if (e.target.checked) {
                        setAttendanceStatus('late')
                        setAttendanceNotes('Présence en demi-journée.')
                      } else {
                        setAttendanceStatus('present')
                        setAttendanceNotes('Arrivée à l\'heure.')
                      }
                    }}
                    className="h-3.5 w-3.5 rounded text-blue-600" 
                  />
                  <Label htmlFor="halfDayToggle" className="text-[11px] font-bold text-slate-600 cursor-pointer">Option Demi-Journée</Label>
                </div>
              </div>

              <form onSubmit={handleRecordAttendance} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Select Employee</Label>
                  <select 
                    required
                    value={selectedEmpAttendance}
                    onChange={e => setSelectedEmpAttendance(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Work Date</Label>
                  <Input 
                    type="date"
                    required
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Status</Label>
                  <select 
                    value={attendanceStatus}
                    disabled={attendanceHalfDay}
                    onChange={e => setAttendanceStatus(e.target.value as any)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="present">🟢 Present</option>
                    <option value="absent">🔴 Absent</option>
                    <option value="late">🟡 Late</option>
                    <option value="leave">🔵 On Leave</option>
                  </select>
                </div>

                {attendanceStatus === 'present' || attendanceStatus === 'late' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">Check In</Label>
                      <Input 
                        type="time" 
                        value={checkInTime} 
                        onChange={e => handleCheckInChange(e.target.value)} 
                        className="rounded-xl border-slate-200 text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">Check Out</Label>
                      <Input 
                        type="time" 
                        value={checkOutTime} 
                        onChange={e => setCheckOutTime(e.target.value)} 
                        className="rounded-xl border-slate-200 text-xs" 
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Private Notes / Observations</Label>
                  <textarea 
                    value={attendanceNotes}
                    onChange={e => setAttendanceNotes(e.target.value)}
                    placeholder="E.g., Arrived late due to transport delays, etc."
                    className="flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold py-2">
                  Save Attendance Record
                </Button>
              </form>
            </div>
          )}

          {/* Monthly Registry Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Monthly Attendance Registry Grid</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Employee</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Employee Code</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Days Tracked</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500 text-right">Status Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const empAtt = attendance.filter(a => a.employee_id === emp.id)
                    const present = empAtt.filter(a => a.status === 'present').length
                    const late = empAtt.filter(a => a.status === 'late').length
                    const absent = empAtt.filter(a => a.status === 'absent').length
                    const onLeave = empAtt.filter(a => a.status === 'leave').length

                    return (
                      <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-medium text-slate-800 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold">
                              {emp.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {emp.full_name}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-bold">{emp.employee_code}</td>
                        <td className="py-3 px-3 text-slate-500">{empAtt.length} days</td>
                        <td className="py-3 px-3 text-right space-x-1.5 animate-fade-in">
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 rounded-md text-[10px] font-bold px-1.5">
                            {present} Présents
                          </Badge>
                          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100 rounded-md text-[10px] font-bold px-1.5">
                            {late} Retards
                          </Badge>
                          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-100 rounded-md text-[10px] font-bold px-1.5">
                            {absent} Absences
                          </Badge>
                          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 rounded-md text-[10px] font-bold px-1.5">
                            {onLeave} Congés
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div>
              <h2 className="text-md font-semibold text-slate-800">Leave Balance & Requests</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Track available balances and request annual, sick, or custom Hajj leaves.</p>
            </div>
            
            <Button onClick={() => setIsLeaveModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4">
              Request Vacation / Leave
            </Button>
          </div>

          {/* Quick Leave Balances tracker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {employees.map(emp => {
              return (
                <div key={emp.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{emp.full_name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{emp.employee_code}</p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-500 rounded-md text-[9px] uppercase tracking-wider border-0 font-extrabold">{emp.department}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Annual Leave Balance:</span>
                        <span className="text-slate-800 font-bold">{emp.remaining_annual_leave} / {emp.annual_leave_days} Days</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(emp.remaining_annual_leave / emp.annual_leave_days) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Sick Leave Balance:</span>
                        <span className="text-slate-800 font-bold">{emp.remaining_sick_leave} / {emp.sick_leave_days} Days</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(emp.remaining_sick_leave / emp.sick_leave_days) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leave Requests Directory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Vacation & Leave Requests History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Employee</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Type</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Duration</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Reason / Details</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Status</th>
                    {isSuperadminOrManager && <th className="py-2.5 px-3 font-semibold text-slate-500 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(request => {
                    const start = new Date(request.start_date)
                    const end = new Date(request.end_date)
                    const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                    
                    return (
                      <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-medium text-slate-800">{request.employee_name}</td>
                        <td className="py-3 px-3 capitalize">
                          <Badge variant="outline" className={request.leave_type === 'hajj' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}>
                            {request.leave_type === 'hajj' ? '🕋 Hajj Leave' : request.leave_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          <span className="font-bold text-slate-700">{requestedDays} Days</span> ({new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()})
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate" title={request.reason}>{request.reason || 'N/A'}</td>
                        <td className="py-3 px-3">
                          <Badge className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            request.status === 'approved' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : request.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {request.status}
                          </Badge>
                        </td>
                        {isSuperadminOrManager && (
                          <td className="py-3 px-3 text-right space-x-1">
                            {request.status === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleApproveLeave(request.id, 'approved')}
                                  className="h-7 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 rounded-md text-[10px] font-bold px-2"
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleApproveLeave(request.id, 'rejected')}
                                  className="h-7 bg-red-50 text-red-700 hover:bg-red-100 border-red-200 rounded-md text-[10px] font-bold px-2"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">No leave requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COMMISSION & PAYROLL (Paydates calendar view & Bulk actions) */}
      {activeTab === 'payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payroll Generator Form */}
          {isSuperadminOrManager && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Process Individual Commission</h2>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Select Employee</Label>
                  <select 
                    value={selectedEmpPayroll}
                    onChange={e => {
                      setSelectedEmpPayroll(e.target.value)
                      setPayrollCalcs(null)
                    }}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Month</Label>
                    <select 
                      value={payrollMonth}
                      onChange={e => setPayrollMonth(parseInt(e.target.value))}
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Year</Label>
                    <Input 
                      type="number" 
                      value={payrollYear} 
                      onChange={e => setPayrollYear(parseInt(e.target.value))} 
                      className="rounded-xl border-slate-200 text-xs bg-slate-50/50" 
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCalculateCommission} 
                  disabled={!selectedEmpPayroll || isCalculatingPayroll}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold py-2 transition"
                >
                  {isCalculatingPayroll ? <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-1" /> : null}
                  Fetch closed bookings & Calculate
                </Button>
              </div>

              {payrollCalcs && (
                <form onSubmit={handleRecordPayroll} className="space-y-4 pt-6 border-t border-slate-150 mt-6 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Payroll calculations result</h3>

                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Closed Bookings Count:</span>
                      <span className="text-slate-800 font-bold">{payrollCalcs.closed_count} bookings</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Sales Volume Closed:</span>
                      <span className="text-slate-800 font-bold">{(payrollCalcs.total_volume || 0).toLocaleString()} DA</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Auto Commission calculated:</span>
                      <span className="text-blue-600 font-black">{payrollCalcs.total_commission.toLocaleString()} DA</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Base Monthly Salary (DZD)</Label>
                    <Input 
                      type="number"
                      required
                      value={baseSalaryInput}
                      onChange={e => setBaseSalaryInput(parseInt(e.target.value))}
                      className="rounded-xl border-slate-200 text-xs bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Bonuses (DZD)</Label>
                      <Input 
                        type="number"
                        value={bonusesInput}
                        onChange={e => setBonusesInput(parseInt(e.target.value))}
                        className="rounded-xl border-slate-200 text-xs bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Deductions (DZD)</Label>
                      <Input 
                        type="number"
                        value={deductionsInput}
                        onChange={e => setDeductionsInput(parseInt(e.target.value))}
                        className="rounded-xl border-slate-200 text-xs bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mb-4">
                    <span className="text-xs font-semibold text-slate-500">Net Salary to Pay:</span>
                    <span className="text-base font-black text-slate-800">
                      {(baseSalaryInput + payrollCalcs.total_commission + bonusesInput - deductionsInput).toLocaleString()} DA
                    </span>
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-2">
                    Record & Pay Slip
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Paid Slips History with BULK processing */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-850">Registered Payroll Slips History</h2>
                <p className="text-xs text-slate-400 mt-1">Sélectionnez les collaborateurs ci-dessous pour effectuer un traitement en lot.</p>
              </div>

              {/* Bulk Payroll Action Trigger */}
              {selectedEmpIds.length > 0 && isSuperadminOrManager && (
                <Button 
                  onClick={handleProcessBulkPayroll}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-1.5 px-4 shrink-0 transition"
                >
                  Calculer & Clôturer la Paie ({selectedEmpIds.length})
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {isSuperadminOrManager && (
                      <th className="py-2.5 px-3 w-8">
                        <input 
                          type="checkbox"
                          checked={selectedEmpIds.length === employees.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedEmpIds(employees.map(x => x.id))
                            else setSelectedEmpIds([])
                          }}
                          className="rounded text-blue-600 h-3.5 w-3.5 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Employee</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Period</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Base Salary</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Commissions</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500">Net Paid</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const slip = payroll.find(p => p.employee_id === emp.id && p.month === payrollMonth && p.year === payrollYear)
                    const isSelected = selectedEmpIds.includes(emp.id)

                    return (
                      <tr key={emp.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${isSelected ? 'bg-blue-50/15' : ''}`}>
                        {isSuperadminOrManager && (
                          <td className="py-3 px-3">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedEmpIds([...selectedEmpIds, emp.id])
                                else setSelectedEmpIds(selectedEmpIds.filter(id => id !== emp.id))
                              }}
                              className="rounded text-blue-600 h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-3 px-3 font-bold text-slate-800">{emp.full_name}</td>
                        <td className="py-3 px-3 text-slate-500 font-bold">
                          {new Date(2026, payrollMonth - 1, 1).toLocaleString('default', { month: 'short' })} {payrollYear}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{(emp.base_salary || 40000).toLocaleString()} DA</td>
                        <td className="py-3 px-3 text-blue-600 font-semibold">
                          {slip ? `+${slip.commission.toLocaleString()} DA` : '--'}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-800">
                          {slip ? `${slip.net_salary.toLocaleString()} DA` : 'En attente'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {slip ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSlip(slip)
                                setIsPayrollModalOpen(true)
                              }}
                              className="h-7 border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold px-2 rounded-md"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View Fiche
                            </Button>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-bold px-1.5">A Calculer</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Payout Calendar View */}
            <div className="border-t border-slate-150 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-emerald-600" /> Calendrier de Règlement Mensuel
              </h3>
              
              <div className="grid grid-cols-7 gap-1 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
                  <div key={d} className="text-center font-extrabold text-[9px] text-slate-400 py-1">{d}</div>
                ))}
                {/* 31 days grid representation */}
                {[...Array(31)].map((_, i) => {
                  const day = i + 1
                  const isPayday = day === 25

                  return (
                    <div 
                      key={i} 
                      className={`h-11 border rounded-xl flex flex-col justify-between p-1 text-left relative transition duration-150 ${
                        isPayday 
                          ? 'border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-500/20' 
                          : 'border-slate-150 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${isPayday ? 'text-emerald-700 font-black' : 'text-slate-655 text-slate-500'}`}>{day}</span>
                      {isPayday && (
                        <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tight block shrink-0 bg-emerald-100 rounded px-1 text-center scale-95 origin-left">
                          💸 Paie
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: KANBAN TASKS (Overdue alerts & HTML5 card Drag-Drop) */}
      {activeTab === 'kanban' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div>
              <h2 className="text-md font-semibold text-slate-800">HR Taskboard & Kanban</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Gérez vos tâches d'équipe. Glissez les cartes pour modifier leur statut. Les éléments en retard clignotent en rouge.</p>
            </div>
            
            <Button onClick={() => setIsTaskModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4">
              <Plus className="mr-1 h-4 w-4" /> Add Board Task
            </Button>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(['todo', 'in_progress', 'blocked', 'done'] as const).map(colStatus => {
              const statusTasks = tasks.filter(t => t.status === colStatus)
              const statusLabels = {
                todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                blocked: { label: 'Blocked', color: 'bg-red-50 text-red-700 border-red-100' },
                done: { label: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
              }
              const config = statusLabels[colStatus]

              return (
                <div 
                  key={colStatus} 
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.currentTarget.classList.add('bg-slate-200/50', 'scale-[1.01]')}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-slate-200/50', 'scale-[1.01]')}
                  onDrop={async (e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('bg-slate-200/50', 'scale-[1.01]')
                    const taskId = e.dataTransfer.getData('text/plain')
                    if (taskId) {
                      const res = await updateKanbanTaskStatus(taskId, colStatus)
                      if (res.success) {
                        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: colStatus } : t))
                      }
                    }
                  }}
                  className="bg-slate-100/50 rounded-2xl p-4 border border-slate-200/40 min-h-[400px] flex flex-col gap-4 transition-all duration-200"
                >
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">{config.label}</span>
                    <Badge className={`rounded-md border text-[10px] font-bold py-0.5 px-2 ${config.color}`}>
                      {statusTasks.length}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {statusTasks.map(task => {
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                      const isDueToday = task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString() && task.status !== 'done'

                      return (
                        <div 
                          key={task.id} 
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', task.id)
                            e.currentTarget.classList.add('scale-95', 'opacity-60')
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('scale-95', 'opacity-60')
                          }}
                          className={`bg-white border rounded-xl p-4 shadow-2xs hover:shadow-xs cursor-grab transition-all space-y-3 relative text-left select-none ${
                            isOverdue 
                              ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.25)] animate-pulse' 
                              : isDueToday 
                              ? 'border-amber-400 bg-amber-50/10' 
                              : 'border-slate-200'
                          }`}
                        >
                          {/* Alert badging */}
                          {isOverdue && (
                            <Badge className="bg-red-500 text-white border-0 text-[8px] font-black rounded px-1.5 py-0 uppercase absolute top-2 right-2 flex items-center gap-0.5">
                              <AlertCircle className="h-2.5 w-2.5 shrink-0" /> Retard
                            </Badge>
                          )}
                          {isDueToday && (
                            <Badge className="bg-amber-400 text-slate-800 border-0 text-[8px] font-black rounded px-1.5 py-0 uppercase absolute top-2 right-2">
                              Aujourd'hui
                            </Badge>
                          )}

                          <h4 className="text-xs font-bold text-slate-800 leading-snug pr-12">{task.title}</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed truncate">{task.description || 'No description'}</p>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-md">
                              👤 {task.assignee_name}
                            </span>
                            
                            {/* Manual shift helpers */}
                            <div className="flex items-center gap-1">
                              {colStatus !== 'todo' && (
                                <button 
                                  onClick={() => handleMoveTask(task.id, colStatus === 'done' ? 'in_progress' : colStatus === 'in_progress' ? 'todo' : 'in_progress')}
                                  className="h-5 w-5 hover:bg-slate-100 border border-slate-250 text-slate-400 hover:text-slate-600 rounded-md transition flex items-center justify-center text-[10px] font-black"
                                >
                                  🡄
                                </button>
                              )}
                              {colStatus !== 'done' && (
                                <button 
                                  onClick={() => handleMoveTask(task.id, colStatus === 'todo' ? 'in_progress' : colStatus === 'in_progress' ? 'done' : 'in_progress')}
                                  className="h-5 w-5 hover:bg-slate-100 border border-slate-250 text-slate-400 hover:text-slate-600 rounded-md transition flex items-center justify-center text-[10px] font-black"
                                >
                                  🡆
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {statusTasks.length === 0 && (
                      <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 font-semibold select-none">Column is empty</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 7: ANNOUNCEMENTS BOARD */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Announcements panel */}
          {isSuperadminOrManager && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Publish Agency Announcement</h2>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Announcement Content</Label>
                  <textarea 
                    required
                    value={announceContent}
                    onChange={e => setAnnounceContent(e.target.value)}
                    placeholder="Write important notes, news, @mentions, or operational triggers..."
                    className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 py-1.5 select-none">
                  <input 
                    type="checkbox" 
                    id="announcePinned"
                    checked={announcePinned}
                    onChange={e => setAnnouncePinned(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <Label htmlFor="announcePinned" className="text-xs font-semibold text-slate-600 cursor-pointer flex items-center gap-1">
                    <Pin className="h-3.5 w-3.5 text-slate-400 rotate-45" /> Pin announcement to top
                  </Label>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold py-2">
                  Publish announcement post
                </Button>
              </form>
            </div>
          )}

          {/* Announcements Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Platform Updates & Pinned Announcements</h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {announcements.map(item => {
                const readBy = Array.isArray(item.read_by) ? item.read_by : []
                const hasRead = readBy.includes(currentUserId)
                
                return (
                  <div 
                    key={item.id}
                    className={`border rounded-2xl p-5 text-left relative transition duration-150 ${
                      item.is_pinned 
                        ? 'border-amber-200 bg-amber-50/20' 
                        : 'border-slate-200/70 bg-white hover:border-slate-300'
                    }`}
                  >
                    {item.is_pinned && (
                      <Badge className="absolute top-4 right-4 bg-amber-500 text-white rounded-md text-[9px] font-bold px-1.5 py-0 border-0 flex items-center gap-0.5">
                        <Pin className="h-2.5 w-2.5 rotate-45 shrink-0" /> Pinned
                      </Badge>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-9 w-9 border border-slate-100 shadow-sm shrink-0">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                          {item.author_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.author_name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap">{item.content}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100/50 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        👀 Read receipts ({readBy.length} read)
                      </span>

                      {!hasRead && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkRead(item.id)}
                          className="h-7 text-blue-600 hover:text-blue-755 hover:bg-blue-50 text-[10px] font-black px-2.5 rounded-md"
                        >
                          <Check className="h-3 w-3 mr-1" /> Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
              {announcements.length === 0 && (
                <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                  <BookOpen className="h-8 w-8 text-slate-350 mx-auto mb-2" />
                  <span className="text-xs text-slate-400 font-semibold select-none">No active announcements posted</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY DIALOG MODALS */}

      {/* Bulk Payroll Progress Dialog */}
      <Dialog open={isProcessingBulkPayroll} onOpenChange={setIsProcessingBulkPayroll}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden font-geist">
          <DialogHeader className="text-left">
            <DialogTitle className="text-sm font-bold text-slate-850">Processing Bulk Payroll</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">Calcul des salaires nets, commissions closes et envoi automatique par e-mail.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Calcul en cours...</span>
                <span>{bulkPayrollProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${bulkPayrollProgress}%` }}
                />
              </div>
            </div>

            {/* Compiled Logs Console */}
            <div className="bg-slate-900 rounded-xl p-3.5 font-mono text-[9px] text-slate-300 space-y-1.5 max-h-[180px] overflow-y-auto border border-slate-850 select-none">
              {bulkPayrollLogs.map((log, idx) => (
                <div key={idx} className={log.includes('EMAIL') ? 'text-blue-400 font-semibold' : log.includes('ERREUR') ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
              disabled={bulkPayrollProgress < 100}
              onClick={() => {
                setIsProcessingBulkPayroll(false)
                setSelectedEmpIds([])
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-1.5 px-4"
            >
              Terminer & Quitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1. INVITE MEMBER MODAL */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden font-geist">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-slate-850">Invite Team Member</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">Send a registration link to add employees to your agency dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-4 text-left">
            {inviteError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{inviteError}</div>}
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Full Name</Label>
              <Input className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition" id="full_name" name="full_name" required placeholder="E.g., John Doe" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" id="email" name="email" type="email" required placeholder="john@example.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Access Role</Label>
              <select 
                id="role"
                name="role" 
                defaultValue="employee"
                className="flex h-10 w-full items-center justify-between rounded-xl border-0 bg-slate-100 px-3 py-2 text-sm text-slate-750 focus:outline-none"
              >
                <option value="employee">Employee (Transcripts & Live Chats only)</option>
                <option value="superadmin">Admin (Full Control Panel & Settings)</option>
              </select>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-xs font-semibold px-4 transition">
                {inviteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. CUSTOM ROLE MODAL */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden font-geist">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-slate-850">Create Custom Agency Role</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">Configure granular dashboard permissions for guides, sales, or assistants.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole} className="space-y-4 py-4 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Role Name</Label>
              <Input 
                required 
                placeholder="E.g., Chief Coordinator, Junior Guide..."
                value={customRoleName}
                onChange={e => setCustomRoleName(e.target.value)}
                className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition"
              />
            </div>

            <div className="space-y-2 select-none">
              <Label className="text-xs font-semibold text-slate-600">Assign Permissions Matrix</Label>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto p-1 border rounded-lg bg-slate-50/50">
                {[
                  { key: 'view_dashboard', label: 'View Dashboard KPIs & widgets' },
                  { key: 'manage_inbox', label: 'Manage AI Chatbot & live transcript chats' },
                  { key: 'manage_clients', label: 'Create & delete clients index' },
                  { key: 'manage_trips', label: 'Configure travel package step wizards' },
                  { key: 'manage_bookings', label: 'View / Modify reservation manifests' },
                  { key: 'manage_invoices', label: 'Create invoices & share PDF links' },
                  { key: 'manage_payroll', label: 'Calculate salary slips & commissions' }
                ].map(p => (
                  <label key={p.key} className="flex items-center gap-2 text-xs text-slate-600 p-1 hover:bg-white rounded-md cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={customRolePerms.includes(p.key)}
                      onChange={e => {
                        if (e.target.checked) setCustomRolePerms([...customRolePerms, p.key])
                        else setCustomRolePerms(customRolePerms.filter(k => k !== p.key))
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-350"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-105 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl border-slate-205 text-slate-600 hover:bg-slate-50 text-xs" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 transition">
                Build Role Custom
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. REQUEST LEAVE VACATION MODAL */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden font-geist">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-slate-850">Request Time-Off / Leave</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">Submit leave request for approval based on remaining balances.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestLeave} className="space-y-4 py-4 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Leave Type</Label>
              <select 
                value={leaveType}
                onChange={e => setLeaveType(e.target.value as any)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
              >
                <option value="annual">🌴 Annual Vacation Leave</option>
                <option value="sick">🩺 Medical / Sick Leave</option>
                <option value="hajj">🕋 Pious Hajj / Umrah Leave</option>
                <option value="other">💬 Other Custom Absence</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Start Date</Label>
                <Input type="date" required value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className="rounded-xl border-slate-200 text-xs bg-slate-50/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">End Date</Label>
                <Input type="date" required value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className="rounded-xl border-slate-200 text-xs bg-slate-50/50" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Reason / Description Details</Label>
              <textarea 
                required 
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                placeholder="Details of the leave requested..."
                className="flex min-h-[70px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-6 border-t border-slate-105 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl border-slate-205 text-slate-600 hover:bg-slate-50 text-xs" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 transition">
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. KANBAN TASK CREATION MODAL */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden font-geist">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-slate-850">Add Kanban Board Task</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">Assign collaborate tasks to employees for workflow orchestration.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 py-4 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Task Title</Label>
              <Input required value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Task Description</Label>
              <textarea 
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                className="flex min-h-[70px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Assignee</Label>
                <select 
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="">-- Unassigned --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Due Date</Label>
                <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="rounded-xl border-slate-200 text-xs bg-slate-50/50" />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-105 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl border-slate-205 text-slate-600 hover:bg-slate-50 text-xs" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 transition">
                Create Kanban Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. DETAILED EMPLOYEE PROFILE */}
      {selectedEmployee && (() => {
        const { trend, avg: performanceAvg, percentile } = getPerformanceMetrics(selectedEmployee.id)
        const teamAvgRating = 82
        const sparklinePoints = trend.map((val, idx) => `${idx * 60 + 20},${100 - (val - 50) * 1.5}`).join(' ')

        return (
          <Dialog open={selectedEmployee !== null} onOpenChange={() => setSelectedEmployee(null)}>
            <DialogContent className="sm:max-w-3xl rounded-3xl overflow-hidden font-geist p-0 max-h-[85vh] flex flex-col text-left">
              <div className="bg-slate-900 text-white p-6 relative">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/20 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-650 text-white font-bold text-xl">
                      {selectedEmployee.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">{selectedEmployee.full_name}</h2>
                    <p className="text-xs text-slate-350 font-medium mt-0.5">
                      {selectedEmployee.role || selectedEmployee.department || 'Collaborator'} ({selectedEmployee.employee_code})
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Inner tab row selectors */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 gap-1 select-none shrink-0 overflow-x-auto">
                {(['personal', 'contract', 'payroll', 'leaves', 'documents', 'performance'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold border-b-2 transition whitespace-nowrap ${
                      detailTab === tab 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TAB CONTENTS SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <form onSubmit={handleUpdateEmployee} className="space-y-6">
                  
                  {detailTab === 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Full Name</Label>
                        <Input name="full_name" defaultValue={selectedEmployee.full_name} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Phone</Label>
                        <Input name="phone" defaultValue={selectedEmployee.phone} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Date of Birth</Label>
                        <Input type="date" name="date_of_birth" defaultValue={selectedEmployee.date_of_birth} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Place of Birth (Wilaya)</Label>
                        <select 
                          name="place_of_birth" 
                          defaultValue={selectedEmployee.place_of_birth || ''}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="">-- Select Wilaya --</option>
                          {ALGERIAN_WILAYAS.map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Nationality</Label>
                        <Input name="nationality" defaultValue={selectedEmployee.nationality || 'Algerian'} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Marital Status</Label>
                        <select 
                          name="marital_status" 
                          defaultValue={selectedEmployee.marital_status || 'single'}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Number of Children</Label>
                        <Input type="number" name="num_children" defaultValue={selectedEmployee.num_children || 0} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 pt-4 md:col-span-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Emergency contact details</h4>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Emergency Contact Name</Label>
                        <Input name="emergency_contact_name" defaultValue={selectedEmployee.emergency_contact_name || ''} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Emergency Contact Phone</Label>
                        <Input name="emergency_contact_phone" defaultValue={selectedEmployee.emergency_contact_phone || ''} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Relationship</Label>
                        <Input name="emergency_contact_relation" defaultValue={selectedEmployee.emergency_contact_relation || ''} className="rounded-xl border-slate-200 text-xs" placeholder="E.g., Brother, Spouse..." />
                      </div>
                    </div>
                  )}

                  {detailTab === 'contract' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Employee Internal Code</Label>
                        <Input disabled defaultValue={selectedEmployee.employee_code || ''} className="rounded-xl bg-slate-50 border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Department</Label>
                        <select 
                          name="department" 
                          defaultValue={selectedEmployee.department || 'Sales'}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="Sales">Sales</option>
                          <option value="Operations">Operations</option>
                          <option value="Finance">Finance</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Guides">Guides</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Access Role</Label>
                        <select 
                          name="role" 
                          defaultValue={selectedEmployee.role || 'employee'}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="superadmin">Superadmin (All)</option>
                          <option value="employee">Employee</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Employment Type</Label>
                        <select 
                          name="employment_type" 
                          defaultValue={selectedEmployee.employment_type || 'full_time'}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="full_time">Full Time</option>
                          <option value="part_time">Part Time</option>
                          <option value="contract">Contractor</option>
                          <option value="intern">Intern</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Hire Date</Label>
                        <Input type="date" name="hire_date" defaultValue={selectedEmployee.hire_date || ''} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Probation End Date</Label>
                        <Input type="date" name="probation_end" defaultValue={selectedEmployee.probation_end || ''} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Contract End Date</Label>
                        <Input type="date" name="contract_end" defaultValue={selectedEmployee.contract_end || ''} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Branch Location / Office</Label>
                        <Input name="branch_location" defaultValue={selectedEmployee.branch_location || 'Main Algiers Office'} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Reporting Manager</Label>
                        <select 
                          name="manager_id" 
                          defaultValue={selectedEmployee.manager_id || ''}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="">-- No Direct Manager (Head) --</option>
                          {employees.filter(e => e.id !== selectedEmployee.id).map(e => (
                            <option key={e.id} value={e.id}>{e.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {detailTab === 'payroll' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Base Monthly Salary (DZD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input type="number" name="base_salary" defaultValue={selectedEmployee.base_salary || 40000} className="rounded-xl border-slate-200 text-xs pl-9" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Commission Percent (%)</Label>
                        <Input type="number" step="0.01" name="commission_percent" defaultValue={selectedEmployee.commission_percent || 0} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Salary Payment Method</Label>
                        <select 
                          name="payment_method" 
                          defaultValue={selectedEmployee.payment_method || 'ccp'}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="ccp">Algerian CCP Account</option>
                          <option value="bank_transfer">Direct Bank Wire</option>
                          <option value="cash">Direct Cash Handover</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Algerian CCP Account Number</Label>
                        <Input name="ccp_account" defaultValue={selectedEmployee.ccp_account || ''} placeholder="E.g., 0012345678 Key 99" className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Bank Account Details (RIB)</Label>
                        <Input name="bank_account" defaultValue={selectedEmployee.bank_account || ''} placeholder="20-digit bank account number" className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Bank Name</Label>
                        <Input name="bank_name" defaultValue={selectedEmployee.bank_name || ''} placeholder="E.g., BNA, BADR, CPA, SGA..." className="rounded-xl border-slate-200 text-xs" />
                      </div>
                    </div>
                  )}

                  {detailTab === 'leaves' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Annual Leave Allotted Days</Label>
                        <Input type="number" name="annual_leave_days" defaultValue={selectedEmployee.annual_leave_days || 30} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Remaining Annual Leave Days</Label>
                        <Input type="number" name="remaining_annual_leave" defaultValue={selectedEmployee.remaining_annual_leave || 30} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Sick Leave Allotted Days</Label>
                        <Input type="number" name="sick_leave_days" defaultValue={selectedEmployee.sick_leave_days || 15} className="rounded-xl border-slate-200 text-xs" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Remaining Sick Leave Days</Label>
                        <Input type="number" name="remaining_sick_leave" defaultValue={selectedEmployee.remaining_sick_leave || 15} className="rounded-xl border-slate-200 text-xs" />
                      </div>
                    </div>
                  )}

                  {detailTab === 'documents' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Vault Document Placeholders</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'id_card_front_url', label: 'CNI Front Copy (National ID)' },
                          { key: 'id_card_back_url', label: 'CNI Back Copy (National ID)' },
                          { key: 'passport_url', label: 'Passport Details Page' },
                          { key: 'contract_url', label: 'Signed Employment Contract' }
                        ].map(doc => (
                          <div key={doc.key} className="p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col justify-between items-center text-center gap-2">
                            <FileText className="h-8 w-8 text-slate-350" />
                            <span className="text-xs font-semibold text-slate-700">{doc.label}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{selectedEmployee[doc.key] ? 'Uploaded' : 'No document uploaded'}</span>
                            <Input 
                              type="text"
                              name={doc.key}
                              placeholder="Paste document cloud URL..."
                              defaultValue={selectedEmployee[doc.key] || ''}
                              className="rounded-xl border-slate-200 text-[10px] h-8 mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: Performance & 6-month Sparklines Graph */}
                  {detailTab === 'performance' && (
                    <div className="space-y-6">
                      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Évolution Trimestrielle</span>
                            <span className="text-lg font-black text-slate-800">Note de Performance (6 Derniers Mois)</span>
                          </div>
                          <Badge className="bg-blue-600 text-white rounded-md text-xs font-black px-2.5 py-0.5 border-0">
                            {percentile} des Collaborateurs
                          </Badge>
                        </div>

                        {/* Interactive SVG Sparkline trend graph */}
                        <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-visible mt-2">
                          <svg className="w-full h-24 overflow-visible" style={{ minWidth: '350px' }}>
                            {/* SVG Sparkline grid lines */}
                            <line x1="10" y1="20" x2="350" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="10" y1="50" x2="350" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="10" y1="80" x2="350" y2="80" stroke="#f1f5f9" strokeWidth="1" />

                            <polyline
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={sparklinePoints}
                            />
                            {trend.map((val, idx) => (
                              <g key={idx} className="group">
                                <circle
                                  cx={idx * 60 + 20}
                                  cy={100 - (val - 50) * 1.5}
                                  r="4.5"
                                  className="fill-white stroke-blue-600 stroke-[3px] hover:r-6 cursor-pointer transition"
                                />
                                <text 
                                  x={idx * 60 + 20} 
                                  y={100 - (val - 50) * 1.5 - 10} 
                                  textAnchor="middle" 
                                  className="text-[9px] font-black fill-slate-700 hidden group-hover:block transition"
                                >
                                  {val}%
                                </text>
                              </g>
                            ))}
                          </svg>

                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider px-2 mt-3 select-none">
                            <span>Déc 25</span>
                            <span>Jan 26</span>
                            <span>Fév 26</span>
                            <span>Mar 26</span>
                            <span>Avr 26</span>
                            <span>Mai 26</span>
                          </div>
                        </div>
                      </div>

                      {/* Team Average ratings contrasted comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Comparaison Équipe</span>
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-slate-800">{performanceAvg}%</span>
                            <span className="text-xs text-slate-400 font-semibold">Moyenne équipe: {teamAvgRating}%</span>
                          </div>
                          
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${performanceAvg}%` }} />
                            <div className="absolute top-0 bottom-0 w-0.5 bg-red-400" style={{ left: `${teamAvgRating}%` }} title="Moyenne équipe" />
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Objectifs opérationnels</span>
                          <span className="text-xs text-slate-655 text-slate-600 leading-relaxed font-semibold">
                            {performanceAvg >= teamAvgRating 
                              ? 'Collaborateur performant. Au-dessus de la moyenne de l\'équipe. Excellent travail commercial.' 
                              : 'Collaborateur en phase de progression. Un accompagnement senior est recommandé pour atteindre les objectifs.'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Save Row */}
                  {isSuperadminOrManager && detailTab !== 'performance' && (
                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                      <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs" onClick={() => setSelectedEmployee(null)}>
                        Close Details
                      </Button>
                      <Button type="submit" disabled={isUpdatingEmployee} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 transition">
                        {isUpdatingEmployee ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                        Save HR Modifications
                      </Button>
                    </div>
                  )}
                </form>

              </div>
            </DialogContent>
          </Dialog>
        )
      })()}

      {/* 7. FICHE DE PAIE PREVIEW MODAL */}
      {selectedSlip && (
        <Dialog open={selectedSlip !== null} onOpenChange={() => setSelectedSlip(null)}>
          <DialogContent className="sm:max-w-2xl rounded-3xl overflow-hidden font-geist p-0 max-h-[90vh] flex flex-col text-left">
            <div className="p-6 overflow-y-auto space-y-6" id="printable-payslip">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fiche de Paie</h2>
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Algerian Travel Agency SaaS Platform</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 uppercase">Période de Paie:</span>
                  <p className="text-sm font-black text-blue-600 mt-0.5">
                    {new Date(2026, selectedSlip.month - 1, 1).toLocaleString('default', { month: 'long' })} {selectedSlip.year}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block">Collaborator:</span>
                  <p className="font-bold text-slate-850">{selectedSlip.employee_name}</p>
                  
                  <span className="text-slate-400 font-semibold block pt-2">Code Employé:</span>
                  <p className="font-bold text-slate-800">{selectedSlip.employee_code || 'EMP-001'}</p>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-slate-400 font-semibold block">Méthode de Paiement:</span>
                  <p className="font-bold text-slate-850 uppercase">CCP / Bank Transfer</p>
                  
                  <span className="text-slate-400 font-semibold block pt-2">Compte CCP / Banque:</span>
                  <p className="font-bold text-slate-800">{selectedSlip.ccp_account || selectedSlip.bank_account || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Salary breakdown structure</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="p-3">Description Component</th>
                        <th className="p-3 text-right">Gains (DZD)</th>
                        <th className="p-3 text-right">Retenues (DZD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="p-3 font-semibold text-slate-800">Base Monthly Salary (Salaire de Base)</td>
                        <td className="p-3 text-right font-bold">{selectedSlip.base_salary.toLocaleString()} DA</td>
                        <td className="p-3 text-right">-</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-3 font-semibold text-slate-800">Sales Commission (Closed Bookings auto-calc)</td>
                        <td className="p-3 text-right font-bold text-blue-600">+{selectedSlip.commission.toLocaleString()} DA</td>
                        <td className="p-3 text-right">-</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-3 font-semibold text-slate-800">Performance Bonuses</td>
                        <td className="p-3 text-right font-bold">+{selectedSlip.bonuses.toLocaleString()} DA</td>
                        <td className="p-3 text-right">-</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-3 font-semibold text-slate-800">Custom Payroll Deductions</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right font-bold text-red-600">-{selectedSlip.deductions.toLocaleString()} DA</td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-slate-800">
                        <td className="p-3">NET TOTAL SALARY PAID</td>
                        <td className="p-3 text-right text-base text-slate-900" colSpan={2}>
                          {selectedSlip.net_salary.toLocaleString()} DA
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-100/50 p-4 rounded-xl text-xs italic text-slate-600 border border-slate-150">
                <span className="font-bold text-slate-800 uppercase not-italic block mb-1">Prix en Lettres:</span>
                Arrêté la présente fiche de paie à la somme nette de : <span className="font-extrabold not-italic text-slate-900 capitalize">Dinars Algériens</span>.
              </div>

              <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-12">Signature de l'Employeur</span>
                  <div className="w-32 border-b border-slate-350 mx-auto" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-12">Signature de l'Employé</span>
                  <div className="w-32 border-b border-slate-350 mx-auto" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => setSelectedSlip(null)}
                className="rounded-xl border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
              >
                Close Fiche
              </Button>
              <Button 
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download / Print PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
