import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { FiClock, FiTarget, FiZap, FiCalendar, FiBookOpen,
         FiArrowRight, FiTrendingUp, FiAward, FiAlertCircle } from 'react-icons/fi'
import { dashboardService } from '../services/dashboard.service'
import { useAuthStore } from '../store/authStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Loader from '../components/ui/Loader'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function StatCard({ icon: Icon, label, value, sub, color = 'brand', onClick }) {
  const colors = {
    brand:   'from-brand-500/20 to-brand-600/5 border-brand-500/20 text-brand-400',
    success: 'from-accent-500/20 to-accent-600/5 border-accent-500/20 text-accent-400',
    orange:  'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400',
    purple:  'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  }
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 cursor-pointer transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center`}>
          <Icon size={20} className="opacity-80" />
        </div>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-600 border border-white/10 rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 mb-1">{DIAS[label] || label}</p>
      <p className="text-white font-bold">{Math.round(payload[0]?.value || 0)}h estudadas</p>
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
  const hojeH = (d.hoje_minutos / 60).toFixed(1)
  const semanaH = (d.semana_minutos / 60).toFixed(1)
  const mesH = (d.mes_minutos / 60).toFixed(1)

  const chartData = DIAS.map((dia, i) => {
    const found = d.grafico_semana?.find(g => parseInt(g.dia) === i)
    return { dia, horas: found ? (parseInt(found.min) / 60) : 0 }
  })

  const metaPct = d.meta_diaria
    ? Math.min(100, (d.hoje_minutos / (d.meta_diaria.valor_alvo * 60)) * 100)
    : Math.min(100, (d.hoje_minutos / 120) * 100)

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome + frase */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard 🎯</h1>
          <p className="text-slate-400 text-sm mt-1 italic">"{d.frase_motivacional}"</p>
        </div>
        <Button onClick={() => navigate('/cronometro')} icon={<FiClock size={16} />}>
          Iniciar Estudo
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiClock}      label="Hoje"     value={`${hojeH}h`}  sub="horas"  color="brand"   onClick={() => navigate('/estatisticas')} />
        <StatCard icon={FiTrendingUp} label="Semana"   value={`${semanaH}h`} sub="horas"  color="success" onClick={() => navigate('/estatisticas')} />
        <StatCard icon={FiAward}      label="Mês"      value={`${mesH}h`}   sub="horas"  color="purple"  onClick={() => navigate('/estatisticas')} />
        <StatCard icon={FiZap}        label="Sequência" value={`${d.streak}🔥`} sub="dias"  color="orange"  onClick={() => navigate('/gamificacao')} />
      </div>

      {/* Meta diária */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiTarget size={18} className="text-brand-400" />
            <span className="font-semibold text-white">Meta Diária</span>
          </div>
          <Badge variant={metaPct >= 100 ? 'success' : 'primary'}>
            {Math.round(metaPct)}%
          </Badge>
        </div>
        <ProgressBar value={metaPct} color={metaPct >= 100 ? 'success' : 'brand'} size="lg" />
        <p className="text-xs text-slate-500 mt-2">
          {d.hoje_minutos} min estudados {d.meta_diaria ? `de ${d.meta_diaria.valor_alvo * 60} min` : 'hoje'}
        </p>
      </Card>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Horas esta semana</h3>
            <span className="text-xs text-slate-500">Total: {semanaH}h</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="horas" radius={[6,6,0,0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={new Date().getDay() === i ? '#6366f1' : '#1a1a27'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Level + XP */}
        <Card className="p-5 flex flex-col gap-4">
          <h3 className="font-bold text-white">Seu Progresso</h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a27" strokeWidth="10" />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - ((d.user?.xp % 100) / 100)) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black gradient-text">{d.user?.level || 1}</span>
                <span className="text-xs text-slate-500">Nível</span>
              </div>
            </div>
            <div className="text-center w-full">
              <p className="text-sm text-slate-400 mb-2">{d.user?.xp % 100}/100 XP para o próximo nível</p>
              <ProgressBar value={(d.user?.xp % 100)} max={100} color="rainbow" />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/gamificacao')}>
            Ver Conquistas <FiArrowRight size={14} />
          </Button>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revisoes pendentes */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiCalendar size={18} className="text-yellow-400" />
              <h3 className="font-bold text-white">Revisões Pendentes</h3>
            </div>
            <Badge variant={d.revisoes_pendentes > 0 ? 'warning' : 'success'}>
              {d.revisoes_pendentes} pendentes
            </Badge>
          </div>
          {d.revisoes_pendentes > 0 ? (
            <div>
              <p className="text-slate-400 text-sm mb-4">Você tem revisões para fazer hoje!</p>
              <Button onClick={() => navigate('/revisoes')} size="sm">
                Ver Revisões <FiArrowRight size={14} />
              </Button>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">✅ Nenhuma revisão pendente. Continue assim!</p>
          )}
        </Card>

        {/* Matéria top */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiBookOpen size={18} className="text-accent-400" />
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
                <p className="text-sm text-slate-400">{Math.round(d.materia_top.min / 60)}h estudadas no total</p>
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
      <Card className="p-5 bg-gradient-to-r from-dark-700 to-dark-700 border border-brand-500/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <FiAlertCircle size={20} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Banco de Questões Erradas</p>
              <p className="text-sm text-slate-400">Registre questões para revisar depois</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/questoes')}>
            Acessar <FiArrowRight size={14} />
          </Button>
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
