import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBookOpen, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiCheck, FiClock,
  FiVideo, FiFileText, FiGlobe, FiBook, FiEdit, FiLayers, FiExternalLink
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
const EMPTY_FORM = { nome: '', cor: '#6366f1', meta_semanal_horas: 5, assuntos_texto: '' }
const EMPTY_CONTEUDO = { titulo: '', tipo: 'anotacao', url: '', descricao: '' }

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

function ConteudoItem({ conteudo, onToggle, onDelete, onEdit }) {
  const info = getTipoInfo(conteudo.tipo)
  const Icon = info.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
        conteudo.visualizado
          ? 'bg-accent-500/5 border-accent-500/20'
          : 'bg-dark-600/30 border-white/5 hover:border-white/10'
      }`}
    >
      <button
        onClick={() => onToggle(conteudo.id)}
        className={`w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
          conteudo.visualizado ? 'bg-accent-500 border-accent-500' : 'border-white/20 hover:border-accent-500'
        }`}
      >
        {conteudo.visualizado && <FiCheck size={12} className="text-white" />}
      </button>

      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: info.color + '20', border: `1px solid ${info.color}40` }}>
        <Icon size={15} style={{ color: info.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${conteudo.visualizado ? 'text-slate-500 line-through' : 'text-white'}`}>
          {conteudo.titulo}
        </p>
        {conteudo.descricao && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{conteudo.descricao}</p>
        )}
        {conteudo.url && (
          <a href={conteudo.url} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1 transition-colors">
            <FiExternalLink size={11} /> Abrir link
          </a>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(conteudo)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
          <FiEdit2 size={12} />
        </button>
        <button onClick={() => onDelete(conteudo.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <FiTrash2 size={12} />
        </button>
      </div>
    </motion.div>
  )
}

function MateriaCard({ materia, onEdit, onDelete, onToggleAssunto, onAddConteudo }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('assuntos')
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
    if (expanded && tab === 'conteudos') loadConteudos()
    // eslint-disable-next-line
  }, [expanded, tab])

  const handleToggleConteudo = async (id) => {
    try {
      const r = await conteudoService.toggle(id)
      setConteudos(cs => cs.map(c => c.id === id ? r.data : c))
    } catch { toast.error('Erro') }
  }

  const handleDeleteConteudo = async (id) => {
    if (!confirm('Remover este conteúdo?')) return
    try {
      await conteudoService.delete(id)
      setConteudos(cs => cs.filter(c => c.id !== id))
      toast.success('Conteúdo removido')
    } catch { toast.error('Erro') }
  }

  const conteudosVistos = conteudos.filter(c => c.visualizado).length

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
            <span>Progresso</span><span>{pct}%</span>
          </div>
          <ProgressBar value={pct} color="brand" size="sm" />
          <p className="text-xs text-slate-500">{concluidos}/{totalAssuntos} assuntos concluídos</p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Meta: {materia.meta_semanal_horas}h/sem</span>
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors font-medium">
            {expanded ? 'Recolher' : 'Detalhes'}
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <FiChevronDown size={14} />
            </motion.div>
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/5">
                {/* Tabs */}
                <div className="flex gap-1 mb-3 p-1 bg-dark-600/50 rounded-xl">
                  <button onClick={() => setTab('assuntos')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      tab === 'assuntos' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}>
                    📋 Assuntos ({totalAssuntos})
                  </button>
                  <button onClick={() => setTab('conteudos')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      tab === 'conteudos' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}>
                    📚 Conteúdos ({conteudos.length})
                  </button>
                </div>

                {/* Assuntos */}
                {tab === 'assuntos' && (
                  <div className="space-y-1.5">
                    {!materia.assuntos?.length ? (
                      <p className="text-xs text-slate-500 text-center py-4">Nenhum assunto cadastrado</p>
                    ) : (
                      materia.assuntos.map(a => (
                        <div key={a.id} className="flex items-center gap-2.5 text-sm">
                          <button onClick={() => onToggleAssunto(materia.id, a.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${a.concluido ? 'border-transparent' : 'border-white/20 hover:border-brand-500'}`}
                            style={a.concluido ? { backgroundColor: materia.cor + '90', borderColor: materia.cor } : {}}>
                            {a.concluido && <FiCheck size={11} className="text-white" />}
                          </button>
                          <span className={a.concluido ? 'line-through text-slate-500' : 'text-slate-300'}>{a.nome}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Conteúdos */}
                {tab === 'conteudos' && (
                  <div className="space-y-2">
                    {conteudos.length > 0 && (
                      <p className="text-xs text-slate-500 mb-2">{conteudosVistos}/{conteudos.length} estudados</p>
                    )}

                    {loadingConteudos ? (
                      <div className="text-center py-4">
                        <div className="inline-block w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                      </div>
                    ) : conteudos.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">
                        Nenhum conteúdo ainda. Adicione vídeos, PDFs, sites, livros e mais!
                      </p>
                    ) : (
                      conteudos.map(c => (
                        <ConteudoItem key={c.id} conteudo={c}
                          onToggle={handleToggleConteudo}
                          onDelete={handleDeleteConteudo}
                          onEdit={(item) => onAddConteudo(materia, item, loadConteudos)}
                        />
                      ))
                    )}

                    <Button size="sm" variant="outline" className="w-full mt-2"
                      onClick={() => onAddConteudo(materia, null, loadConteudos)}
                      icon={<FiPlus size={12} />}>
                      Adicionar Conteúdo
                    </Button>
                  </div>
                )}
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

  // Estado de Conteúdo
  const [conteudoModalOpen, setConteudoModalOpen] = useState(false)
  const [conteudoForm, setConteudoForm] = useState(EMPTY_CONTEUDO)
  const [conteudoEditId, setConteudoEditId] = useState(null)
  const [conteudoMateria, setConteudoMateria] = useState(null)
  const [conteudoRefreshFn, setConteudoRefreshFn] = useState(() => () => {})
  const [savingConteudo, setSavingConteudo] = useState(false)

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
        ? {
            ...m,
            assuntos: m.assuntos?.map(a => a.id === assuntoId ? r.data : a),
            assuntos_concluidos: r.data.concluido
              ? (m.assuntos_concluidos || 0) + 1
              : Math.max(0, (m.assuntos_concluidos || 0) - 1)
          }
        : m))
    } catch { toast.error('Erro ao atualizar assunto') }
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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar conteúdo')
    } finally {
      setSavingConteudo(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="📚"
        title="Matérias"
        subtitle={`${materias.length} ${materias.length === 1 ? 'matéria cadastrada' : 'matérias cadastradas'} · Organize seus assuntos e conteúdos`}
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
                onToggleAssunto={handleToggleAssunto}
                onAddConteudo={openConteudoModal}
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

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Assuntos (um por linha)</label>
            <textarea placeholder={'Princípios Constitucionais\nDireitos Fundamentais\nOrganização do Estado'}
              className="input-field text-sm resize-none h-28"
              value={form.assuntos_texto} onChange={e => setForm({...form, assuntos_texto: e.target.value})} />
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
          {/* Tipo - cards visuais */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Tipo de conteúdo</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIPOS_CONTEUDO.map(t => {
                const Icon = t.icon
                const active = conteudoForm.tipo === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setConteudoForm({...conteudoForm, tipo: t.value})}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                      active
                        ? 'border-current bg-current/10'
                        : 'border-white/10 hover:border-white/20 text-slate-400'
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
            label="Título"
            placeholder="Ex: Aula 1 - Princípios"
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

const MOCK = [
  { id:1, nome:'Direito Constitucional', cor:'#6366f1', meta_semanal_horas:8, horas_estudadas:720, total_assuntos:12, assuntos_concluidos:5,
    assuntos:[{id:1,nome:'Princípios Fundamentais',concluido:true},{id:2,nome:'Direitos Fundamentais',concluido:false}]},
  { id:2, nome:'Português', cor:'#10b981', meta_semanal_horas:5, horas_estudadas:480, total_assuntos:8, assuntos_concluidos:3, assuntos:[]},
  { id:3, nome:'Raciocínio Lógico', cor:'#f59e0b', meta_semanal_horas:4, horas_estudadas:300, total_assuntos:10, assuntos_concluidos:2, assuntos:[]},
]
