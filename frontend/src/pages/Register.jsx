import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const features = [
  'Cronômetro de estudo inteligente',
  'Revisão espaçada automática',
  'Gamificação e conquistas',
  'Gráficos de evolução',
  'Banco de questões erradas',
  'Planejamento semanal',
]

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.email.includes('@')) e.email = 'E-mail inválido'
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirm) e.confirm = 'Senhas não conferem'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const ok = await register(form.name, form.email, form.password)
    if (ok) navigate('/dashboard')
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex">
      {/* Left: Visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden bg-dark-800"
      >
        <div className="absolute inset-0 bg-gradient-radial from-accent-500/15 via-transparent to-transparent" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-sm">
          <h2 className="text-4xl font-black text-white mb-4">Junte-se a <span className="gradient-text">50 mil aprovados</span></h2>
          <p className="text-slate-400 mb-10">Crie sua conta grátis e comece a estudar com estratégia agora mesmo.</p>

          <div className="space-y-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck size={12} className="text-accent-400" />
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 rounded-2xl gradient-border">
            <p className="text-sm text-slate-300 italic">"Com o AprovadoX organizei meus estudos e fui aprovado em 8 meses. A revisão espaçada foi o diferencial!"</p>
            <p className="text-xs text-slate-500 mt-3">— João Silva, aprovado TJSP 2024</p>
          </div>
        </div>
      </motion.div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <span className="font-black text-2xl gradient-text">AprovadoX</span>
          </Link>

          <h1 className="text-3xl font-black text-white mb-2">Criar conta grátis 🚀</h1>
          <p className="text-slate-400 mb-8">Comece hoje, seja aprovado amanhã.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Seu nome completo" type="text" placeholder="João da Silva"
              icon={<FiUser size={16} />} value={form.name}
              onChange={set('name')} error={errors.name} required />

            <Input label="E-mail" type="email" placeholder="seu@email.com"
              icon={<FiMail size={16} />} value={form.email}
              onChange={set('email')} error={errors.email} required />

            <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres"
              icon={<FiLock size={16} />} value={form.password}
              onChange={set('password')} error={errors.password} required />

            <Input label="Confirmar senha" type="password" placeholder="Repita a senha"
              icon={<FiLock size={16} />} value={form.confirm}
              onChange={set('confirm')} error={errors.confirm} required />

            <p className="text-xs text-slate-500">
              Ao criar conta você concorda com os <span className="text-brand-400 cursor-pointer">Termos de Uso</span> e <span className="text-brand-400 cursor-pointer">Política de Privacidade</span>.
            </p>

            <Button type="submit" size="lg" loading={isLoading} className="w-full mt-2">
              Criar minha conta <FiArrowRight />
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Fazer login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
