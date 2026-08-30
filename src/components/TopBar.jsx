import { useEffect, useRef, useState } from 'react'
import { Sun, Moon, User, LogOut } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { formatLunar } from '../lib/lunar'

// 顶部状态栏：高 56px，底部哑光金细线
// 右侧：农历日期 + 语言切换(单字) + 用户头像菜单 + 深浅色
export default function TopBar({ title }) {
  const { t, lang, changeLang } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // 点击空白处关闭用户菜单
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // 语言单字：zh-Hant -> 繁 / zh-Hans -> 简
  const langChar = lang === 'zh-Hant' ? '繁' : '简'

  // 根据当前时间生成问候语：
  //   21:00 ~ 次日 5:00 → 晚安，呼噜噜
  //   5:00  ~ 12:00     → 早安，啦啦啦
  //   12:00 ~ 21:00     → 啦啦啦
  const hour = new Date().getHours()
  const greeting =
    hour >= 21 || hour < 5 ? t('greetingNight') :
    hour < 12 ? t('greetingMorning') : t('greetingIdle')

  // 本地精确计算农历（纯本地稳定）
  const today = new Date()
  const lunarStr = formatLunar(today)

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-gold/30">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base font-semibold text-cream tracking-wide">{title}</h1>
        <span className="text-xs text-muted">{greeting}</span>
      </div>

      {/* 右侧：农历 + 语言 + 用户菜单 + 深浅色 */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-cream">{lunarStr}</span>

        {/* 语言切换（单字，点击切换） */}
        <button
          onClick={() => changeLang(lang === 'zh-Hant' ? 'zh-Hans' : 'zh-Hant')}
          className="w-7 h-7 flex items-center justify-center text-sm font-medium text-cream hover:bg-hover rounded-md transition-colors"
          title={t('language')}
        >
          {langChar}
        </button>

        {/* 用户头像菜单 */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-cream hover:bg-hover rounded-full transition-colors"
            title={user?.email}
          >
            <User size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-50 w-56 rounded-lg bg-nav border border-gold/25 shadow-2xl p-1">
              <div className="px-3 py-2 text-xs text-muted truncate border-b border-divider">
                {user?.email}
              </div>
              <button
                onClick={async () => {
                  setMenuOpen(false)
                  await signOut()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cream hover:bg-hover rounded-md transition-colors"
              >
                <LogOut size={14} />{t('logout')}
              </button>
            </div>
          )}
        </div>

        {/* 深浅色 */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-muted hover:text-cream hover:bg-hover rounded-md transition-colors"
          title={t('theme')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
