import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CtaBanner() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-[#f9fafb] py-20">
      <div className="mx-auto max-w-[1200px] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl bg-white px-8 py-16 text-center shadow-xl shadow-gray-100/80"
        >
          {/* Subtle blobs */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#FE5B29]/6 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[#6366F1]/6 blur-3xl" />

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="relative text-[28px] font-extrabold text-[#1a1a2e] md:text-[38px]"
          >
            Prêt à Transformer{' '}
            <span className="bg-gradient-to-r from-[#2B7FFF] to-[#6366F1] bg-clip-text text-transparent">
              Votre Communication
            </span>{' '}
            ?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="relative mx-auto mt-4 max-w-[480px] text-[15px] text-[#6b7280]"
          >
            Démarrez gratuitement dès aujourd'hui. Aucune carte bancaire requise.
            Support francophone 24/7.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="relative mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.a
              whileHover={{ scale: 1.04, boxShadow: '0 8px 28px rgba(254,91,41,0.35)' }}
              whileTap={{ scale: 0.97 }}
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-[#FE5B29] px-8 py-3.5 text-[14px] font-bold text-white shadow-md hover:bg-[#E0521F] transition-colors"
            >
              Commencer maintenant <ArrowRight size={16} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#tarifs"
              className="rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-[14px] font-semibold text-[#374151] shadow-sm hover:border-gray-300 transition-colors"
            >
              Voir les tarifs
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative mt-6 flex flex-wrap items-center justify-center gap-5 text-[12px] text-[#9ca3af]"
          >
            <span>✓ Essai gratuit 14 jours</span>
            <span>✓ Sans engagement</span>
            <span>✓ Support 24/7</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
