import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, UserPlus, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const { t } = useLanguage()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      // 成功后 AuthContext 会自动更新 user，App 路由自动跳转
    } catch (err) {
      setError(err.message || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo：空白头像 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-nav border border-gold/25 flex items-center justify-center mb-3">
            <User size={30} className="text-cinnabar" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-cream tracking-widest">{t('appName')}</h1>
          <p className="text-xs text-muted mt-1">{t('appSubtitle')}</p>
        </div>

        {/* 卡片 */}
        <div className="ink-card p-6">
          {/* 登录/注册切换 */}
          <div className="flex gap-1 mb-5 p-1 bg-field rounded-md">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-1.5 text-sm rounded transition-colors ${
                  mode === m ? 'bg-cinnabar text-onaccent' : 'text-muted hover:text-cream'
                }`}
              >
                {m === 'login' ? t('login') : t('register')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="lbl">{t('email')}</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field !pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="lbl">{t('password')}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field !pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#c96b5b] bg-[#8c3a30]/15 border border-[#8c3a30]/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-cinnabar w-full disabled:opacity-60">
              {mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
              {busy ? t('loading') : mode === 'login' ? t('login') : t('register')}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted mt-4">DiDiDaDiDa Manager</p>
      </motion.div>
    </div>
  )
}
