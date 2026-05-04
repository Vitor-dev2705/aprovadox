import { motion } from 'framer-motion'

/**
 * PageHeader padrão para todas as páginas internas.
 *
 * Props:
 *  - emoji: string com emoji opcional (ex: '📚')
 *  - title: título principal (string ou elemento)
 *  - subtitle: descrição curta abaixo
 *  - actions: elemento(s) à direita (botões, badges)
 *  - badge: pequeno badge de status no topo (string)
 */
export default function PageHeader({ emoji, title, subtitle, actions, badge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mb-6 sm:mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              {badge}
            </div>
          )}
          <div className="flex items-center gap-3">
            {emoji && <span className="text-3xl sm:text-4xl">{emoji}</span>}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Linha divisória sutil com gradiente */}
      <div className="mt-5 h-px bg-gradient-to-r from-brand-500/30 via-white/5 to-transparent" />
    </motion.div>
  )
}
