'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { getBuilderConfig } from '@/app/actions/builder'
import { createClient } from '@/lib/supabase/client'
import WebsiteBuilderShell from '@/components/dashboard/WebsiteBuilderShell'

export default function VisualBuilderPage() {
  const [loading, setLoading] = useState(true)
  const [agency, setAgency] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [revisions, setRevisions] = useState<any[]>([])
  const [salesCars, setSalesCars] = useState<any[]>([])
  const [rentalCars, setRentalCars] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getBuilderConfig()
        setAgency(data.agency)
        setConfig(data.config)
        setRevisions(data.revisions)

        // Load real inventory data
        const supabase = createClient()
        if (supabase && data.agency?.id) {
          const { data: salesData } = await supabase
            .from('car_sales_inventory')
            .select('*')
            .eq('agency_id', data.agency.id)
            .neq('status', 'sold')
            .order('created_at', { ascending: false })
          setSalesCars(salesData || [])

          const { data: rentalData } = await supabase
            .from('car_rental_fleet')
            .select('*')
            .eq('agency_id', data.agency.id)
            .order('created_at', { ascending: false })
          setRentalCars(rentalData || [])
        }
      } catch (err) {
        console.error('Error loading visual builder:', err)
        setError('Impossible de charger le builder. Vérifiez vos permissions.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center text-slate-400 gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-rose-500" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-300">
          Chargement de l'atelier de création...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="text-red-400 text-sm font-bold">{error}</div>
      </div>
    )
  }

  return (
    <WebsiteBuilderShell
      agency={agency}
      initialConfig={config}
      initialRevisions={revisions}
      salesCars={salesCars}
      rentalCars={rentalCars}
    />
  )
}
