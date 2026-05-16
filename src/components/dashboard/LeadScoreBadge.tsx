import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function LeadScoreBadge({ score, className }: { score: 'HOT' | 'WARM' | 'COLD' | null, className?: string }) {
  if (!score) return null
  
  const colors = {
    HOT: "bg-red-500 hover:bg-red-600 text-white",
    WARM: "bg-amber-500 hover:bg-amber-600 text-white",
    COLD: "bg-slate-400 hover:bg-slate-500 text-white"
  }
  
  return (
    <Badge className={cn(colors[score], className)}>
      {score}
    </Badge>
  )
}
