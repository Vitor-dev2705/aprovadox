import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCalendar, FiCheck, FiClock, FiAlertTriangle, FiBookOpen,
  FiChevronDown, FiChevronUp, FiInfo, FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { revisaoService } from '../services/revisao.service'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import toast from 'react-hot-toast'

const TIPO_INFO = {
  '24h': { label: '24h',  labelFull: '24 horas', cor: '#ef4444', bg: 'bg-red-500/20 border-red-500/30 text-red-300' },
  '7d':  { label: '7d',   labelFull: '7 dias',   cor: '#f59e0b', bg: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' },
  '30d': { label: '30d',  labelFull: '30 dias',   cor: '#6366f1', bg: 'bg-brand-500/20 border-brand-500/30 text-brand-300' },
  '90d': { label: '90d',  labelFull: '90 dias',   cor: '#10b981', bg: 'bg-accent-500/20 border-accent-500/30 text-accent-300' },
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Parse seguro de datas — evita bug de timezone com DATE do PostgreSQL
// "2026-05-14T00:00:00.000Z" ou "2026-05-14" → Date local dia 14
function parseDate(dateStr) {
  if (!dateStr) return null
  const str = String(dateStr).slice(0, 10) // "2026-05-14"
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getDateStr(dateStr) {
  if (!dateStr) return null
  // Pega a versão texto limpa (data_revisao_str) ou extrai do ISO
  return String(dateStr).slice(0, 10)
}

function getTodayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getLabel(r) {
  return r.conteudo_titulo || r.assunto_nome || r.materia_nome
}

function getSub(r) {
  const label = getLabel(r)
  if (label !== r.materia_nome) return r.materia_nome
  return null
}

function isOverdue(r) {
  const dataStr = r.data_revisao_str || getDateStr(r.data_revisao)
  if (!dataStr) return false
  return dataStr < getTodayStr()
}

function isToday(r) {
  const dataStr = r.data_revisao_str || getDateStr(r.data_revisao)
  if (!dataStr) return false
  return dataStr === getTodayStr()
}

function groupByDate(revisoes) {
  const hojeStr = getTodayStr()
  const hoje = parseDate(hojeStr)
  const groups = { overdue: [], today: [], week: [], later: [] }

  revisoes.forEach(r => {
    if (r.concluida) { groups.later.push(r); return }
    const dataStr = r.data_revisao_str || getDateStr(r.data_revisao)
    if (!dataStr) { groups.later.push(r); return }

    if (dataStr < hojeStr) groups.overdue.push(r)
    else if (dataStr === hojeStr) groups.today.push(r)
    else {
      const data = parseDate(dataStr)
      const diff = Math.floor((data - hoje) / 86400000)
      if (diff <= 7) groups.week.push(r)
      else groups.later.push(r)
    }
  })

  return groups
}

// Formata data para exibicao
function formatDateShort(r) {
  const dataStr = r.data_revisao_str || getDateStr(r.data_revisao)
  if (!dataStr) return ''
  const d = parseDate(dataStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ==================== CALENDARIO DE REVISOES ====================
function CalendarioRevisoes({ calendario, mes, onMesChange, selectedDay, onDayClick }) {
  const ano = mes.getFullYear()
  const mesIdx = mes.getMonth()

  const primeiroDia = new Date(ano, mesIdx, 1).getDay()
  const diasNoMes = new Date(ano, mesIdx + 1, 0).getDate()
  const hojeStr = getTodayStr()

  // Mapa de "2026-05-14" → { total, concluidas, pendentes }
  const dadosMap = {}
  ;(calendario || []).forEach((item) => {
    dadosMap[item.data] = {
      total: parseInt(item.total),
      concluidas: parseInt(item.concluidas),
      pendentes: parseInt(item.pendentes),
    }
  })

  const cells = []
  for (let i = 0; i < primeiroDia; i++) {
    cells.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = `${ano}-${String(mesIdx + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    const info = dadosMap[dataStr]
    const ehHoje = dataStr === hojeStr
    const isSelected = selectedDay === dataStr
    const temPendente = info && info.pendentes > 0
    const todoConcluido = info && info.pendentes === 0 && info.concluidas > 0
    const atrasado = temPendente && dataStr < hojeStr

    cells.push(
      <button
        key={dia}
        type="button"
        onClick={() => onDayClick(isSelected ? null : dataStr)}
        className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-xs cursor-pointer
          ${isSelected ? 'border-brand-500/60 bg-brand-500/15 ring-1 ring-brand-500/40' : ''}
          ${!isSelected && ehHoje ? 'border-brand-500/40 bg-brand-500/8' : ''}
          ${!isSelected && !ehHoje && atrasado ? 'border-red-500/30 bg-red-500/8' : ''}
          ${!isSelected && !ehHoje && temPendente && !atrasado ? 'border-yellow-500/30 bg-yellow-500/8' : ''}
          ${!isSelected && !ehHoje && todoConcluido ? 'border-accent-500/30 bg-accent-500/8' : ''}
          ${!isSelected && !ehHoje && !info ? 'border-white/5 bg-dark-700/30 hover:border-white/10' : ''}
        `}
      >
        <span className={`font-bold text-[11px] ${
          isSelected ? 'text-brand-400' :
          ehHoje ? 'text-brand-400' :
          info ? 'text-white' : 'text-slate-500'
        }`}>
          {dia}
        </span>
        {info && (
          <>
            {info.pendentes > 0 && (
              <span className={`font-semibold text-[9px] leading-none ${atrasado ? 'text-red-400' : 'text-yellow-400'}`}>
                {info.pendentes} pend.
              </span>
            )}
            {info.concluidas > 0 && (
              <span className="text-accent-400 text-[9px] leading-none">
                {info.concluidas} feita{info.concluidas > 1 ? 's' : ''}
              </span>
            )}
          </>
        )}
      </button>
    )
  }

  const prevMes = () => onMesChange(new Date(ano, mesIdx - 1, 1))
  const nextMes = () => onMesChange(new Date(ano, mesIdx + 1, 1))
  const hoje = new Date()
  const irParaHoje = () => onMesChange(new Date(hoje.getFullYear(), hoje.getMonth(), 1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMes}
          className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all">
          <FiChevronLeft size={16} />
        </button>
        <h3 className="font-bold text-white text-sm">
          {MESES[mesIdx]} de {ano}
        </h3>
        <button onClick={nextMes}
          className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all">
          <FiChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500/40" />
          <span className="text-[10px] text-slate-500">Atrasada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500/40" />
          <span className="text-[10px] text-slate-500">Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-accent-500/40" />
          <span className="text-[10px] text-slate-500">Concluida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm border border-brand-500/40 bg-brand-500/20" />
          <span className="text-[10px] text-slate-500">Hoje</span>
        </div>
      </div>

      {(mesIdx !== hoje.getMonth() || ano !== hoje.getFullYear()) && (
        <div className="flex justify-center">
          <button onClick={irParaHoje}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold border border-brand-500/20 px-3 py-1 rounded-lg hover:bg-brand-500/10 transition-all">
            Hoje
          </button>
        </div>
      )}
    </div>
  )
}

// ==================== ROW DE REVISAO ====================
function RevisaoRow({ r, completing, onComplete, showDate = true }) {
  const sub = getSub(r)
  const overdue = isOverdue(r) && !r.concluida
  const tipo = TIPO_INFO[r.tipo]

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all ${
      overdue ? 'bg-red-500/8 border border-red-500/15' :
      r.concluida ? 'bg-dark-700/30 opacity-60' :
      'bg-dark-700/40 hover:bg-dark-700/60'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: r.materia_cor || '#6366f1' }} />
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${r.concluida ? 'text-slate-400 line-through' : 'text-white'}`}>
            {getLabel(r)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            {sub && <span>{sub}</span>}
            {sub && showDate && <span>•</span>}
            {showDate && <span>{formatDateShort(r)}</span>}
            {overdue && <span className="text-red-400 font-medium">• Atrasada</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {tipo && (
          <span className="w-8 h-5 rounded flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: tipo.cor + '20', color: tipo.cor }}>
            {tipo.label}
          </span>
        )}
        {!r.concluida ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={completing === r.id}
            onClick={() => onComplete(r.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-500/15 border border-accent-500/30 text-accent-400 hover:bg-accent-500/25 transition-all disabled:opacity-50"
          >
            {completing === r.id
              ? <div className="w-3.5 h-3.5 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
              : <FiCheck size={14} />
            }
          </motion.button>
        ) : (
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-500/10 text-accent-400/50">
            <FiCheck size={14} />
          </span>
        )}
      </div>
    </div>
  )
}

function GroupSection({ title, icon: Icon, iconColor, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!count) return null

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-2 group"
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon size={13} />
          </div>
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="text-xs text-slate-500 font-medium">{count}</span>
        </div>
        <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== PAGINA PRINCIPAL ====================
export default function Revisoes() {
  const [revisoes, setRevisoes] = useState([])
  const [todayPending, setTodayPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [completing, setCompleting] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [calendario, setCalendario] = useState([])
  const [mes, setMes] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      revisaoService.getToday(),
      revisaoService.getAll({ pendentes: filter === 'pending' ? 'true' : undefined })
    ])
      .then(([today, all]) => {
        setTodayPending(today.data || [])
        setRevisoes(all.data || [])
      })
      .catch(() => {
        setTodayPending([])
        setRevisoes([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [filter])

  // Carrega calendario ao mudar de mes
  useEffect(() => {
    const mesStr = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`
    revisaoService.getCalendar(mesStr)
      .then(r => setCalendario(r.data || []))
      .catch(() => setCalendario([]))
  }, [mes])

  const handleComplete = async (id) => {
    setCompleting(id)
    try {
      await revisaoService.complete(id)
      setTodayPending(ts => ts.filter(r => r.id !== id))
      setRevisoes(rs => rs.map(r => r.id === id ? { ...r, concluida: true } : r))
      toast.success('Revisao concluida! +5 XP')
      // Atualiza calendario
      const mesStr = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`
      revisaoService.getCalendar(mesStr)
        .then(r => setCalendario(r.data || []))
        .catch(() => {})
    } catch { toast.error('Erro ao concluir') }
    finally { setCompleting(null) }
  }

  if (loading) return <Loader text="Carregando revisoes..." />

  const groups = groupByDate(revisoes)
  const overdueCount = todayPending.filter(r => isOverdue(r)).length
  const todayCount = todayPending.filter(r => isToday(r)).length
  const totalPending = todayPending.length

  // Revisoes filtradas pelo dia selecionado no calendario
  const filteredRevisoes = selectedDay
    ? revisoes.filter(r => {
        const dataStr = r.data_revisao_str || getDateStr(r.data_revisao)
        return dataStr === selectedDay
      })
    : null

  const selectedDayLabel = selectedDay
    ? (() => {
        const d = parseDate(selectedDay)
        if (selectedDay === getTodayStr()) return 'Hoje'
        return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
      })()
    : null

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <PageHeader
        emoji="🔄"
        title="Revisoes"
        subtitle="Revisao espacada automatica — nunca mais esqueca o que estudou"
        badge={totalPending > 0 ? `${totalPending} pendente${totalPending > 1 ? 's' : ''}` : 'Em dia'}
      />

      {/* Stats resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3.5 text-center">
          <p className={`text-xl font-black ${overdueCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
            {overdueCount}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Atrasadas</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-xl font-black text-yellow-400">{todayCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Para hoje</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-xl font-black text-accent-400">{groups.week.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Esta semana</p>
        </Card>
      </div>

      {/* Alerta de urgencia */}
      {overdueCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <FiAlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              {overdueCount} revisao{overdueCount > 1 ? 'es' : ''} atrasada{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-300/60">
              Revisoes atrasadas perdem eficacia. Complete-as o mais rapido possivel.
            </p>
          </div>
        </motion.div>
      )}

      {/* Calendario + Lista */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Calendario */}
        <Card accent="#6366f1" className="p-5 lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              <FiCalendar size={18} className="text-brand-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Calendario de Revisoes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Clique em um dia para ver as revisoes</p>
            </div>
          </div>
          <CalendarioRevisoes
            calendario={calendario}
            mes={mes}
            onMesChange={setMes}
            selectedDay={selectedDay}
            onDayClick={setSelectedDay}
          />
        </Card>

        {/* Painel lateral: revisoes do dia selecionado OU pendentes */}
        <Card accent={selectedDay ? '#f59e0b' : '#10b981'} className="p-5 lg:col-span-2 flex flex-col">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            {selectedDay ? (
              <>
                <FiCalendar size={16} className="text-yellow-400" />
                Revisoes — {selectedDayLabel}
                <button
                  onClick={() => setSelectedDay(null)}
                  className="ml-auto text-xs text-slate-400 hover:text-white border border-white/10 px-2 py-1 rounded-lg transition-all"
                >
                  Ver todas
                </button>
              </>
            ) : (
              <>
                <FiClock size={16} className="text-accent-400" />
                Pendentes para hoje
              </>
            )}
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[420px] scrollbar-thin space-y-1.5">
            {selectedDay ? (
              filteredRevisoes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">Nenhuma revisao neste dia.</p>
                </div>
              ) : (
                filteredRevisoes.map(r => (
                  <RevisaoRow key={r.id} r={r} completing={completing} onComplete={handleComplete} showDate={false} />
                ))
              )
            ) : (
              todayPending.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-accent-400 text-sm font-medium">Tudo em dia!</p>
                  <p className="text-slate-500 text-xs mt-1">Nenhuma revisao pendente.</p>
                </div>
              ) : (
                todayPending.map(r => (
                  <RevisaoRow key={r.id} r={r} completing={completing} onComplete={handleComplete} />
                ))
              )
            )}
          </div>
        </Card>
      </div>

      {/* Filters + info toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-dark-700/60 rounded-xl">
          {[{v:'pending',l:'Pendentes'},{v:'all',l:'Todas'}].map(({v,l}) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === v
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}>
              {l}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            showInfo ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-700 text-slate-500 hover:text-white'
          }`}
        >
          <FiInfo size={14} />
        </button>
      </div>

      {/* How it works */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-300 mb-3">Como funciona a Revisao Espacada</p>
              <div className="flex gap-2">
                {Object.entries(TIPO_INFO).map(([tipo, info]) => (
                  <div key={tipo} className="flex-1 p-2 rounded-lg border text-center"
                    style={{ backgroundColor: info.cor + '10', borderColor: info.cor + '30' }}>
                    <p className="text-sm font-black" style={{ color: info.cor }}>{tipo}</p>
                    <p className="text-[10px] text-slate-400">{info.labelFull}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Ao registrar uma sessao de estudo, o sistema agenda 4 revisoes automaticamente para fixar o conteudo na memoria de longo prazo.
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista completa agrupada */}
      {!revisoes.length ? (
        <EmptyState
          icon={FiCalendar}
          title={filter === 'pending' ? 'Nenhuma revisao pendente' : 'Nenhuma revisao encontrada'}
          description="Estude uma materia no cronometro para que revisoes sejam agendadas automaticamente."
        />
      ) : (
        <div className="space-y-2">
          <GroupSection
            title="Atrasadas"
            icon={FiAlertTriangle}
            iconColor="bg-red-500/15 text-red-400"
            count={groups.overdue.length}
            defaultOpen={true}
          >
            {groups.overdue.map(r => (
              <RevisaoRow key={r.id} r={r} completing={completing} onComplete={handleComplete} />
            ))}
          </GroupSection>

          <GroupSection
            title="Hoje"
            icon={FiClock}
            iconColor="bg-yellow-500/15 text-yellow-400"
            count={groups.today.length}
            defaultOpen={true}
          >
            {groups.today.map(r => (
              <RevisaoRow key={r.id} r={r} completing={completing} onComplete={handleComplete} showDate={false} />
            ))}
          </GroupSection>

          <GroupSection
            title="Proximos 7 dias"
            icon={FiCalendar}
            iconColor="bg-brand-500/15 text-brand-400"
            count={groups.week.length}
            defaultOpen={true}
          >
            {groups.week.map(r => (
              <RevisaoRow key={r.id} r={r} completing={completing} onComplete={handleComplete} />
            ))}
          </GroupSection>

          <GroupSection
            title={filter === 'pending' ? 'Mais tarde' : 'Mais tarde / Concluidas'}
            icon={FiBookOpen}
            iconColor="bg-slate-500/15 text-slate-400"
            count={groups.later.length}
            defaultOpen={false}
          >
            {groups.later.map(r => (
              <RevisaoRow key={r.id} r={r} completing={completing} onComplete={handleComplete} />
            ))}
          </GroupSection>
        </div>
      )}
    </div>
  )
}
