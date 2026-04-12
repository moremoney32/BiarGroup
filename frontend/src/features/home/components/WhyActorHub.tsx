import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  TrendingUp, DollarSign, Smile, Clock, BarChart2, Settings2,
  type LucideIcon,
} from 'lucide-react'
import { homeMetrics } from '../../../datamocks/home.mock'

const iconMap: Record<string, LucideIcon> = {
  TrendingUp, DollarSign, Smile, Clock, BarChart2, Settings2,
}

export default function WhyActorHub() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="pourquoi" className="bg-[#f9fafb] py-20">
      <div className="mx-auto max-w-[1200px] px-4">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-12 text-center"
        >
          <h2 className="text-[34px] font-extrabold text-[#1a1a2e] md:text-[42px]">
            Pourquoi{' '}
            <span className="bg-gradient-to-r from-[#FE5B29] via-[#E91E8C] to-[#2B7FFF] bg-clip-text text-transparent">
              Actor Hub
            </span>{' '}
            ?
          </h2>
          <p className="mt-3 text-[15px] text-[#6b7280]">
            Des fonctionnalités puissantes pour propulser votre entreprise.
          </p>
          <p className="mt-1 text-[15px] font-semibold text-[#374151]">
            Des résultats concrets pour votre entreprise.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeMetrics.map((m, i) => {
            const Icon = iconMap[m.icon]
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                className="rounded-2xl border border-gray-100 bg-white p-6 transition-shadow duration-200"
              >
                {/* Icon */}
                {Icon && (
                  <div className="mb-4 inline-flex">
                    <Icon size={22} style={{ color: m.color }} strokeWidth={2} />
                  </div>
                )}

                {/* Value */}
                <div className="text-[42px] font-extrabold leading-none" style={{ color: m.color }}>
                  {m.value}
                </div>

                {/* Label */}
                <p className="mt-2 text-[13px] font-semibold" style={{ color: m.color }}>
                  {m.label}
                </p>

                {/* Description */}
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#6b7280]">
                  {m.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
