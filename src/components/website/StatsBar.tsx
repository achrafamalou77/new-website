'use client'

import { motion } from 'framer-motion'
import { Users, MapPin, Calendar } from 'lucide-react'

export function StatsBar({ tripsCount }: { agency: any, tripsCount: number }) {
  const stats = [
    { icon: Users, label: 'Happy Travelers', value: '500+' },
    { icon: MapPin, label: 'Trips Organized', value: `${tripsCount > 0 ? tripsCount : 12}+` },
    { icon: Calendar, label: 'Years Experience', value: '8+' },
  ]

  return (
    <section className="bg-white pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center space-y-2"
            >
              <div className="text-4xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
