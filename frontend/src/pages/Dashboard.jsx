import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  FiClock, FiTarget, FiZap, FiCalendar, FiBookOpen,
  FiArrowRight, FiTrendingUp, FiAward, FiAlertCircle, FiPlay
} from 'react-icons/fi'
import { dashboardService } from '../services/dashboard.service'
import { useAuthStore } from '../store/authStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import PageHeader from '../components/ui/PageHeader'
import Loader from '../components/ui/Loader'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function StatCard({ icon: Icon, label, value, sub, color = 'brand', onClick, delay = 0 }) {
  const palette = {
    brand:   { bg: 'from-brand-500/15 to-brand-500/5',     border: 'border-brand-500/20',   text: 'text-brand-400',   accent: '#6366f1' },
    success: { bg: 'from-accent-500/15 to-accent-500/5',   border: 'border-accent-500/20',  text: 'text-accent-400',  accent: '#10b981' },
    orange:  { bg: 'from-orange-500/15 to-orange-500/5',   border: 'border-orange-500/20',  text: 'text-orange-400',  accent: '#f59e0b' },
    purple:  { bg: 'from-purple-500/15 to-purple-500/5',   border: 'border-purple-500/20',  text: 'text-purple-400',  accent: '#a855f7' },
  }
  const c = palette[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20`}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center ${c.text}`}>
          <Icon size={20} />
        </div>
        {sub && <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{sub}</span>}
      </div>
      <p className="text-3xl font-black text-white mb-0.5 tracking-tight">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const totalMin = Math.round((payload[0]?.value || 0) * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const texto = h > 0 ? (m > 0 ? `${h}h${m}min` : `${h}h`) : `${m}min`
  return (
    <div className="bg-dark-600 border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1 text-xs">{DIAS[label] || label}</p>
      <p className="text-white font-bold">{texto} estudados</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    dashboardService.get()
      .then(r => setData(r.data))
      .catch(() => setData(getMockData()))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader text="Carregando seu dashboard..." />

  const d = data || getMockData()

  const formatarTempo = (minutos) => {
    if (!minutos || minutos <= 0) return '0min'
    const h = Math.floor(minutos / 60)
    const m = Math.round(minutos % 60)
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${m}min`
  }

  const hojeF = formatarTempo(d.hoje_minutos)
  const semanaF = formatarTempo(d.semana_minutos)
  const mesF = formatarTempo(d.mes_minutos)

  const todayDow = new Date().getDay()
  const chartData = DIAS.map((dia, i) => {
    const found = d.grafico_semana?.find(g => parseInt(g.dia) === i)
    return { dia, horas: found ? (parseInt(found.min) / 60) : 0, isToday: i === todayDow }
  })

  const metaMinutos = d.meta_diaria?.valor_alvo ? d.meta_diaria.valor_alvo * 60 : 120
  const metaPct = metaMinutos > 0
    ? Math.min(100, (d.hoje_minutos / metaMinutos) * 100)
    : 0

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="🎯"
        title="Dashboard"
        subtitle={`"${d.frase_motivacional}"`}
        badge="Visão geral"
        actions={
          <Button onClick={() => navigate('/cronometro')} icon={<FiPlay size={14} />}>
            Iniciar Estudo
          </Button>
        }
      />

      {/* Stats grid premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0.0} icon={FiClock}      label="Hoje"      value={hojeF}   sub="tempo"  color="brand"   onClick={() => navigate('/estatisticas')} />
        <StatCard delay={0.1} icon={FiTrendingUp} label="Semana"    value={semanaF}  sub="tempo"  color="success" onClick={() => navigate('/estatisticas')} />
        <StatCard delay={0.2} icon={FiAward}      label="Mês"       value={mesF}     sub="tempo"  color="purple"  onClick={() => navigate('/estatisticas')} />
        <StatCard delay={0.3} icon={FiZap}        label="Sequência" value={`${d.streak}🔥`} sub="dias" color="orange"  onClick={() => navigate('/gamificacao')} />
      </div>

      {/* Meta diária */}
      <Card accent="#6366f1" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              <FiTarget size={18} className="text-brand-400" />
            </div>
            <div>
              <p className="font-bold text-white">Meta Diária</p>
              <p className="text-xs text-slate-500">
                {formatarTempo(d.hoje_minutos)} hoje {d.meta_diaria ? `de ${formatarTempo(d.meta_diaria.valor_alvo * 60)}` : ''}
              </p>
            </div>
          </div>
          <Badge variant={metaPct >= 100 ? 'success' : 'primary'}>
            {Math.round(metaPct)}% concluída
          </Badge>
        </div>
        <ProgressBar value={metaPct} color={metaPct >= 100 ? 'success' : 'rainbow'} size="lg" />
      </Card>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card accent="#10b981" className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white">Esta semana</h3>
              <p className="text-xs text-slate-500 mt-0.5">{semanaF} estudados</p>
            </div>
            <Badge variant="success" dot>Em curso</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="horas" radius={[8,8,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isToday ? '#6366f1' : '#1a1a27'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card accent="#a855f7" className="p-5 flex flex-col gap-4">
          <h3 className="font-bold text-white">Seu Progresso</h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a27" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#progGrad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - ((user?.xp % 100) / 100)) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="progGrad">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black gradient-text">{user?.level || 1}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Nível</span>
              </div>
            </div>
            <div className="text-center w-full">
              <p className="text-xs text-slate-400 mb-2">{user?.xp % 100}/100 XP para o nível {(user?.level || 1) + 1}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/gamificacao')}>
            Ver Conquistas <FiArrowRight size={14} />
          </Button>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card accent="#f59e0b" className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
                <FiCalendar size={18} className="text-yellow-400" />
              </div>
              <h3 className="font-bold text-white">Revisões Pendentes</h3>
            </div>
            <Badge variant={d.revisoes_pendentes > 0 ? 'warning' : 'success'}>
              {d.revisoes_pendentes}
            </Badge>
          </div>
          {d.revisoes_pendentes > 0 ? (
            <>
              <p className="text-slate-400 text-sm mb-4">Você tem revisões para fazer hoje. Não pula!</p>
              <Button onClick={() => navigate('/revisoes')} size="sm" icon={<FiArrowRight size={14} />}>
                Ver Revisões
              </Button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">✅ Nenhuma revisão pendente. Continue assim!</p>
          )}
        </Card>

        <Card accent="#10b981" className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/25 flex items-center justify-center">
              <FiBookOpen size={18} className="text-accent-400" />
            </div>
            <h3 className="font-bold text-white">Matéria em Destaque</h3>
          </div>
          {d.materia_top ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: d.materia_top.cor + '30', border: `1px solid ${d.materia_top.cor}40` }}>
                <FiBookOpen size={20} style={{ color: d.materia_top.cor }} />
              </div>
              <div>
                <p className="font-semibold text-white">{d.materia_top.nome}</p>
                <p className="text-sm text-slate-400">{formatarTempo(d.materia_top.min)} estudados no total</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 text-sm mb-3">Comece a estudar para ver sua matéria em destaque!</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/materias')}>
                Configurar Matérias
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Questoes alert */}
      <Card accent="#8b5cf6" className="p-5" hover onClick={() => navigate('/questoes')}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
              <FiAlertCircle size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Banco de Questões Erradas</p>
              <p className="text-sm text-slate-400">Registre questões para revisar depois e nunca mais errar</p>
            </div>
          </div>
          <FiArrowRight className="text-slate-500" />
        </div>
      </Card>
    </div>
  )
}

function getMockData() {
  return {
    user: { name: 'Estudante', xp: 250, level: 3, streak: 7 },
    hoje_minutos: 90, semana_minutos: 600, mes_minutos: 2400,
    streak: 7, revisoes_pendentes: 3,
    materia_top: { nome: 'Direito Constitucional', cor: '#6366f1', min: 1200 },
    meta_diaria: { valor_alvo: 3 },
    grafico_semana: [],
    frase_motivacional: 'A disciplina é a ponte entre metas e conquistas.'
  }
}
