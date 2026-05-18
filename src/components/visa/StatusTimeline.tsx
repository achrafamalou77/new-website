'use client'

import React from 'react'
import { VisaTimelineEvent } from '@/types/visa'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, CheckCircle2, XCircle, Clock, 
  Send, Hourglass, Landmark, User, MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'

interface StatusTimelineProps {
  currentStatus: string;
  timeline: VisaTimelineEvent[];
}

export function StatusTimeline({ currentStatus, timeline }: StatusTimelineProps) {
  // Ordered status milestones
  const steps = [
    { key: 'inquiry', label: 'Inquiry' },
    { key: 'documents_pending', label: 'Docs Pending' },
    { key: 'documents_received', label: 'Docs Received' },
    { key: 'application_submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Decision' }, // Approved/Rejected
    { key: 'completed', label: 'Completed' }
  ]

  // Get index of current status to highlight progress
  const currentIdx = steps.findIndex(s => s.key === currentStatus)
  const isRejected = currentStatus === 'rejected'

  const eventIcons: { [key: string]: any } = {
    created: FileText,
    status_changed: Clock,
    payment_received: Landmark,
    document_uploaded: CheckCircle2,
    whatsapp_reminder: MessageSquare
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Visual Status Roadmap */}
      <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <h4 className="font-extrabold text-slate-800 text-[14px] mb-6 uppercase tracking-wider">
          Visa Application Roadmap
        </h4>
        
        {/* Responsive horizontal step indicators */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
          
          {/* Connector Line for larger screens */}
          <div className="absolute hidden md:block left-0 top-[15px] right-0 h-0.5 bg-slate-100 -z-1" />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx
            const isActive = idx === currentIdx || (step.key === 'approved' && isRejected)
            const isFuture = idx > currentIdx

            let stepColor = 'bg-slate-100 text-slate-400 border-slate-200'
            let badgeText = ''
            
            if (isCompleted) {
              stepColor = 'bg-blue-600 text-white border-blue-600'
            } else if (isActive) {
              if (isRejected && step.key === 'approved') {
                stepColor = 'bg-rose-500 text-white border-rose-500 ring-4 ring-rose-100'
                badgeText = 'Rejected'
              } else if (currentStatus === 'approved' && step.key === 'approved') {
                stepColor = 'bg-emerald-500 text-white border-emerald-500 ring-4 ring-emerald-100'
                badgeText = 'Approved'
              } else {
                stepColor = 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100'
              }
            }

            return (
              <div 
                key={step.key} 
                className="flex md:flex-col items-center gap-3 md:gap-2 flex-1 w-full md:w-auto relative"
              >
                {/* Step Circle */}
                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 z-1 transition-all duration-300 ${stepColor}`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                
                {/* Step Label */}
                <div className="flex flex-col md:items-center text-left md:text-center min-w-0">
                  <span className={`text-[11px] font-extrabold ${isActive ? 'text-slate-800' : 'text-slate-550 text-slate-400'}`}>
                    {step.key === 'approved' && badgeText ? badgeText : step.label}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping mt-1 hidden md:block" />
                  )}
                </div>
              </div>
            )
          })}

        </div>
      </Card>

      {/* 2. Chronological Timeline Logs */}
      <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <h4 className="font-extrabold text-slate-800 text-[14px] mb-6 uppercase tracking-wider">
          Activity Logs & Event Timeline
        </h4>

        <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No logged events yet.</p>
          ) : (
            timeline.map((evt) => {
              const IconComponent = eventIcons[evt.event_type] || FileText
              
              // Status changes or payments have specific tailwind gradients
              let bgIconColor = 'bg-slate-100 text-slate-500'
              if (evt.event_type === 'status_changed') bgIconColor = 'bg-blue-50 text-blue-600 border-blue-100'
              if (evt.event_type === 'payment_received') bgIconColor = 'bg-emerald-50 text-emerald-600 border-emerald-100'
              if (evt.event_type === 'whatsapp_reminder') bgIconColor = 'bg-emerald-500 text-white'

              return (
                <div key={evt.id} className="relative group">
                  
                  {/* Timeline point marker */}
                  <div className={`absolute -left-10 top-0.5 h-8 w-8 rounded-full border flex items-center justify-center shrink-0 shadow-2xs z-2 ${bgIconColor}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Log contents */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-bold text-slate-800 text-[13px]">{evt.title}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {evt.created_at ? format(new Date(evt.created_at), 'dd MMM hh:mm a') : 'N/A'}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                        {evt.description}
                      </p>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>
      </Card>

    </div>
  )
}
