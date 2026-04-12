import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const stats = [
  { value: 5000, suffix: '+', label: 'Entreprises clientes', color: '#E91E8C' },
  { value: 190,  suffix: '+', label: 'Pays couverts',        color: '#E91E8C' },
  { value: 99.9, suffix: '%', label: 'Uptime garanti',       color: '#E91E8C', decimal: true },
  { value: 24,   suffix: '/7', label: 'Support expert',      color: '#E91E8C' },
]

function Counter({ to, suffix, decimal, color }: { to: number; suffix: string; decimal?: boolean; color: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1600
    const steps = 60
    const increment = to / steps
    let current = 0
    const t = setInterval(() => {
      current = Math.min(current + increment, to)
      setVal(current)
      if (current >= to) clearInterval(t)
    }, duration / steps)
    return () => clearInterval(t)
  }, [inView, to])

  return (
    <span ref={ref} style={{ color }} className="text-[36px] font-extrabold md:text-[42px]">
      {decimal ? val.toFixed(1) : Math.floor(val).toLocaleString('fr-FR')}
      {suffix}
    </span>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center gap-1 text-center"
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
