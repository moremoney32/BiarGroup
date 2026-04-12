import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Phone, MessageSquare, MessageCircle, Mail, ArrowRight } from 'lucide-react'

const solutions = [
  {
    icon: Phone,
    color: '#ff8052',
    bg: 'bg-orange-50',
    title: 'Centre d\'Appels Cloud',
    desc: 'Softphone HD, IVR intelligent, supervision temps réel, dialers automatiques et CTI avancé.',
    tags: ['Softphone WebRTC', 'IVR Visuel', 'Power/Predictive Dialer'],
  },
  {
    icon: MessageSquare,
    color: '#155dfc',
    bg: 'bg-blue-50',
    title: 'SMS Marketing',
    desc: 'Connexion SMPP directe, envoi bulk illimité, SMS two-way et analytics en temps réel.',
    tags: ['SMPP Direct', 'SMS Bulk', 'Two-Way Conversations'],
  },
  {
    icon: MessageCircle,
    color: '#009689',
    bg: 'bg-teal-50',
    title: 'WhatsApp Business',
    desc: 'API officielle, chatbot IA, broadcast illimité, chat multi-agents et automation complète.',
    tags: ['Chatbot IA', 'Broadcast', 'Multi-Agents'],
  },
  {
    icon: Mail,
    color: '#9810fa',
    bg: 'bg-purple-50',
    title: 'Email Marketing',
    desc: 'Éditeur drag & drop, automation workflows, segmentation avancée et délivrabilité optimisée.',
    tags: ['Drag & Drop', 'Automation', '99.5% Délivrabilité'],
  },
]

export default function Solutions() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="services" ref={ref} className="bg-white py-20">
      <div className="mx-auto max-w-[1087px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="text-[48px] font-bold text-[#1c1b1d]">Nos Solutions Multi-Canal</h2>
          <p className="mt-3 text-[20px] text-[#4a5565]">
            Une plateforme unifiée pour gérer tous vos canaux de communication professionnels
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {solutions.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
              className="rounded-2xl border border-[#f3f4f6] bg-white p-7 transition-shadow"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon size={24} style={{ color: s.color }} />
              </div>
              <h3 className="text-[24px] font-bold text-[#1c1b1d]">{s.title}</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-[#4a5565]">{s.desc}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#f3f4f6] bg-[#f9fafb] px-3 py-1 text-[14px] font-medium text-[#364153]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <motion.a
                whileHover={{ x: 4 }}
                href="#"
                className="mt-5 inline-flex items-center gap-1.5 text-[16px] font-semibold"
                style={{ color: '#F97316' }}
              >
                En savoir plus <ArrowRight size={16} />
              </motion.a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
