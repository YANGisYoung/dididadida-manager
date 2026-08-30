import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, FlaskConical, BookOpen, CheckSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import SealedLogo from './SealedLogo'

const navItems = [
  { key: 'navHome', icon: LayoutDashboard, to: '/' },
  { key: 'navProjects', icon: FolderKanban, to: '/projects' },
  { key: 'navExperiments', icon: FlaskConical, to: '/experiments' },
  { key: 'navPapers', icon: BookOpen, to: '/papers' },
  { key: 'navTodos', icon: CheckSquare, to: '/todos' },
]

// 主侧栏：收起成窄条（图标居中，hover 显示 tooltip）。
// 关键：图标永远保持「绝对定位居中」，文字通过 AnimatePresence 独立进出，
// 从而图标绝不位移、绝不闪跳。
export default function Sidebar() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1')

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }

  const iconOnly = collapsed

  return (
    <motion.aside
      className="shrink-0 h-full bg-nav border-r border-divider flex flex-col select-none overflow-hidden"
      animate={{ width: iconOnly ? 60 : 220 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      draggable={false}
    >
      {/* Logo 区 */}
      <div className="h-14 flex items-center px-3 border-b border-gold/20 shrink-0">
        <SealedLogo size={36} className="shrink-0" />
        <AnimatePresence initial={false}>
          {!iconOnly && (
            <motion.div
              className="leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap', marginLeft: 10 }}
            >
              <div className="text-sm font-semibold text-cream tracking-wide">{t('appName')}</div>
              <div className="text-[10px] text-muted">{t('appSubtitle')}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 导航：图标用固定宽容器居中，文字右侧淡入淡出（图标位置恒定） */}
      <nav className={`flex-1 py-3 space-y-1 ${iconOnly ? 'px-2' : 'px-2'}`}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={iconOnly ? t(item.key) : undefined}
              className="block"
            >
              <div
                className={`flex items-center rounded-md transition-colors ${
                  isActive
                    ? 'bg-cinnabar/20 text-cream'
                    : 'text-muted hover:text-cream hover:bg-hover'
                }`}
              >
                {/* 图标：固定 40px 容器，始终居中 */}
                <span className="w-10 shrink-0 flex items-center justify-center h-9">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                {/* 文字：右侧，顺畅淡入淡出 */}
                <AnimatePresence initial={false}>
                  {!iconOnly && (
                    <motion.span
                      className="whitespace-nowrap text-sm pr-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {t(item.key)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* 底部：收起切换 */}
      <div className={`border-t border-gold/20 shrink-0 ${iconOnly ? 'p-1' : 'p-2'}`}>
        <button
          onClick={toggleCollapsed}
          className={`flex items-center rounded-md text-xs text-muted hover:text-cream hover:bg-hover transition-colors ${
            iconOnly ? 'mx-auto' : ''
          }`}
          title={collapsed ? '展开' : '收起'}
        >
          <span className="w-10 h-9 shrink-0 flex items-center justify-center">
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </span>
          <AnimatePresence initial={false}>
            {!iconOnly && (
              <motion.span
                className="whitespace-nowrap pr-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                收起
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <AnimatePresence initial={false}>
          {!iconOnly && (
            <motion.div
              className="text-xs text-muted truncate text-center pt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              title={user?.email}
            >
              {user?.email}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
