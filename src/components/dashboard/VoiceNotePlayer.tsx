import { cn } from '@/lib/utils'
import { Play, Mic } from 'lucide-react'

export function VoiceNotePlayer({ url, duration = "0:15", transcript, colorClass = "bg-blue-500" }: { url: string | null, duration?: string, transcript?: string | null, colorClass?: string }) {
  const isGradient = colorClass.includes('gradient')
  
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 w-64 max-w-full border shadow-sm">
      <div className="flex items-center gap-3">
        <button className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95", colorClass)}>
          <Play className="h-4 w-4 fill-current ml-0.5" />
        </button>
        <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
          <div className={cn("h-full w-1/3 rounded-full", isGradient ? colorClass : colorClass)} />
        </div>
        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{duration}</span>
      </div>
      {transcript && (
        <div className="flex items-start gap-2 border-t border-slate-100 pt-2 mt-1">
          <Mic className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500 italic line-clamp-2">"{transcript}"</p>
        </div>
      )}
    </div>
  )
}

