import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useLanguage } from '../context/LanguageContext'

// 根据路由决定顶部栏标题
const pageTitles = {
  '/': 'navHome',
  '/projects': 'navProjects',
  '/experiments': 'navExperiments',
  '/papers': 'navPapers',
  '/todos': 'navTodos',
}

export default function Layout() {
  const { t } = useLanguage()
  const location = useLocation()
  const titleKey = pageTitles[location.pathname] || 'navHome'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={t(titleKey)} />
        <main className="flex-1 overflow-y-auto p-5 bg-ink">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
