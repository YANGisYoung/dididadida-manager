import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { DEFAULT_LANG, translate } from '../lib/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // 读取 localStorage 里保存的语言偏好，没有则默认繁体
    return localStorage.getItem('dididada-lang') || DEFAULT_LANG
  })

  const changeLang = useCallback((newLang) => {
    setLang(newLang)
    localStorage.setItem('dididada-lang', newLang)
  }, [])

  // t 函数：取当前语言下的文案
  const t = useCallback((key) => translate(lang, key), [lang])

  const value = useMemo(() => ({ lang, changeLang, t }), [lang, changeLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage 必须在 LanguageProvider 内使用')
  return ctx
}
