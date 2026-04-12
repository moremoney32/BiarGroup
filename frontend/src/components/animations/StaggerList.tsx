import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

interface StaggerListProps {
  children: React.ReactNode
  className?: string
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: StaggerListProps) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}
