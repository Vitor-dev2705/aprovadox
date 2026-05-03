import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiTarget, FiPlus, FiCalendar, FiEdit2, FiTrash2, FiBook, FiAlertCircle } from 'react-icons/fi'
import { concursoService } from '../services/concurso.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import Loader from '../components/ui/Loader'
import toast from 'react-hot-toast'

const EMPTY_FORM = { nome: '', banca: '', cargo: '', data_prova: '', edital_url: '' }

function DaysRemaining({ date }) {
  if (!date) return <Badge variant="default">Sem data</Badge>
  const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return <Badge variant="danger">Prova encerrada</Badge>
  if (days <= 30) return <Badge variant="danger">⚠️ {days} dias</Badge>
  if (days <= 90) return <Badge variant="warning">🕐 {days} dias</Badge>
  return <Badge variant="success">📅 {days} dias</Badge>
}

export default function Concursos() {
  const [concursos, setConcursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    concursoService.getAll()
      .then(r => setConcursos(r.data))
      .catch(() => setConcursos(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (c) => { setEditItem(c); setForm({ nome: c.nome, banca: c.banca || '', cargo: c.cargo || '', data_prova: c.data_prova?.split('T')[0] || '', edital_url: c.edital_url || '' }); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        const r = await concursoService.update(editItem.id, form)
        setConcursos(cs => cs.map(c => c.id === editItem.id ? r.data : c))
        toast.success('Concurso atualizado!')
      } else {
        const r = await concursoService.create(form)
        setConcursos(cs => [r.data, ...cs])
        toast.success('Concurso adicionado!')
      }
      setModalOpen(false)
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover este concurso?')) return
    try {
      await concursoService.delete(id)
      setConcursos(cs => cs.filter(c => c.id !== id))
      toast.success('Concurso removido')
    } catch { toast.error('Erro ao remover') }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Concursos 🎯</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie seus concursos e acompanhe prazos</p>
        </div>
        <Button onClick={openAdd} icon={<FiPlus size={16} />}>Adicionar</Button>
      </div>

      {!concursos.length ? (
        <EmptyState icon={FiTarget} title="Nenhum concurso cadastrado"
          description="Adicione o concurso que está estudando para organizar melhor seu preparo."
          action={openAdd} actionLabel="Adicionar Concurso" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {concursos.map((c, i) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="p-5 h-full flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                      <FiTarget size={18} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{c.nome}</h3>
                      {c.banca && <p className="text-xs text-slate-500">{c.banca}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                {c.cargo && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FiBook size={12} />
                    <span>{c.cargo}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                  {c.data_prova && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FiCalendar size={12} />
                      <span>{new Date(c.data_prova).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  <DaysRemaining date={c.data_prova} />
                </div>

                {c.total_materias > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <FiBook size={12} />
                    <span>{c.total_materias} matérias vinculadas</span>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Concurso' : 'Novo Concurso'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome do Concurso" placeholder="Ex: Concurso TJ-SP 2024" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Banca" placeholder="Ex: FCC, CESPE" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
            <Input label="Cargo" placeholder="Ex: Analista" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} />
          </div>
          <Input label="Data da Prova" type="date" value={form.data_prova} onChange={e => setForm({...form, data_prova: e.target.value})} />
          <Input label="Link do Edital (opcional)" placeholder="https://..." value={form.edital_url} onChange={e => setForm({...form, edital_url: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const MOCK = [
  { id: 1, nome: 'Concurso TJ-SP', banca: 'VUNESP', cargo: 'Analista Judiciário', data_prova: '2024-08-15', total_materias: 5 },
  { id: 2, nome: 'Receita Federal', banca: 'ESAF', cargo: 'Auditor-Fiscal', data_prova: '2024-11-20', total_materias: 8 },
]
