import React from 'react'

export function MessengerIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      style={{ color: '#0084FF' }}
    >
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.253a12.87 12.87 0 003.443.464c6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.293 14.887l-3.08-3.283-6.01 3.283 6.61-7.017 3.08 3.283 6.01-3.283-6.61 7.017z"/>
    </svg>
  )
}
