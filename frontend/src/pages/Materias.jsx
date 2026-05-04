import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBookOpen, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiCheck, FiClock,
  FiVideo, FiFileText, FiGlobe, FiBook, FiEdit, FiLayers, FiExternalLink, FiList
} from 'react-icons/fi'
import { materiaService } from '../services/materia.service'
import { conteudoService } from '../services/conteudo.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import Loader from '../components/ui/Loader'
import PageHeader from '../components/ui/PageHeader'
import toast from 'react-hot-toast'

const CORES = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4']
const EMPTY_FORM = { nome: '', cor: '#6366f1', meta_semanal_horas: 5 }
const EMPTY_CONTEUDO = { titulo: '', tipo: 'anotacao', url: '', descricao: '', assuntos_texto: '' }

const TIPOS_CONTEUDO = [
  { value: 'video',     label: 'Vídeo',     icon: FiVideo,    color: '#ef4444' },
  { value: 'pdf',       label: 'PDF',       icon: FiFileText, color: '#dc2626' },
  { value: 'site',      label: 'Site',      icon: FiGlobe,    color: '#3b82f6' },
  { value: 'livro',     label: 'Livro',     icon: FiBook,     color: '#10b981' },
  { value: 'curso',     label: 'Curso',     icon: FiLayers,   color: '#8b5cf6' },
  { value: 'flashcard', label: 'Flashcard', icon: FiLayers,   color: '#f59e0b' },
  { value: 'anotacao',  label: 'Anotação',  icon: FiEdit,     color: '#64748b' },
]

const getTipoInfo = (tipo) => TIPOS_CONTEUDO.find(t => t.value === tipo) || TIPOS_CONTEUDO[6]

/**
 * Item de Conteúdo — sem checkbox, expansível para mostrar assuntos.
 */
function ConteudoItem({ conteudo, materiaCor, onDelete, onEdit, onToggleAssunto, onAddAssunto }) {
  const [expanded, setExpanded] = useState(false)
  const info = getTipoInfo(conteudo.tipo)
  const Icon = info.icon
  const totalAssuntos = conteudo.assuntos?.length || 0
  const assuntosFeitos = conteudo.assuntos?.filter(a => a.concluido).length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-dark-600/30 hover:border-white/10 overflow-hidden transition-all"
    >
      <div className="p-3 flex items-start gap-3 group">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: info.color + '20', border: `1px solid ${info.color}40` }}>
          <Icon size={15} style={{ color: info.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{conteudo.titulo}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: info.color }}>
              {info.label}
            </span>
            {totalAssuntos > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <FiList size={9} /> {assuntosFeitos}/{totalAssuntos} assuntos
              </span>
            )}
          </div>
          {conteudo.descricao && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{conteudo.descricao}</p>
          )}
          {conteudo.url && (
            <a href={conteudo.url} target="_blank" rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1 transition-colors">
              <FiExternalLink size={11} /> Abrir link
            </a>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            title="Ver assuntos">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <FiChevronDown size={14} />
            </motion.div>
          </button>
          <button onClick={() => onEdit(conteudo)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100">
            <FiEdit2 size={12} />
          </button>
          <button onClick={() => onDelete(conteudo.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
            <FiTrash2 size={12} />
          </button>
        </div>
      </div>

      {/* Lista de Assuntos do conteúdo (expansível) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between mb-2 mt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">📋 Assuntos deste conteúdo</p>
                <button onClick={() => onAddAssunto(conteudo)}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                  <FiPlus size={10} /> Adicionar
                </button>
              </div>

              {totalAssuntos === 0 ? (
                <p className="text-xs text-slate-500 py-2">Nenhum assunto cadastrado neste conteúdo</p>
              ) : (
                <div className="space-y-1.5">
                  {conteudo.assuntos.map(a => (
                    <div key={a.id} className="flex items-center gap-2.5 text-sm">
                      <button onClick={() => onToggleAssunto(a.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                          a.concluido ? 'border-transparent' : 'border-white/20 hover:border-current'
                        }`}
                        style={a.concluido
                          ? { backgroundColor: materiaCor + '90', borderColor: materiaCor }
                          : { color: materiaCor }
                        }>
                        {a.concluido && <FiCheck size={9} className="text-white" />}
                      </button>
                      <span className={a.concluido ? 'line-through text-slate-500 text-xs' : 'text-slate-300 text-xs'}>
                        {a.nome}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MateriaCard({ materia, onEdit, onDelete, onToggleAssunto, onAddConteudo, onAddAssuntoConteudo }) {
  const [expanded, setExpanded] = useState(false)
  const [conteudos, setConteudos] = useState([])
  const [loadingConteudos, setLoadingConteudos] = useState(false)

  const totalAssuntos = materia.total_assuntos || 0
  const concluidos = materia.assuntos_concluidos || 0
  const pct = totalAssuntos > 0 ? Math.round((concluidos / totalAssuntos) * 100) : 0
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
    if (!confirm('Remover este conteúdo? Os assuntos vinculados ficarão sem agrupamento.')) return
    try {
      await conteudoService.delete(id)
      setConteudos(cs => cs.filter(c => c.id !== id))
      toast.success('Conteúdo removido')
    } catch { toast.error('Erro') }
  }

  const handleToggleAssuntoLocal = async (assuntoId) => {
    try {
      const r = await materiaService.toggleAssunto(materia.id, assuntoId)
      // Atualiza dentro dos conteúdos
      setConteudos(cs => cs.map(c => ({
        ...c,
        assuntos: c.assuntos?.map(a => a.id === assuntoId ? r.data : a)
      })))
      // Atualiza contador da matéria
      onToggleAssunto(materia.id, assuntoId, r.data.concluido)
    } catch { toast.error('Erro') }
  }

  return (
    <Card accent={materia.cor} className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: materia.cor + '25', border: `1px solid ${materia.cor}50` }}>
              <FiBookOpen size={20} style={{ color: materia.cor }} />
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
            <span>Progresso geral</span><span>{pct}%</span>
          </div>
          <ProgressBar value={pct} color="brand" size="sm" />
          <p className="text-xs text-slate-500">{concluidos}/{totalAssuntos} assuntos · Meta: {materia.meta_semanal_horas}h/sem</p>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-dark-600/50 hover:bg-dark-600 transition-all text-sm text-brand-400 font-medium">
          <span>{expanded ? 'Recolher detalhes' : `Ver conteúdos (${conteudos.length || '—'})`}</span>
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
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">📚 Conteúdos da matéria</p>
                </div>

                {loadingConteudos ? (
                  <div className="text-center py-4">
                    <div className="inline-block w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  </div>
                ) : conteudos.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">
                    Nenhum conteúdo ainda. Adicione vídeos, PDFs, livros e mais!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conteudos.map(c => (
                      <ConteudoItem key={c.id} conteudo={c}
                        materiaCor={materia.cor}
                        onDelete={handleDeleteConteudo}
                        onEdit={(item) => onAddConteudo(materia, item, loadConteudos)}
                        onToggleAssunto={handleToggleAssuntoLocal}
                        onAddAssunto={(cont) => onAddAssuntoConteudo(materia, cont, loadConteudos)}
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
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Conteúdo
  const [conteudoModalOpen, setConteudoModalOpen] = useState(false)
  const [conteudoForm, setConteudoForm] = useState(EMPTY_CONTEUDO)
  const [conteudoEditId, setConteudoEditId] = useState(null)
  const [conteudoMateria, setConteudoMateria] = useState(null)
  const [conteudoRefreshFn, setConteudoRefreshFn] = useState(() => () => {})
  const [savingConteudo, setSavingConteudo] = useState(false)

  // Adicionar Assunto a um Conteúdo (modal pequeno)
  const [assuntoModalOpen, setAssuntoModalOpen] = useState(false)
  const [assuntoNome, setAssuntoNome] = useState('')
  const [assuntoMateria, setAssuntoMateria] = useState(null)
  const [assuntoConteudo, setAssuntoConteudo] = useState(null)
  const [assuntoRefreshFn, setAssuntoRefreshFn] = useState(() => () => {})
  const [savingAssunto, setSavingAssunto] = useState(false)

  useEffect(() => {
    materiaService.getAll().then(r => setMaterias(r.data)).catch(() => setMaterias([])).finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (m) => { setEditItem(m); setForm({ nome: m.nome, cor: m.cor, meta_semanal_horas: m.meta_semanal_horas }); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editItem) {
        const r = await materiaService.update(editItem.id, form)
        setMaterias(ms => ms.map(m => m.id === editItem.id ? { ...m, ...r.data } : m))
        toast.success('Matéria atualizada!')
      } else {
        const r = await materiaService.create(form)
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

  const updateMateriaCounters = (materiaId, _aid, concluiu) => {
    setMaterias(ms => ms.map(m => m.id === materiaId
      ? {
          ...m,
          assuntos_concluidos: concluiu
            ? (m.assuntos_concluidos || 0) + 1
            : Math.max(0, (m.assuntos_concluidos || 0) - 1)
        }
      : m))
  }

  // CONTEÚDOS
  const openConteudoModal = (materia, conteudo, refreshFn) => {
    setConteudoMateria(materia)
    setConteudoRefreshFn(() => refreshFn)
    if (conteudo) {
      setConteudoEditId(conteudo.id)
      setConteudoForm({
        titulo: conteudo.titulo,
        tipo: conteudo.tipo,
        url: conteudo.url || '',
        descricao: conteudo.descricao || '',
        assuntos_texto: '',
      })
    } else {
      setConteudoEditId(null)
      setConteudoForm(EMPTY_CONTEUDO)
    }
    setConteudoModalOpen(true)
  }

  const handleSaveConteudo = async (e) => {
    e.preventDefault()
    setSavingConteudo(true)
    const assuntos = conteudoForm.assuntos_texto.split('\n').map(s => s.trim()).filter(Boolean)
    try {
      if (conteudoEditId) {
        await conteudoService.update(conteudoEditId, conteudoForm)
        toast.success('Conteúdo atualizado!')
      } else {
        await conteudoService.create({
          materia_id: conteudoMateria.id,
          titulo: conteudoForm.titulo,
          tipo: conteudoForm.tipo,
          url: conteudoForm.url,
          descricao: conteudoForm.descricao,
          assuntos,
        })
        toast.success(`Conteúdo${assuntos.length ? ` + ${assuntos.length} assunto(s)` : ''} adicionado!`)
      }
      conteudoRefreshFn()
      setConteudoModalOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar conteúdo')
    } finally {
      setSavingConteudo(false)
    }
  }

  // Adicionar ASSUNTO a um conteúdo
  const openAssuntoModal = (materia, conteudo, refreshFn) => {
    setAssuntoMateria(materia)
    setAssuntoConteudo(conteudo)
    setAssuntoRefreshFn(() => refreshFn)
    setAssuntoNome('')
    setAssuntoModalOpen(true)
  }

  const handleSaveAssunto = async (e) => {
    e.preventDefault()
    if (!assuntoNome.trim()) return
    setSavingAssunto(true)
    try {
      await materiaService.addAssunto(assuntoMateria.id, {
        nome: assuntoNome.trim(),
        conteudo_id: assuntoConteudo.id,
      })
      toast.success('Assunto adicionado!')
      assuntoRefreshFn()
      setAssuntoModalOpen(false)
      // Atualiza contador na matéria
      setMaterias(ms => ms.map(m => m.id === assuntoMateria.id
        ? { ...m, total_assuntos: (m.total_assuntos || 0) + 1 } : m))
    } catch { toast.error('Erro ao adicionar') } finally { setSavingAssunto(false) }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="📚"
        title="Matérias"
        subtitle={`${materias.length} ${materias.length === 1 ? 'matéria cadastrada' : 'matérias cadastradas'} · Cada conteúdo pode ter seus próprios assuntos`}
        badge="Gestão de estudos"
        actions={
          <Button onClick={openAdd} icon={<FiPlus size={16} />}>Nova Matéria</Button>
        }
      />

      {!materias.length ? (
        <EmptyState icon={FiBookOpen} title="Nenhuma matéria cadastrada"
          description="Crie suas matérias para organizar o estudo, anotar assuntos e armazenar conteúdos."
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
                onToggleAssunto={updateMateriaCounters}
                onAddConteudo={openConteudoModal}
                onAddAssuntoConteudo={openAssuntoModal}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal: Matéria */}
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

          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
            <p className="text-xs text-brand-300 font-medium">💡 Dica</p>
            <p className="text-xs text-slate-400 mt-1">Após criar a matéria, abra os detalhes e adicione conteúdos (vídeos, PDFs, livros) com seus próprios assuntos.</p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Conteúdo */}
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

          <Input
            label="Título do conteúdo"
            placeholder="Ex: Aula 1 - Princípios Fundamentais"
            value={conteudoForm.titulo}
            onChange={e => setConteudoForm({...conteudoForm, titulo: e.target.value})}
            required
          />

          {(['video', 'site', 'pdf', 'curso'].includes(conteudoForm.tipo)) && (
            <Input
              label="URL / Link"
              placeholder="https://..."
              value={conteudoForm.url}
              onChange={e => setConteudoForm({...conteudoForm, url: e.target.value})}
              icon={<FiExternalLink size={15} />}
            />
          )}

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">
              {conteudoForm.tipo === 'anotacao' ? 'Anotação completa' : 'Descrição/Notas (opcional)'}
            </label>
            <textarea
              placeholder={conteudoForm.tipo === 'livro'
                ? 'Ex: Capítulo 3, páginas 45-78. Foco no tema X.'
                : conteudoForm.tipo === 'anotacao'
                  ? 'Suas notas, resumos, mnemônicos...'
                  : 'Descrição rápida ou pontos importantes...'
              }
              className="input-field text-sm resize-none h-20"
              value={conteudoForm.descricao}
              onChange={e => setConteudoForm({...conteudoForm, descricao: e.target.value})}
            />
          </div>

          {/* Assuntos do conteúdo (só ao criar) */}
          {!conteudoEditId && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <FiList size={13} /> Assuntos deste conteúdo
                <span className="text-xs text-slate-500 font-normal">(opcional, um por linha)</span>
              </label>
              <textarea
                placeholder={'Princípios Fundamentais\nDireitos Fundamentais\nOrganização do Estado'}
                className="input-field text-sm resize-none h-24"
                value={conteudoForm.assuntos_texto}
                onChange={e => setConteudoForm({...conteudoForm, assuntos_texto: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">
                Você poderá adicionar mais assuntos depois clicando em "+ Adicionar" no conteúdo.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setConteudoModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={savingConteudo} className="flex-1">
              {conteudoEditId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adicionar Assunto a um Conteúdo */}
      <Modal isOpen={assuntoModalOpen} onClose={() => setAssuntoModalOpen(false)}
        title={`Novo Assunto${assuntoConteudo ? ` em ${assuntoConteudo.titulo}` : ''}`} size="sm">
        <form onSubmit={handleSaveAssunto} className="space-y-4">
          <Input
            label="Nome do assunto"
            placeholder="Ex: Princípios fundamentais"
            value={assuntoNome}
            onChange={e => setAssuntoNome(e.target.value)}
            autoFocus
            required
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setAssuntoModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={savingAssunto} className="flex-1">Adicionar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
