import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { homeStats } from '../../../datamocks/home.mock'

function Counter({ to, suffix, decimal, color }: { to: number; suffix: string; decimal: boolean; color: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const steps = 60
    const duration = 1800
    let current = 0
    const increment = to / steps
    const t = setInterval(() => {
      current = Math.min(current + increment, to)
      setVal(current)
      if (current >= to) clearInterval(t)
    }, duration / steps)
    return () => clearInterval(t)
  }, [inView, to])

  return (
    <span ref={ref} className="text-[38px] font-extrabold leading-none md:text-[44px]" style={{ color }}>
      {decimal ? val.toFixed(1) : Math.floor(val).toLocaleString('fr-FR')}
      {suffix}
    </span>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="bg-white py-10 md:py-12 border-y border-gray-100">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {homeStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <Counter to={s.value} suffix={s.suffix} decimal={s.decimal} color={s.color} />
              <span className="text-[13px] text-[#6b7280]">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
