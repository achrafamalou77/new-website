'use client'

import React, { useState } from 'react'
import { DocumentStatus } from '@/types/visa'
import { updateVisaApplicationChecklist, sendVisaWhatsAppReminder } from '@/app/actions/visa'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, CheckCircle2, AlertTriangle, Upload, 
  MessageSquare, Trash2, ExternalLink
} from 'lucide-react'

interface DocumentChecklistProps {
  applicationId: string;
  initialDocuments: DocumentStatus[];
}

export function DocumentChecklist({ applicationId, initialDocuments }: DocumentChecklistProps) {
  const [documents, setDocuments] = useState<DocumentStatus[]>(initialDocuments || [])
  const [loadingName, setLoadingName] = useState<string | null>(null)

  // Toggle document status received/pending
  const toggleDocStatus = async (name: string, currentStatus: string) => {
    setLoadingName(name)
    const nextStatus = currentStatus === 'received' ? 'pending' : 'received'
    
    const updated = documents.map(d => {
      if (d.name === name) {
        return {
          ...d,
          status: nextStatus as any,
          received_at: nextStatus === 'received' ? new Date().toISOString() : undefined,
          file_url: nextStatus === 'received' ? `/simulated-scans/${name.toLowerCase().replace(/ /g, '_')}.pdf` : undefined
        }
      }
      return d
    })

    const result = await updateVisaApplicationChecklist(applicationId, updated)
    if (result.success) {
      setDocuments(updated)
    }
    setLoadingName(null)
  }

  // Trigger simulated WhatsApp message requesting this document
  const sendReminder = async (docName: string) => {
    setLoadingName(`wa-${docName}`)
    const result = await sendVisaWhatsAppReminder(applicationId, 'document_request', docName)
    if (result.success) {
      alert(`WhatsApp Simulated Reminder Sent for missing document: "${docName}"`)
    }
    setLoadingName(null)
  }

  // File Upload Simulation
  const simulateUpload = async (docName: string) => {
    setLoadingName(`upload-${docName}`)
    // Simulate short network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const updated = documents.map(d => {
      if (d.name === docName) {
        return {
          ...d,
          status: 'received' as any,
          received_at: new Date().toISOString(),
          file_url: `/simulated-scans/${docName.toLowerCase().replace(/ /g, '_')}.pdf`
        }
      }
      return d
    })

    const result = await updateVisaApplicationChecklist(applicationId, updated)
    if (result.success) {
      setDocuments(updated)
    }
    setLoadingName(null)
  }

  // Computations
  const total = documents.length
  const received = documents.filter(d => d.status === 'received').length
  const pct = total > 0 ? Math.round((received / total) * 100) : 0

  return (
    <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
      
      {/* Progress Bar & Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-800 text-[15px] flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Required Document Checklist
          </h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            {received} of {total} documents collected ({pct}%)
          </p>
        </div>
        
        <Badge className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
          pct === 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'
        }`}>
          {pct === 100 ? 'All Documents Collected' : 'Collection Incomplete'}
        </Badge>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border">
        <div 
          className={`h-full rounded-full transition-all duration-550 ease-out ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist List */}
      <div className="space-y-3.5 pt-2">
        {documents.map((doc) => {
          const isReceived = doc.status === 'received'
          const isLoading = loadingName === doc.name || loadingName === `wa-${doc.name}` || loadingName === `upload-${doc.name}`

          return (
            <div 
              key={doc.name} 
              className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                isReceived 
                  ? 'bg-emerald-50/20 border-emerald-100' 
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              
              {/* Left Label & Checkbox */}
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={isReceived} 
                  disabled={isLoading}
                  onCheckedChange={() => toggleDocStatus(doc.name, doc.status)}
                  className="mt-1 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <div className="flex flex-col min-w-0">
                  <span className={`font-bold text-[13px] ${isReceived ? 'text-slate-800 line-through decoration-slate-400' : 'text-slate-700'}`}>
                    {doc.name}
                  </span>
                  {doc.notes && (
                    <span className="text-[10px] text-slate-400 font-medium italic mt-0.5">
                      {doc.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Operations Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {isReceived ? (
                  <>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/50 border border-emerald-100 px-2 py-0.5 rounded">
                      Received
                    </span>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="Open file"
                          className="h-8 w-8 hover:bg-slate-100 text-slate-500 rounded-lg"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}


                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                      Pending
                    </span>
                    
                    {/* Simulated WhatsApp Reminder Trigger */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => sendReminder(doc.name)}
                      className="h-8 border-slate-200 hover:bg-emerald-50 text-emerald-600 font-bold text-[11px] rounded-lg px-2.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      WhatsApp Request
                    </Button>
                  </>
                )}

                {/* Upload simulation button */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => simulateUpload(doc.name)}
                  className="h-8 border-slate-200 hover:bg-blue-50 text-blue-600 font-bold text-[11px] rounded-lg px-2.5"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  {isReceived ? 'Re-upload' : 'Upload Scan'}
                </Button>
              </div>

            </div>
          )
        })}
      </div>

    </Card>
  )
}
