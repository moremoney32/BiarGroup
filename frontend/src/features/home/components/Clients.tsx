import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { homeClients, homePartners } from '../../../datamocks/home.mock'

export default function Clients() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="bg-[#f9fafb] py-16">
      <div className="mx-auto max-w-[1200px] px-4">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-[28px] font-extrabold md:text-[34px]">
            <span className="bg-gradient-to-r from-[#E91E8C] to-[#6366F1] bg-clip-text text-transparent">
              Ils Nous Font Confiance
            </span>
          </h2>
          <p className="mt-2 text-[14px] text-[#6b7280]">
            Des entreprises leaders dans leur secteur
          </p>
        </motion.div>

        {/* NOS CLIENTS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
            Nos Clients
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {homeClients.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 + i * 0.04, duration: 0.35 }}
                className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-3.5 text-center transition-shadow hover:shadow-sm"
              >
                <span className="text-[13px] font-semibold text-[#374151]">{name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* NOS PARTENAIRES */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10"
        >
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
            Nos Partenaires Technologiques
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {homePartners.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.04, duration: 0.35 }}
                className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-3.5 text-center transition-shadow hover:shadow-sm"
              >
                <span className="text-[13px] font-semibold text-[#374151]">{name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
