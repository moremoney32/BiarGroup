import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star } from 'lucide-react'
import { homeTestimonials } from '../../../datamocks/home.mock'

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ backgroundColor: color + '22', border: `2px solid ${color}33` }}
    >
      {/* Generic silhouette */}
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" fill="none">
        <circle cx="20" cy="15" r="7" fill={color} opacity="0.7" />
        <ellipse cx="20" cy="34" rx="12" ry="9" fill={color} opacity="0.5" />
      </svg>
      <span className="relative z-10 text-[12px] font-bold text-white drop-shadow">
        {initials}
      </span>
    </div>
  )
}

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="temoignages" className="bg-white py-20">
      <div className="mx-auto max-w-[1200px] px-4">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-12 text-center"
        >
          <h2 className="text-[30px] font-extrabold md:text-[38px]">
            <span className="bg-gradient-to-r from-[#E91E8C] to-[#6366F1] bg-clip-text text-transparent">
              Ce Que Disent Nos Clients
            </span>
          </h2>
          <p className="mt-3 text-[14px] text-[#6b7280]">
            Des milliers d'entreprises dans le monde utilisent Actor Hub chaque jour
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {homeTestimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: '0 16px 48px rgba(0,0,0,0.07)' }}
              className="rounded-2xl border border-gray-100 bg-white p-6 transition-shadow duration-200"
            >
              {/* Author top */}
              <div className="mb-4 flex items-center gap-3">
                <Avatar initials={t.initials} color={t.color} />
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">{t.name}</p>
                  <p className="text-[11px] text-[#6b7280]">{t.role}</p>
                  <p className="text-[10px] text-[#9ca3af]">{t.country}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={13} className="fill-[#FE5B29] text-[#FE5B29]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[13px] leading-[1.75] text-[#4b5563]">
                "{t.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
