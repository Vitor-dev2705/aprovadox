import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiCalendar, FiLock, FiArrowRight, FiCheck, FiX, FiShield, FiArrowLeft } from 'react-icons/fi'
import api from '../services/api'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

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
      {ok ? <FiCheck size={12} /> : <FiX size={12} />}
      <span>{label}</span>
    </div>
  )
}

export default function EsqueciSenha() {
  const [step, setStep] = useState(1)        // 1 = verificação, 2 = nova senha, 3 = sucesso
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [userName, setUserName] = useState('')
  const [form, setForm] = useState({ email: '', data_nascimento: '', newPassword: '', confirm: '' })
  const navigate = useNavigate()

  const pwCheck = useMemo(() => checkPassword(form.newPassword), [form.newPassword])
  const pwAllOk = Object.values(pwCheck).every(Boolean)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  // PASSO 1: verificar email + data de nascimento
  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: form.email,
        data_nascimento: form.data_nascimento
      })
      setResetToken(data.resetToken)
      setUserName(data.name)
      setStep(2)
      toast.success('Identidade verificada! Crie sua nova senha.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao verificar dados')
    } finally {
      setLoading(false)
    }
  }

  // PASSO 2: definir nova senha
  const handleReset = async (e) => {
    e.preventDefault()
    if (!pwAllOk) { toast.error('A senha não atende aos requisitos'); return }
    if (form.newPassword !== form.confirm) { toast.error('As senhas não conferem'); return }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword: form.newPassword
      })
      setStep(3)
      toast.success('Senha redefinida! 🎉')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 via-transparent to-transparent" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-black text-xl">X</span>
          </div>
          <span className="font-black text-2xl gradient-text">AprovadoX</span>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${
              s <= step ? 'bg-brand-500' : 'bg-dark-600'
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* PASSO 1: Verificação */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mb-5">
                <FiShield size={24} className="text-brand-400" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">Recuperar senha 🔐</h1>
              <p className="text-slate-400 mb-6">Confirme seu e-mail e data de nascimento para verificarmos sua identidade.</p>

              <form onSubmit={handleVerify} className="space-y-4">
                <Input label="E-mail da conta" type="email" placeholder="seu@email.com"
                  icon={<FiMail size={16} />} value={form.email}
                  onChange={set('email')} required />

                <Input label="Sua data de nascimento" type="date"
                  icon={<FiCalendar size={16} />}
                  value={form.data_nascimento}
                  onChange={set('data_nascimento')} required />

                <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
                  Verificar identidade <FiArrowRight />
                </Button>
              </form>

              <Link to="/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm mt-6 transition-colors">
                <FiArrowLeft size={14} /> Voltar para login
              </Link>
            </motion.div>
          )}

          {/* PASSO 2: Nova senha */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-14 h-14 rounded-2xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mb-5">
                <FiLock size={24} className="text-accent-400" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">Nova senha</h1>
              <p className="text-slate-400 mb-6">
                Olá <span className="text-white font-semibold">{userName?.split(' ')[0]}</span>! Sua identidade foi confirmada. Agora crie uma senha forte.
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Input label="Nova senha" type="password" placeholder="Crie uma senha forte"
                    icon={<FiLock size={16} />} value={form.newPassword}
                    onChange={set('newPassword')} required />

                  {form.newPassword && (
                    <div className="mt-2 p-3 rounded-xl bg-dark-600/50 border border-white/5 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-300 mb-1.5">Requisitos da senha:</p>
                      <PasswordRequirement ok={pwCheck.length}  label="Mínimo 8 caracteres" />
                      <PasswordRequirement ok={pwCheck.upper}   label="1 letra maiúscula (A-Z)" />
                      <PasswordRequirement ok={pwCheck.lower}   label="1 letra minúscula (a-z)" />
                      <PasswordRequirement ok={pwCheck.number}  label="1 número (0-9)" />
                      <PasswordRequirement ok={pwCheck.special} label="1 caractere especial (!@#$% etc.)" />
                    </div>
                  )}
                </div>

                <Input label="Confirmar nova senha" type="password" placeholder="Repita a senha"
                  icon={<FiLock size={16} />} value={form.confirm}
                  onChange={set('confirm')} required />

                <Button type="submit" size="lg" loading={loading} disabled={!pwAllOk} className="w-full mt-2">
                  Redefinir senha <FiCheck />
                </Button>
              </form>
            </motion.div>
          )}

          {/* PASSO 3: Sucesso */}
          {step === 3 && (
            <motion.div key="step3" className="text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-accent-500/20 border-2 border-accent-500 flex items-center justify-center mx-auto mb-6">
                <FiCheck size={36} className="text-accent-400" />
              </motion.div>
              <h1 className="text-3xl font-black text-white mb-2">Senha redefinida! 🎉</h1>
              <p className="text-slate-400 mb-8">Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.</p>

              <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
                Ir para o login <FiArrowRight />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
