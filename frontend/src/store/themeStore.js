import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  root.dataset.theme = theme
  // Atualiza meta theme-color para mobile
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0f' : '#f8fafc')
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: newTheme })
        applyTheme(newTheme)
        // Persiste no backend silenciosamente
        api.put('/auth/profile', { theme: newTheme }).catch(() => {})
      },

      setTheme: (theme) => {
        if (theme !== 'dark' && theme !== 'light') return
        set({ theme })
        applyTheme(theme)
      },

      initTheme: () => {
        const { theme } = get()
        applyTheme(theme)
      },
    }),
    {
      name: 'aprovadox-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme)
      },
    }
  )
)
