import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiHome, FiClock, FiBookOpen, FiTarget, FiCalendar,
  FiBarChart2, FiAlertCircle, FiZap, FiGrid, FiStar,
  FiAward, FiLogOut, FiSun, FiMoon,
  FiChevronLeft, FiChevronRight, FiMenu
} from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import clsx from 'clsx'

const nav = [
  { to: '/dashboard',    icon: FiHome,       label: 'Dashboard' },
  { to: '/cronometro',   icon: FiClock,      label: 'Cronômetro' },
  { to: '/concursos',    icon: FiTarget,     label: 'Concursos' },
  { to: '/materias',     icon: FiBookOpen,   label: 'Matérias' },
  { to: '/revisoes',     icon: FiCalendar,   label: 'Revisões' },
  { to: '/planejamento', icon: FiGrid,       label: 'Planejamento' },
  { to: '/estatisticas', icon: FiBarChart2,  label: 'Estatísticas' },
  { to: '/questoes',     icon: FiAlertCircle,label: 'Questões' },
  { to: '/tecnicas',     icon: FiZap,        label: 'Técnicas' },
  { to: '/gamificacao',  icon: FiAward,      label: 'Gamificação' },
  { to: '/motivacional', icon: FiStar,       label: 'Motivação' },
]

function XpBar({ xp, level }) {
  const progress = xp % 100
  return (
    <div className="px-4 py-3 bg-dark-600/50 rounded-xl mx-3 mb-2">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-bold text-brand-400">Nível {level}</span>
        <span className="text-xs text-slate-500">{progress}/100 XP</span>
      </div>
      <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/**
 * Tooltip que aparece quando sidebar está colapsada (hover)
 */
function NavTooltip({ label }) {
  return (
    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="bg-dark-600 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-xl whitespace-nowrap">
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-dark-600" />
      </div>
    </div>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-dark-800 border-r border-white/5 z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30">
            <span className="text-white font-black text-lg">X</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <span className="font-black text-lg gradient-text whitespace-nowrap">AprovadoX</span>
                <p className="text-[10px] text-slate-500 -mt-0.5 whitespace-nowrap">Sua aprovação começa aqui</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botão de toggle DESTACADO — fica entre logo e nav */}
        <div className="px-3 py-3 border-b border-white/5">
          <motion.button
            onClick={onToggle}
            whileTap={{ scale: 0.96 }}
            title={collapsed ? 'Mostrar menu' : 'Ocultar menu'}
            className={clsx(
              'w-full flex items-center gap-2.5 rounded-xl transition-all duration-200 font-medium',
              'border border-white/10 hover:border-brand-500/40',
              'bg-dark-700 hover:bg-brand-500/10',
              'text-slate-300 hover:text-brand-400',
              collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
            )}
          >
            <div className="flex items-center gap-2">
              <FiMenu size={16} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-xs whitespace-nowrap overflow-hidden"
                  >
                    Ocultar menu
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-slate-500"
              >
                <FiChevronLeft size={14} />
              </motion.div>
            )}
          </motion.button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-2 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => clsx(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm',
                isActive
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip aparece só quando colapsado */}
              {collapsed && <NavTooltip label={label} />}
            </NavLink>
          ))}
        </nav>

        {/* XP Bar */}
        {!collapsed && user && <XpBar xp={user.xp || 0} level={user.level || 1} />}

        {/* User section */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <NavLink to="/perfil"
            className={({ isActive }) => clsx(
              'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {(user?.avatar_url || user?.avatarUrl)
              ? <img src={user.avatar_url || user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
            }
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.plan === 'premium' ? '⭐ Premium' : 'Plano Free'}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {collapsed && <NavTooltip label="Meu Perfil" />}
          </NavLink>

          <div className={clsx('flex gap-1', collapsed && 'flex-col')}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              {theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />}
              {!collapsed && <span className="text-xs">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>}
            </button>
            <button
              onClick={handleLogout}
              title="Sair"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
            >
              <FiLogOut size={15} />
              {!collapsed && <span className="text-xs">Sair</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* BOTÃO FLUTUANTE para REABRIR quando está colapsado */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: 0.2 }}
            onClick={onToggle}
            title="Mostrar menu"
            className="hidden lg:flex fixed top-24 z-50 items-center gap-1.5 pl-1.5 pr-3 py-2.5 rounded-r-xl bg-brand-500 hover:bg-brand-600 text-white shadow-2xl shadow-brand-500/40 transition-all hover:pl-2"
            style={{ left: 76 }}
          >
            <FiChevronRight size={16} />
            <span className="text-xs font-bold whitespace-nowrap">Abrir menu</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
