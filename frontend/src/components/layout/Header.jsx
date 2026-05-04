import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBell, FiSearch, FiZap, FiCheck } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import { notificacaoService } from '../../services/notificacao.service'

export default function Header({ sidebarCollapsed }) {
  const { user } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotif, setLoadingNotif] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    setLoadingNotif(true)
    try {
      const { data } = await notificacaoService.getAll()
      setNotifications(data.notifications || [])
    } catch {
      setNotifications([])
    } finally {
      setLoadingNotif(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // refresh a cada 1 min
    return () => clearInterval(interval)
  }, [])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setBellOpen(false)
      }
    }
    if (bellOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const handleNotifClick = (notif) => {
    setBellOpen(false)
    if (notif.url) navigate(notif.url)
  }

  const avatar = user?.avatar_url || user?.avatarUrl
  const unreadCount = notifications.length
  const hasHigh = notifications.some(n => n.priority === 'high')

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

        {/* Notification bell with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <FiBell size={18} className={bellOpen ? 'text-brand-400' : ''} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ${
                  hasHigh ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-500 text-white'
                }`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-700 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">Notificações</p>
                    <p className="text-xs text-slate-500">{unreadCount} {unreadCount === 1 ? 'item' : 'itens'} para você</p>
                  </div>
                  <button
                    onClick={fetchNotifications}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    Atualizar
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loadingNotif ? (
                    <div className="p-8 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                      <p className="text-xs text-slate-500 mt-2">Carregando...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto mb-3">
                        <FiCheck size={20} className="text-accent-400" />
                      </div>
                      <p className="text-sm font-semibold text-white">Tudo em dia! 🎉</p>
                      <p className="text-xs text-slate-500 mt-1">Sem notificações pendentes</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className="w-full text-left p-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 flex gap-3 items-start">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                          style={{
                            backgroundColor: (n.color || '#6366f1') + '25',
                            border: `1px solid ${(n.color || '#6366f1')}40`,
                          }}>
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                            {n.priority === 'high' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-white/5 bg-dark-800/50">
                    <button
                      onClick={() => { setBellOpen(false); navigate('/dashboard') }}
                      className="w-full text-center text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors py-1">
                      Ver dashboard completo →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => navigate('/perfil')} className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-500/30 hover:border-brand-500 transition-all">
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
          }
        </button>
      </div>
    </header>
  )
}
