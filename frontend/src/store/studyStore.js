import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store GLOBAL do cronômetro de estudos.
 * - Funciona em segundo plano: navegar para outras páginas NÃO pausa
 * - Persistência em localStorage: refresh / fechar aba mantém o tempo
 * - Cálculo baseado em Date — preciso mesmo se a aba fica em background
 */
export const useStudyStore = create(
  persist(
    (set, get) => ({
      // ============ Estado ============
      isRunning: false,
      isPaused: false,
      seconds: 0,
      startTime: null,            // ISO string

      selectedMateria: null,
      materiaName: null,
      materiaCor: null,

      selectedAssunto: null,
      selectedTecnica: 'Pomodoro',
      notes: '',

      pomodoroPhase: 'work',
      pomodoroCount: 0,

      _intervalId: null,          // NÃO persistido

      // ============ Setters ============
      setMateria: (id, name, cor) => set({ selectedMateria: id, materiaName: name, materiaCor: cor }),
      setAssunto: (id) => set({ selectedAssunto: id }),
      setTecnica: (tecnica) => set({ selectedTecnica: tecnica }),
      setNotes: (notes) => set({ notes }),

      // ============ Internos ============
      _tick: () => {
        const st = get().startTime
        if (!st) return
        const elapsed = Math.floor((Date.now() - new Date(st).getTime()) / 1000)
        set({ seconds: Math.max(0, elapsed) })
      },

      _ensureInterval: () => {
        const { _intervalId } = get()
        if (_intervalId) return
        const id = setInterval(() => get()._tick(), 1000)
        set({ _intervalId: id })
      },

      _clearInterval: () => {
        const { _intervalId } = get()
        if (_intervalId) clearInterval(_intervalId)
        set({ _intervalId: null })
      },

      // ============ Controles ============
      start: () => {
        const { isRunning, isPaused, seconds } = get()
        if (isRunning) return
        const startTime = isPaused
          ? new Date(Date.now() - seconds * 1000)
          : new Date()
        set({
          isRunning: true,
          isPaused: false,
          startTime: startTime.toISOString(),
        })
        get()._ensureInterval()
      },

      pause: () => {
        get()._tick()
        get()._clearInterval()
        set({ isRunning: false, isPaused: true })
      },

      reset: () => {
        get()._clearInterval()
        set({
          isRunning: false, isPaused: false, seconds: 0, startTime: null,
          notes: '', pomodoroPhase: 'work', pomodoroCount: 0,
        })
      },

      // Pomodoro
      setPomodoroPhase: (phase) => {
        const { pomodoroCount } = get()
        const newCount = phase === 'break' ? pomodoroCount + 1 : pomodoroCount
        set({
          pomodoroPhase: phase,
          pomodoroCount: newCount,
          seconds: 0,
          startTime: new Date().toISOString(),
        })
      },

      // ============ Hidratação após reload ============
      _hydrate: () => {
        const { isRunning, startTime } = get()
        if (isRunning && startTime) {
          const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
          set({ seconds: Math.max(0, elapsed) })
          get()._ensureInterval()
        }
      },

      getFormattedTime: () => {
        const { seconds } = get()
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      },
    }),
    {
      name: 'aprovadox-study',
      partialize: (state) => ({
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        seconds: state.seconds,
        startTime: state.startTime,
        selectedMateria: state.selectedMateria,
        materiaName: state.materiaName,
        materiaCor: state.materiaCor,
        selectedAssunto: state.selectedAssunto,
        selectedTecnica: state.selectedTecnica,
        notes: state.notes,
        pomodoroPhase: state.pomodoroPhase,
        pomodoroCount: state.pomodoroCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) setTimeout(() => state._hydrate?.(), 0)
      },
    }
  )
)
