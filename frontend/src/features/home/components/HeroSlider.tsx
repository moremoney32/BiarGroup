import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { heroSlides } from '../../../datamocks/home.mock'
import bg1 from '../../../assets/Section.png'
import bg2 from '../../../assets/Section2.png'
import bg3 from '../../../assets/Section3.png'
import bg4 from '../../../assets/Section4.png'
import bg5 from '../../../assets/Section5.png'

const bgs = [bg1, bg2, bg3, bg4, bg5]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent(c => (c + 1) % heroSlides.length), [])
  const prev = useCallback(() => setCurrent(c => (c - 1 + heroSlides.length) % heroSlides.length), [])
  const goTo = useCallback((i: number) => setCurrent(i), [])

  // Auto-play — boucle simple toutes les 5s
  useEffect(() => {
    if (paused) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [paused, next])

  const slide = heroSlides[current]

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - 64px)', minHeight: 520, maxHeight: 700 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero carousel"
    >
      {/* ── Backgrounds empilés — CSS opacity uniquement ── */}
      {bgs.map((bg, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
          }}
        />
      ))}

      {/* Overlay gauche pour lisibilité */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)' }}
      />

      {/* ── Contenu — AnimatePresence sur le texte uniquement ── */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-center px-6 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex max-w-[580px] flex-col"
          >
            <h1 className="whitespace-pre-line text-[34px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[42px] md:text-[52px]">
              {slide.title}
            </h1>

            <p className="mt-5 text-[14px] leading-[1.7] text-white/80 md:text-[16px]">
              {slide.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={slide.cta1.href}
                className="flex items-center gap-2 rounded-lg bg-[#FE5B29] px-6 py-3 text-[14px] font-bold text-white shadow-lg hover:bg-[#E0521F] transition-colors"
              >
                {slide.cta1.label} <ArrowRight size={15} />
              </a>
              <a
                href={slide.cta2.href}
                className="rounded-lg border border-white/35 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur-sm hover:bg-white/18 transition-colors"
              >
                {slide.cta2.label}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flèche gauche */}
      <button
        onClick={prev}
        aria-label="Précédent"
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>

      {/* Flèche droite */}
      <button
        onClick={next}
        aria-label="Suivant"
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 24 : 6,
              height: 6,
              backgroundColor: i === current ? '#FE5B29' : 'rgba(255,255,255,0.45)',
            }}
          />
        ))}
      </div>

      {/* Barre de progression */}
      {!paused && (
        <motion.div
          key={'bar-' + current}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 5, ease: 'linear' }}
          className="absolute bottom-0 left-0 z-20 h-[3px] w-full origin-left"
          style={{ backgroundColor: 'rgba(254,91,41,0.7)' }}
        />
      )}
    </section>
  )
}
