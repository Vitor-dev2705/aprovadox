import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertCircle, FiPlus, FiCheck, FiTrash2, FiChevronDown, FiFilter } from 'react-icons/fi'
import { questaoService } from '../services/questao.service'
import { materiaService } from '../services/materia.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Loader from '../components/ui/Loader'
import toast from 'react-hot-toast'

const EMPTY_FORM = { materia_id: '', questao: '', erro_cometido: '', explicacao_correta: '' }

function QuestaoCard({ q, onRevised, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${q.revisada ? 'bg-accent-400' : 'bg-red-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {q.materia_nome && (
                  <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                    style={{ backgroundColor: (q.materia_cor || '#6366f1') + '25', borderColor: (q.materia_cor || '#6366f1') + '60', color: q.materia_cor || '#818cf8' }}>
                    {q.materia_nome}
                  </span>
                )}
                <Badge variant={q.revisada ? 'success' : 'danger'}>{q.revisada ? '✅ Revisada' : '❌ Não revisada'}</Badge>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!q.revisada && (
                  <button onClick={() => onRevised(q.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-accent-400 hover:bg-accent-500/10 transition-all">
                    <FiCheck size={14} />
                  </button>
                )}
                <button onClick={() => onDelete(q.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-300 line-clamp-2">{q.questao}</p>
            <p className="text-xs text-slate-500 mt-1">{new Date(q.created_at).toLocaleDateString('pt-BR')}</p>

            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors mt-2">
              Ver detalhes
              <motion.div animate={{ rotate: expanded ? 180 : 0 }}><FiChevronDown size={12} /></motion.div>
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
                    {q.erro_cometido && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-xs font-semibold text-red-400 mb-1">❌ Erro cometido</p>
                        <p className="text-xs text-slate-300">{q.erro_cometido}</p>
                      </div>
                    )}
                    {q.explicacao_correta && (
                      <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                        <p className="text-xs font-semibold text-accent-400 mb-1">✅ Explicação correta</p>
                        <p className="text-xs text-slate-300">{q.explicacao_correta}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Questoes() {
  const [questoes, setQuestoes] = useState([])
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filterMateria, setFilterMateria] = useState('')
  const [filterRevisada, setFilterRevisada] = useState('')

  useEffect(() => {
    Promise.all([
      questaoService.getAll(),
      materiaService.getAll()
    ])
      .then(([q, m]) => { setQuestoes(q.data); setMaterias(m.data) })
      .catch(() => { setQuestoes(MOCK); setMaterias([]) })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await questaoService.create(form)
      setQuestoes(qs => [r.data, ...qs])
      setModalOpen(false); setForm(EMPTY_FORM)
      toast.success('Questão salva!')
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  const handleRevised = async (id) => {
    try {
      const r = await questaoService.markReviewed(id)
      setQuestoes(qs => qs.map(q => q.id === id ? r.data : q))
      toast.success('Marcada como revisada!')
    } catch { toast.error('Erro') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover?')) return
    try { await questaoService.delete(id); setQuestoes(qs => qs.filter(q => q.id !== id)) }
    catch { toast.error('Erro') }
  }

  const filtered = questoes.filter(q => {
    if (filterMateria && q.materia_id != filterMateria) return false
    if (filterRevisada === 'true' && !q.revisada) return false
    if (filterRevisada === 'false' && q.revisada) return false
    return true
  })

  const pendentes = questoes.filter(q => !q.revisada).length

  if (loading) return <Loader />

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Questões Erradas ❌</h1>
          <p className="text-slate-400 text-sm mt-1">{pendentes} para revisar · {questoes.length} total</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<FiPlus size={16} />}>Registrar</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-white">{questoes.length}</p>
          <p className="text-xs text-slate-400">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-red-400">{pendentes}</p>
          <p className="text-xs text-slate-400">Pendentes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-accent-400">{questoes.length - pendentes}</p>
          <p className="text-xs text-slate-400">Revisadas</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-400"><FiFilter size={14} /></div>
        <select className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
          value={filterMateria} onChange={e => setFilterMateria(e.target.value)}>
          <option value="">Todas as matérias</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <select className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
          value={filterRevisada} onChange={e => setFilterRevisada(e.target.value)}>
          <option value="">Todas</option>
          <option value="false">Não revisadas</option>
          <option value="true">Revisadas</option>
        </select>
      </div>

      {!filtered.length ? (
        <EmptyState icon={FiAlertCircle} title="Nenhuma questão encontrada"
          description="Registre questões que errou para revisar depois e fixar o conteúdo."
          action={() => setModalOpen(true)} actionLabel="Registrar Questão" />
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.03 }}>
              <QuestaoCard q={q} onRevised={handleRevised} onDelete={handleDelete} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Questão Errada" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <Select label="Matéria" options={materias.map(m => ({ value: m.id, label: m.nome }))}
            placeholder="Selecione a matéria" value={form.materia_id}
            onChange={e => setForm({...form, materia_id: e.target.value})} />

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Questão / Enunciado</label>
            <textarea className="input-field text-sm resize-none h-24" placeholder="Cole ou escreva a questão..."
              value={form.questao} onChange={e => setForm({...form, questao: e.target.value})} required />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Por que errei?</label>
            <textarea className="input-field text-sm resize-none h-16" placeholder="Descreva o erro cometido..."
              value={form.erro_cometido} onChange={e => setForm({...form, erro_cometido: e.target.value})} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Explicação correta</label>
            <textarea className="input-field text-sm resize-none h-16" placeholder="Explique a resposta correta..."
              value={form.explicacao_correta} onChange={e => setForm({...form, explicacao_correta: e.target.value})} />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const MOCK = [
  { id:1, materia_id:1, materia_nome:'Direito Constitucional', materia_cor:'#6366f1', questao:'Segundo a CF/88, são poderes da União, independentes e harmônicos entre si...', erro_cometido:'Confundi com os princípios da administração', explicacao_correta:'Os poderes são Legislativo, Executivo e Judiciário conforme Art. 2º CF/88', revisada:false, created_at:'2024-03-01' },
  { id:2, materia_id:2, materia_nome:'Português', materia_cor:'#10b981', questao:'Identifique a oração subordinada adverbial causal...', erro_cometido:'Marquei a concessiva em vez da causal', explicacao_correta:'Causa indica motivo, concessão indica obstáculo', revisada:true, created_at:'2024-03-05' },
]
