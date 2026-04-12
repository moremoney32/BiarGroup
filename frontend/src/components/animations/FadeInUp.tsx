import { motion, HTMLMotionProps } from 'framer-motion'

interface FadeInUpProps extends HTMLMotionProps<'div'> {
  delay?: number
  children: React.ReactNode
}

export default function FadeInUp({ delay = 0, children, ...props }: FadeInUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
