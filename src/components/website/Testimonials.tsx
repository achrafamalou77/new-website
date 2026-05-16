'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

export function Testimonials({ agency }: { agency: any }) {
  const reviews = [
    {
      name: "Ahmed B.",
      text: "The trip to Istanbul was perfectly organized. Everything from the flight to the hotels was top notch. Highly recommend Ephedia store!",
      rating: 5
    },
    {
      name: "Selma K.",
      text: "Amazing experience! The guides were very knowledgeable and the itinerary was well-balanced between adventure and relaxation.",
      rating: 5
    },
    {
      name: "Mohamed R.",
      text: "Booking was so easy through WhatsApp. Great support throughout the journey. I'll definitely book my next vacation here.",
      rating: 5
    }
  ]

  return (
    <section id="testimonials" className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Traveler Success Stories</h2>
          <p className="text-slate-500 text-lg">Don't just take our word for it. Hear from our amazing community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-8 rounded-2xl border border-slate-100 bg-white"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(review.rating)].map((_star: any, i: number) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-8 leading-relaxed">
                "{review.text}"
              </p>
              <div className="font-bold text-slate-900">
                {review.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
