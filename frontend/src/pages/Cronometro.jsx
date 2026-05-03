import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlay, FiPause, FiSquare, FiBook, FiZap, FiMusic, FiVolume2, FiVolumeX, FiClock } from 'react-icons/fi'
import { sessaoService } from '../services/sessao.service'
import { materiaService } from '../services/materia.service'
import { useStudyStore } from '../store/studyStore'
import { useAuthStore } from '../store/authStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'

const TECNICAS = [
  { value: 'Pomodoro',        label: '🍅 Pomodoro (25+5min)' },
  { value: 'Feynman',         label: '🧠 Técnica Feynman' },
  { value: 'Active Recall',   label: '⚡ Active Recall' },
  { value: 'Revisão Espaçada',label: '🔄 Revisão Espaçada' },
  { value: 'Questões',        label: '📝 Resolução de Questões' },
  { value: 'Leitura',         label: '📖 Leitura Ativa' },
]

const POMODORO_WORK  = 25 * 60
const POMODORO_BREAK = 5  * 60

function TimerCircle({ seconds, isRunning, max = 3600 }) {
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? 1 - (seconds % max) / max : 0
  const strokeDashoffset = circumference * progress

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Outer glow ring */}
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${isRunning ? 'shadow-[0_0_60px_rgba(99,102,241,0.3)]' : ''}`} />
      <svg viewBox="0 0 280 280" className="w-full h-full -rotate-90">
        {/* Background track */}
        <circle cx="140" cy="140" r={radius} fill="none" stroke="#1a1a27" strokeWidth="8" />
        {/* Progress */}
        <motion.circle
          cx="140" cy="140" r={radius} fill="none"
          stroke="url(#timerGrad)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {isRunning && (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-brand-400" />
        )}
        <span className="text-5xl font-black text-white tabular-nums tracking-tight">
          {formatTime(seconds)}
        </span>
        <span className="text-sm text-slate-400">{isRunning ? 'Estudando...' : 'Pronto para começar'}</span>
      </div>
    </div>
  )
}

function formatTime(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function Cronometro() {
  const [materias, setMaterias] = useState([])
  const [assuntos, setAssuntos] = useState([])
  const [selectedMateria, setSelectedMateria] = useState('')
  const [selectedAssunto, setSelectedAssunto] = useState('')
  const [tecnica, setTecnica] = useState('Pomodoro')
  const [notes, setNotes] = useState('')
  const [soundOn, setSoundOn] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [pomodoroPhase, setPomodoroPhase] = useState('work')
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const intervalRef = useRef(null)
  const { updateUser } = useAuthStore()

  useEffect(() => {
    materiaService.getAll().then(r => setMaterias(r.data)).catch(() => setMaterias(MOCK_MATERIAS))
  }, [])

  useEffect(() => {
    if (selectedMateria) {
      materiaService.getById(selectedMateria).then(r => setAssuntos(r.data.assuntos || [])).catch(() => setAssuntos([]))
    }
  }, [selectedMateria])

  // Pomodoro auto-cycle
  useEffect(() => {
    if (tecnica === 'Pomodoro' && isRunning) {
      const limit = pomodoroPhase === 'work' ? POMODORO_WORK : POMODORO_BREAK
      if (seconds >= limit) {
        if (soundOn) playBeep()
        if (pomodoroPhase === 'work') {
          toast.success('🍅 Pomodoro concluído! Hora de descansar 5 min.')
          setPomodoroPhase('break')
          setPomodoroCount(c => c + 1)
        } else {
          toast('⚡ Pausa encerrada! Vamos estudar!', { icon: '🎯' })
          setPomodoroPhase('work')
        }
        setSeconds(0)
      }
    }
  }, [seconds, tecnica, isRunning, pomodoroPhase, soundOn])

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8)
    } catch {}
  }

  const startTimer = () => {
    if (isRunning) return
    const st = isPaused ? new Date(Date.now() - seconds * 1000) : new Date()
    setStartTime(st)
    setIsRunning(true); setIsPaused(false)
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
  }

  const pauseTimer = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false); setIsPaused(true)
  }

  const stopTimer = async () => {
    clearInterval(intervalRef.current)
    if (seconds < 30) {
      toast.error('Sessão muito curta. Estude pelo menos 30 segundos.')
      setIsRunning(false); setIsPaused(false); setSeconds(0)
      return
    }
    if (soundOn) playBeep()
    const duracao = Math.floor(seconds / 60) || 1
    try {
      const { data } = await sessaoService.create({
        materia_id: selectedMateria || null,
        assunto_id: selectedAssunto || null,
        tecnica, duracao_minutos: duracao,
        data_inicio: startTime?.toISOString() || new Date().toISOString(),
        data_fim: new Date().toISOString(), notas: notes
      })
      toast.success(`✅ Sessão salva! +${data.xp_ganho || 0} XP`)
      if (data.xp_ganho) updateUser({ xp: undefined })
    } catch {
      toast.error('Erro ao salvar sessão')
    }
    setIsRunning(false); setIsPaused(false); setSeconds(0)
    setStartTime(null); setNotes('')
    setPomodoroPhase('work')
  }

  const pomodoroLimit = pomodoroPhase === 'work' ? POMODORO_WORK : POMODORO_BREAK

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-black text-white">Cronômetro ⏱️</h1>
        <p className="text-slate-400 text-sm mt-1">Registre seu tempo de estudo em tempo real</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Timer Card */}
        <Card className="lg:col-span-3 p-8 flex flex-col items-center gap-6">
          {/* Pomodoro phase indicator */}
          {tecnica === 'Pomodoro' && (
            <div className="flex gap-2">
              <Badge variant={pomodoroPhase === 'work' ? 'primary' : 'default'} dot>Estudo</Badge>
              <Badge variant={pomodoroPhase === 'break' ? 'success' : 'default'} dot>Pausa</Badge>
              {pomodoroCount > 0 && <Badge variant="orange">🍅 {pomodoroCount} pomodoros</Badge>}
            </div>
          )}

          <TimerCircle
            seconds={tecnica === 'Pomodoro' ? seconds : seconds}
            isRunning={isRunning}
            max={tecnica === 'Pomodoro' ? pomodoroLimit : Math.max(seconds, 3600)}
          />

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isRunning ? (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={startTimer}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/40 neon-glow"
              >
                <FiPlay size={28} className="text-white ml-1" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={pauseTimer}
                className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center"
              >
                <FiPause size={28} className="text-yellow-400" />
              </motion.button>
            )}
            {(isRunning || isPaused) && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
              >
                <FiSquare size={20} className="text-red-400" />
              </motion.button>
            )}
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anotações desta sessão (opcional)..."
            className="w-full input-field text-sm resize-none h-20"
          />
        </Card>

        {/* Settings */}
        <Card className="lg:col-span-2 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FiBook size={16} className="text-brand-400" /> Configurar Sessão
          </h3>

          <Select
            label="Matéria"
            options={materias.map(m => ({ value: m.id, label: m.nome }))}
            placeholder="Selecionar matéria"
            value={selectedMateria}
            onChange={e => { setSelectedMateria(e.target.value); setSelectedAssunto('') }}
          />

          <Select
            label="Assunto"
            options={assuntos.map(a => ({ value: a.id, label: a.nome }))}
            placeholder="Selecionar assunto"
            value={selectedAssunto}
            onChange={e => setSelectedAssunto(e.target.value)}
            disabled={!selectedMateria}
          />

          <Select
            label="Técnica de Estudo"
            options={TECNICAS}
            value={tecnica}
            onChange={e => setTecnica(e.target.value)}
          />

          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-600 border border-white/10 hover:border-white/20 transition-all"
          >
            {soundOn ? <FiVolume2 size={16} className="text-brand-400" /> : <FiVolumeX size={16} className="text-slate-500" />}
            <span className="text-sm text-slate-300">{soundOn ? 'Som ativado' : 'Som desativado'}</span>
          </button>

          {/* Pomodoro info */}
          {tecnica === 'Pomodoro' && (
            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-1">
              <p className="text-xs font-semibold text-brand-400">🍅 Modo Pomodoro</p>
              <p className="text-xs text-slate-400">25 min de foco → 5 min de pausa</p>
              <p className="text-xs text-slate-400">A cada 4 pomodoros, descanse 15 min</p>
            </div>
          )}

          {/* Stats de hoje */}
          <div className="mt-auto p-4 rounded-xl bg-dark-600/50 space-y-2">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FiClock size={12} /> Hoje
            </p>
            <p className="text-2xl font-black text-white">{formatTime(seconds)}</p>
            <p className="text-xs text-slate-500">sessão atual</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

const MOCK_MATERIAS = [
  { id: 1, nome: 'Direito Constitucional', cor: '#6366f1' },
  { id: 2, nome: 'Português', cor: '#10b981' },
  { id: 3, nome: 'Raciocínio Lógico', cor: '#f59e0b' },
  { id: 4, nome: 'Informática', cor: '#3b82f6' },
]
