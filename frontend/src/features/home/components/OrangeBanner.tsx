import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const badges = ['Intégration en 24h', 'Sans engagement', 'Support francophone']

export default function OrangeBanner() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden py-14"
        style={{ background: 'linear-gradient(130deg, #FE5B29 0%, #f06020 30%, #0284c7 70%, #0ea5e9 100%)' }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-[1200px] px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-[28px] font-extrabold text-white md:text-[34px]"
          >
            Rejoignez des milliers d'entreprises
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-2 text-[15px] text-white/80"
          >
            qui ont transformé leur communication avec nos solutions
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            {badges.map((b) => (
              <div
                key={b}
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-5 py-2 backdrop-blur-sm"
              >
                <CheckCircle2 size={15} className="shrink-0 text-white" strokeWidth={2.5} />
                <span className="text-[13px] font-semibold text-white">{b}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
