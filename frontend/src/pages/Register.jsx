import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck, FiCalendar, FiX } from 'react-icons/fi'
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

// Verifica força da senha em tempo real
function checkPassword(pw) {
  return {
    length: pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pw),
  }
}

function PasswordRequirement({ ok, label }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-accent-400' : 'text-slate-500'}`}>
      {ok
        ? <FiCheck size={12} className="flex-shrink-0" />
        : <FiX size={12} className="flex-shrink-0" />}
      <span>{label}</span>
    </div>
  )
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', data_nascimento: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const pwCheck = useMemo(() => checkPassword(form.password), [form.password])
  const pwAllOk = Object.values(pwCheck).every(Boolean)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.email.includes('@')) e.email = 'E-mail inválido'
    if (!form.data_nascimento) e.data_nascimento = 'Data de nascimento obrigatória'
    else {
      const d = new Date(form.data_nascimento)
      const idade = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (idade < 10 || idade > 120) e.data_nascimento = 'Idade inválida (mín. 10 anos)'
    }
    if (!pwAllOk) e.password = 'Senha não atende aos requisitos'
    if (form.password !== form.confirm) e.confirm = 'Senhas não conferem'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const ok = await register(form.name, form.email, form.password, form.data_nascimento)
    if (ok) navigate('/dashboard')
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  // Idade máxima (mín. 10 anos) e mínima (até 120 anos atrás)
  const today = new Date().toISOString().slice(0, 10)
  const maxDate = new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const minDate = new Date(Date.now() - 120 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

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
          <h2 className="text-4xl font-black text-white mb-4">Comece a estudar <span className="gradient-text">com método</span></h2>
          <p className="text-slate-400 mb-10">Crie sua conta grátis e organize seus estudos em poucos minutos.</p>

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
            <p className="text-sm text-slate-300">
              <span className="block font-bold text-white mb-1">100% grátis para começar</span>
              Cadastro rápido, sem cartão de crédito. Sua data de nascimento é usada para recuperação de senha caso precise.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-8"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <span className="font-black text-2xl gradient-text">AprovadoX</span>
          </Link>

          <h1 className="text-3xl font-black text-white mb-2">Criar conta grátis 🚀</h1>
          <p className="text-slate-400 mb-6">Comece hoje, seja aprovado amanhã.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Seu nome completo" type="text" placeholder="João da Silva"
              icon={<FiUser size={16} />} value={form.name}
              onChange={set('name')} error={errors.name} required />

            <Input label="E-mail" type="email" placeholder="seu@email.com"
              icon={<FiMail size={16} />} value={form.email}
              onChange={set('email')} error={errors.email} required />

            <Input label="Data de nascimento" type="date"
              icon={<FiCalendar size={16} />}
              value={form.data_nascimento}
              onChange={set('data_nascimento')}
              min={minDate} max={maxDate}
              error={errors.data_nascimento} required />

            <div>
              <Input label="Senha" type="password" placeholder="Crie uma senha forte"
                icon={<FiLock size={16} />} value={form.password}
                onChange={set('password')} error={errors.password} required />

              {/* Requisitos da senha em tempo real */}
              {form.password && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                  className="mt-2 p-3 rounded-xl bg-dark-600/50 border border-white/5 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-300 mb-1.5">Requisitos da senha:</p>
                  <PasswordRequirement ok={pwCheck.length}  label="Mínimo 8 caracteres" />
                  <PasswordRequirement ok={pwCheck.upper}   label="1 letra maiúscula (A-Z)" />
                  <PasswordRequirement ok={pwCheck.lower}   label="1 letra minúscula (a-z)" />
                  <PasswordRequirement ok={pwCheck.number}  label="1 número (0-9)" />
                  <PasswordRequirement ok={pwCheck.special} label="1 caractere especial (!@#$% etc.)" />
                </motion.div>
              )}
            </div>

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
