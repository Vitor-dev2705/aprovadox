import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function ProgressBar({ value = 0, max = 100, color = 'brand', size = 'md', label, showValue = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    brand:   'from-brand-500 to-brand-400',
    success: 'from-accent-500 to-accent-400',
    warning: 'from-yellow-500 to-yellow-400',
    danger:  'from-red-500 to-red-400',
    rainbow: 'from-brand-500 via-accent-500 to-yellow-500',
  }
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && <span className="text-xs font-bold text-white">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={clsx('w-full bg-dark-500 rounded-full overflow-hidden', heights[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={clsx('h-full rounded-full bg-gradient-to-r', colors[color])}
        />
      </div>
    </div>
  )
}
