import clsx from 'clsx'
import { motion } from 'framer-motion'

/**
 * Card universal premium.
 * Variantes:
 *  - hover: hover lift suave
 *  - glow: borda neon
 *  - gradient: fundo com leve gradiente
 *  - elevated: sombra forte
 *  - accent: cor de destaque na borda superior (linha gradiente)
 */
export default function Card({
  children, className,
  hover = false,
  gradient = false,
  glow = false,
  elevated = false,
  accent,
  onClick,
  ...props
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -3 } : undefined}
      transition={hover ? { type: 'spring', stiffness: 300, damping: 22 } : undefined}
      onClick={onClick}
      className={clsx(
        'rounded-2xl transition-all duration-300 relative overflow-hidden',
        gradient
          ? 'bg-gradient-to-br from-dark-700 via-dark-700 to-dark-800'
          : 'bg-dark-700',
        glow
          ? 'border border-brand-500/40 shadow-[0_0_24px_-4px_rgba(99,102,241,0.25)]'
          : 'border border-white/[0.06]',
        elevated
          ? 'shadow-2xl shadow-black/30'
          : 'shadow-lg shadow-black/15',
        hover && 'cursor-pointer hover:border-brand-500/30 hover:shadow-brand-500/10',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`
          }}
        />
      )}
      {children}
    </motion.div>
  )
}
