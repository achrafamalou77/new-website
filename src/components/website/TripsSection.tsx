'use client'

import { motion } from 'framer-motion'
import { TripCard } from './TripCard'

export function TripsSection({ 
  agency, 
  trips,
  comparedTrips = [],
  onToggleCompare
}: { 
  agency: any, 
  trips: any[],
  comparedTrips?: any[],
  onToggleCompare?: (trip: any) => void
}) {
  return (
    <section id="trips" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Curated Destinations by {agency.company_name}
            </h2>
            <p className="text-slate-500 text-lg">
              Explore our hand-picked selection of luxury and adventure trips, specifically tailored for the modern explorer.
            </p>
          </div>
        </div>

        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {trips.map((trip, idx) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <TripCard 
                  trip={trip} 
                  agency={agency} 
                  isCompared={comparedTrips.some(t => t.id === trip.id)}
                  onToggleCompare={onToggleCompare}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[2rem] p-12 sm:p-20 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">New trips coming soon!</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              We're currently preparing new exclusive destinations for you. Stay tuned!
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
