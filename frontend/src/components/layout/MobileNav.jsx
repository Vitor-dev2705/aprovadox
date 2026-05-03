import { NavLink } from 'react-router-dom'
import { FiHome, FiClock, FiBarChart2, FiMenu, FiAward } from 'react-icons/fi'
import clsx from 'clsx'

export default function MobileNav({ onMenuOpen }) {
  const links = [
    { to: '/dashboard',    icon: FiHome,    label: 'Início' },
    { to: '/cronometro',   icon: FiClock,   label: 'Timer' },
    { to: '/estatisticas', icon: FiBarChart2, label: 'Stats' },
    { to: '/gamificacao',  icon: FiAward,   label: 'Rank' },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-white/5 flex items-center justify-around px-2 pb-safe z-50 h-16">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => clsx(
            'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all text-xs',
            isActive ? 'text-brand-400' : 'text-slate-500'
          )}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
      <button onClick={onMenuOpen} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-slate-500 text-xs">
        <FiMenu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  )
}
