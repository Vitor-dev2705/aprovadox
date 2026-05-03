import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiSearch, FiZap } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header({ sidebarCollapsed }) {
  const { user } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-xl border-b border-white/5 flex items-center gap-4 px-6 sticky top-0 z-30">
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div key="search" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-xs">
              <input
                autoFocus
                placeholder="Buscar matéria, sessão..."
                className="input-field text-sm py-2"
                onBlur={() => setSearchOpen(false)}
              />
            </motion.div>
          ) : (
            <motion.div key="greeting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <p className="text-sm text-slate-400">{getGreeting()}, <span className="text-white font-semibold">{user?.name?.split(' ')[0]}</span> 👋</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        {/* Streak badge */}
        {(user?.streak || 0) > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-full">
            <span className="text-orange-400">🔥</span>
            <span className="text-xs font-bold text-orange-300">{user.streak}</span>
          </div>
        )}

        {/* XP badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-brand-500/20 border border-brand-500/30 px-3 py-1.5 rounded-full">
          <FiZap size={12} className="text-brand-400" />
          <span className="text-xs font-bold text-brand-300">{user?.xp || 0} XP</span>
        </div>

        <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <FiSearch size={18} />
        </button>

        <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <FiBell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        <button onClick={() => navigate('/perfil')} className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-500/30 hover:border-brand-500 transition-all">
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
          }
        </button>
      </div>
    </header>
  )
}
