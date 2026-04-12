import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Amadou Diallo',
    role: 'CEO, TechAfrique SARL',
    country: 'Cameroun',
    text: 'Actor Hub a transformé notre communication client. Nous envoyons 500K SMS/mois avec un taux de délivrabilité de 99%. Le support francophone est exceptionnel.',
    stars: 5,
    color: '#F97316',
  },
  {
    name: 'Marie Dubois',
    role: 'Directrice Marketing, BanqueCongoPlus',
    country: 'RD Congo',
    text: 'L\'intégration WhatsApp Business avec leur chatbot IA a augmenté notre engagement de 300%. Plateforme très intuitive et support réactif disponible 24h/24.',
    stars: 5,
    color: '#E91E8C',
  },
  {
    name: 'Jean-Pierre Nkosi',
    role: 'COO, Groupe Télécoms Africa',
    country: 'Kinshasa',
    text: 'La plateforme la plus complète du marché africain. Call center, SMS, WhatsApp et Email dans une seule interface. ROI mesurable dès le premier mois.',
    stars: 5,
    color: '#8B5CF6',
  },
]

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-white py-20">
      <div className="mx-auto max-w-[1200px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-[36px] font-extrabold text-[#1a1a2e] md:text-[44px]">
            Ce Que Disent Nos Clients
          </h2>
          <p className="mt-3 text-[16px] text-[#6b7280]">
            Des milliers d'entreprises dans le monde utilisent Actor Hub chaque jour
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: '0 16px 48px rgba(0,0,0,0.07)' }}
              className="rounded-2xl border border-gray-100 bg-white p-7 transition-shadow"
            >
              {/* Quote icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: t.color + '15' }}>
                <Quote size={18} style={{ color: t.color }} />
              </div>

              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={15} className="fill-[#F97316] text-[#F97316]" />
                ))}
              </div>

              {/* Quote text */}
              <p className="mb-6 text-[15px] leading-relaxed text-[#4b5563]">"{t.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, #1a1a2e)` }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#1a1a2e]">{t.name}</p>
                  <p className="text-[13px] text-[#6b7280]">{t.role}</p>
                  <p className="text-[12px] text-[#9ca3af]">{t.country}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
