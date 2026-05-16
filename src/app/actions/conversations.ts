'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleAiStatus(conversationId: string, aiStatus: boolean) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Demo mode: Skipping AI toggle Supabase update for', conversationId)
    return { success: true }
  }

  const supabase = await createClient()
  
  const { error } = await (supabase as any)
    .from('conversations')
    .update({ ai_status: aiStatus })
    .eq('id', conversationId)
    
  if (error) {
    console.error('Failed to toggle AI status:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
