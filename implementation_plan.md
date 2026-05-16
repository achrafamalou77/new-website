# Inbox UI Upgrade with Platform Styling

## Goal Description
Upgrade the `/dashboard/inbox` page to display platform‑specific styling (WhatsApp, Facebook Messenger, Instagram). This includes new icons, colour‑coded borders, platform badges, filter tabs with counts, platform text labels, and platform‑specific empty states. The UI remains fully responsive and continues to receive real‑time updates via Supabase.

## User Review Required
> [!IMPORTANT]
> Confirm the colour palette, icons, and mock data counts (All (8), WhatsApp (3), Messenger (3), Instagram (2)). The plan proceeds only after approval.

## Open Questions
> [!NOTE]
> - Instagram gradient uses Tailwind utilities `bg-gradient-to-r from-purple-600 to-pink-500`. Ensure Tailwind config supports gradient utilities.
> - Platform badge text will be "Chatting via WhatsApp", "Chatting via Messenger", "Chatting via Instagram".
> - Voice‑note play button will be a rounded button (`rounded-full`) with the platform colour as background.

## Proposed Changes
---
### New Types
#### [NEW] `src/types/platform.ts`
```ts
export type Platform = 'whatsapp' | 'facebook' | 'instagram';
export interface PlatformInfo {
  platform: Platform;
  platform_display_name: string; // e.g. "WhatsApp", "Messenger", "Instagram"
}
```
---
### Mock Data
#### [MODIFY] `src/lib/mock-data.ts`
- Extend `Conversation` type to include `platform_display_name`.
- Update existing mock conversations to include the new field matching each platform.
- Ensure total counts are 8 (3 WhatsApp, 3 Facebook, 2 Instagram).
---
### UI Components
#### [NEW] `src/components/dashboard/PlatformIcon.tsx`
```tsx
'use client';
import { MessageCircle, MessageSquare, Camera } from 'lucide-react';
import { Platform } from '@/types/platform';
import clsx from 'clsx';

interface Props {
  platform: Platform | string;
  className?: string;
}

export function PlatformIcon({ platform, className }: Props) {
  const icons = {
    whatsapp: <MessageCircle className={clsx('h-full w-full', className)} />, 
    facebook: <MessageSquare className={clsx('h-full w-full', className)} />, 
    instagram: <Camera className={clsx('h-full w-full', className)} />, 
  };
  const colors = {
    whatsapp: 'text-[#25D366]',
    facebook: 'text-[#0084FF]',
    instagram: 'text-purple-600',
  };
  const key = platform as Platform;
  return <span className={clsx(colors[key])}>{icons[key] ?? null}</span>;
}
```
---
#### [NEW] `src/components/dashboard/PlatformBadge.tsx`
```tsx
'use client';
import { PlatformIcon } from './PlatformIcon';
import { Platform } from '@/types/platform';
import clsx from 'clsx';

interface Props {
  platform: Platform;
  className?: string;
}

export function PlatformBadge({ platform, className }: Props) {
  const bg = {
    whatsapp: 'bg-[#25D366]/10 text-[#25D366]',
    facebook: 'bg-[#0084FF]/10 text-[#0084FF]',
    instagram: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
  }[platform];
  const label = {
    whatsapp: 'WhatsApp',
    facebook: 'Messenger',
    instagram: 'Instagram',
  }[platform];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', bg, className)}>
      <PlatformIcon platform={platform} className="h-3 w-3" />
      {label}
    </span>
  );
}
```
---
#### [NEW] `src/components/dashboard/PlatformFilter.tsx`
```tsx
'use client';
import { Platform } from '@/types/platform';
import clsx from 'clsx';

interface Props {
  counts: Record<'all' | Platform, number>;
  active: 'all' | Platform;
  onChange: (value: 'all' | Platform) => void;
}

export function PlatformFilter({ counts, active, onChange }: Props) {
  const tabs: Array<{key: 'all' | Platform; label: string}> = [
    {key: 'all', label: `All (${counts.all})`},
    {key: 'whatsapp', label: `WhatsApp (${counts.whatsapp})`},
    {key: 'facebook', label: `Messenger (${counts.facebook})`},
    {key: 'instagram', label: `Instagram (${counts.instagram})`},
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
            active === t.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```
---
### Conversation List Adjustments
#### [MODIFY] `src/components/dashboard/ConversationList.tsx`
- Replace static filter buttons with `PlatformFilter`.
- Compute counts from `conversations` (group by platform).
- Pass `activePlatform` state to filter the rendered list.
- In each `ConversationCard`, render platform icon **and** a text label after the name (e.g., `Achraf — WhatsApp`).
- Apply left‑border colour based on platform (`border-l-4 border-whatsapp`, `border-facebook`, `border-instagram`).
---
#### [MODIFY] `src/components/dashboard/ConversationCard.tsx`
- Add platform colour mapping object.
- Adjust outer `div` class to include `border-l-4` with appropriate colour.
- Insert platform text after the name: `<span className="text-sm text-slate-500 ml-1">— {conversation.platform_display_name}</span>`.
- Use `PlatformIcon` for the icon.
---
### Chat Panel Adjustments
#### [MODIFY] `src/components/dashboard/ChatPanel.tsx`
- Header now shows `PlatformBadge` next to the avatar.
- Pass `conversation.platform` to `PlatformBadge`.
- `MessageBubble` component receives `platform` prop and styles its border/background accordingly.
- Voice‑note UI inside `MessageBubble` gets a rounded button with `bg-[#25D366]` / `bg-[#0084FF]` / gradient for Instagram.
---
### Empty State Components
#### [NEW] `src/components/dashboard/EmptyStates.tsx`
Add platform‑specific empty state components that accept a `platform` prop and render the appropriate gradient/icon with a friendly message, e.g., "No WhatsApp conversations yet".
---
### Styling
- Extend `tailwind.config.js` with custom colours:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        whatsapp: '#25D366',
        messenger: '#0084FF',
        instagram: {
          start: '#8B5CF6', // tailwind purple-600
          end: '#EC4899',   // tailwind pink-500
        },
      },
    },
  },
};
```
- Use gradient utilities for Instagram left border (`bg-gradient-to-r from-purple-600 to-pink-500`).
---
### Tests
- **Unit tests** for `PlatformIcon`, `PlatformBadge`, `PlatformFilter` (assert correct colour classes and labels).
- **Snapshot tests** for `ConversationList` with each platform filter active.
- **E2E sanity** (manual) – verify real‑time updates still flow after UI changes.
---
## Verification Plan
### Automated
- Run `npm test` after adding Jest tests.
- Lint with `npm run lint` (TS strict).
### Manual
- Open `/dashboard/inbox` in dev server.
- Switch between filter tabs and confirm counts.
- Open each conversation and verify platform badge, coloured bubbles, and voice‑note button colour.
- Platform‑specific empty states appear when no conversations exist for a filter.
- Simulate a new message via Supabase console and watch UI update.
- Resize window to <640 px to confirm mobile layout.
---
