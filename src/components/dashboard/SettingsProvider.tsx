'use client'

import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/lib/stores/settings-store'

export function SettingsProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode, 
  initialData: any 
}) {
  const setAllSettings = useSettingsStore(state => state.setAllSettings)
  const initialDataStr = JSON.stringify(initialData)
  const lastInitialDataStrRef = useRef('')

  // Initialize store with fresh server data on mount or when data actually changes
  useEffect(() => {
    if (initialData && initialDataStr !== lastInitialDataStrRef.current) {
      lastInitialDataStrRef.current = initialDataStr
      setAllSettings(initialData)
    }
  }, [initialDataStr, setAllSettings])

  return <>{children}</>
}
