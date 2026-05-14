import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCalendar, FiCheck, FiClock, FiAlertTriangle, FiBookOpen,
  FiChevronDown, FiChevronUp, FiInfo
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

function getLabel(r) {
  return r.conteudo_titulo || r.assunto_nome || r.materia_nome
}

function getSub(r) {
  const label = getLabel(r)
  if (label !== r.materia_nome) return r.materia_nome
  return null
}

function isOverdue(r) {
  if (!r.data_revisao) return false
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const data = new Date(r.data_revisao); data.setHours(0,0,0,0)
  return data < hoje
}

function isToday(r) {
  if (!r.data_revisao) return false
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const data = new Date(r.data_revisao); data.setHours(0,0,0,0)
  return data.getTime() === hoje.getTime()
}

function groupByDate(revisoes) {
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const groups = { overdue: [], today: [], week: [], later: [] }

  revisoes.forEach(r => {
    if (r.concluida) { groups.later.push(r); return }
    const data = new Date(r.data_revisao); data.setHours(0,0,0,0)
    const diff = Math.floor((data - hoje) / 86400000)
    if (diff < 0) groups.overdue.push(r)
    else if (diff === 0) groups.today.push(r)
    else if (diff <= 7) groups.week.push(r)
    else groups.later.push(r)
  })

  return groups
}

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
            {showDate && r.data_revisao && (
              <span>{new Date(r.data_revisao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            )}
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

function GroupSection({ title, icon: Icon, iconColor, count, children, defaultOpen = true, accent }) {
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

export default function Revisoes() {
  const [revisoes, setRevisoes] = useState([])
  const [todayPending, setTodayPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [completing, setCompleting] = useState(null)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      revisaoService.getToday(),
      revisaoService.getAll({ pendentes: filter === 'pending' })
    ])
      .then(([today, all]) => {
        setTodayPending(today.data)
        setRevisoes(all.data)
      })
      .catch(() => {
        setTodayPending(MOCK_TODAY)
        setRevisoes(MOCK_ALL)
      })
      .finally(() => setLoading(false))
  }, [filter])

  const handleComplete = async (id) => {
    setCompleting(id)
    try {
      await revisaoService.complete(id)
      setTodayPending(ts => ts.filter(r => r.id !== id))
      setRevisoes(rs => rs.filter(r => r.id !== id))
      toast.success('Revisão concluída! +5 XP')
    } catch { toast.error('Erro ao concluir') }
    finally { setCompleting(null) }
  }

  if (loading) return <Loader text="Carregando revisões..." />

  const groups = groupByDate(revisoes)
  const overdueCount = todayPending.filter(r => isOverdue(r)).length
  const todayCount = todayPending.filter(r => isToday(r)).length
  const totalPending = todayPending.length

  // Stats rápidas
  const totalRevisoes = revisoes.length
  const completedCount = revisoes.filter(r => r.concluida).length
  const pendingCount = totalRevisoes - completedCount

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <PageHeader
        emoji="🔄"
        title="Revisões"
        subtitle="Revisão espaçada automática — nunca mais esqueça o que estudou"
        badge={totalPending > 0 ? `${totalPending} pendente${totalPending > 1 ? 's' : ''}` : 'Em dia ✓'}
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

      {/* Alerta de urgência */}
      {overdueCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <FiAlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              {overdueCount} revisão{overdueCount > 1 ? 'ões' : ''} atrasada{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-300/60">
              Revisões atrasadas perdem eficácia. Complete-as o mais rápido possível.
            </p>
          </div>
        </motion.div>
      )}

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

      {/* How it works — collapsible */}
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
              <p className="text-xs font-semibold text-slate-300 mb-3">Como funciona a Revisão Espaçada</p>
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
                Ao registrar uma sessão de estudo, o sistema agenda 4 revisões automaticamente para fixar o conteúdo na memória de longo prazo.
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista agrupada */}
      {!revisoes.length ? (
        <EmptyState
          icon={FiCalendar}
          title={filter === 'pending' ? 'Nenhuma revisão pendente' : 'Nenhuma revisão encontrada'}
          description="Estude uma matéria no cronômetro para que revisões sejam agendadas automaticamente."
        />
      ) : (
        <div className="space-y-2">
          {/* Atrasadas */}
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

          {/* Hoje */}
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

          {/* Esta semana */}
          <GroupSection
            title="Próximos 7 dias"
            icon={FiCalendar}
            iconColor="bg-brand-500/15 text-brand-400"
            count={groups.week.length}
            defaultOpen={true}
          >
            {groups.week.map(r => (
              <RevisaoRow key={r.id} r={r} completing={completing} onComplete={handleComplete} />
            ))}
          </GroupSection>

          {/* Depois / concluídas */}
          <GroupSection
            title={filter === 'pending' ? 'Mais tarde' : 'Mais tarde / Concluídas'}
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

const today = new Date().toISOString()
const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString()
const inThreeDays = new Date(Date.now() + 86400000 * 3).toISOString()

const MOCK_TODAY = [
  { id:1, materia_nome:'Direito Constitucional', assunto_nome:'Princípios Fundamentais', materia_cor:'#6366f1', tipo:'24h', data_revisao: today },
  { id:2, materia_nome:'Português', assunto_nome:'Concordância Verbal', materia_cor:'#10b981', tipo:'7d', data_revisao: today },
  { id:3, materia_nome:'Raciocínio Lógico', materia_cor:'#f59e0b', tipo:'24h', data_revisao: twoDaysAgo },
]
const MOCK_ALL = [
  ...MOCK_TODAY,
  { id:4, materia_nome:'Informática', assunto_nome:'Redes', materia_cor:'#3b82f6', tipo:'30d', data_revisao: inThreeDays },
  { id:5, materia_nome:'Direito Administrativo', materia_cor:'#8b5cf6', tipo:'90d', data_revisao:'2024-06-15' },
]
