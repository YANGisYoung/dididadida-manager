import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const ThemeContext = createContext(null)

// 根据当前时间决定默认主题：
//   21:00 ~ 次日 5:00 → 深色（dark）
//   其他时间          → 浅色（light）
function getDefaultTheme() {
  const hour = new Date().getHours()
  if (hour >= 21 || hour < 5) return 'dark'
  return 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getDefaultTheme)

  // 手动切换：只对当次生效，不写 localStorage（刷新后重新按时间决定）
  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  // 把主题写到根元素，CSS 变量据此切换
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}
