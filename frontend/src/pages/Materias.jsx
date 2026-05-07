import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBookOpen, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiClock,
  FiVideo, FiFileText, FiGlobe, FiBook, FiEdit, FiLayers, FiExternalLink, FiList
} from 'react-icons/fi'
import { materiaService } from '../services/materia.service'
import { conteudoService } from '../services/conteudo.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import Loader from '../components/ui/Loader'
import PageHeader from '../components/ui/PageHeader'
import toast from 'react-hot-toast'

const CORES = [
  '#6366f1', '#10b981', '#f59e0b', '#3b82f6', 
  '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#a855f7', '#14b8a6',
  '#f43f5e', '#64748b', '#22c55e', '#eab308'
]
const EMPTY_FORM = { nome: '', cor: '#6366f1', conteudos_texto: '' }
const EMPTY_CONTEUDO = { titulo: '', tipo: 'anotacao', url: '', descricao: '' }

const TIPOS_CONTEUDO = [
  { value: 'Conteúdo',  label: 'Conteúdo',  icon: FiEdit,     color: '#64748b' },
]

const getTipoInfo = (tipo) => TIPOS_CONTEUDO.find(t => t.value === tipo) || TIPOS_CONTEUDO[6]

/** Item de Conteúdo — SEM CHECKBOX, apenas info e ações */
function ConteudoItem({ conteudo, onDelete, onEdit }) {
  const info = getTipoInfo(conteudo.tipo)
  const Icon = info.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="group flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-dark-600/30 hover:border-white/10 transition-all"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: info.color + '20', border: `1px solid ${info.color}40` }}>
        <Icon size={16} style={{ color: info.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{conteudo.titulo}</p>
        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: info.color }}>{info.label}</span>
        {conteudo.descricao && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{conteudo.descricao}</p>}
        {conteudo.url && (
          <a href={conteudo.url} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1">
            <FiExternalLink size={11} /> Abrir link
          </a>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(conteudo)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
          <FiEdit2 size={12} />
        </button>
        <button onClick={() => onDelete(conteudo.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
          <FiTrash2 size={12} />
        </button>
      </div>
    </motion.div>
  )
}

/** Card de Matéria — apenas conteúdos, sem progresso/assuntos/meta */
function MateriaCard({ materia, onEdit, onDelete, onAddConteudo }) {
  const [expanded, setExpanded] = useState(false)
  const [conteudos, setConteudos] = useState([])
  const [loadingConteudos, setLoadingConteudos] = useState(false)

  const horas = Math.round((materia.horas_estudadas || 0) / 60 * 10) / 10

  const loadConteudos = async () => {
    setLoadingConteudos(true)
    try {
      const r = await conteudoService.getByMateria(materia.id)
      setConteudos(r.data)
    } catch { setConteudos([]) }
    finally { setLoadingConteudos(false) }
  }

  useEffect(() => {
    if (expanded) loadConteudos()
    // eslint-disable-next-line
  }, [expanded])

  const handleDeleteConteudo = async (id) => {
    if (!confirm('Remover este conteúdo?')) return
    try {
      await conteudoService.delete(id)
      setConteudos(cs => cs.filter(c => c.id !== id))
      toast.success('Conteúdo removido')
    } catch { toast.error('Erro') }
  }

  return (
    <Card accent={materia.cor} className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: materia.cor + '25', border: `1px solid ${materia.cor}50` }}>
              <FiBookOpen size={22} style={{ color: materia.cor }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{materia.nome}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><FiClock size={11} /> {horas}h</span>
                <span className="flex items-center gap-1"><FiList size={11} /> {conteudos.length || materia.total_conteudos || '0'} conteúdos</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(materia)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
              <FiEdit2 size={14} />
            </button>
            <button onClick={() => onDelete(materia.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-dark-600/50 hover:bg-dark-600 transition-all text-sm text-brand-400 font-medium">
          <span className="flex items-center gap-2">
            <FiList size={14} />
            {expanded ? 'Recolher conteúdos' : 'Ver conteúdos'}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <FiChevronDown size={14} />
          </motion.div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">📚 Conteúdos</p>
                </div>

                {loadingConteudos ? (
                  <div className="text-center py-4">
                    <div className="inline-block w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  </div>
                ) : conteudos.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Nenhum conteúdo ainda. Adicione tópicos como "Morfologia", "Sintaxe", etc.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conteudos.map(c => (
                      <ConteudoItem key={c.id} conteudo={c}
                        onDelete={handleDeleteConteudo}
                        onEdit={(item) => onAddConteudo(materia, item, loadConteudos)}
                      />
                    ))}
                  </div>
                )}

                <Button size="sm" variant="outline" className="w-full mt-3"
                  onClick={() => onAddConteudo(materia, null, loadConteudos)}
                  icon={<FiPlus size={12} />}>
                  Adicionar Conteúdo
                </Button>
              </div>
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
  const [modalTab, setModalTab] = useState('basico')
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Conteúdo modal
  const [conteudoModalOpen, setConteudoModalOpen] = useState(false)
  const [conteudoForm, setConteudoForm] = useState(EMPTY_CONTEUDO)
  const [conteudoEditId, setConteudoEditId] = useState(null)
  const [conteudoMateria, setConteudoMateria] = useState(null)
  const [conteudoRefreshFn, setConteudoRefreshFn] = useState(() => () => {})
  const [savingConteudo, setSavingConteudo] = useState(false)

  useEffect(() => {
    materiaService.getAll().then(r => setMaterias(r.data)).catch(() => setMaterias([])).finally(() => setLoading(false))
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setModalTab('basico')
    setModalOpen(true)
  }
  const openEdit = (m) => {
    setEditItem(m)
    setForm({ nome: m.nome, cor: m.cor, conteudos_texto: '' })
    setModalTab('basico')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    const conteudos = form.conteudos_texto.split('\n').map(s => s.trim()).filter(Boolean)
    try {
      if (editItem) {
        const r = await materiaService.update(editItem.id, { nome: form.nome, cor: form.cor })
        setMaterias(ms => ms.map(m => m.id === editItem.id ? { ...m, ...r.data } : m))
        toast.success('Matéria atualizada!')
      } else {
        const r = await materiaService.create({ nome: form.nome, cor: form.cor, conteudos })
        setMaterias(ms => [...ms, r.data])
        toast.success(`Matéria criada${conteudos.length ? ` + ${conteudos.length} conteúdo(s)` : ''}!`)
      }
      setModalOpen(false)
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover esta matéria?')) return
    try { await materiaService.delete(id); setMaterias(ms => ms.filter(m => m.id !== id)); toast.success('Removida!') }
    catch { toast.error('Erro ao remover') }
  }

  const openConteudoModal = (materia, conteudo, refreshFn) => {
    setConteudoMateria(materia)
    setConteudoRefreshFn(() => refreshFn)
    if (conteudo) {
      setConteudoEditId(conteudo.id)
      setConteudoForm({ titulo: conteudo.titulo, tipo: conteudo.tipo, url: conteudo.url || '', descricao: conteudo.descricao || '' })
    } else {
      setConteudoEditId(null)
      setConteudoForm(EMPTY_CONTEUDO)
    }
    setConteudoModalOpen(true)
  }

  const handleSaveConteudo = async (e) => {
    e.preventDefault(); setSavingConteudo(true)
    try {
      if (conteudoEditId) {
        await conteudoService.update(conteudoEditId, conteudoForm)
        toast.success('Conteúdo atualizado!')
      } else {
        await conteudoService.create({ ...conteudoForm, materia_id: conteudoMateria.id })
        toast.success('Conteúdo adicionado!')
      }
      conteudoRefreshFn()
      setConteudoModalOpen(false)
    } catch (err) { toast.error(err.response?.data?.error || 'Erro') }
    finally { setSavingConteudo(false) }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="📚"
        title="Matérias"
        subtitle={`${materias.length} ${materias.length === 1 ? 'matéria cadastrada' : 'matérias cadastradas'}`}
        badge="Gestão de estudos"
        actions={<Button onClick={openAdd} icon={<FiPlus size={16} />}>Nova Matéria</Button>}
      />

      {!materias.length ? (
        <EmptyState icon={FiBookOpen} title="Nenhuma matéria cadastrada"
          description="Crie suas matérias e adicione conteúdos para organizar seus estudos."
          action={openAdd} actionLabel="Criar Matéria" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {materias.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <MateriaCard
                materia={m}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAddConteudo={openConteudoModal}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL: Criar/Editar Matéria */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Editar Matéria' : 'Nova Matéria'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {!editItem && (
            <div className="flex gap-1 p-1 bg-dark-600/50 rounded-xl">
              <button type="button" onClick={() => setModalTab('basico')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  modalTab === 'basico' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                ⓘ Informações
              </button>
              <button type="button" onClick={() => setModalTab('conteudos')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  modalTab === 'conteudos' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                📚 Conteúdos
              </button>
            </div>
          )}

          {(editItem || modalTab === 'basico') && (
            <div className="space-y-4">
              <Input label="Nome da Matéria" placeholder="Ex: Português"
                value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form, cor: c})}
                      className="w-9 h-9 rounded-full transition-all"
                      style={{ backgroundColor: c, outline: form.cor === c ? `2px solid white` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!editItem && modalTab === 'conteudos' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <FiList size={13} /> Conteúdos da matéria
                  <span className="text-xs text-slate-500 font-normal">(um por linha)</span>
                </label>
                <textarea
                  placeholder={'Morfologia\nSintaxe\nCrase\nConcordância Verbal'}
                  className="input-field text-sm resize-none h-48"
                  value={form.conteudos_texto}
                  onChange={e => setForm({...form, conteudos_texto: e.target.value})}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 <span className="text-slate-300 font-medium">Exemplo:</span> Para Português, adicione "Morfologia", "Sintaxe", "Crase".
                  As revisões serão agendadas com base nestes conteúdos.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Adicionar/Editar Conteúdo individual */}
      <Modal
        isOpen={conteudoModalOpen}
        onClose={() => setConteudoModalOpen(false)}
        title={conteudoEditId ? 'Editar Conteúdo' : `Novo Conteúdo${conteudoMateria ? ` · ${conteudoMateria.nome}` : ''}`}
        size="lg"
      >
        <form onSubmit={handleSaveConteudo} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Tipo de conteúdo</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIPOS_CONTEUDO.map(t => {
                const Icon = t.icon
                const active = conteudoForm.tipo === t.value
                return (
                  <button key={t.value} type="button"
                    onClick={() => setConteudoForm({...conteudoForm, tipo: t.value})}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                      active ? 'border-current bg-current/10' : 'border-white/10 hover:border-white/20 text-slate-400'
                    }`}
                    style={active ? { color: t.color } : undefined}
                  >
                    <Icon size={18} />
                    <span className="text-[11px] font-semibold">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Input label="Título" placeholder="Ex: Morfologia"
            value={conteudoForm.titulo}
            onChange={e => setConteudoForm({...conteudoForm, titulo: e.target.value})} required />

          {(['video', 'site', 'pdf', 'curso'].includes(conteudoForm.tipo)) && (
            <Input label="URL / Link" placeholder="https://..."
              value={conteudoForm.url}
              onChange={e => setConteudoForm({...conteudoForm, url: e.target.value})}
              icon={<FiExternalLink size={15} />} />
          )}

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">
              {conteudoForm.tipo === 'anotacao' ? 'Anotação completa' : 'Descrição/Notas (opcional)'}
            </label>
            <textarea
              placeholder="Descrição rápida ou pontos importantes..."
              className="input-field text-sm resize-none h-24"
              value={conteudoForm.descricao}
              onChange={e => setConteudoForm({...conteudoForm, descricao: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setConteudoModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={savingConteudo} className="flex-1">
              {conteudoEditId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
