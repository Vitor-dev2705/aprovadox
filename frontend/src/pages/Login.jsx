import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMail, FiLock, FiArrowRight, FiZap, FiClock, FiCalendar, FiAward, FiBarChart2,
  FiAlertCircle
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const highlights = [
  { icon: FiClock,     label: 'Cronômetro com Pomodoro' },
  { icon: FiCalendar,  label: 'Revisão espaçada automática' },
  { icon: FiBarChart2, label: 'Gráficos de evolução' },
  { icon: FiAward,     label: 'Gamificação e medalhas' },
]

// Regex para validar e-mail
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [errors, setErrors] = useState({})
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  // Validação centralizada
  const validate = (data = form) => {
    const e = {}
    // Email
    if (!data.email.trim()) {
      e.email = 'O e-mail é obrigatório'
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      e.email = 'Digite um e-mail válido'
    }
    // Senha
    if (!data.password) {
      e.password = 'A senha é obrigatória'
    } else if (data.password.length < 6) {
      e.password = 'A senha deve ter no mínimo 6 caracteres'
    }
    return e
  }

  const handleChange = (field) => (event) => {
    const value = event.target.value
    const newForm = { ...form, [field]: value }
    setForm(newForm)
    if (touched[field]) {
      setErrors(validate(newForm))
    }
  }

  const handleBlur = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }))
    setErrors(validate())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const ok = await login(form.email.trim(), form.password)
    if (ok) navigate('/dashboard')
  }

  // Verifica se o form está completamente preenchido e válido
  const formValido = !Object.keys(validate()).length

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
          <p className="text-slate-400 mb-6">Continue sua jornada rumo à aprovação.</p>

          {/* Aviso: todos campos obrigatórios */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <span className="text-red-400">*</span>
            <span>Todos os campos são obrigatórios</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                label={<span>E-mail <span className="text-red-400">*</span></span>}
                type="email"
                placeholder="seu@email.com"
                icon={<FiMail size={16} />}
                value={form.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email ? errors.email : undefined}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <Input
                label={<span>Senha <span className="text-red-400">*</span></span>}
                type="password"
                placeholder="Digite sua senha"
                icon={<FiLock size={16} />}
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                autoComplete="current-password"
                required
                minLength={6}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Lembrar-me
              </label>
              <Link to="/esqueci-senha" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

            {/* Resumo de erros (se touched mas invalid) */}
            <AnimatePresence>
              {(touched.email || touched.password) && Object.keys(errors).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <FiAlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-300 space-y-0.5">
                      {Object.values(errors).map((msg, i) => (
                        <p key={i}>• {msg}</p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              disabled={!formValido}
              className="w-full mt-2"
            >
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
        <div className="absolute inset-0 bg-gradient-radial from-brand-600/20 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/40"
          >
            <FiZap size={40} className="text-white" />
          </motion.div>

          <h2 className="text-3xl font-black text-white mb-4">Sua aprovação <span className="gradient-text">começa aqui</span></h2>
          <p className="text-slate-400 mb-10">A plataforma completa para quem estuda para concursos públicos.</p>

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
