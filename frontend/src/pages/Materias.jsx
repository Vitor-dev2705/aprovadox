import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBookOpen, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiCheck, FiClock } from 'react-icons/fi'
import { materiaService } from '../services/materia.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import Loader from '../components/ui/Loader'
import toast from 'react-hot-toast'

const CORES = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4']
const EMPTY_FORM = { nome: '', cor: '#6366f1', meta_semanal_horas: 5, assuntos_texto: '' }

function MateriaCard({ materia, onEdit, onDelete, onToggleAssunto }) {
  const [expanded, setExpanded] = useState(false)
  const totalAssuntos = materia.total_assuntos || 0
  const concluidos = materia.assuntos_concluidos || 0
  const pct = totalAssuntos > 0 ? Math.round((concluidos / totalAssuntos) * 100) : 0
  const horas = Math.round((materia.horas_estudadas || 0) / 60 * 10) / 10

  return (
    <Card className="overflow-hidden">
      {/* Color stripe */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${materia.cor}, ${materia.cor}80)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: materia.cor + '25', border: `1px solid ${materia.cor}50` }}>
              <FiBookOpen size={18} style={{ color: materia.cor }} />
            </div>
            <div>
              <h3 className="font-bold text-white">{materia.nome}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <FiClock size={11} />
                <span>{horas}h estudadas</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(materia)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"><FiEdit2 size={14} /></button>
            <button onClick={() => onDelete(materia.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><FiTrash2 size={14} /></button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progresso</span><span>{pct}%</span>
          </div>
          <ProgressBar value={pct} color="brand" size="sm" />
          <p className="text-xs text-slate-500">{concluidos}/{totalAssuntos} assuntos concluídos</p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Meta: {materia.meta_semanal_horas}h/sem</span>
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors">
            Assuntos
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <FiChevronDown size={14} />
            </motion.div>
          </button>
        </div>

        <AnimatePresence>
          {expanded && materia.assuntos?.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-white/5 space-y-1.5 overflow-hidden">
              {materia.assuntos.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 text-sm">
                  <button onClick={() => onToggleAssunto(materia.id, a.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${a.concluido ? 'border-transparent' : 'border-white/20 hover:border-brand-500'}`}
                    style={a.concluido ? { backgroundColor: materia.cor + '90', borderColor: materia.cor } : {}}>
                    {a.concluido && <FiCheck size={11} className="text-white" />}
                  </button>
                  <span className={a.concluido ? 'line-through text-slate-500' : 'text-slate-300'}>{a.nome}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}

export default function Materias() {
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    materiaService.getAll().then(r => setMaterias(r.data)).catch(() => setMaterias(MOCK)).finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (m) => { setEditItem(m); setForm({ nome: m.nome, cor: m.cor, meta_semanal_horas: m.meta_semanal_horas, assuntos_texto: '' }); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, assuntos: form.assuntos_texto.split('\n').map(s => s.trim()).filter(Boolean) }
    try {
      if (editItem) {
        const r = await materiaService.update(editItem.id, payload)
        setMaterias(ms => ms.map(m => m.id === editItem.id ? { ...m, ...r.data } : m))
        toast.success('Matéria atualizada!')
      } else {
        const r = await materiaService.create(payload)
        setMaterias(ms => [...ms, r.data])
        toast.success('Matéria criada!')
      }
      setModalOpen(false)
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover esta matéria?')) return
    try { await materiaService.delete(id); setMaterias(ms => ms.filter(m => m.id !== id)); toast.success('Removida!') }
    catch { toast.error('Erro ao remover') }
  }

  const handleToggleAssunto = async (materiaId, assuntoId) => {
    try {
      const r = await materiaService.toggleAssunto(materiaId, assuntoId)
      setMaterias(ms => ms.map(m => m.id === materiaId
        ? { ...m, assuntos: m.assuntos?.map(a => a.id === assuntoId ? r.data : a) }
        : m))
    } catch { toast.error('Erro ao atualizar assunto') }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Matérias 📚</h1>
          <p className="text-slate-400 text-sm mt-1">{materias.length} matérias cadastradas</p>
        </div>
        <Button onClick={openAdd} icon={<FiPlus size={16} />}>Nova Matéria</Button>
      </div>

      {!materias.length ? (
        <EmptyState icon={FiBookOpen} title="Nenhuma matéria cadastrada"
          description="Crie suas matérias para organizar o estudo e acompanhar seu progresso."
          action={openAdd} actionLabel="Criar Matéria" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {materias.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <MateriaCard materia={m} onEdit={openEdit} onDelete={handleDelete} onToggleAssunto={handleToggleAssunto} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Matéria' : 'Nova Matéria'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome da Matéria" placeholder="Ex: Direito Constitucional" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {CORES.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, cor: c})}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{ backgroundColor: c, outline: form.cor === c ? `2px solid white` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          <Input label="Meta Semanal (horas)" type="number" min="1" max="40"
            value={form.meta_semanal_horas} onChange={e => setForm({...form, meta_semanal_horas: e.target.value})} />

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Assuntos (um por linha)</label>
            <textarea placeholder="Princípios Constitucionais&#10;Direitos Fundamentais&#10;Organização do Estado"
              className="input-field text-sm resize-none h-28"
              value={form.assuntos_texto} onChange={e => setForm({...form, assuntos_texto: e.target.value})} />
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
  { id:1, nome:'Direito Constitucional', cor:'#6366f1', meta_semanal_horas:8, horas_estudadas:720, total_assuntos:12, assuntos_concluidos:5,
    assuntos:[{id:1,nome:'Princípios Fundamentais',concluido:true},{id:2,nome:'Direitos Fundamentais',concluido:false}]},
  { id:2, nome:'Português', cor:'#10b981', meta_semanal_horas:5, horas_estudadas:480, total_assuntos:8, assuntos_concluidos:3, assuntos:[]},
  { id:3, nome:'Raciocínio Lógico', cor:'#f59e0b', meta_semanal_horas:4, horas_estudadas:300, total_assuntos:10, assuntos_concluidos:2, assuntos:[]},
]
