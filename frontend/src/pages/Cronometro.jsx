import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FiPlay, FiPause, FiSquare, FiBook, FiClock, FiVolume2, FiVolumeX,
  FiAlertTriangle, FiVideo, FiFileText, FiGlobe, FiLayers, FiEdit, FiBookOpen
} from 'react-icons/fi'
import { sessaoService } from '../services/sessao.service'
import { materiaService } from '../services/materia.service'
import { conteudoService } from '../services/conteudo.service'
import { useStudyStore } from '../store/studyStore'
import { useAuthStore } from '../store/authStore'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import toast from 'react-hot-toast'

const TECNICAS = [
  { value: 'Pomodoro',         label: '🍅 Pomodoro (25+5min)' },
  { value: 'Feynman',          label: '🧠 Técnica Feynman' },
  { value: 'Active Recall',    label: '⚡ Active Recall' },
  { value: 'Revisão Espaçada', label: '🔄 Revisão Espaçada' },
  { value: 'Questões',         label: '📝 Resolução de Questões' },
  { value: 'Leitura',          label: '📖 Leitura Ativa' },
]

const TIPO_ICON = {
  video: FiVideo,
  pdf: FiFileText,
  site: FiGlobe,
  livro: FiBookOpen,
  curso: FiLayers,
  flashcard: FiLayers,
  anotacao: FiEdit,
}

const TIPO_COR = {
  video: '#ef4444', pdf: '#dc2626', site: '#3b82f6', livro: '#10b981',
  curso: '#8b5cf6', flashcard: '#f59e0b', anotacao: '#64748b',
}

const POMODORO_WORK = 25 * 60
const POMODORO_BREAK = 5 * 60

function formatTime(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function TimerCircle({ seconds, isRunning, max }) {
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const safeMax = Math.max(max, 1)
  const progress = 1 - (seconds % safeMax) / safeMax
  const strokeDashoffset = circumference * progress

  return (
    <div className="relative w-72 h-72 mx-auto">
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${isRunning ? 'shadow-[0_0_60px_rgba(99,102,241,0.3)]' : ''}`} />
      <svg viewBox="0 0 280 280" className="w-full h-full -rotate-90">
        <circle cx="140" cy="140" r={radius} fill="none" stroke="#1a1a27" strokeWidth="8" />
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

export default function Cronometro() {
  // Store global
  const isRunning       = useStudyStore(s => s.isRunning)
  const isPaused        = useStudyStore(s => s.isPaused)
  const seconds         = useStudyStore(s => s.seconds)
  const startTime       = useStudyStore(s => s.startTime)
  const selectedMateria = useStudyStore(s => s.selectedMateria)
  const materiaName     = useStudyStore(s => s.materiaName)
  const materiaCor      = useStudyStore(s => s.materiaCor)
  const selectedConteudo = useStudyStore(s => s.selectedConteudo)
  const conteudoTitulo  = useStudyStore(s => s.conteudoTitulo)
  const conteudoTipo    = useStudyStore(s => s.conteudoTipo)
  const selectedAssunto = useStudyStore(s => s.selectedAssunto)
  const selectedTecnica = useStudyStore(s => s.selectedTecnica)
  const notes           = useStudyStore(s => s.notes)
  const pomodoroPhase   = useStudyStore(s => s.pomodoroPhase)
  const pomodoroCount   = useStudyStore(s => s.pomodoroCount)
  const setMateria      = useStudyStore(s => s.setMateria)
  const setConteudo     = useStudyStore(s => s.setConteudo)
  const setAssunto      = useStudyStore(s => s.setAssunto)
  const setTecnica      = useStudyStore(s => s.setTecnica)
  const setNotes        = useStudyStore(s => s.setNotes)
  const start           = useStudyStore(s => s.start)
  const pause           = useStudyStore(s => s.pause)
  const reset           = useStudyStore(s => s.reset)
  const setPomodoroPhase = useStudyStore(s => s.setPomodoroPhase)

  // UI local
  const [materias, setMaterias] = useState([])
  const [conteudos, setConteudos] = useState([])
  const [assuntosAll, setAssuntosAll] = useState([])
  const [soundOn, setSoundOn] = useState(true)
  const lastBeepRef = useRef(0)
  const { updateUser } = useAuthStore()

  useEffect(() => {
    materiaService.getAll().then(r => setMaterias(r.data)).catch(() => setMaterias([]))
  }, [])

  // Quando matéria muda, carrega conteúdos + todos os assuntos da matéria
  useEffect(() => {
    if (selectedMateria) {
      Promise.all([
        conteudoService.getByMateria(selectedMateria),
        materiaService.getById(selectedMateria),
      ])
        .then(([rConteudos, rMateria]) => {
          setConteudos(rConteudos.data || [])
          setAssuntosAll(rMateria.data?.assuntos || [])
        })
        .catch(() => { setConteudos([]); setAssuntosAll([]) })
    } else {
      setConteudos([])
      setAssuntosAll([])
    }
  }, [selectedMateria])

  // Assuntos da matéria — sempre mostra todos (independente do conteúdo)
  const assuntosFiltrados = assuntosAll

  // Auto-cycle do Pomodoro
  useEffect(() => {
    if (selectedTecnica === 'Pomodoro' && isRunning) {
      const limit = pomodoroPhase === 'work' ? POMODORO_WORK : POMODORO_BREAK
      if (seconds >= limit && Date.now() - lastBeepRef.current > 5000) {
        lastBeepRef.current = Date.now()
        if (soundOn) playBeep()
        if (pomodoroPhase === 'work') {
          toast.success('🍅 Pomodoro concluído! Hora de descansar 5 min.')
          setPomodoroPhase('break')
        } else {
          toast('⚡ Pausa encerrada! Vamos estudar!', { icon: '🎯' })
          setPomodoroPhase('work')
        }
      }
    }
  }, [seconds, selectedTecnica, isRunning, pomodoroPhase, soundOn, setPomodoroPhase])

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

  const canStart = !!selectedMateria

  const handleStart = () => {
    if (!canStart) {
      toast.error('Selecione uma matéria antes de iniciar! 📚', { duration: 3000 })
      return
    }
    start()
  }

  const handleStop = async () => {
    if (seconds < 30) {
      toast.error('Sessão muito curta. Estude pelo menos 30 segundos.')
      reset()
      return
    }
    if (soundOn) playBeep()

    const duracao = Math.floor(seconds / 60) || 1
    const startISO = startTime || new Date(Date.now() - seconds * 1000).toISOString()

    try {
      const { data } = await sessaoService.create({
        materia_id: selectedMateria,
        conteudo_id: selectedConteudo || null,
        assunto_id: selectedAssunto || null,
        tecnica: selectedTecnica,
        duracao_minutos: duracao,
        data_inicio: startISO,
        data_fim: new Date().toISOString(),
        notas: notes
      })
      toast.success(`✅ Sessão salva! +${data.xp_ganho || 0} XP`)
      if (data.xp_ganho) updateUser({ xp: undefined })
    } catch {
      toast.error('Erro ao salvar sessão')
    }
    reset()
  }

  const pomodoroLimit = pomodoroPhase === 'work' ? POMODORO_WORK : POMODORO_BREAK
  const ConteudoIcon = conteudoTipo ? TIPO_ICON[conteudoTipo] : null
  const conteudoCorAtiva = conteudoTipo ? TIPO_COR[conteudoTipo] : null

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="⏱️"
        title="Cronômetro"
        subtitle="Registre seu tempo de estudo em tempo real"
        badge="Modo foco"
        actions={
          isRunning ? <Badge variant="success" dot>Rodando em segundo plano</Badge> : null
        }
      />

      {!selectedMateria && !isRunning && !isPaused && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle size={18} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-300">Selecione uma matéria</p>
            <p className="text-xs text-yellow-200/80">A escolha da matéria é obrigatória para iniciar o cronômetro.</p>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Timer */}
        <Card accent={materiaCor || '#6366f1'} className="lg:col-span-3 p-8 flex flex-col items-center gap-6">
          {/* Chip da matéria + conteúdo */}
          {materiaName && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: (materiaCor || '#6366f1') + '20', border: `1px solid ${(materiaCor || '#6366f1')}40` }}>
                <FiBook size={11} style={{ color: materiaCor || '#818cf8' }} />
                <span className="text-xs font-semibold" style={{ color: materiaCor || '#818cf8' }}>{materiaName}</span>
              </div>
              {conteudoTitulo && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-600 border border-white/10">
                  {ConteudoIcon && <ConteudoIcon size={10} style={{ color: conteudoCorAtiva }} />}
                  <span className="text-xs text-slate-300">{conteudoTitulo}</span>
                </div>
              )}
            </div>
          )}

          {selectedTecnica === 'Pomodoro' && (
            <div className="flex gap-2">
              <Badge variant={pomodoroPhase === 'work' ? 'primary' : 'default'} dot>Estudo</Badge>
              <Badge variant={pomodoroPhase === 'break' ? 'success' : 'default'} dot>Pausa</Badge>
              {pomodoroCount > 0 && <Badge variant="orange">🍅 {pomodoroCount} pomodoros</Badge>}
            </div>
          )}

          <TimerCircle
            seconds={seconds}
            isRunning={isRunning}
            max={selectedTecnica === 'Pomodoro' ? pomodoroLimit : Math.max(seconds, 3600)}
          />

          {/* Controles */}
          <div className="flex items-center gap-4">
            {!isRunning ? (
              <motion.button
                whileHover={{ scale: canStart ? 1.05 : 1 }}
                whileTap={{ scale: canStart ? 0.95 : 1 }}
                onClick={handleStart}
                disabled={!canStart}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  canStart
                    ? 'bg-gradient-to-br from-brand-500 to-accent-500 shadow-brand-500/40 neon-glow cursor-pointer'
                    : 'bg-dark-600 border-2 border-white/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <FiPlay size={28} className="text-white ml-1" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={pause}
                className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center"
              >
                <FiPause size={28} className="text-yellow-400" />
              </motion.button>
            )}
            {(isRunning || isPaused) && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
              >
                <FiSquare size={20} className="text-red-400" />
              </motion.button>
            )}
          </div>

          {isRunning && (
            <p className="text-xs text-accent-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              Cronômetro continua mesmo se você sair desta tela
            </p>
          )}

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anotações desta sessão (opcional)..."
            className="w-full input-field text-sm resize-none h-20"
          />
        </Card>

        {/* Configuração */}
        <Card className="lg:col-span-2 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FiBook size={16} className="text-brand-400" /> Configurar Sessão
          </h3>

          {/* Matéria */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
              Matéria
              <span className="text-red-400 text-xs">*obrigatório</span>
            </label>
            <select
              className={`input-field text-sm ${!selectedMateria ? 'border-yellow-500/40 ring-1 ring-yellow-500/20' : ''}`}
              value={selectedMateria || ''}
              disabled={isRunning || isPaused}
              onChange={e => {
                const id = e.target.value
                const mat = materias.find(m => String(m.id) === String(id))
                setMateria(id ? Number(id) : null, mat?.nome || null, mat?.cor || null)
              }}
            >
              <option value="">— Selecione uma matéria —</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
            {!materias.length && (
              <p className="text-xs text-yellow-400 mt-1">⚠️ Cadastre uma matéria primeiro em "Matérias"</p>
            )}
          </div>

          {/* CONTEÚDO da matéria — NOVO */}
          {selectedMateria && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                Conteúdo
                <span className="text-slate-500 text-xs">(opcional)</span>
              </label>

              {conteudos.length === 0 ? (
                <div className="p-3 rounded-xl bg-dark-600/50 border border-white/5">
                  <p className="text-xs text-slate-500">
                    Nenhum conteúdo cadastrado. Adicione vídeos, PDFs ou livros em "Matérias".
                  </p>
                </div>
              ) : (
                <select
                  className="input-field text-sm"
                  value={selectedConteudo || ''}
                  disabled={isRunning || isPaused}
                  onChange={e => {
                    const id = e.target.value
                    const c = conteudos.find(x => String(x.id) === String(id))
                    setConteudo(id ? Number(id) : null, c?.titulo || null, c?.tipo || null)
                  }}
                >
                  <option value="">— Sem conteúdo específico —</option>
                  {conteudos.map(c => {
                    const labelTipo = (c.tipo || 'anotacao').toUpperCase()
                    return (
                      <option key={c.id} value={c.id}>
                        [{labelTipo}] {c.titulo}
                      </option>
                    )
                  })}
                </select>
              )}

              {/* Chips visuais dos conteúdos */}
              {conteudos.length > 0 && !isRunning && !isPaused && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {conteudos.slice(0, 6).map(c => {
                    const Icon = TIPO_ICON[c.tipo] || FiEdit
                    const cor = TIPO_COR[c.tipo] || '#64748b'
                    const active = String(selectedConteudo) === String(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setConteudo(active ? null : Number(c.id), active ? null : c.titulo, active ? null : c.tipo)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                          active ? 'border' : 'border border-white/5 hover:border-white/10'
                        }`}
                        style={active
                          ? { backgroundColor: cor + '20', borderColor: cor + '50', color: cor }
                          : { color: '#94a3b8' }
                        }
                      >
                        <Icon size={10} />
                        <span className="truncate max-w-[110px]">{c.titulo}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Assunto - sempre mostra todos da matéria */}
          <Select
            label="Assunto"
            options={assuntosFiltrados.map(a => ({ value: a.id, label: a.nome }))}
            placeholder="Selecionar assunto"
            value={selectedAssunto || ''}
            onChange={e => setAssunto(e.target.value ? Number(e.target.value) : null)}
            disabled={!selectedMateria || isRunning || isPaused}
          />

          <Select
            label="Técnica de Estudo"
            options={TECNICAS}
            value={selectedTecnica}
            onChange={e => setTecnica(e.target.value)}
            disabled={isRunning || isPaused}
          />

          <button
            onClick={() => setSoundOn(!soundOn)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-600 border border-white/10 hover:border-white/20 transition-all"
          >
            {soundOn ? <FiVolume2 size={16} className="text-brand-400" /> : <FiVolumeX size={16} className="text-slate-500" />}
            <span className="text-sm text-slate-300">{soundOn ? 'Som ativado' : 'Som desativado'}</span>
          </button>

          {selectedTecnica === 'Pomodoro' && (
            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-1">
              <p className="text-xs font-semibold text-brand-400">🍅 Modo Pomodoro</p>
              <p className="text-xs text-slate-400">25 min de foco → 5 min de pausa</p>
              <p className="text-xs text-slate-400">A cada 4 pomodoros, descanse 15 min</p>
            </div>
          )}

          <div className="mt-auto p-4 rounded-xl bg-dark-600/50 space-y-2">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FiClock size={12} /> Tempo da sessão atual
            </p>
            <p className="text-2xl font-black text-white tabular-nums">{formatTime(seconds)}</p>
            <p className="text-xs text-slate-500">
              {isRunning ? '🟢 Rodando' : isPaused ? '⏸️ Pausado' : '⚪ Aguardando'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
