import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiArrowRight, FiZap, FiClock, FiCalendar, FiAward, FiBarChart2 } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const highlights = [
  { icon: FiClock,     label: 'Cronômetro com Pomodoro' },
  { icon: FiCalendar,  label: 'Revisão espaçada automática' },
  { icon: FiBarChart2, label: 'Gráficos de evolução' },
  { icon: FiAward,     label: 'Gamificação e medalhas' },
]

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(form.email, form.password)
    if (ok) navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <span className="font-black text-2xl gradient-text">AprovadoX</span>
          </Link>

          <h1 className="text-3xl font-black text-white mb-2">Bem-vindo de volta! 👋</h1>
          <p className="text-slate-400 mb-8">Continue sua jornada rumo à aprovação.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              icon={<FiMail size={16} />}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={<FiLock size={16} />}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Lembrar-me
              </label>
              <button type="button" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
              Entrar <FiArrowRight />
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden bg-dark-800"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-brand-600/20 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          {/* Big icon */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/40"
          >
            <FiZap size={40} className="text-white" />
          </motion.div>

          <h2 className="text-3xl font-black text-white mb-4">Sua aprovação <span className="gradient-text">começa aqui</span></h2>
          <p className="text-slate-400 mb-10">A plataforma completa para quem estuda para concursos públicos.</p>

          {/* Highlights */}
          <div className="space-y-3 text-left">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-dark-700/60 rounded-xl p-3 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-brand-400" />
                </div>
                <span className="text-sm text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
