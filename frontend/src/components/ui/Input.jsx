import clsx from 'clsx'

export default function Input({ label, error, icon, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          className={clsx(
            'w-full bg-dark-600 border rounded-xl px-4 py-3 text-white placeholder-slate-500',
            'focus:outline-none focus:ring-1 transition-all duration-200 text-sm',
            icon && 'pl-10',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
              : 'border-white/10 focus:border-brand-500 focus:ring-brand-500/30',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
