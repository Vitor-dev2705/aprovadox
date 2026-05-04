import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiLock, FiCamera, FiSave, FiMoon, FiSun, FiLogOut } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'

export default function Perfil() {
  const { user, updateUser, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault(); setSavingProfile(true)
    try {
      const r = await api.put('/auth/profile', profileForm)
      updateUser(r.data)
      toast.success('Perfil atualizado!')
    } catch { toast.error('Erro ao atualizar') } finally { setSavingProfile(false) }
  }

  const handlePassSave = async (e) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirm) { toast.error('Senhas não conferem'); return }
    setSavingPass(true)
    try {
      await api.put('/auth/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
      setPassForm({ currentPassword:'', newPassword:'', confirm:'' })
      toast.success('Senha alterada!')
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao alterar senha') } finally { setSavingPass(false) }
  }

  // Redimensiona e comprime imagem no navegador antes de enviar
  const compressImage = (file, maxSize = 400, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > height) {
            if (width > maxSize) { height = (height * maxSize) / width; width = maxSize }
          } else {
            if (height > maxSize) { width = (width * maxSize) / height; height = maxSize }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)')
      return
    }
    setUploadingAvatar(true)
    try {
      const compressed = await compressImage(file)
      const r = await api.post('/auth/avatar', { avatar: compressed })
      updateUser({ avatar_url: r.data.avatar_url, avatarUrl: r.data.avatar_url })
      toast.success('Foto atualizada! 📸')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Erro ao enviar foto')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-black text-white">Perfil 👤</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar + info */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-500/30">
              {(user?.avatar_url || user?.avatarUrl)
                ? <img src={user.avatar_url || user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{user?.name?.[0]?.toUpperCase()}</span>
                  </div>
              }
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
              {uploadingAvatar
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <FiCamera size={20} className="text-white" />
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">Nível {user?.level || 1}</Badge>
              <Badge variant="orange">🔥 {user?.streak || 0} dias</Badge>
              <Badge variant={user?.plan === 'premium' ? 'warning' : 'default'}>
                {user?.plan === 'premium' ? '⭐ Premium' : 'Free'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-2">Membro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'hoje'}</p>
          </div>
        </div>
      </Card>

      {/* Edit profile */}
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FiUser size={16} className="text-brand-400" />Informações Pessoais</h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <Input label="Nome completo" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} icon={<FiUser size={15} />} />
          <Input label="E-mail" type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} icon={<FiMail size={15} />} />
          <Button type="submit" loading={savingProfile} icon={<FiSave size={14} />}>Salvar Alterações</Button>
        </form>
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FiLock size={16} className="text-brand-400" />Alterar Senha</h3>
        <form onSubmit={handlePassSave} className="space-y-4">
          <Input label="Senha atual" type="password" placeholder="••••••••" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} icon={<FiLock size={15} />} />
          <Input label="Nova senha" type="password" placeholder="Mínimo 6 caracteres" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} icon={<FiLock size={15} />} />
          <Input label="Confirmar nova senha" type="password" placeholder="Repita a nova senha" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} icon={<FiLock size={15} />} />
          <Button type="submit" loading={savingPass} variant="secondary" icon={<FiSave size={14} />}>Alterar Senha</Button>
        </form>
      </Card>

      {/* Preferences */}
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4">⚙️ Preferências</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-600/50 border border-white/5">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <FiMoon size={18} className="text-brand-400" /> : <FiSun size={18} className="text-yellow-400" />}
              <div>
                <p className="text-sm font-medium text-white">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</p>
                <p className="text-xs text-slate-500">Aparência da interface</p>
              </div>
            </div>
            <button onClick={toggleTheme} aria-label="Alternar tema"
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-brand-500' : 'bg-yellow-400'}`}>
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center text-[10px] ${theme === 'dark' ? 'left-8' : 'left-1'}`}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>

          {/* Botões rápidos para escolher direto */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => useThemeStore.getState().setTheme('light')}
              className={`p-3 rounded-xl border transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                theme === 'light'
                  ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}>
              <FiSun size={14} /> Claro
            </button>
            <button onClick={() => useThemeStore.getState().setTheme('dark')}
              className={`p-3 rounded-xl border transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}>
              <FiMoon size={14} /> Escuro
            </button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-red-500/20">
        <h3 className="font-bold text-red-400 mb-4">⚠️ Zona de Perigo</h3>
        <Button variant="danger" onClick={handleLogout} icon={<FiLogOut size={14} />}>
          Sair da conta
        </Button>
      </Card>
    </div>
  )
}
