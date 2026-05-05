import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiCheck, FiClock, FiBookOpen, FiFilter } from 'react-icons/fi'
import { revisaoService } from '../services/revisao.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Loader from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const TIPO_INFO = {
  '24h': { label: '24 horas', color: 'danger', bg: 'bg-red-500/20 border-red-500/30 text-red-300' },
  '7d':  { label: '7 dias',   color: 'warning', bg: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' },
  '15d': { label: '15 dias',  color: 'orange', bg: 'bg-orange-500/20 border-orange-500/30 text-orange-300' },
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

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-black text-white">Revisões 🔄</h1>
        <p className="text-slate-400 text-sm mt-1">Sistema de revisão espaçada automática</p>
      </div>

      {/* Today alert */}
      {todayPending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/15 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <FiClock size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-white">Revisões de hoje!</p>
              <p className="text-sm text-yellow-300">{todayPending.length} revisão(ões) pendente(s)</p>
            </div>
          </div>
          <div className="space-y-2">
            {todayPending.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3 bg-dark-700/60 rounded-xl p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.materia_cor || '#6366f1' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.conteudo_titulo || r.assunto_nome || r.materia_nome}</p>
                    <p className="text-xs text-slate-500">{r.materia_nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${TIPO_INFO[r.tipo]?.bg}`}>
                    {TIPO_INFO[r.tipo]?.label}
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
          Após registrar uma sessão de estudo com um conteúdo selecionado, o sistema agenda automaticamente revisões para te ajudar a memorizar de forma definitiva.
        </p>
      </Card>

      {/* List */}
      {!revisoes.length ? (
        <EmptyState icon={FiCalendar} title="Nenhuma revisão pendente"
          description="Estude um conteúdo para que o sistema agende revisões automáticas." />
      ) : (
        <div className="space-y-2">
          {revisoes.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: r.materia_cor || '#6366f1' }} />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{r.conteudo_titulo || r.assunto_nome || r.materia_nome}</p>
                      <p className="text-xs text-slate-500">
                        {r.materia_nome} • {new Date(r.data_revisao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${TIPO_INFO[r.tipo]?.bg}`}>
                      {TIPO_INFO[r.tipo]?.label}
                    </span>
                    <Button size="sm" variant="ghost" loading={completing === r.id} onClick={() => handleComplete(r.id)}>
                      <FiCheck size={14} />
                    </Button>
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
  { id:1, materia_nome:'Direito Constitucional', assunto_nome:'Princípios Fundamentais', materia_cor:'#6366f1', tipo:'24h' },
  { id:2, materia_nome:'Português', assunto_nome:'Concordância Verbal', materia_cor:'#10b981', tipo:'7d' },
]
const MOCK_ALL = [...MOCK_TODAY, { id:3, materia_nome:'Raciocínio Lógico', assunto_nome:'Proposições', materia_cor:'#f59e0b', tipo:'30d', data_revisao:'2024-04-20' }]
