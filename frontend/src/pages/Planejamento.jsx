import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { FiGrid, FiPlus, FiTrash2, FiClock } from 'react-icons/fi'
import { materiaService } from '../services/materia.service'
import api from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import toast from 'react-hot-toast'

const DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
const DIAS_API = [1, 2, 3, 4, 5, 6, 0]

const EMPTY_FORM = { dia_semana: '', materia_id: '', horas: 2, horario_inicio: '08:00' }

export default function Planejamento() {
  const [blocos, setBlocos] = useState(DIAS.map(() => []))
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/planejamento'),
      materiaService.getAll()
    ]).then(([plan, mat]) => {
      setMaterias(mat.data)
      const newBlocos = DIAS.map(() => [])
      plan.data.forEach(b => {
        const idx = DIAS_API.indexOf(b.dia_semana)
        if (idx >= 0) newBlocos[idx].push(b)
      })
      setBlocos(newBlocos)
    }).catch(() => {
      setMaterias(MOCK_MATERIAS)
      setBlocos(MOCK_BLOCOS)
    }).finally(() => setLoading(false))
  }, [])

  const onDragEnd = (result) => {
    const { source, destination } = result
    if (!destination) return
    const srcDay = parseInt(source.droppableId)
    const dstDay = parseInt(destination.droppableId)
    const newBlocos = blocos.map(d => [...d])
    const [moved] = newBlocos[srcDay].splice(source.index, 1)
    newBlocos[dstDay].splice(destination.index, 0, moved)
    setBlocos(newBlocos)
  }

  const handleAddBloco = async (e) => {
    e.preventDefault(); setSaving(true)
    const materia = materias.find(m => m.id == form.materia_id)
    try {
      const r = await api.post('/planejamento', {
        dia_semana: DIAS_API[parseInt(form.dia_semana)],
        materia_id: form.materia_id,
        horas: form.horas,
        horario_inicio: form.horario_inicio
      })
      const newBlocos = blocos.map(d => [...d])
      newBlocos[parseInt(form.dia_semana)].push({ ...r.data, materia_nome: materia?.nome, materia_cor: materia?.cor })
      setBlocos(newBlocos)
      setModalOpen(false)
      toast.success('Bloco adicionado!')
    } catch {
      // Fallback: add locally
      const newBlocos = blocos.map(d => [...d])
      newBlocos[parseInt(form.dia_semana)].push({ id: Date.now(), materia_nome: materia?.nome, materia_cor: materia?.cor || '#6366f1', horas: form.horas, horario_inicio: form.horario_inicio })
      setBlocos(newBlocos)
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  const handleRemove = async (diaIdx, blocoId) => {
    try { await api.delete(`/planejamento/${blocoId}`) } catch {}
    const newBlocos = blocos.map(d => [...d])
    newBlocos[diaIdx] = newBlocos[diaIdx].filter(b => b.id !== blocoId)
    setBlocos(newBlocos)
  }

  const totalHoras = blocos.reduce((sum, dia) => sum + dia.reduce((s, b) => s + parseFloat(b.horas || 0), 0), 0)

  if (loading) return <Loader />

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Planejamento Semanal 📅</h1>
          <p className="text-slate-400 text-sm mt-1">{totalHoras.toFixed(1)}h planejadas esta semana</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<FiPlus size={16} />}>Adicionar Bloco</Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {DIAS.map((dia, diaIdx) => {
            const horasDia = blocos[diaIdx].reduce((s, b) => s + parseFloat(b.horas || 0), 0)
            return (
              <div key={dia} className="flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-bold text-white">{dia}</span>
                  <span className="text-xs text-slate-500">{horasDia}h</span>
                </div>
                <Droppable droppableId={String(diaIdx)}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-24 rounded-xl p-2 space-y-2 border transition-all ${
                        snapshot.isDraggingOver ? 'bg-brand-500/10 border-brand-500/40' : 'bg-dark-700/40 border-white/5'
                      }`}
                    >
                      {blocos[diaIdx].map((bloco, index) => (
                        <Draggable key={String(bloco.id)} draggableId={String(bloco.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-xl p-3 border group cursor-grab active:cursor-grabbing transition-all ${snapshot.isDragging ? 'shadow-2xl shadow-brand-500/30 scale-105' : ''}`}
                              style={{ backgroundColor: (bloco.materia_cor || '#6366f1') + '20', borderColor: (bloco.materia_cor || '#6366f1') + '40' }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate" style={{ color: bloco.materia_cor || '#818cf8' }}>
                                    {bloco.materia_nome || 'Matéria'}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <FiClock size={10} className="text-slate-500" />
                                    <span className="text-xs text-slate-500">{bloco.horas}h</span>
                                    {bloco.horario_inicio && <span className="text-xs text-slate-600">· {bloco.horario_inicio}</span>}
                                  </div>
                                </div>
                                <button onClick={() => handleRemove(diaIdx, bloco.id)}
                                  className="p-1 rounded text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                  <FiTrash2 size={11} />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Bloco de Estudo">
        <form onSubmit={handleAddBloco} className="space-y-4">
          <Select label="Dia da semana"
            options={DIAS.map((d, i) => ({ value: i, label: d }))}
            placeholder="Selecione o dia"
            value={form.dia_semana}
            onChange={e => setForm({...form, dia_semana: e.target.value})}
            required />
          <Select label="Matéria"
            options={materias.map(m => ({ value: m.id, label: m.nome }))}
            placeholder="Selecione a matéria"
            value={form.materia_id}
            onChange={e => setForm({...form, materia_id: e.target.value})}
            required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Horas" type="number" min="0.5" max="12" step="0.5"
              value={form.horas} onChange={e => setForm({...form, horas: e.target.value})} />
            <Input label="Horário início" type="time"
              value={form.horario_inicio} onChange={e => setForm({...form, horario_inicio: e.target.value})} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Adicionar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const MOCK_MATERIAS = [
  { id:1, nome:'Direito Constitucional', cor:'#6366f1' },
  { id:2, nome:'Português', cor:'#10b981' },
]
const MOCK_BLOCOS = [
  [{ id:1, materia_nome:'Português', materia_cor:'#10b981', horas:2, horario_inicio:'08:00' }],
  [{ id:2, materia_nome:'Direito Constitucional', materia_cor:'#6366f1', horas:3, horario_inicio:'09:00' }],
  [], [], [], [], []
]
