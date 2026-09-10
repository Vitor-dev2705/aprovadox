import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiClock, FiBookOpen, FiHelpCircle, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'
import { concursoService } from '../services/concurso.service'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'
import Loader from '../components/ui/Loader'

const riskVariant = { green: 'success', yellow: 'warning', orange: 'warning', red: 'danger', slate: 'default' }

export default function ConcursoDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projection, setProjection] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    concursoService.getProjection(id).then(r => setProjection(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader />
  if (!projection) return null
  const p = projection
  const targetDate = p.concurso.data_prova_oficial || p.concurso.data_prova_estimada || p.concurso.data_prova

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <button onClick={() => navigate('/concursos')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <FiArrowLeft /> Voltar para concursos
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-brand-300 uppercase tracking-widest font-bold">Planejamento inteligente</p>
          <h1 className="text-3xl font-black text-white mt-1">{p.concurso.nome}</h1>
          <p className="text-slate-400 text-sm mt-1">{p.concurso.orgao || p.concurso.cargo || 'Concurso em preparação'}</p>
        </div>
        <Badge variant={riskVariant[p.risco.color] || 'default'}>{p.risco.label}</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4"><p className="text-xs text-slate-500">Prova</p><p className="text-lg font-black text-white mt-1">{p.dias_restantes == null ? 'Sem data' : `${p.dias_restantes} dias`}</p><p className="text-[10px] text-slate-500">{targetDate ? new Date(targetDate).toLocaleDateString('pt-BR') : 'Defina uma meta'}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Horas estudadas</p><p className="text-lg font-black text-white mt-1">{p.horas_estudadas.toFixed(1)}h</p><p className="text-[10px] text-slate-500">de {p.horas_necessarias.toFixed(1)}h estimadas</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Questões</p><p className="text-lg font-black text-white mt-1">{p.questoes.total}</p><p className="text-[10px] text-slate-500">{p.questoes.aproveitamento}% de aproveitamento</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Revisões pendentes</p><p className="text-lg font-black text-white mt-1">{p.revisoes_pendentes}</p><p className="text-[10px] text-slate-500">separadas deste concurso</p></Card>
      </div>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div><h2 className="font-bold text-white">Projeção de preparação</h2><p className="text-xs text-slate-500 mt-1">{p.mensagem}</p></div>
          <FiRefreshCw className="text-brand-400" />
        </div>
        <ProgressBar value={p.cobertura_conteudo} label={`Cobertura do conteúdo · ${p.topicos.concluidos}/${p.topicos.total} tópicos`} showValue color={p.risco.color === 'green' ? 'success' : 'brand'} />
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-slate-500">Capacidade até a prova</p><p className="text-white font-bold">{p.horas_disponiveis_projetadas.toFixed(1)}h</p></div>
          <div><p className="text-slate-500">Necessário por semana</p><p className="text-white font-bold">{p.horas_semanais_necessarias.toFixed(1)}h</p></div>
          <div><p className="text-slate-500">Déficit projetado</p><p className="text-white font-bold">{p.deficit_horas.toFixed(1)}h</p></div>
        </div>
        {p.previsao_termino && <p className="text-xs text-slate-400 border-t border-white/5 pt-4">Com o ritmo planejado, a conclusão estimada é <strong className="text-white">{new Date(p.previsao_termino).toLocaleDateString('pt-BR')}</strong>. Isso é uma projeção, não uma garantia de aprovação.</p>}
      </Card>

      {p.risco.code !== 'NO_RITMO' && p.risco.code !== 'SEM_DATA' && (
        <Card className="p-5 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex gap-3"><FiAlertTriangle className="text-yellow-400 mt-0.5" /><div><h2 className="font-bold text-white">Ajuste recomendado</h2><p className="text-sm text-slate-300 mt-1">Priorize matérias de maior peso e menor domínio antes de aumentar a carga. O sistema indica aproximadamente {p.horas_semanais_necessarias.toFixed(1)}h semanais para manter esta projeção.</p></div></div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4"><FiClock className="text-brand-400 mb-3" /><h3 className="font-bold text-white">Ritmo semanal</h3><p className="text-sm text-slate-400 mt-1">{Number(p.horas_semanais_planejadas).toFixed(1)}h planejadas por semana.</p></Card>
        <Card className="p-4"><FiBookOpen className="text-accent-400 mb-3" /><h3 className="font-bold text-white">Conteúdo restante</h3><p className="text-sm text-slate-400 mt-1">{p.topicos.restantes} tópicos ainda não concluídos.</p></Card>
        <Card className="p-4"><FiHelpCircle className="text-orange-400 mb-3" /><h3 className="font-bold text-white">Próximo foco</h3><p className="text-sm text-slate-400 mt-1">Use matérias e assuntos com menor domínio na próxima sessão.</p></Card>
      </div>
    </div>
  )
}
