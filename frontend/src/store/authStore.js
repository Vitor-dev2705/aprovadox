import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({ user: data.user, token: data.token, isAuthenticated: true })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          toast.success(`Bem-vindo de volta, ${data.user.name.split(' ')[0]}! 🎯`)
          return true
        } catch (err) {
          toast.error(err.response?.data?.error || 'Erro ao fazer login')
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          set({ user: data.user, token: data.token, isAuthenticated: true })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          toast.success('Conta criada! Sua jornada começa agora 🚀')
          return true
        } catch (err) {
          toast.error(err.response?.data?.error || 'Erro ao criar conta')
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        delete api.defaults.headers.common['Authorization']
        toast.success('Até logo! Continue estudando 📚')
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      refreshProfile: async () => {
        try {
          const { data } = await api.get('/auth/profile')
          set({ user: data })
        } catch {}
      },

      initializeAuth: () => {
        const { token } = get()
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      },
    }),
    {
      name: 'aprovadox-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
