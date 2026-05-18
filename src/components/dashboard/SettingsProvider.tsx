'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/stores/settings-store'

export function SettingsProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode, 
  initialData: any 
}) {
  const setAllSettings = useSettingsStore(state => state.setAllSettings)

  // Initialize store with fresh server data on mount
  useEffect(() => {
    if (initialData) {
      setAllSettings(initialData)
    }
  }, [initialData, setAllSettings])

  return <>{children}</>
}
