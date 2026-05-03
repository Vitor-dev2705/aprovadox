import clsx from 'clsx'

export default function Select({ label, error, options = [], placeholder, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <select
        className={clsx(
          'w-full bg-dark-600 border border-white/10 rounded-xl px-4 py-3 text-white text-sm',
          'focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all duration-200',
          'appearance-none cursor-pointer',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
