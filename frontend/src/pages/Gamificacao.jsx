import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiAward, FiZap, FiTarget, FiStar, FiCheckCircle, FiLock } from 'react-icons/fi'
import { gamificacaoService } from '../services/gamificacao.service'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'
import Loader from '../components/ui/Loader'

const MEDALS_DEF = [
  { tipo:'primeiro_estudo', nome:'Primeiro Passo', emoji:'🎯', desc:'Completou a primeira sessão de estudo' },
  { tipo:'streak_7',        nome:'7 Dias',          emoji:'🔥', desc:'7 dias seguidos estudando' },
  { tipo:'streak_30',       nome:'Mês Completo',    emoji:'💎', desc:'30 dias seguidos sem parar' },
  { tipo:'horas_10',        nome:'Dedicado',         emoji:'📚', desc:'10 horas de estudo total' },
  { tipo:'horas_50',        nome:'Estudioso',        emoji:'🏆', desc:'50 horas de estudo total' },
  { tipo:'horas_100',       nome:'Maratonista',      emoji:'⭐', desc:'100 horas de estudo total' },
  { tipo:'horas_500',       nome:'Lenda',            emoji:'👑', desc:'500 horas de estudo total' },
  { tipo:'sessoes_50',      nome:'Consistente',      emoji:'💪', desc:'50 sessões de estudo concluídas' },
  { tipo:'pomodoro_10',     nome:'Especialista',     emoji:'🍅', desc:'10 pomodoros concluídos' },
  { tipo:'revisao_10',      nome:'Revisor',          emoji:'🔄', desc:'10 revisões concluídas' },
  { tipo:'questoes_50',     nome:'Caçador',          emoji:'❌', desc:'50 questões registradas' },
]

const LEVEL_NAMES = ['', 'Iniciante', 'Estudante', 'Dedicado', 'Avançado', 'Expert', 'Mestre', 'Elite', 'Lenda', 'Imortal', 'AprovadoX']

export default function Gamificacao() {
  const [data, setData] = useState(null)
  const [missoes, setMissoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('visao')

  useEffect(() => {
    Promise.all([
      gamificacaoService.getStatus(),
      gamificacaoService.getMissoes()
    ]).then(([status, miss]) => {
      setData(status.data)
      setMissoes(miss.data)
    }).catch(() => {
      setData(MOCK_DATA)
      setMissoes(MOCK_MISSOES)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  const d = data || MOCK_DATA
  const conquistas = d.medalhas?.map(m => m.tipo) || []
  const xpPct = d.xp_nivel_atual || (d.xp % 100)
  const levelName = LEVEL_NAMES[Math.min(d.level, LEVEL_NAMES.length - 1)]

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-black text-white">Gamificação 🏆</h1>
        <p className="text-slate-400 text-sm mt-1">Conquistas, missões e seu progresso</p>
      </div>

      {/* Level hero */}
      <Card className="p-6 bg-gradient-to-br from-brand-500/15 via-dark-700 to-accent-500/10 border-brand-500/20">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-brand-500/40">
              <span className="text-4xl font-black text-white">{d.level}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-dark-700 border-2 border-brand-500 flex items-center justify-center">
              <FiStar size={14} className="text-yellow-400" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <Badge variant="primary" className="mb-2">⚡ {levelName}</Badge>
            <h2 className="text-3xl font-black text-white">Nível {d.level}</h2>
            <p className="text-slate-400 text-sm mt-1">{d.xp} XP total · Sequência de {d.streak} dias 🔥</p>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progresso para nível {d.level + 1}</span>
                <span>{xpPct}/100 XP</span>
              </div>
              <ProgressBar value={xpPct} max={100} color="rainbow" size="lg" />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{id:'visao',label:'Visão Geral'},{id:'medalhas',label:'Medalhas'},{id:'missoes',label:'Missões'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400 hover:text-white border border-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'visao' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-black gradient-text">{d.xp}</p>
              <p className="text-xs text-slate-400">XP Total</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-black text-orange-400">{d.streak}🔥</p>
              <p className="text-xs text-slate-400">Dias seguidos</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-black text-yellow-400">{d.medalhas?.length || 0}</p>
              <p className="text-xs text-slate-400">Medalhas</p>
            </Card>
          </div>

          {/* Recent XP */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2"><FiZap size={16} className="text-brand-400" />XP Recente</h3>
            <div className="space-y-2">
              {(d.historico || MOCK_DATA.historico).slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <p className="text-sm text-slate-300">{log.descricao}</p>
                  <Badge variant="primary">+{log.xp_ganho} XP</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'medalhas' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MEDALS_DEF.map((medal, i) => {
            const unlocked = conquistas.includes(medal.tipo)
            return (
              <motion.div key={medal.tipo} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.03 }}>
                <Card className={`p-4 text-center transition-all ${unlocked ? 'border-yellow-500/30 bg-yellow-500/5' : 'opacity-50 grayscale'}`}>
                  <div className="text-3xl mb-2">{medal.emoji}</div>
                  <p className="text-xs font-bold text-white mb-1">{medal.nome}</p>
                  <p className="text-xs text-slate-500">{medal.desc}</p>
                  {!unlocked && <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-600"><FiLock size={10} /> Bloqueada</div>}
                  {unlocked && <Badge variant="warning" className="mt-2 text-xs">Conquistada ✨</Badge>}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {activeTab === 'missoes' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400 font-medium">Missões de hoje</p>
          {missoes.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.1 }}>
              <Card className={`p-5 ${m.concluida ? 'border-accent-500/30 bg-accent-500/5' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {m.concluida
                      ? <div className="w-9 h-9 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center"><FiCheckCircle size={18} className="text-accent-400" /></div>
                      : <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center"><FiTarget size={18} className="text-brand-400" /></div>
                    }
                    <div>
                      <p className={`font-semibold text-sm ${m.concluida ? 'text-accent-400 line-through' : 'text-white'}`}>{m.nome}</p>
                      <Badge variant="primary" className="mt-0.5">+{m.xp} XP</Badge>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">{m.progresso}/{m.alvo}</span>
                </div>
                <ProgressBar value={m.progresso} max={m.alvo} color={m.concluida ? 'success' : 'brand'} />
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const MOCK_DATA = {
  xp:250, level:3, streak:7, xp_nivel_atual:50,
  medalhas:[{tipo:'primeiro_estudo'},{tipo:'streak_7'}],
  historico:[
    {descricao:'Estudou 45 min de Pomodoro', xp_ganho:15},
    {descricao:'Revisão concluída', xp_ganho:5},
    {descricao:'Estudou 60 min de Feynman', xp_ganho:20},
    {descricao:'Bem-vindo ao AprovadoX!', xp_ganho:50},
  ]
}
const MOCK_MISSOES = [
  { id:1, nome:'Estudar 60 minutos', progresso:45, alvo:60, xp:20, concluida:false },
  { id:2, nome:'Completar 3 revisões', progresso:3, alvo:3, xp:15, concluida:true },
  { id:3, nome:'Registrar 5 questões', progresso:2, alvo:5, xp:15, concluida:false },
]
