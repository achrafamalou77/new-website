'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bot, User } from 'lucide-react'
import { toggleAiStatus } from '@/app/actions/conversations'
import { useState, useTransition, useEffect } from 'react'

export function AiToggle({ conversationId, initialStatus }: { conversationId: string, initialStatus: boolean }) {
  const [isAiActive, setIsAiActive] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  // Sync if prop changes externally (e.g. Realtime update)
  useEffect(() => {
    setIsAiActive(initialStatus)
  }, [initialStatus])

  const handleToggle = (checked: boolean) => {
    setIsAiActive(checked)
    startTransition(async () => {
      await toggleAiStatus(conversationId, checked)
    })
  }

  return (
    <div className="flex items-center space-x-2 rounded-full border px-3 py-1.5 bg-slate-50">
      <User className={`h-4 w-4 ${!isAiActive ? 'text-blue-500' : 'text-slate-400'}`} />
      <Switch 
        checked={isAiActive} 
        onCheckedChange={handleToggle} 
        disabled={isPending}
        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-blue-500"
      />
      <Bot className={`h-4 w-4 ${isAiActive ? 'text-emerald-500' : 'text-slate-400'}`} />
      <Label className="text-xs font-medium w-16 text-center text-slate-700">
        {isAiActive ? 'AI Active' : 'Human'}
      </Label>
    </div>
  )
}
