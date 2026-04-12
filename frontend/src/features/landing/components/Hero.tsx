import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  {
    id: 1,
    tag: 'Plateforme CPaaS #1 en Afrique',
    title: 'Plateforme Unifiée\nde Communication\nCloud',
    desc: 'Transformez votre communication client avec notre solution SaaS complète : Centre d\'appels, SMS Bulk, WhatsApp Business et Email Marketing.',
    cta1: { label: 'Essai gratuit 14 jours', href: '/register' },
    cta2: { label: 'Voir la démo', href: '#demo' },
    gradient: 'from-[#0a0b1a] via-[#1a0f2e] to-[#0d1117]',
  },
  {
    id: 2,
    tag: 'White-label & Multi-tenant',
    title: 'Pourquoi les Entreprises\net Opérateurs Télécom\nChoisissent ACTOR Hub',
    desc: 'One platform · Infinite connections. Débloquez la croissance avec le white-label, multi-tenancy, UC tout-en-un et bien plus encore.',
    cta1: { label: 'Explorer la solution →', href: '#solutions' },
    cta2: { label: 'Voir les tarifs', href: '#tarifs' },
    gradient: 'from-[#0a1628] via-[#0f2318] to-[#0a0b0b]',
  },
  {
    id: 3,
    tag: 'B-GOTOCALL',
    title: 'Centre d\'Appels Cloud\nNouvelle Génération 🏆',
    desc: 'Softphone WebRTC, IVR intelligent, Power & Predictive Dialer, supervision en temps réel et analytics avancés.',
    cta1: { label: 'Découvrir le Call Center', href: '#call-center' },
    cta2: { label: 'Voir les fonctionnalités', href: '#fonctionnalites' },
    gradient: 'from-[#0a0f1e] via-[#0f1a2e] to-[#0a0b0b]',
  },
  {
    id: 4,
    tag: 'B-SMSBULK',
    title: 'SMS Marketing\nDirect Opérateurs',
    desc: 'Connexion SMPP avec 800+ opérateurs dans 190 pays. Envoyez des millions de SMS avec 99% de délivrabilité, API REST et rapports DLR en temps réel.',
    cta1: { label: 'Commencer avec SMS', href: '/register' },
    cta2: { label: 'Documentation API', href: '#api' },
    gradient: 'from-[#1a0a00] via-[#0f0f0f] to-[#0a0b0b]',
  },
  {
    id: 5,
    tag: 'B-WHATSAPP',
    title: 'WhatsApp Business\nAPI Officielle',
    desc: 'Connectez-vous à 2 milliards d\'utilisateurs. Chatbot IA multilingue, Broadcast illimité, Multi-agents et automation complète des conversations.',
    cta1: { label: 'Activer WhatsApp →', href: '/register' },
    cta2: { label: 'Voir les cas d\'usage', href: '#cas-usage' },
    gradient: 'from-[#001a0a] via-[#0a1a10] to-[#0a0b0b]',
  },
]

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)

  const go = useCallback((idx: number, d: number) => {
    setDir(d)
    setCurrent(idx)
  }, [])

  const next = useCallback(() => go((current + 1) % slides.length, 1), [current, go])
  const prev = useCallback(() => go((current - 1 + slides.length) % slides.length, -1), [current, go])

  useEffect(() => {
    if (paused) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, paused])

  const slide = slides[current]

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - 64px)', minHeight: 480, maxHeight: 720 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Gradient bg per slide */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={'bg-' + current}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
        />
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Slide content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-center px-6 md:px-12">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={current}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="max-w-[640px]"
          >
            {/* Tag badge */}
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm"
            >
              {slide.tag}
            </motion.span>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="whitespace-pre-line text-[34px] font-extrabold leading-[1.18] text-white sm:text-[42px] md:text-[52px]"
            >
              {slide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
              className="mt-5 text-[14px] leading-relaxed text-white/70 md:text-[16px]"
            >
              {slide.desc}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <motion.a
                whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(249,115,22,0.45)' }}
                whileTap={{ scale: 0.96 }}
                href={slide.cta1.href}
                className="rounded-lg bg-[#F97316] px-6 py-3 text-[14px] font-bold text-white shadow-lg hover:bg-[#EA6C0A] transition-colors"
              >
                {slide.cta1.label}
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                href={slide.cta2.href}
                className="rounded-lg border border-white/35 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                {slide.cta2.label}
              </motion.a>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Left arrow */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
        aria-label="Précédent"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Right arrow */}
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
        aria-label="Suivant"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i, i > current ? 1 : -1)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'h-2 w-6 bg-[#F97316]'
                : 'h-2 w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
