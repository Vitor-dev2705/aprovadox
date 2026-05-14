import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { FiBarChart2, FiPieChart, FiTrendingUp, FiClock, FiAward } from 'react-icons/fi'
import { dashboardService } from '../services/dashboard.service'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4']

function formatarTempo(minutos) {
  if (!minutos || minutos <= 0) return '0min'
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

function getDiaMaisProdutivo(diaChart) {
  const temDados = diaChart.some(d => d.minutos > 0)
  if (!temDados) return 'Sem dados'
  const melhor = diaChart.reduce((a, b) => b.minutos > a.minutos ? b : a, diaChart[0])
  return melhor.dia
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-600 border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => {
        const val = parseInt(p.value) || 0
        return <p key={i} className="font-bold" style={{ color: p.color }}>{formatarTempo(val)}</p>
      })}
    </div>
  )
}

function StatMini({ label, value, color }) {
  return (
    <Card className="p-4 text-center">
      <p className={`text-xl font-black ${color} mb-1`}>{value}</p>
      <p className="text-[11px] text-slate-500 font-medium">{label}</p>
    </Card>
  )
}

export default function Estatisticas() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('visao-geral')

  useEffect(() => {
    dashboardService.getEstatisticas()
      .then(r => setStats(r.data))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader text="Carregando estatísticas..." />
  const d = stats || MOCK_STATS

  // Tempos diretos do backend (já em minutos inteiros)
  const hojeMin = d.hoje_minutos || 0
  const semanaMin = d.semana_minutos || 0
  const mesMin = d.mes_minutos || 0
  const totalMin = d.total_minutos || 0
  const totalSessoes = d.total_sessoes || 0

  const materiaChart = (d.por_materia || []).map(m => ({
    name: m.nome, minutos: parseInt(m.minutos) || 0
  }))

  // Gráfico semanal — usa por_dia_semana (semana atual) para consistência com Dashboard
  const semanaChart = DIAS.map((dia, i) => {
    const f = (d.por_dia_semana || []).find(x => parseInt(x.dia) === i)
    return { dia, minutos: f ? parseInt(f.minutos) : 0 }
  })

  // Gráfico 30 dias — usa por_dia_30d
  const dia30Chart = DIAS.map((dia, i) => {
    const f = (d.por_dia_30d || d.por_dia || []).find(x => parseInt(x.dia) === i)
    return { dia, minutos: f ? parseInt(f.minutos) : 0 }
  })

  // Evolução mensal — FIX: usa getUTCMonth() para evitar bug de timezone
  const mesChart = (d.evolucao_mensal || []).slice(0, 6).reverse().map(m => ({
    mes: MESES[new Date(m.mes).getUTCMonth()],
    minutos: parseInt(m.minutos) || 0
  }))

  const horaChart = Array.from({ length: 24 }, (_, h) => {
    const f = (d.por_hora || []).find(x => parseInt(x.hora) === h)
    return { hora: `${String(h).padStart(2,'0')}h`, minutos: f ? parseInt(f.minutos) : 0 }
  }).filter(h => h.minutos > 0)

  const tabs = [
    { id:'visao-geral', label:'Visão Geral', icon: FiBarChart2 },
    { id:'materia', label:'Por Matéria', icon: FiPieChart },
    { id:'evolucao', label:'Evolução', icon: FiTrendingUp },
    { id:'horarios', label:'Horários', icon: FiClock },
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="📊"
        title="Estatísticas"
        subtitle="Análise completa do seu desempenho"
        badge={totalSessoes > 0 ? `${totalSessoes} sessões` : 'Comece a estudar'}
      />

      {/* Resumo de tempo — números reais do backend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini label="Hoje" value={formatarTempo(hojeMin)} color="text-brand-400" />
        <StatMini label="Esta semana" value={formatarTempo(semanaMin)} color="text-accent-400" />
        <StatMini label="Este mês" value={formatarTempo(mesMin)} color="text-purple-400" />
        <StatMini label="Total" value={formatarTempo(totalMin)} color="text-yellow-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === id ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400 hover:text-white border border-white/5'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {activeTab === 'visao-geral' && (
        <div className="space-y-4">
          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatMini
              label="Metas cumpridas"
              value={`${d.metas?.cumpridas || 0}/${d.metas?.total || 0}`}
              color="text-accent-400"
            />
            <StatMini
              label="Técnica favorita"
              value={d.por_tecnica?.[0]?.tecnica || '—'}
              color="text-purple-400"
            />
            <StatMini
              label="Dia mais produtivo"
              value={getDiaMaisProdutivo(dia30Chart)}
              color="text-yellow-400"
            />
          </div>

          {/* Técnicas breakdown */}
          {(d.por_tecnica || []).length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <FiAward size={16} className="text-purple-400" /> Por Técnica de Estudo
              </h3>
              <div className="space-y-3">
                {d.por_tecnica.map((t, i) => {
                  const pct = totalMin > 0 ? (parseInt(t.minutos) / totalMin * 100) : 0
                  return (
                    <div key={t.tecnica}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-white font-medium capitalize">{t.tecnica}</span>
                        <span className="text-xs text-slate-400">
                          {formatarTempo(t.minutos)} • {parseInt(t.sessoes)} sessões
                        </span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Weekly chart — semana atual (mesma fonte do Dashboard) */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-1">Esta Semana</h3>
            <p className="text-xs text-slate-500 mb-4">{formatarTempo(semanaMin)} estudados</p>
            {semanaChart.some(d => d.minutos > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={semanaChart} barSize={32}>
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:12 }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="minutos" name="Minutos" fill="#6366f1" radius={[6,6,0,0]}>
                    {semanaChart.map((entry, i) => (
                      <Cell key={i} fill={entry.dia === DIAS[new Date().getDay()] ? '#6366f1' : '#1e1e2e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FiBarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem dados nesta semana ainda</p>
              </div>
            )}
          </Card>

          {/* 30-day chart */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-1">Distribuição por Dia (últimos 30 dias)</h3>
            <p className="text-xs text-slate-500 mb-4">Soma dos minutos estudados em cada dia da semana</p>
            {dia30Chart.some(d => d.minutos > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dia30Chart} barSize={28}>
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:12 }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="minutos" name="Minutos" fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Sem dados dos últimos 30 dias</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'materia' && (
        <div className="space-y-4">
          {materiaChart.length === 0 ? (
            <EmptyState icon={FiPieChart} title="Sem dados por matéria"
              description="Registre sessões de estudo para ver a distribuição por matéria." />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-bold text-white mb-4">Tempo por Matéria</h3>
                <ResponsiveContainer width="100%" height={Math.max(200, materiaChart.length * 45)}>
                  <BarChart data={materiaChart} layout="vertical" barSize={18}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill:'#94a3b8', fontSize:12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.08)' }} />
                    <Bar dataKey="minutos" name="Minutos" radius={[0,6,6,0]}>
                      {materiaChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <h3 className="font-bold text-white mb-4">Distribuição</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={materiaChart} dataKey="minutos" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={3}>
                      {materiaChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span className="text-slate-300 text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Matéria detail list */}
          {materiaChart.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-white mb-4">Detalhamento</h3>
              <div className="space-y-3">
                {materiaChart.map((m, i) => {
                  const pct = totalMin > 0 ? (m.minutos / totalMin * 100) : 0
                  return (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white font-medium truncate">{m.name}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                            {formatarTempo(m.minutos)} ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'evolucao' && (
        <Card className="p-5">
          <h3 className="font-bold text-white mb-4">Evolução Mensal</h3>
          {mesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a27" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:11 }}
                  tickFormatter={(v) => formatarTempo(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="minutos" name="Minutos" stroke="#6366f1" strokeWidth={3}
                  dot={{ fill:'#6366f1', r:5 }} activeDot={{ r:7, fill:'#818cf8' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FiTrendingUp size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Dados insuficientes para mostrar evolução</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'horarios' && (
        <Card className="p-5">
          <h3 className="font-bold text-white mb-4">Horários mais produtivos</h3>
          {horaChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={horaChart} barSize={20}>
                  <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:10 }} interval={0} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="minutos" name="Minutos" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {(() => {
                const melhor = horaChart.reduce((a, b) => b.minutos > a.minutos ? b : a, horaChart[0])
                return (
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                    <FiClock size={16} className="text-brand-400" />
                    <p className="text-sm text-slate-300">
                      Seu horário mais produtivo é às <span className="text-white font-bold">{melhor.hora}</span> com{' '}
                      <span className="text-brand-400 font-bold">{formatarTempo(melhor.minutos)}</span> estudados
                    </p>
                  </div>
                )
              })()}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FiClock size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Dados insuficientes ainda</p>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">Distribuição de minutos estudados por horário do dia</p>
        </Card>
      )}
    </div>
  )
}

const MOCK_STATS = {
  hoje_minutos: 90,
  semana_minutos: 600,
  mes_minutos: 2400,
  total_minutos: 3180,
  total_sessoes: 42,
  por_materia: [
    { nome:'Direito Constitucional', cor:'#6366f1', minutos:1200 },
    { nome:'Português', cor:'#10b981', minutos:900 },
    { nome:'Raciocínio Lógico', cor:'#f59e0b', minutos:600 },
    { nome:'Informática', cor:'#3b82f6', minutos:480 },
  ],
  por_dia_semana: [
    {dia:1,minutos:60},{dia:2,minutos:90},{dia:3,minutos:45},
  ],
  por_dia_30d: [
    {dia:1,minutos:120},{dia:2,minutos:180},{dia:3,minutos:90},
    {dia:4,minutos:210},{dia:5,minutos:150},{dia:6,minutos:240},
  ],
  por_hora: [{hora:8,minutos:120},{hora:14,minutos:180},{hora:20,minutos:90}],
  evolucao_mensal: [
    {mes:'2024-01-01',minutos:800},{mes:'2024-02-01',minutos:1200},
    {mes:'2024-03-01',minutos:960},{mes:'2024-04-01',minutos:1500},
  ],
  metas: { cumpridas: 12, total: 20 },
  por_tecnica: [
    { tecnica:'Pomodoro', minutos:1800, sessoes:36 },
    { tecnica:'Livre', minutos:600, sessoes:12 },
  ],
}
