import { MessageSquareDashed, SearchX, Inbox } from 'lucide-react'
import { PlatformIcon } from './PlatformIcon'
import { Platform } from '@/types/platform'
import clsx from 'clsx'

export function NoConversationsState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
      <Inbox className="mb-4 h-12 w-12 text-slate-300" />
      <h3 className="text-lg font-medium text-slate-900">No conversations yet</h3>
      <p className="text-sm mt-1">When leads contact your agency, they will appear here.</p>
    </div>
  )
}

export function NoSearchResultsState({ query }: { query: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
      <SearchX className="mb-4 h-12 w-12 text-slate-300" />
      <h3 className="text-lg font-medium text-slate-900">No results found</h3>
      <p className="text-sm mt-1">No conversations match "{query}".</p>
    </div>
  )
}

export function NoFilterResultsState({ filter, platform }: { filter: string, platform?: string }) {
  const isPlatform = ['whatsapp', 'facebook', 'instagram'].includes(platform || '')
  const p = platform as Platform

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
      {isPlatform ? (
        <div className={clsx(
          "mb-4 p-4 rounded-full bg-slate-50 border",
          p === 'whatsapp' && "border-[#25D366]/20",
          p === 'facebook' && "border-[#0084FF]/20",
          p === 'instagram' && "border-purple-200"
        )}>
          <PlatformIcon platform={p} className="h-8 w-8" />
        </div>
      ) : (
        <MessageSquareDashed className="mb-4 h-12 w-12 text-slate-300" />
      )}
      <h3 className="text-lg font-medium text-slate-900">
        {isPlatform ? `No ${platform_label(p)} conversations` : `No ${filter} leads`}
      </h3>
      <p className="text-sm mt-1">
        {isPlatform 
          ? `There are currently no messages from ${platform_label(p)}.` 
          : `There are currently no conversations marked as ${filter}.`}
      </p>
    </div>
  )
}

function platform_label(p: Platform) {
  if (p === 'facebook') return 'Messenger'
  return p.charAt(0).toUpperCase() + p.slice(1)
}
