import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiCheck, FiClock, FiAlertTriangle } from 'react-icons/fi'
import { revisaoService } from '../services/revisao.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import toast from 'react-hot-toast'

function getRevisaoLabel(r) {
  return r.conteudo_titulo || r.assunto_nome || r.materia_nome
}

function getRevisaoSub(r) {
  const label = getRevisaoLabel(r)
  if (label !== r.materia_nome) return r.materia_nome
  return TIPO_INFO[r.tipo]?.label || r.tipo
}

function isOverdue(r) {
  if (!r.data_revisao) return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = new Date(r.data_revisao)
  data.setHours(0, 0, 0, 0)
  return data < hoje
}

const TIPO_INFO = {
  '24h': { label: '24 horas', color: 'danger', bg: 'bg-red-500/20 border-red-500/30 text-red-300' },
  '7d':  { label: '7 dias',   color: 'warning', bg: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' },
  '30d': { label: '30 dias',  color: 'primary', bg: 'bg-brand-500/20 border-brand-500/30 text-brand-300' },
  '90d': { label: '90 dias',  color: 'success', bg: 'bg-accent-500/20 border-accent-500/30 text-accent-300' },
}

export default function Revisoes() {
  const [revisoes, setRevisoes] = useState([])
  const [todayPending, setTodayPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [completing, setCompleting] = useState(null)

  useEffect(() => {
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
      toast.success('✅ Revisão concluída! +5 XP')
    } catch { toast.error('Erro ao concluir') }
    finally { setCompleting(null) }
  }

  if (loading) return <Loader />

  const overdueCount = todayPending.filter(r => isOverdue(r)).length
  const todayOnlyCount = todayPending.length - overdueCount

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="🔄"
        title="Revisões"
        subtitle="Sistema de revisão espaçada automática"
        badge={todayPending.length > 0 ? `${todayPending.length} pendente${todayPending.length > 1 ? 's' : ''}` : 'Em dia'}
      />

      {/* Today alert */}
      {todayPending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/15 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              {overdueCount > 0
                ? <FiAlertTriangle size={18} className="text-yellow-400" />
                : <FiClock size={18} className="text-yellow-400" />
              }
            </div>
            <div>
              <p className="font-bold text-white">
                {overdueCount > 0 ? 'Revisões pendentes!' : 'Revisões de hoje!'}
              </p>
              <p className="text-sm text-yellow-300">
                {overdueCount > 0 && `${overdueCount} atrasada${overdueCount > 1 ? 's' : ''}`}
                {overdueCount > 0 && todayOnlyCount > 0 && ' • '}
                {todayOnlyCount > 0 && `${todayOnlyCount} para hoje`}
                {overdueCount > 0 && todayOnlyCount === 0 && ' — revise o quanto antes!'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {todayPending.map(r => (
              <div key={r.id} className={`flex items-center justify-between gap-3 rounded-xl p-3 ${isOverdue(r) ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-700/60'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.materia_cor || '#6366f1' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{getRevisaoLabel(r)}</p>
                    <p className="text-xs text-slate-500">
                      {getRevisaoSub(r)}
                      {isOverdue(r) && <span className="text-red-400 ml-1">• Atrasada</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${TIPO_INFO[r.tipo]?.bg || 'bg-slate-500/20 border-slate-500/30 text-slate-300'}`}>
                    {TIPO_INFO[r.tipo]?.label || r.tipo}
                  </span>
                  <Button size="sm" variant="success" loading={completing === r.id} onClick={() => handleComplete(r.id)} icon={<FiCheck size={12} />}>
                    Feito
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {[{v:'pending',l:'Pendentes'},{v:'all',l:'Todas'}].map(({v,l}) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === v ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* How it works */}
      <Card className="p-5">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <FiCalendar size={16} className="text-brand-400" /> Como funciona a Revisão Espaçada
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(TIPO_INFO).map(([tipo, info]) => (
            <div key={tipo} className={`p-3 rounded-xl border text-center ${info.bg}`}>
              <p className="text-lg font-black">{tipo}</p>
              <p className="text-xs opacity-80">{info.label} após estudar</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Após registrar uma sessão de estudo (com matéria, conteúdo ou assunto), o sistema agenda automaticamente revisões para te ajudar a memorizar de forma definitiva.
        </p>
      </Card>

      {/* List */}
      {!revisoes.length ? (
        <EmptyState icon={FiCalendar} title="Nenhuma revisão pendente"
          description="Estude uma matéria para que o sistema agende revisões automáticas." />
      ) : (
        <div className="space-y-2">
          {revisoes.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
              <Card className={`p-4 ${isOverdue(r) ? 'border-red-500/20' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: r.materia_cor || '#6366f1' }} />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{getRevisaoLabel(r)}</p>
                      <p className="text-xs text-slate-500">
                        {getRevisaoSub(r)} • {new Date(r.data_revisao).toLocaleDateString('pt-BR')}
                        {isOverdue(r) && <span className="text-red-400 ml-1">• Atrasada</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${TIPO_INFO[r.tipo]?.bg || 'bg-slate-500/20 border-slate-500/30 text-slate-300'}`}>
                      {TIPO_INFO[r.tipo]?.label || r.tipo}
                    </span>
                    {!r.concluida && (
                      <Button size="sm" variant="ghost" loading={completing === r.id} onClick={() => handleComplete(r.id)}>
                        <FiCheck size={14} />
                      </Button>
                    )}
                    {r.concluida && (
                      <span className="text-xs text-accent-400 font-medium px-2">✓ Feita</span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const MOCK_TODAY = [
  { id:1, materia_nome:'Direito Constitucional', assunto_nome:'Princípios Fundamentais', materia_cor:'#6366f1', tipo:'24h', data_revisao: new Date().toISOString() },
  { id:2, materia_nome:'Português', assunto_nome:'Concordância Verbal', materia_cor:'#10b981', tipo:'7d', data_revisao: new Date().toISOString() },
  { id:3, materia_nome:'Raciocínio Lógico', materia_cor:'#f59e0b', tipo:'24h', data_revisao: new Date(Date.now() - 86400000 * 2).toISOString() },
]
const MOCK_ALL = [...MOCK_TODAY, { id:4, materia_nome:'Informática', assunto_nome:'Redes', materia_cor:'#3b82f6', tipo:'30d', data_revisao:'2024-04-20' }]
