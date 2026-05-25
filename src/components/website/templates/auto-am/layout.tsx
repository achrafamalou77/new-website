// src/components/website/templates/auto-am/layout.tsx
import React from 'react';

export default function AutoAMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-red-650 selection:text-white antialiased">
      {children}
    </div>
  );
}
