import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Phone, MessageSquare, MessageCircle, Mail, type LucideIcon } from 'lucide-react'
import { homeSolutions } from '../../../datamocks/home.mock'

const iconMap: Record<string, LucideIcon> = { Phone, MessageSquare, MessageCircle, Mail }

export default function Solutions() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="solutions" className="bg-[#f9fafb] py-20">
      <div className="mx-auto max-w-[1200px] px-4">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-12 text-center"
        >
          <h2 className="text-[34px] font-extrabold text-[#1a1a2e] md:text-[42px]">
            Nos Solutions Multi-Canal
          </h2>
          <p className="mt-3 text-[16px] text-[#6b7280]">
            Une plateforme unifiée pour gérer tous vos canaux de communication professionnels
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2">
          {homeSolutions.map((s, i) => {
            const Icon = iconMap[s.icon]
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(0,0,0,0.09)' }}
                className="group rounded-2xl border border-gray-100 bg-white p-7 transition-shadow duration-200"
              >
                {/* iOS-style icon */}
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: s.iconBg }}
                >
                  {Icon && <Icon size={22} className="text-white" strokeWidth={2} />}
                </div>

                <h3 className="text-[19px] font-bold text-[#1a1a2e]">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">{s.desc}</p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-[11px] font-medium"
                      style={{ backgroundColor: s.bgColor, color: s.color }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <motion.a
                  href={s.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
                  style={{ color: s.color }}
                  whileHover={{ x: 3 }}
                >
                  En savoir plus <ArrowRight size={13} />
                </motion.a>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
