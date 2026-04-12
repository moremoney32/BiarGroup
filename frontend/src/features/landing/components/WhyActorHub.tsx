import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { TrendingUp, Clock, Star, Zap, Globe, HeartHandshake } from 'lucide-react'

const metrics = [
  { icon: TrendingUp, value: '98%',  color: '#F97316', label: 'Taux d\'engagement client',  desc: 'Augmentation moyenne de l\'engagement client' },
  { icon: TrendingUp, value: '60%',  color: '#E91E8C', label: 'Réduction des coûts',        desc: 'Économies sur vos coûts de communication' },
  { icon: Star,       value: '95%',  color: '#8B5CF6', label: 'Satisfaction client',         desc: 'Score de satisfaction moyen de nos clients' },
  { icon: Clock,      value: '75%',  color: '#F97316', label: 'Gain de temps',               desc: 'Automatisation de vos processus métier' },
  { icon: Zap,        value: '4.2x', color: '#E91E8C', label: 'ROI mesurable',               desc: 'Retour sur investissement moyen constaté' },
  { icon: Globe,      value: '24h',  color: '#3B82F6', label: 'Intégration rapide',          desc: 'Intégrez avec vos outils existants' },
]

export default function WhyActorHub() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-[#fafafa] py-20">
      <div className="mx-auto max-w-[1200px] px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-[38px] font-extrabold text-[#1a1a2e] md:text-[46px]">
            Pourquoi{' '}
            <span className="bg-gradient-to-r from-[#F97316] to-[#E91E8C] bg-clip-text text-transparent">
              Actor Hub
            </span>{' '}
            ?
          </h2>
          <p className="mt-3 text-[17px] text-[#6b7280]">
            Des fonctionnalités puissantes pour propulser votre entreprise.
          </p>
          <p className="mt-1 text-[17px] font-semibold text-[#374151]">
            Des résultats concrets pour votre entreprise.
          </p>
        </motion.div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {metrics.map((m, i) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                className="rounded-2xl border border-gray-100 bg-white p-6 transition-shadow"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: m.color + '18' }}>
                  <Icon size={22} style={{ color: m.color }} />
                </div>
                <span className="text-[40px] font-extrabold leading-none" style={{ color: m.color }}>
                  {m.value}
                </span>
                <p className="mt-2 text-[16px] font-semibold text-[#1a1a2e]">{m.label}</p>
                <p className="mt-1 text-[14px] text-[#6b7280]">{m.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#F97316] to-[#E91E8C] px-8 py-7 text-white"
        >
          <div>
            <p className="text-[24px] font-bold">Rejoignez des milliers d'entreprises</p>
            <p className="mt-0.5 text-[15px] text-white/80">
              qui ont transformé leur communication avec nos solutions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[14px] font-medium">
            <span>✓ Intégration en 24h</span>
            <span>✓ Sans engagement</span>
            <span>✓ Support francophone 24/7</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
