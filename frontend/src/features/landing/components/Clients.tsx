import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const clients = ['MTN', 'Orange', 'Moov', 'Airtel', 'Vodafone', 'Camtel', 'Total', 'BICEC', 'Afriland', 'Ecobank', 'UBA', 'SCB']
const partners = ['Microsoft', 'Google Cloud', 'AWS', 'Twilio', 'SendGrid', 'WhatsApp', 'Salesforce', 'HubSpot']

export default function Clients() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="bg-[#f9fafb] py-16">
      <div className="mx-auto max-w-[1087px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h2 className="text-[30px] font-bold text-[#f0e6ff] [text-shadow:0_1px_20px_rgba(0,0,0,0.5)]"
            style={{ color: '#1c1b1d' }}>
            Ils Nous Font Confiance
          </h2>
          <p className="mt-2 text-[16px] text-[#4a5565]">Des entreprises leaders dans leur secteur</p>
        </motion.div>

        {/* Clients */}
        <div className="mb-10">
          <p className="mb-5 text-center text-[14px] font-semibold uppercase tracking-wider text-[#6a7282]">
            Nos Clients
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-12"
          >
            {clients.map((client, i) => (
              <motion.div
                key={client}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.08, y: -2 }}
                className="flex items-center justify-center rounded-xl border border-[#e5e7eb] bg-white px-3 py-3 shadow-sm"
              >
                <span className="text-[18px] font-semibold text-[#4a5565]">{client}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Partenaires */}
        <div>
          <p className="mb-5 text-center text-[14px] font-semibold uppercase tracking-wider text-[#6a7282]">
            Nos Partenaires Technologiques
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {partners.map((p, i) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.06 }}
                className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-3 shadow-sm"
              >
                <span className="text-[16px] font-semibold text-[#364153]">{p}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
