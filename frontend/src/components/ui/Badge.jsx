import clsx from 'clsx'

const variants = {
  default:  'bg-slate-700 text-slate-300',
  primary:  'bg-brand-500/20 text-brand-300 border border-brand-500/30',
  success:  'bg-accent-500/20 text-accent-300 border border-accent-500/30',
  warning:  'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  danger:   'bg-red-500/20 text-red-300 border border-red-500/30',
  orange:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
}

export default function Badge({ children, variant = 'default', className, dot = false }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
      variants[variant], className
    )}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', {
        'bg-brand-400': variant === 'primary',
        'bg-accent-400': variant === 'success',
        'bg-yellow-400': variant === 'warning',
        'bg-red-400': variant === 'danger',
        'bg-orange-400': variant === 'orange',
        'bg-slate-400': variant === 'default',
      })} />}
      {children}
    </span>
  )
}
