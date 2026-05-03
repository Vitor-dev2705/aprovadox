import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { FiBarChart2, FiPieChart, FiTrendingUp, FiClock } from 'react-icons/fi'
import { dashboardService } from '../services/dashboard.service'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-600 border border-white/10 rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}h</p>
      ))}
    </div>
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

  if (loading) return <Loader />
  const d = stats || MOCK_STATS

  const materiaChart = d.por_materia.map(m => ({ name: m.nome, horas: (m.minutos / 60).toFixed(1) }))
  const diaChart = DIAS.map((dia, i) => { const f = d.por_dia.find(d => parseInt(d.dia) === i); return { dia, horas: f ? (f.minutos / 60).toFixed(1) : 0 } })
  const mesChart = d.evolucao_mensal.slice(0, 6).reverse().map(m => ({
    mes: MESES[new Date(m.mes).getMonth()], horas: (m.minutos / 60).toFixed(1)
  }))
  const horaChart = Array.from({ length: 24 }, (_, h) => {
    const f = d.por_hora.find(x => parseInt(x.hora) === h)
    return { hora: `${String(h).padStart(2,'0')}h`, min: f ? parseInt(f.minutos) : 0 }
  }).filter(h => h.min > 0)

  const tabs = [
    { id:'visao-geral', label:'Visão Geral', icon: FiBarChart2 },
    { id:'materia', label:'Por Matéria', icon: FiPieChart },
    { id:'evolucao', label:'Evolução', icon: FiTrendingUp },
    { id:'horarios', label:'Horários', icon: FiClock },
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-black text-white">Estatísticas 📊</h1>
        <p className="text-slate-400 text-sm mt-1">Análise completa do seu desempenho</p>
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
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label:'Metas cumpridas', value:`${d.metas?.cumpridas || 0}/${d.metas?.total || 0}`, color:'text-accent-400' },
              { label:'Técnica favorita', value: d.por_tecnica?.[0]?.tecnica || 'Pomodoro', color:'text-brand-400' },
              { label:'Dia mais produtivo', value: DIAS[diaChart.reduce((a,b) => parseFloat(b.horas) > parseFloat(a.horas) ? b : a, diaChart[0])?.dia ? DIAS.indexOf(diaChart.reduce((a,b) => parseFloat(b.horas) > parseFloat(a.horas) ? b : a, diaChart[0]).dia) : 1] || 'Segunda', color:'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="p-4 text-center">
                <p className={`text-xl font-black ${color} mb-1`}>{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </Card>
            ))}
          </div>

          {/* Days chart */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Distribuição Semanal</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={diaChart} barSize={32}>
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:12 }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="horas" name="Horas" fill="#6366f1" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {activeTab === 'materia' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-bold text-white mb-4">Horas por Matéria</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={materiaChart} layout="vertical" barSize={18}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fill:'#94a3b8', fontSize:12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="horas" name="Horas" radius={[0,6,6,0]}>
                    {materiaChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="font-bold text-white mb-4">Distribuição</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={materiaChart} dataKey="horas" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={3}>
                    {materiaChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(v) => <span className="text-slate-300 text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'evolucao' && (
        <Card className="p-5">
          <h3 className="font-bold text-white mb-4">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a27" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="horas" name="Horas" stroke="#6366f1" strokeWidth={3}
                dot={{ fill:'#6366f1', r:5 }} activeDot={{ r:7, fill:'#818cf8' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {activeTab === 'horarios' && (
        <Card className="p-5">
          <h3 className="font-bold text-white mb-4">Horários mais produtivos</h3>
          {horaChart.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={horaChart} barSize={20}>
                <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:10 }} interval={1} />
                <YAxis hide />
                <Tooltip cursor={{ fill:'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="min" name="Minutos" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">Dados insuficientes ainda</div>
          )}
          <p className="text-xs text-slate-500 mt-3">Distribuição de minutos estudados por horário do dia</p>
        </Card>
      )}
    </div>
  )
}

const MOCK_STATS = {
  por_materia: [
    { nome:'Direito Constitucional', cor:'#6366f1', minutos:1200 },
    { nome:'Português', cor:'#10b981', minutos:900 },
    { nome:'Raciocínio Lógico', cor:'#f59e0b', minutos:600 },
    { nome:'Informática', cor:'#3b82f6', minutos:480 },
  ],
  por_dia: [
    {dia:1,minutos:120},{dia:2,minutos:180},{dia:3,minutos:90},
    {dia:4,minutos:210},{dia:5,minutos:150},{dia:6,minutos:240},
  ],
  por_hora: [{hora:8,minutos:120},{hora:14,minutos:180},{hora:20,minutos:90}],
  evolucao_mensal: [
    {mes:'2024-01-01',minutos:800},{mes:'2024-02-01',minutos:1200},
    {mes:'2024-03-01',minutos:960},{mes:'2024-04-01',minutos:1500},
  ],
  metas: { cumpridas: 12, total: 20 },
  por_tecnica: [{ tecnica:'Pomodoro', minutos:1800, sessoes:36 }],
}
