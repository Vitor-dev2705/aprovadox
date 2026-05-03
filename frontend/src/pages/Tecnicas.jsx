import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiClock, FiZap, FiRepeat, FiGrid, FiBookOpen, FiHelpCircle, FiChevronDown, FiArrowRight } from 'react-icons/fi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const tecnicas = [
  {
    id: 'pomodoro',
    nome: 'Técnica Pomodoro',
    emoji: '🍅',
    icon: FiClock,
    cor: '#ef4444',
    resumo: 'Estude em blocos de 25 minutos com pausas estratégicas para maximizar o foco.',
    beneficios: ['Aumenta o foco', 'Reduz a procrastinação', 'Previne o esgotamento mental'],
    passos: [
      { num: 1, desc: 'Escolha uma tarefa para trabalhar' },
      { num: 2, desc: 'Configure o timer para 25 minutos' },
      { num: 3, desc: 'Trabalhe com foco total até o timer soar' },
      { num: 4, desc: 'Faça uma pausa de 5 minutos' },
      { num: 5, desc: 'A cada 4 pomodoros, faça uma pausa longa (15-30 min)' },
    ],
    dica: 'Durante o pomodoro, nada de celular ou redes sociais. Foco total!',
  },
  {
    id: 'feynman',
    nome: 'Técnica Feynman',
    emoji: '🧠',
    icon: FiZap,
    cor: '#6366f1',
    resumo: 'Aprenda ensinando. Se você não consegue explicar de forma simples, ainda não entendeu.',
    beneficios: ['Identifica lacunas no conhecimento', 'Aprofunda a compreensão', 'Fixa o conteúdo na memória'],
    passos: [
      { num: 1, desc: 'Escolha um conceito para aprender' },
      { num: 2, desc: 'Explique o conceito como se ensinasse a uma criança de 10 anos' },
      { num: 3, desc: 'Identifique onde sua explicação falha ou fica confusa' },
      { num: 4, desc: 'Volte ao material e estude as partes que falhou' },
      { num: 5, desc: 'Repita a explicação de forma ainda mais simples' },
    ],
    dica: 'Use analogias do cotidiano. Se não encontrar analogia, você ainda não entendeu bem.',
  },
  {
    id: 'active-recall',
    nome: 'Active Recall',
    emoji: '⚡',
    icon: FiRepeat,
    cor: '#10b981',
    resumo: 'Tente lembrar o conteúdo sem olhar o material. O esforço de recordar fortalece a memória.',
    beneficios: ['Muito mais eficaz que releitura passiva', 'Identifica o que realmente sabe', 'Reconsolida memórias de longo prazo'],
    passos: [
      { num: 1, desc: 'Estude o material uma vez normalmente' },
      { num: 2, desc: 'Feche o material e tente recordar tudo que aprendeu' },
      { num: 3, desc: 'Escreva ou fale em voz alta tudo que lembrar' },
      { num: 4, desc: 'Compare com o material e veja o que esqueceu' },
      { num: 5, desc: 'Repita o processo para os pontos esquecidos' },
    ],
    dica: 'Use o "blank paper method": pegue uma folha em branco e escreva tudo que sabe sobre o tema.',
  },
  {
    id: 'revisao-espacada',
    nome: 'Revisão Espaçada',
    emoji: '🔄',
    icon: FiRepeat,
    cor: '#f59e0b',
    resumo: 'Revise o conteúdo em intervalos crescentes para fixar na memória de longo prazo.',
    beneficios: ['Combate o esquecimento natural', 'Usa o tempo de estudo com eficiência', 'Garante retenção por anos'],
    passos: [
      { num: 1, desc: 'Estude o conteúdo pela primeira vez' },
      { num: 2, desc: 'Revise após 24 horas' },
      { num: 3, desc: 'Revise novamente após 7 dias' },
      { num: 4, desc: 'Revise após 30 dias' },
      { num: 5, desc: 'Última revisão após 90 dias — conteúdo fixado!' },
    ],
    dica: 'O AprovadoX agenda as revisões automaticamente quando você registra uma sessão de estudo.',
  },
  {
    id: 'flashcards',
    nome: 'Flashcards',
    emoji: '🃏',
    icon: FiGrid,
    cor: '#3b82f6',
    resumo: 'Cartões de pergunta e resposta que combinam active recall com revisão espaçada.',
    beneficios: ['Portáteis e práticos', 'Combinam múltiplas técnicas', 'Excelentes para definições e fórmulas'],
    passos: [
      { num: 1, desc: 'Escreva a pergunta/conceito na frente do cartão' },
      { num: 2, desc: 'Escreva a resposta/definição no verso' },
      { num: 3, desc: 'Tente responder antes de virar o cartão' },
      { num: 4, desc: 'Separe os acertos dos erros' },
      { num: 5, desc: 'Revise os erros com mais frequência' },
    ],
    dica: 'Faça os cartões você mesmo! O processo de criar já é aprendizado.',
  },
  {
    id: 'mapas-mentais',
    nome: 'Mapas Mentais',
    emoji: '🗺️',
    icon: FiBookOpen,
    cor: '#8b5cf6',
    resumo: 'Organize informações visualmente conectando ideias de forma hierárquica e criativa.',
    beneficios: ['Visão sistêmica do conteúdo', 'Facilita memorização visual', 'Ótimo para estruturar matérias complexas'],
    passos: [
      { num: 1, desc: 'Coloque o tema central no meio da página' },
      { num: 2, desc: 'Trace ramos para os tópicos principais' },
      { num: 3, desc: 'Adicione sub-ramos para subtópicos' },
      { num: 4, desc: 'Use cores, ícones e palavras-chave (não frases longas)' },
      { num: 5, desc: 'Revise e expanda o mapa conforme estuda mais' },
    ],
    dica: 'Use apenas palavras-chave nos ramos, não frases completas. O objetivo é ativar a memória, não substituir o material.',
  },
]

function TecnicaCard({ t, onStart }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = t.icon

  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${t.cor}, ${t.cor}60)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: t.cor + '20', border: `1px solid ${t.cor}40` }}>
              {t.emoji}
            </div>
            <div>
              <h3 className="font-bold text-white">{t.nome}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{t.resumo}</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {t.beneficios.map((b, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-dark-600 border border-white/5 text-slate-400">{b}</span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onStart(t.id)} icon={<FiArrowRight size={12} />}
            style={{ backgroundColor: t.cor + '25', color: t.cor, borderColor: t.cor + '50' }}
            variant="outline" className="flex-1">
            Usar esta técnica
          </Button>
          <button onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl bg-dark-600 border border-white/5 text-slate-400 hover:text-white transition-all">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}><FiChevronDown size={16} /></motion.div>
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="pt-4 mt-4 border-t border-white/5">
                <h4 className="text-sm font-bold text-white mb-3">📋 Passo a passo</h4>
                <div className="space-y-2">
                  {t.passos.map(p => (
                    <div key={p.num} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: t.cor + '30', color: t.cor }}>{p.num}</span>
                      <p className="text-sm text-slate-300 pt-0.5">{p.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-xl text-xs text-slate-300 italic"
                  style={{ backgroundColor: t.cor + '10', borderLeft: `3px solid ${t.cor}` }}>
                  💡 {t.dica}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}

export default function Tecnicas() {
  const navigate = useNavigate()

  const handleStart = (tecnicaId) => {
    navigate('/cronometro', { state: { tecnica: tecnicaId } })
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-black text-white">Técnicas de Estudo ⚡</h1>
        <p className="text-slate-400 text-sm mt-1">Aprenda as melhores técnicas para estudar de forma eficiente</p>
      </div>

      {/* Quote */}
      <Card className="p-5 bg-gradient-to-r from-brand-500/10 to-accent-500/10 border-brand-500/20">
        <p className="text-white font-medium italic">"Não existe método ruim, existe método aplicado de forma errada. O segredo é a consistência."</p>
        <p className="text-xs text-slate-500 mt-2">— Princípio do AprovadoX</p>
      </Card>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tecnicas.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <TecnicaCard t={t} onStart={handleStart} />
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <Card className="p-6 text-center bg-gradient-to-br from-brand-500/15 to-accent-500/10 border-brand-500/20">
        <p className="text-xl font-black text-white mb-2">Qual técnica você vai usar hoje? 🎯</p>
        <p className="text-slate-400 text-sm mb-4">Combine técnicas para maximizar seu rendimento</p>
        <Button onClick={() => navigate('/cronometro')} icon={<FiClock size={16} />} size="lg">
          Iniciar Sessão Agora
        </Button>
      </Card>
    </div>
  )
}
