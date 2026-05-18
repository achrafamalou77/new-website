'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VisaType } from '@/types/visa'
import { 
  Globe, Clock, DollarSign, ListChecks, ShieldCheck, 
  HelpCircle, Edit3, Trash2
} from 'lucide-react'

interface VisaTypeCardProps {
  visaType: VisaType;
  onEdit?: (visaType: VisaType) => void;
}

export function VisaTypeCard({ visaType, onEdit }: VisaTypeCardProps) {
  // Flags list mapping
  const countryFlags: { [key: string]: string } = {
    france: '🇫🇷',
    spain: '🇪🇸',
    italy: '🇮🇹',
    turkey: '🇹🇷',
    egypt: '🇪🇬',
    'saudi arabia': '🇸🇦',
    'united arab emirates': '🇦🇪',
    'united kingdom': '🇬🇧',
    'united states': '🇺🇸',
    canada: '🇨🇦'
  }

  const flag = countryFlags[visaType.destination_country.toLowerCase()] || '🌍'

  return (
    <Card className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between h-full">
      <div className="space-y-4">
        
        {/* Header country flag & title */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-3xl leading-none">{flag}</span>
            <div className="flex flex-col">
              <h3 className="font-extrabold text-slate-800 text-[15px]">{visaType.name}</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{visaType.destination_country}</span>
            </div>
          </div>
          
          <Badge className={`text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wide border ${
            visaType.category === 'Umrah' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
            visaType.category === 'Business' ? 'bg-blue-50 text-blue-800 border-blue-100' :
            'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {visaType.category}
          </Badge>
        </div>

        {/* Technical Specs grid */}
        <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 leading-none">Process Time</span>
              <span className="text-slate-700 font-bold mt-0.5">{visaType.processing_time}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 leading-none">Stay / Validity</span>
              <span className="text-slate-700 font-bold mt-0.5">{visaType.stay_duration} / {visaType.validity}</span>
            </div>
          </div>
        </div>

        {/* Pricing details */}
        <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[12px]">
          <div className="flex justify-between font-semibold text-slate-500">
            <span>Embassy/Gov Fee</span>
            <span className="text-slate-800 font-bold">{visaType.government_fee.toLocaleString()} DZD</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-500">
            <span>Standard Service Fee</span>
            <span className="text-slate-800 font-bold">{visaType.service_fee.toLocaleString()} DZD</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-500">
            <span>Express Service Fee</span>
            <span className="text-amber-600 font-bold">{visaType.express_fee.toLocaleString()} DZD</span>
          </div>
        </div>

        {/* Document Checklist count */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-blue-50/50 border border-blue-100/50 p-2.5 rounded-xl">
          <ListChecks className="h-4 w-4 text-blue-500" />
          <span>{visaType.documents_required?.length || 0} Required Documents Checklist</span>
        </div>

        {/* Algerian details */}
        {visaType.special_notes && (
          <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-h-[60px] overflow-y-auto">
            <span className="font-bold text-slate-500">Note: </span>
            {visaType.special_notes}
          </p>
        )}

      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400">
          Method: <span className="text-slate-600 font-bold">{visaType.application_method}</span>
        </span>
        {onEdit && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEdit(visaType)}
            className="border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-3 py-1 rounded-lg text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1.5" />
            Configure
          </Button>
        )}
      </div>
    </Card>
  )
}
