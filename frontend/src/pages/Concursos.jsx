import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiTarget, FiPlus, FiCalendar, FiEdit2, FiTrash2, FiBook,
  FiDownload, FiZap, FiCheck, FiX, FiExternalLink, FiAlertCircle
} from 'react-icons/fi'
import { concursoService } from '../services/concurso.service'
import { extracaoService } from '../services/extracao.service'
import { materiaService } from '../services/materia.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import Loader from '../components/ui/Loader'
import PageHeader from '../components/ui/PageHeader'
import toast from 'react-hot-toast'

const EMPTY_FORM = { nome: '', banca: '', cargo: '', data_prova: '', edital_url: '' }
const CORES = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4']

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

  // Modal de IMPORTAR matérias do edital
  const [importOpen, setImportOpen] = useState(false)
  const [importConcurso, setImportConcurso] = useState(null)
  const [importStep, setImportStep] = useState('config')      // 'config' | 'review'
  const [importSource, setImportSource] = useState('url')     // 'url' | 'texto'
  const [importUrl, setImportUrl] = useState('')
  const [importTexto, setImportTexto] = useState('')
  const [importCargo, setImportCargo] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [extractedMaterias, setExtractedMaterias] = useState([])
  const [selectedMaterias, setSelectedMaterias] = useState({})
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    concursoService.getAll()
      .then(r => setConcursos(r.data))
      .catch(() => setConcursos([]))
      .finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (c) => {
    setEditItem(c)
    setForm({
      nome: c.nome, banca: c.banca || '', cargo: c.cargo || '',
      data_prova: c.data_prova?.split('T')[0] || '',
      edital_url: c.edital_url || ''
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
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
    } catch { toast.error('Erro') }
  }

  // ============ IMPORTAR EDITAL ============
  const openImport = (concurso) => {
    setImportConcurso(concurso)
    setImportSource('url')
    setImportUrl(concurso.edital_url || '')
    setImportTexto('')
    setImportCargo(concurso.cargo || '')
    setImportStep('config')
    setExtractedMaterias([])
    setSelectedMaterias({})
    setImportOpen(true)
  }

  const handleExtract = async () => {
    if (importSource === 'url' && !importUrl.trim()) {
      toast.error('Informe a URL do edital')
      return
    }
    if (importSource === 'texto' && !importTexto.trim()) {
      toast.error('Cole o texto do edital')
      return
    }

    setImportLoading(true)
    try {
      const payload = {
        cargo: importCargo,
        ...(importSource === 'url' ? { url: importUrl } : { texto: importTexto }),
      }
      const { data } = await extracaoService.extrairEdital(payload)

      if (!data.materias?.length) {
        toast.error(data.message || 'Nenhuma matéria detectada. Tente colar o texto manualmente.')
        return
      }

      setExtractedMaterias(data.materias)
      // Marca todas selecionadas por padrão
      const initial = {}
      data.materias.forEach(m => { initial[m] = true })
      setSelectedMaterias(initial)
      setImportStep('review')
      toast.success(`${data.materias.length} matéria(s) detectada(s)!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao extrair edital')
    } finally {
      setImportLoading(false)
    }
  }

  const toggleMateria = (nome) => {
    setSelectedMaterias(s => ({ ...s, [nome]: !s[nome] }))
  }

  const handleImportar = async () => {
    const aImportar = extractedMaterias.filter(m => selectedMaterias[m])
    if (!aImportar.length) {
      toast.error('Selecione ao menos uma matéria')
      return
    }
    setImporting(true)
    try {
      let count = 0
      for (let i = 0; i < aImportar.length; i++) {
        const nome = aImportar[i]
        const cor = CORES[i % CORES.length]
        await materiaService.create({
          nome,
          cor,
          concurso_id: importConcurso.id,
        })
        count++
      }
      toast.success(`✅ ${count} matéria(s) importada(s) com sucesso!`)
      // Atualizar lista
      const r = await concursoService.getAll()
      setConcursos(r.data)
      setImportOpen(false)
    } catch (err) {
      toast.error('Erro ao importar matérias')
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <Loader />

  const totalSelecionadas = Object.values(selectedMaterias).filter(Boolean).length

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        emoji="🎯"
        title="Concursos"
        subtitle="Gerencie seus concursos, prazos e edital"
        badge="Carreira"
        actions={<Button onClick={openAdd} icon={<FiPlus size={16} />}>Adicionar</Button>}
      />

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
              <Card accent="#6366f1" className="p-5 h-full flex flex-col gap-4">
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
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
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

                {/* BOTÃO IMPORTAR EDITAL */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openImport(c)}
                  icon={<FiZap size={12} />}
                  className="w-full"
                >
                  Importar matérias do edital
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL: Criar/Editar Concurso */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Concurso' : 'Novo Concurso'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome do Concurso" placeholder="Ex: Concurso TJ-SP 2024"
            value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Banca" placeholder="Ex: FCC, CESPE" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
            <Input label="Cargo" placeholder="Ex: Analista" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} />
          </div>
          <Input label="Data da Prova" type="date" value={form.data_prova} onChange={e => setForm({...form, data_prova: e.target.value})} />
          <Input label="Link do Edital (PDF ou página)" placeholder="https://..." icon={<FiExternalLink size={15} />}
            value={form.edital_url} onChange={e => setForm({...form, edital_url: e.target.value})} />

          {form.edital_url && (
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <p className="text-xs text-brand-300">
                💡 <span className="font-semibold">Dica:</span> Após salvar, clique em <span className="font-bold">"Importar matérias do edital"</span> no card para que o sistema extraia automaticamente as matérias para o cargo.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Importar Edital */}
      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)}
        title={`Importar matérias do edital${importConcurso ? ` · ${importConcurso.nome}` : ''}`}
        size="xl"
      >
        {/* STEP 1: Configuração */}
        {importStep === 'config' && (
          <div className="space-y-4">
            {/* Tabs URL / Texto */}
            <div className="flex gap-1 p-1 bg-dark-600/50 rounded-xl">
              <button onClick={() => setImportSource('url')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  importSource === 'url' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                🔗 Por URL
              </button>
              <button onClick={() => setImportSource('texto')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  importSource === 'texto' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                📋 Colar texto
              </button>
            </div>

            {importSource === 'url' && (
              <div>
                <Input
                  label="URL do edital (PDF ou página HTML)"
                  placeholder="https://..."
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  icon={<FiExternalLink size={15} />}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Suporta PDFs públicos e páginas HTML. Se a URL exigir login, use a opção "Colar texto".
                </p>
              </div>
            )}

            {importSource === 'texto' && (
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">
                  Cole aqui o conteúdo programático do edital
                </label>
                <textarea
                  className="input-field text-sm resize-none h-48 font-mono"
                  placeholder={'Cole aqui o trecho do edital com as matérias do cargo...\n\nEx:\nCONHECIMENTOS BÁSICOS\n1. Língua Portuguesa\n2. Raciocínio Lógico\n...'}
                  value={importTexto}
                  onChange={e => setImportTexto(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Funciona melhor com a seção do conteúdo programático.
                </p>
              </div>
            )}

            <Input
              label="Cargo (opcional, melhora a precisão)"
              placeholder="Ex: Analista Judiciário"
              value={importCargo}
              onChange={e => setImportCargo(e.target.value)}
              icon={<FiBook size={15} />}
            />

            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <FiAlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-200">
                  <span className="font-semibold">Como funciona:</span> O sistema busca padrões comuns de editais (matérias conhecidas, listas numeradas, seções). Você poderá revisar e ajustar antes de importar.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setImportOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleExtract} loading={importLoading} className="flex-1" icon={<FiZap size={14} />}>
                Extrair matérias
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Review */}
        {importStep === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">
                <span className="font-bold text-white">{extractedMaterias.length}</span> matérias detectadas ·{' '}
                <span className="text-accent-400 font-semibold">{totalSelecionadas} selecionada(s)</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => {
                  const all = {}
                  extractedMaterias.forEach(m => all[m] = true)
                  setSelectedMaterias(all)
                }}
                  className="text-xs text-brand-400 hover:text-brand-300">
                  Selecionar todas
                </button>
                <span className="text-slate-600">·</span>
                <button onClick={() => setSelectedMaterias({})}
                  className="text-xs text-slate-400 hover:text-white">
                  Limpar
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 -mr-2 pr-2">
              {extractedMaterias.map((m, i) => {
                const checked = !!selectedMaterias[m]
                const cor = CORES[i % CORES.length]
                return (
                  <motion.button
                    key={m}
                    type="button"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => toggleMateria(m)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      checked
                        ? 'bg-brand-500/10 border-brand-500/40'
                        : 'bg-dark-600/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked ? 'bg-brand-500 border-brand-500' : 'border-white/20'
                    }`}>
                      {checked && <FiCheck size={12} className="text-white" />}
                    </div>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                    <span className="text-sm font-medium text-white flex-1">{m}</span>
                  </motion.button>
                )
              })}
            </div>

            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200">
              💡 As matérias selecionadas serão criadas e vinculadas a este concurso. Você poderá adicionar conteúdos específicos depois.
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setImportStep('config')} className="flex-1">
                ← Voltar
              </Button>
              <Button onClick={handleImportar} loading={importing} disabled={!totalSelecionadas} className="flex-1" icon={<FiDownload size={14} />}>
                Importar {totalSelecionadas} matéria{totalSelecionadas === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
