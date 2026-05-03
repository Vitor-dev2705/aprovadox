import clsx from 'clsx'
import { motion } from 'framer-motion'

const variants = {
  primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25',
  secondary: 'bg-dark-600 hover:bg-dark-500 text-white border border-white/10 hover:border-white/20',
  outline:   'border border-brand-500/50 text-brand-400 hover:bg-brand-500/10',
  ghost:     'text-slate-400 hover:text-white hover:bg-white/5',
  danger:    'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
  success:   'bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 border border-accent-500/30',
}

const sizes = {
  sm:  'px-3 py-1.5 text-sm rounded-lg',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3 text-base rounded-xl',
  xl:  'px-8 py-4 text-lg rounded-2xl',
  icon:'p-2.5 rounded-xl',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  className, loading, disabled, icon, ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon && icon}
      {children}
    </motion.button>
  )
}
