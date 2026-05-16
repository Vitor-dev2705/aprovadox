import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiClock, FiTarget, FiZap, FiCalendar, FiBookOpen,
  FiArrowRight, FiTrendingUp, FiAward, FiAlertCircle, FiPlay,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { dashboardService } from '../services/dashboard.service'
import { useAuthStore } from '../store/authStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import PageHeader from '../components/ui/PageHeader'
import Loader from '../components/ui/Loader'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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

function formatarTempo(minutos) {
  if (!minutos || minutos <= 0) return '0min'
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

function formatarTempoCompacto(minutos) {
  if (!minutos || minutos <= 0) return '0m'
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

// Intensidade do heatmap — retorna opacidade 0.0 a 1.0
function getIntensidade(minutos, maxMinutos) {
  if (!minutos || minutos <= 0) return 0
  const safe = Math.max(maxMinutos, 1)
  return Math.min(1, 0.15 + (minutos / safe) * 0.85)
}

// ==================== CALENDARIO ====================
function CalendarioMensal({ calendario, mes, onMesChange }) {
  const [hoveredDay, setHoveredDay] = useState(null)
  const ano = mes.getFullYear()
  const mesIdx = mes.getMonth()

  const primeiroDia = new Date(ano, mesIdx, 1).getDay()
  const diasNoMes = new Date(ano, mesIdx + 1, 0).getDate()
  const diasMesAnterior = new Date(ano, mesIdx, 0).getDate()
  const hoje = new Date()
  const ehHoje = (dia) =>
    dia === hoje.getDate() && mesIdx === hoje.getMonth() && ano === hoje.getFullYear()

  // Mapa de dia → { sessoes, minutos }
  const dadosMap = {}
  let maxMin = 0
  ;(calendario || []).forEach((item) => {
    const d = new Date(item.data + 'T12:00:00')
    const key = d.getDate()
    const min = parseInt(item.minutos)
    dadosMap[key] = { sessoes: parseInt(item.sessoes), minutos: min }
    if (min > maxMin) maxMin = min
  })

  // Total do mes
  const totalMes = Object.values(dadosMap).reduce((s, v) => s + v.minutos, 0)
  const diasAtivos = Object.keys(dadosMap).length

  // Monta o grid completo (6 semanas = 42 celulas)
  const cells = []

  // Dias do mes anterior (cinza)
  for (let i = primeiroDia - 1; i >= 0; i--) {
    const dia = diasMesAnterior - i
    cells.push(
      <div key={`prev-${dia}`} className="min-h-[52px] lg:min-h-[66px] rounded-lg flex flex-col items-center justify-start pt-1.5 text-[11px]">
        <span className="text-slate-700 font-medium">{dia}</span>
      </div>
    )
  }

  // Dias do mes atual
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const info = dadosMap[dia]
    const isToday = ehHoje(dia)
    const intensidade = info ? getIntensidade(info.minutos, maxMin) : 0
    const isHovered = hoveredDay === dia

    cells.push(
      <div
        key={dia}
        className="relative group"
        onMouseEnter={() => setHoveredDay(dia)}
        onMouseLeave={() => setHoveredDay(null)}
      >
        <div
          className={`min-h-[52px] lg:min-h-[66px] rounded-lg flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-all duration-200 cursor-default
            ${isToday ? 'ring-2 ring-brand-400/60 ring-offset-1 ring-offset-dark-800' : ''}
            ${isHovered && info ? 'scale-[1.04] z-10 shadow-lg shadow-black/40' : ''}
          `}
          style={info ? {
            backgroundColor: `rgba(16, 185, 129, ${intensidade * 0.25})`,
            border: `1px solid rgba(16, 185, 129, ${intensidade * 0.4})`,
          } : {
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* Numero do dia */}
          <span className={`font-bold text-[11px] leading-none ${
            isToday ? 'text-brand-400' : info ? 'text-white' : 'text-slate-600'
          }`}>
            {dia}
          </span>

          {/* Barra de intensidade + dados */}
          {info && (
            <div className="flex flex-col items-center gap-0.5 mt-auto pb-1.5">
              {/* Barra visual */}
              <div className="w-5 h-1 rounded-full overflow-hidden bg-white/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(20, intensidade * 100)}%`,
                    backgroundColor: `rgba(16, 185, 129, ${0.5 + intensidade * 0.5})`,
                  }}
                />
              </div>
              <span className="text-[9px] font-semibold leading-none hidden lg:block"
                style={{ color: `rgba(16, 185, 129, ${0.5 + intensidade * 0.5})` }}
              >
                {formatarTempoCompacto(info.minutos)}
              </span>
            </div>
          )}

          {/* Dot indicador (mobile) */}
          {info && (
            <div className="lg:hidden mt-auto mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `rgba(16, 185, 129, ${0.5 + intensidade * 0.5})` }}
              />
            </div>
          )}
        </div>

        {/* Tooltip no hover */}
        {isHovered && info && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-dark-600 border border-white/10 rounded-xl px-3 py-2 shadow-2xl shadow-black/60 whitespace-nowrap">
              <p className="text-[10px] text-slate-400 mb-0.5">{dia} de {MESES[mesIdx]}</p>
              <p className="text-xs font-bold text-white">{formatarTempo(info.minutos)}</p>
              <p className="text-[10px] text-accent-400">{info.sessoes} {info.sessoes === 1 ? 'sessao' : 'sessoes'}</p>
            </div>
            <div className="w-2 h-2 bg-dark-600 border-r border-b border-white/10 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
          </div>
        )}
      </div>
    )
  }

  // Dias do proximo mes (cinza) — preenche ate completar 6 semanas ou completar a linha
  const totalCells = cells.length
  const remaining = (7 - (totalCells % 7)) % 7
  for (let dia = 1; dia <= remaining; dia++) {
    cells.push(
      <div key={`next-${dia}`} className="min-h-[52px] lg:min-h-[66px] rounded-lg flex flex-col items-center justify-start pt-1.5 text-[11px]">
        <span className="text-slate-700 font-medium">{dia}</span>
      </div>
    )
  }

  const prevMes = () => onMesChange(new Date(ano, mesIdx - 1, 1))
  const nextMes = () => onMesChange(new Date(ano, mesIdx + 1, 1))
  const irParaHoje = () => onMesChange(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const isCurrentMonth = mesIdx === hoje.getMonth() && ano === hoje.getFullYear()

  return (
    <div className="space-y-3">
      {/* Header navegacao */}
      <div className="flex items-center justify-between">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={prevMes}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <FiChevronLeft size={16} />
        </motion.button>

        <div className="text-center">
          <h3 className="font-bold text-white text-sm tracking-wide">
            {MESES[mesIdx]}
            <span className="text-slate-500 font-normal ml-1.5">{ano}</span>
          </h3>
          {diasAtivos > 0 && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {formatarTempo(totalMes)} em {diasAtivos} dia{diasAtivos > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={nextMes}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <FiChevronRight size={16} />
        </motion.button>
      </div>

      {/* Header dias da semana */}
      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-widest py-1.5 ${
            i === 0 || i === 6 ? 'text-slate-600' : 'text-slate-500'
          }`}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid do calendario */}
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      {/* Footer: legenda + botao Hoje */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-600 mr-1">Menos</span>
          {[0.05, 0.15, 0.35, 0.6, 0.9].map((op, i) => (
            <div key={i} className="w-3 h-3 rounded-[3px]"
              style={{ backgroundColor: `rgba(16, 185, 129, ${op * 0.3})`, border: `1px solid rgba(16, 185, 129, ${op * 0.4})` }}
            />
          ))}
          <span className="text-[10px] text-slate-600 ml-1">Mais</span>
        </div>

        {!isCurrentMonth && (
          <button onClick={irParaHoje}
            className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-0.5 rounded border border-brand-500/20 hover:bg-brand-500/10 transition-all">
            Hoje
          </button>
        )}
      </div>
    </div>
  )
}

// ==================== ATIVIDADES RECENTES ====================
function AtividadesRecentes({ atividades }) {
  if (!atividades?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 text-sm">Nenhuma atividade registrada.</p>
        <p className="text-slate-600 text-xs mt-1">Comece a estudar para ver seu historico!</p>
      </div>
    )
  }

  // Agrupar por data (Brasil)
  const grupos = {}
  atividades.forEach((a) => {
    // data_inicio vem do banco como UTC string, converter para data BR
    const dt = new Date(a.data_inicio)
    const dataBR = dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    if (!grupos[dataBR]) grupos[dataBR] = []
    grupos[dataBR].push(a)
  })

  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const ontem = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const labelData = (data) => {
    if (data === hoje) return 'Hoje'
    if (data === ontem) return 'Ontem'
    // '15/05/2026' → '15 de maio de 2026'
    const [d, m, y] = data.split('/')
    const mesNome = MESES[parseInt(m) - 1]
    return `${parseInt(d)} de ${mesNome?.toLowerCase() || m} de ${y}`
  }

  return (
    <div className="space-y-4">
      {Object.entries(grupos).map(([data, items]) => (
        <div key={data}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {labelData(data)}
          </p>
          <div className="space-y-2">
            {items.map((a) => {
              const hora = new Date(a.data_inicio).toLocaleTimeString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-700/50 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: a.materia_cor || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {a.materia_nome || 'Materia'}
                    </p>
                    {(a.conteudo_titulo || a.assunto_nome) && (
                      <p className="text-[10px] text-slate-500 truncate">
                        {a.conteudo_titulo || a.assunto_nome}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-500">{hora}</p>
                    <p className="text-xs font-bold text-slate-300">
                      {formatarTempoCompacto(a.duracao_minutos)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== DASHBOARD PRINCIPAL ====================
export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calendario, setCalendario] = useState([])
  const [atividades, setAtividades] = useState([])
  const [mes, setMes] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    dashboardService.get()
      .then(r => setData(r.data))
      .catch(() => setData(getMockData()))
      .finally(() => setLoading(false))

    dashboardService.getAtividades()
      .then(r => setAtividades(r.data || []))
      .catch(() => setAtividades([]))
  }, [])

  // Carrega calendário ao mudar de mês
  useEffect(() => {
    const mesStr = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`
    dashboardService.getCalendario(mesStr)
      .then(r => setCalendario(r.data || []))
      .catch(() => setCalendario([]))
  }, [mes])

  if (loading) return <Loader text="Carregando seu dashboard..." />

  const d = data || getMockData()

  const hojeF = formatarTempo(d.hoje_minutos)
  const semanaF = formatarTempo(d.semana_minutos)
  const mesF = formatarTempo(d.mes_minutos)

  const metaMinutos = d.meta_diaria?.valor_alvo ? d.meta_diaria.valor_alvo * 60 : 120
  const metaPct = metaMinutos > 0
    ? Math.min(100, (d.hoje_minutos / metaMinutos) * 100)
    : 0

  const xpAtual = user?.xp ?? 0
  const xpMod = xpAtual % 100
  const nivelAtual = user?.level || 1

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="🎯"
        title="Dashboard"
        subtitle={`"${d.frase_motivacional}"`}
        badge="Visao geral"
        actions={
          <Button onClick={() => navigate('/cronometro')} icon={<FiPlay size={14} />}>
            Iniciar Estudo
          </Button>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0.0} icon={FiClock}      label="Hoje"      value={hojeF}   sub="tempo"  color="brand"   onClick={() => navigate('/estatisticas')} />
        <StatCard delay={0.1} icon={FiTrendingUp} label="Semana"    value={semanaF}  sub="tempo"  color="success" onClick={() => navigate('/estatisticas')} />
        <StatCard delay={0.2} icon={FiAward}      label="Mes"       value={mesF}     sub="tempo"  color="purple"  onClick={() => navigate('/estatisticas')} />
        <StatCard delay={0.3} icon={FiZap}        label="Sequencia" value={`${d.streak || 0} 🔥`} sub="dias" color="orange" onClick={() => navigate('/gamificacao')} />
      </div>

      {/* Meta diária */}
      <Card accent="#6366f1" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              <FiTarget size={18} className="text-brand-400" />
            </div>
            <div>
              <p className="font-bold text-white">Meta Diaria</p>
              <p className="text-xs text-slate-500">
                {formatarTempo(d.hoje_minutos)} hoje {d.meta_diaria ? `de ${formatarTempo(d.meta_diaria.valor_alvo * 60)}` : ''}
              </p>
            </div>
          </div>
          <Badge variant={metaPct >= 100 ? 'success' : 'primary'}>
            {Math.round(metaPct)}% concluida
          </Badge>
        </div>
        <ProgressBar value={metaPct} color={metaPct >= 100 ? 'success' : 'rainbow'} size="lg" />
      </Card>

      {/* Calendário + Atividades Recentes */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card accent="#10b981" className="p-5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/25 flex items-center justify-center">
              <FiCalendar size={18} className="text-accent-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Calendario de Estudos</h3>
              <p className="text-xs text-slate-500 mt-0.5">{semanaF} esta semana</p>
            </div>
          </div>
          <CalendarioMensal
            calendario={calendario}
            mes={mes}
            onMesChange={setMes}
          />
        </Card>

        <Card accent="#6366f1" className="p-5 flex flex-col">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <FiClock size={16} className="text-brand-400" /> Atividades Recentes
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[400px] scrollbar-thin">
            <AtividadesRecentes atividades={atividades} />
          </div>
        </Card>
      </div>

      {/* Progresso + Revisões */}
      <div className="grid lg:grid-cols-3 gap-5">
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
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - (xpMod / 100)) }}
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
                <span className="text-3xl font-black gradient-text">{nivelAtual}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Nivel</span>
              </div>
            </div>
            <div className="text-center w-full">
              <p className="text-xs text-slate-400 mb-2">{xpMod}/100 XP para o nivel {nivelAtual + 1}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/gamificacao')}>
            Ver Conquistas <FiArrowRight size={14} />
          </Button>
        </Card>

        <Card accent="#f59e0b" className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
                <FiCalendar size={18} className="text-yellow-400" />
              </div>
              <h3 className="font-bold text-white">Revisoes Pendentes</h3>
            </div>
            <Badge variant={d.revisoes_pendentes > 0 ? 'warning' : 'success'}>
              {d.revisoes_pendentes}
            </Badge>
          </div>
          {d.revisoes_pendentes > 0 ? (
            <>
              <p className="text-slate-400 text-sm mb-4">Voce tem revisoes para fazer hoje. Nao pula!</p>
              <Button onClick={() => navigate('/revisoes')} size="sm" icon={<FiArrowRight size={14} />}>
                Ver Revisoes
              </Button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Nenhuma revisao pendente. Continue assim!</p>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card accent="#10b981" className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/25 flex items-center justify-center">
              <FiBookOpen size={18} className="text-accent-400" />
            </div>
            <h3 className="font-bold text-white">Materia em Destaque</h3>
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
              <p className="text-slate-400 text-sm mb-3">Comece a estudar para ver sua materia em destaque!</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/materias')}>
                Configurar Materias
              </Button>
            </div>
          )}
        </Card>

        <Card accent="#8b5cf6" className="p-5" hover onClick={() => navigate('/questoes')}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
                <FiAlertCircle size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Banco de Questoes Erradas</p>
                <p className="text-sm text-slate-400">Registre questoes para revisar depois e nunca mais errar</p>
              </div>
            </div>
            <FiArrowRight className="text-slate-500" />
          </div>
        </Card>
      </div>
    </div>
  )
}

function getMockData() {
  return {
    user: { name: 'Estudante', xp: 250, level: 3, streak: 7 },
    hoje_minutos: 0, semana_minutos: 0, mes_minutos: 0,
    streak: 0, revisoes_pendentes: 0,
    materia_top: null,
    meta_diaria: null,
    grafico_semana: [],
    frase_motivacional: 'A disciplina e a ponte entre metas e conquistas.'
  }
}
