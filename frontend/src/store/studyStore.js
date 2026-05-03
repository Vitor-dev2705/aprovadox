import { create } from 'zustand'

export const useStudyStore = create((set, get) => ({
  // Timer state
  isRunning: false,
  isPaused: false,
  seconds: 0,
  startTime: null,
  selectedMateria: null,
  selectedAssunto: null,
  selectedTecnica: 'Pomodoro',
  pomodoroMode: false,
  pomodoroPhase: 'work', // 'work' | 'break'
  pomodoroCount: 0,
  notes: '',
  intervalId: null,

  // Session history
  recentSessions: [],

  setMateria: (materia) => set({ selectedMateria: materia }),
  setAssunto: (assunto) => set({ selectedAssunto: assunto }),
  setTecnica: (tecnica) => set({ selectedTecnica: tecnica }),
  setPomodoroMode: (val) => set({ pomodoroMode: val }),
  setNotes: (notes) => set({ notes }),

  startTimer: () => {
    const { isRunning, isPaused, seconds } = get()
    if (isRunning) return

    const startTime = isPaused ? new Date(Date.now() - seconds * 1000) : new Date()
    const id = setInterval(() => {
      set((s) => ({ seconds: Math.floor((Date.now() - s.startTime.getTime()) / 1000) }))
    }, 1000)

    set({ isRunning: true, isPaused: false, startTime, intervalId: id })
  },

  pauseTimer: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ isRunning: false, isPaused: true, intervalId: null })
  },

  resetTimer: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({
      isRunning: false, isPaused: false, seconds: 0,
      startTime: null, intervalId: null, notes: '',
      pomodoroPhase: 'work', pomodoroCount: 0
    })
  },

  getFormattedTime: () => {
    const { seconds } = get()
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  },
}))
