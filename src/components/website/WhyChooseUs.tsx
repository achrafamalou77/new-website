'use client'

import { motion } from 'framer-motion'

export function WhyChooseUs({ agency }: { agency: any }) {
  const features = [
    {
      title: "Expert Local Knowledge",
      description: "Our team of travel experts has deep roots in the regions we explore, ensuring you see the authentic side of every destination."
    },
    {
      title: "Hassle-Free Booking",
      description: "From visas to flights, we handle the complex logistics so you can focus entirely on enjoying your adventure."
    },
    {
      title: "24/7 Support",
      description: "Whether you're in Algiers or Istanbul, our dedicated support team is always just a WhatsApp message away."
    }
  ]

  return (
    <section id="why-us" className="py-24 bg-slate-50 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Why travel with {agency.company_name}?</h2>
          <p className="text-slate-500 text-lg">We pride ourselves on providing exceptional service and unforgettable experiences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center md:text-left"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
