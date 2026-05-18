'use client'

import { useEffect } from 'react'

export function PrintTrigger() {
  useEffect(() => {
    // Wait for A4 layout rendering to settle, then open printing dialog
    const timer = setTimeout(() => {
      window.print()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return null
}
