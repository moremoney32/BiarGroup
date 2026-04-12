import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

export default function CtaBanner() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="bg-white py-20">
      <div className="mx-auto max-w-[1087px] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f0e6ff] via-white to-[#fde8f5] px-8 py-16 text-center shadow-xl"
        >
          {/* Decorative blobs */}
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#E91E8C]/10 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#3B2F8F]/10 blur-3xl" />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative text-[48px] font-bold text-[#624a86]"
          >
            Prêt à Transformer Votre Communication ?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative mx-auto mt-4 max-w-xl text-[20px] text-[#4a5565]"
          >
            Démarrez gratuitement dès aujourd'hui. Aucune carte bancaire requise. Support francophone 24/7.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.a
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(233,30,140,0.35)' }}
              whileTap={{ scale: 0.97 }}
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] px-7 py-3.5 text-[16px] font-semibold text-white shadow-lg"
            >
              Commencer maintenant <ArrowRight size={18} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              href="#tarifs"
              className="rounded-xl border border-[#364153]/20 bg-white px-7 py-3.5 text-[16px] font-semibold text-[#364153] shadow-sm hover:border-[#364153]/40 transition-colors"
            >
              Voir les tarifs
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative mt-6 flex flex-wrap items-center justify-center gap-6 text-[14px] text-[#4a5565]"
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
