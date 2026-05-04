import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheck, FiClock, FiTarget, FiBarChart2, FiAward,
         FiBookOpen, FiCalendar, FiZap, FiRepeat, FiAlertCircle, FiGrid } from 'react-icons/fi'

const features = [
  { icon: FiClock,      title: 'Cronômetro Inteligente',  desc: 'Pomodoro, Feynman, Active Recall e mais. Registre cada sessão automaticamente.', color: '#6366f1' },
  { icon: FiTarget,     title: 'Gestão de Concursos',     desc: 'Cadastre seus concursos, controle prazos, matérias e pesos.', color: '#10b981' },
  { icon: FiCalendar,   title: 'Revisão Espaçada',        desc: 'Sistema automático: 24h, 7d, 30d e 90d após cada sessão.', color: '#f59e0b' },
  { icon: FiBarChart2,  title: 'Gráficos de Evolução',    desc: 'Acompanhe seu progresso com relatórios detalhados.', color: '#3b82f6' },
  { icon: FiAward,      title: 'Gamificação',             desc: 'XP, níveis, medalhas e missões diárias para manter a motivação.', color: '#ec4899' },
  { icon: FiAlertCircle,title: 'Banco de Questões Erradas', desc: 'Registre erros e revise depois para nunca mais errar.', color: '#8b5cf6' },
  { icon: FiBookOpen,   title: 'Matérias e Assuntos',     desc: 'Organize por matéria com cores, metas e checklist de tópicos.', color: '#06b6d4' },
  { icon: FiGrid,       title: 'Planejamento Semanal',    desc: 'Calendário drag & drop para planejar sua semana de estudo.', color: '#a855f7' },
  { icon: FiRepeat,     title: 'Técnicas de Estudo',      desc: 'Aprenda Pomodoro, Feynman, Mapas Mentais e Flashcards.', color: '#ef4444' },
]

const plans = [
  {
    name: 'Free', price: 'R$0', period: 'para sempre', color: 'border-white/10',
    features: ['Cronômetro de estudo', 'Até 3 matérias', 'Dashboard básico', 'Gamificação completa'],
    cta: 'Começar grátis'
  },
  {
    name: 'Premium', price: 'R$19,90', period: '/mês', color: 'border-brand-500/50', popular: true,
    features: ['Matérias ilimitadas', 'Revisão espaçada automática', 'Relatórios avançados', 'Banco de questões', 'Planejamento semanal', 'Suporte prioritário'],
    cta: 'Assinar Premium'
  },
]

const howItWorks = [
  { step: '01', title: 'Cadastre seu concurso',   desc: 'Adicione o concurso que está estudando, com banca, cargo e data da prova.' },
  { step: '02', title: 'Organize as matérias',     desc: 'Crie matérias, assuntos e defina metas semanais por disciplina.' },
  { step: '03', title: 'Estude com método',        desc: 'Use o cronômetro com técnicas comprovadas como Pomodoro e Feynman.' },
  { step: '04', title: 'Revise no tempo certo',    desc: 'O sistema agenda revisões automáticas para fixar o conteúdo.' },
  { step: '05', title: 'Acompanhe sua evolução',   desc: 'Veja gráficos, conquiste medalhas e aproxime-se da sua aprovação.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-black text-lg">X</span>
          </div>
          <span className="font-black text-xl gradient-text">AprovadoX</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2">
            Entrar
          </button>
          <button onClick={() => navigate('/cadastro')} className="btn-primary text-sm px-5 py-2.5">
            Criar conta grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-sm font-medium mb-6">
              <FiZap size={14} /> Plataforma completa para concurseiros
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              Sua aprovação<br /><span className="gradient-text">começa aqui</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              A ferramenta que organiza seu estudo do início ao fim. Cronômetro inteligente, revisão espaçada automática, gráficos de evolução e muito mais — tudo em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => navigate('/cadastro')}
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
                Começar grátis <FiArrowRight />
              </motion.button>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => navigate('/login')}
                className="btn-secondary text-lg px-8 py-4">
                Já tenho conta
              </motion.button>
            </div>
            <p className="text-xs text-slate-500 mt-4">Grátis para sempre · Sem cartão de crédito</p>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.7 }}
            className="mt-16 relative">
            <div className="gradient-border rounded-2xl p-1">
              <div className="bg-dark-800 rounded-xl p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-slate-500">aprovadox.vercel.app/dashboard</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[['2.5h','Hoje','#6366f1'],['12h','Semana','#10b981'],['45h','Mês','#8b5cf6'],['7🔥','Streak','#f59e0b']].map(([v,l,c]) => (
                    <div key={l} className="p-3 rounded-xl" style={{ backgroundColor: c+'20', border:`1px solid ${c}30` }}>
                      <p className="text-lg font-black text-white">{v}</p>
                      <p className="text-xs" style={{ color: c }}>{l}</p>
                    </div>
                  ))}
                </div>
                <div className="h-24 bg-dark-700 rounded-xl flex items-end justify-around px-4 pb-3 gap-2">
                  {[30,60,45,80,55,90,40].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md" style={{ height:`${h}%`, background: i===5?'#6366f1':'#1a1a27' }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-y border-white/5 bg-dark-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Como <span className="gradient-text">funciona</span></h2>
            <p className="text-slate-400 text-lg">Em 5 passos simples você organiza tudo.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {howItWorks.map((step, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay: i*0.08 }} viewport={{ once: true }}
                className="p-5 rounded-2xl bg-dark-700 border border-white/5">
                <p className="text-3xl font-black gradient-text mb-3">{step.step}</p>
                <h3 className="font-bold text-white mb-2 text-sm">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Tudo que você precisa <span className="gradient-text">em um só lugar</span></h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Ferramentas pensadas especialmente para quem estuda para concursos.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay: i*0.05 }} viewport={{ once: true }}
                className="p-6 rounded-2xl bg-dark-700 border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: f.color+'25', border:`1px solid ${f.color}40` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Techniques highlight */}
      <section className="py-20 px-6 bg-dark-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Estude com <span className="gradient-text">métodos comprovados</span></h2>
            <p className="text-slate-400 text-lg">As técnicas mais eficazes para concurseiros, integradas direto na plataforma.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { emoji:'🍅', name:'Pomodoro',         desc:'25 min de foco + pausa' },
              { emoji:'🧠', name:'Técnica Feynman',  desc:'Aprenda ensinando' },
              { emoji:'⚡', name:'Active Recall',    desc:'Lembre antes de reler' },
              { emoji:'🔄', name:'Revisão Espaçada', desc:'Memória de longo prazo' },
              { emoji:'🃏', name:'Flashcards',       desc:'Pergunta e resposta' },
              { emoji:'🗺️', name:'Mapas Mentais',   desc:'Organização visual' },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }}
                transition={{ delay: i*0.05 }} viewport={{ once: true }}
                className="p-4 rounded-xl bg-dark-700 border border-white/5 text-center">
                <div className="text-3xl mb-2">{t.emoji}</div>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Planos <span className="gradient-text">simples e honestos</span></h2>
            <p className="text-slate-400 text-lg">Comece grátis. Faça upgrade quando precisar de mais.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {plans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay: i*0.1 }} viewport={{ once: true }}
                className={`p-6 rounded-2xl bg-dark-700 border ${plan.color} relative`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                    ⭐ Mais popular
                  </div>
                )}
                <h3 className="text-2xl font-black text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-black gradient-text">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <FiCheck size={14} className="text-accent-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/cadastro')}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-brand-500/20 to-accent-500/15 border border-brand-500/30">
          <h2 className="text-4xl font-black text-white mb-4">Pronto para começar? 🚀</h2>
          <p className="text-slate-400 mb-8 text-lg">Crie sua conta grátis em menos de 30 segundos.</p>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => navigate('/cadastro')}
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
            Criar conta grátis <FiArrowRight />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">X</span>
          </div>
          <span className="font-black gradient-text">AprovadoX</span>
        </div>
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} AprovadoX. Sua aprovação começa aqui.</p>
      </footer>
    </div>
  )
}
