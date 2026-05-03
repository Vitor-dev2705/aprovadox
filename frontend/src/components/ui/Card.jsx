import clsx from 'clsx'
import { motion } from 'framer-motion'

export default function Card({ children, className, hover = false, gradient = false, onClick, glow = false }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      onClick={onClick}
      className={clsx(
        'bg-dark-700 rounded-2xl border shadow-xl transition-all duration-300',
        hover && 'cursor-pointer hover:border-brand-500/30 hover:shadow-brand-500/10',
        gradient && 'bg-gradient-to-br from-dark-700 to-dark-800',
        glow && 'neon-glow border-brand-500/30',
        !glow && 'border-white/5',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
