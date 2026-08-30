import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderKanban, BookOpen, FlaskConical, Package, Pencil,
  FolderPlus, FilePlus, AlertTriangle, Clock, CheckSquare,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { enumLabel } from '../lib/enums'
import { Card, SectionTitle, Spinner, Badge, Empty, Modal } from '../components/ui'

// 阶段对应的完成百分比（5 阶段）
const STAGE_PROGRESS = { '方案': 20, '采购': 40, '搭建': 60, '调试': 80, '结项': 100 }

export default function Home() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [motto, setMotto] = useState('')
  const [editingMotto, setEditingMotto] = useState(false)
  const [mottoDraft, setMottoDraft] = useState('')
  const [showOngoing, setShowOngoing] = useState(false)

  // 加载首页全部数据
  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const [projects, papers, experiments, todos, bom, settings] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('papers').select('*'),
        supabase.from('experiments').select('*'),
        supabase.from('todos').select('*').order('created_at', { ascending: false }),
        supabase.from('bom_items').select('*'),
        supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle(),
      ])
      if (!active) return
      setData({
        projects: projects.data || [],
        papers: papers.data || [],
        experiments: experiments.data || [],
        todos: todos.data || [],
        bom: bom.data || [],
      })
      const motto = settings.data?.motto || ''
      setMotto(motto)
      setMottoDraft(motto)
      // 默认选中第一个未结项项目
      const ongoing = (projects.data || []).find((p) => p.stage !== '结项') || (projects.data || [])[0]
      if (ongoing) setSelectedProjectId(ongoing.id)
    })()
    return () => { active = false }
  }, [user])

  const stats = useMemo(() => {
    if (!data) return null
    const totalProjects = data.projects.length
    const ongoingProjects = data.projects.filter((p) => p.stage !== '结项').length
    const totalPapers = data.papers.length
    const readPapers = data.papers.filter((p) => p.read_status === '已读').length
    const totalExps = data.experiments.length
    const ongoingExps = data.experiments.filter((e) => e.status === '进行中').length
    const toPurchase = data.bom.filter((b) => b.status === '待采购').length
    return { totalProjects, ongoingProjects, totalPapers, readPapers, totalExps, ongoingExps, toPurchase }
  }, [data])

  // 当前选中项目
  const selectedProject = useMemo(
    () => data?.projects.find((p) => p.id === selectedProjectId) || data?.projects[0],
    [data, selectedProjectId],
  )

  // 进行中的项目（供弹窗选择）
  const ongoingProjects = useMemo(
    () => (data?.projects || []).filter((p) => p.stage !== '结项'),
    [data],
  )

  // 自动提醒计算
  const reminders = useMemo(() => {
    if (!data) return []
    const list = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const near = new Date(today)
    near.setDate(near.getDate() + 7)

    const overdueProjects = data.projects.filter((p) => {
      if (p.stage === '结项' || !p.deadline) return false
      return new Date(p.deadline) < today
    })
    const upcomingProjects = data.projects.filter((p) => {
      if (p.stage === '结项' || !p.deadline) return false
      const d = new Date(p.deadline)
      return d >= today && d <= near
    })
    const unreadPapers = data.papers.filter((p) => p.read_status !== '已读')
    const overdueTodos = data.todos.filter((td) => {
      if (td.status === '已完成' || !td.due_date) return false
      return new Date(td.due_date) < today
    })

    // 逾期项目：每个作为可点击项
    if (overdueProjects.length) {
      list.push({ icon: AlertTriangle, color: '#c96b5b', type: 'overdue', label: t('remindOverdueProject'), projects: overdueProjects })
    }
    // 即将截止项目：每个作为可点击项
    if (upcomingProjects.length) {
      list.push({ icon: Clock, color: 'rgb(var(--c-gold))', type: 'upcoming', label: t('remindUpcomingProject'), projects: upcomingProjects })
    }
    // 未读论文：可点击列表
    if (unreadPapers.length) {
      list.push({ icon: BookOpen, color: 'rgb(var(--c-ochre))', type: 'unreadPapers', label: t('remindUnreadPaper'), papers: unreadPapers })
    }
    if (overdueTodos.length) list.push({ icon: CheckSquare, color: '#c96b5b', type: 'todo', text: `${overdueTodos.length} ${t('remindOverdueTodo')}` })
    return list
  }, [data, t])

  const saveMotto = async () => {
    await supabase.from('settings').upsert({ user_id: user.id, motto: mottoDraft })
    setMotto(mottoDraft)
    setEditingMotto(false)
  }

  if (!data) return <Spinner />

  const progress = selectedProject ? STAGE_PROGRESS[selectedProject.stage] ?? 0 : 0

  return (
    <div className="space-y-5">
      {/* 问候区 + 个性签名 */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-cream">{t('welcome')}</h2>
            <div className="flex items-center gap-2 mt-2 min-h-6">
              {editingMotto ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={mottoDraft}
                    onChange={(e) => setMottoDraft(e.target.value)}
                    className="field"
                    placeholder={t('mottoPlaceholder')}
                  />
                  <button onClick={saveMotto} className="btn-cinnabar shrink-0">{t('save')}</button>
                  <button onClick={() => { setEditingMotto(false); setMottoDraft(motto) }} className="btn-ghost shrink-0">{t('cancel')}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted">
                  <span className="seal-dot" />
                  <span className="text-sm italic">{motto || t('mottoPlaceholder')}</span>
                  <button onClick={() => setEditingMotto(true)} className="text-muted hover:text-cream transition-colors">
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* 快速入口 */}
          <div className="flex gap-2 shrink-0">
            <button onClick={() => navigate('/projects?new=1')} className="btn-ghost !px-3 !py-1.5 text-xs">
              <FolderPlus size={14} />{t('newProject')}
            </button>
            <button onClick={() => navigate('/experiments?new=1')} className="btn-ghost !px-3 !py-1.5 text-xs">
              <FlaskConical size={14} />{t('newExperiment')}
            </button>
            <button onClick={() => navigate('/papers?new=1')} className="btn-ghost !px-3 !py-1.5 text-xs">
              <FilePlus size={14} />{t('newPaper')}
            </button>
          </div>
        </div>
      </Card>

      {/* 数据概览卡片行 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 项目：总数 + 进行中，可点击选择 */}
        <StatCard icon={FolderKanban} label={t('statProjects')} value={stats.totalProjects} sub={`${t('ongoing')} ${stats.ongoingProjects}`} ratio={0} onClick={() => setShowOngoing(true)} clickable />
        {/* 论文：总数 + 已读占比 */}
        <StatCard icon={BookOpen} label={t('statPapers')} value={stats.totalPapers} sub={`${t('readStatus')} ${Math.round((stats.readPapers / (stats.totalPapers || 1)) * 100)}%`} ratio={stats.totalPapers ? stats.readPapers / stats.totalPapers : 0} />
        {/* 实验：总数 + 进行中 */}
        <StatCard icon={FlaskConical} label={t('statExperiments')} value={stats.totalExps} sub={`${t('ongoing')} ${stats.ongoingExps}`} ratio={0} />
        {/* 待采购物料 */}
        <StatCard icon={Package} label={t('statBom')} value={stats.toPurchase} ratio={0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：项目进度环形图 */}
        <Card className="lg:col-span-1">
          <SectionTitle title={t('projectProgress')} icon={FolderKanban} />
          {data.projects.length === 0 ? (
            <Empty />
          ) : (
            <>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="field mb-3"
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-nav">{p.name}</option>
                ))}
              </select>
              <div className="relative w-44 h-44 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'done', value: progress },
                        { name: 'rest', value: 100 - progress },
                      ]}
                      cx="50%" cy="50%" innerRadius={58} outerRadius={76}
                      startAngle={90} endAngle={-270}
                      dataKey="value" stroke="none"
                    >
                      <Cell fill="#8c3a30" />
                      <Cell fill={theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-cream">{progress}%</span>
                  <span className="text-xs text-muted mt-1">{selectedProject?.stage}</span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* 中间：任务看板 */}
        <Card className="lg:col-span-2">
          <SectionTitle title={t('taskBoard')} icon={CheckSquare} />
          {data.todos.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {['待办', '进行中', '已完成'].map((status) => {
                const items = data.todos.filter((td) => td.status === status)
                const dotColor = status === '待办' ? 'bg-cinnabar' : status === '进行中' ? 'bg-ochre' : 'bg-muted'
                const priorityColor = { '高': '#8c3a30', '中': '#a67a6a', '低': '#8a7a6d' }
                return (
                  <div key={status}>
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-muted">
                      <span className={`w-2 h-2 rounded-sm ${dotColor}`} />
                      {t('todoStatus' + ({ '待办': 'Todo', '进行中': 'Doing', '已完成': 'Done' })[status])}
                      <span className="ml-auto">{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((td, i) => (
                        <motion.div
                          key={td.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-nav rounded p-2.5 border-l-[3px] animate-floaty"
                          style={{ borderLeftColor: priorityColor[td.priority] || '#a67a6a', animationDelay: `${i * 0.5}s` }}
                        >
                          <p className="text-xs text-cream leading-snug">{td.content}</p>
                          {td.due_date && <p className="text-[10px] text-muted mt-1">{td.due_date}</p>}
                        </motion.div>
                      ))}
                      {items.length === 0 && <div className="text-[10px] text-muted/40 text-center py-3">—</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 时间轴 */}
        <Card className="lg:col-span-2">
          <SectionTitle title={t('timeline')} icon={Clock} />
          <Timeline projects={data.projects} />
        </Card>

        {/* 提醒 + 最近活动 */}
        <div className="space-y-4">
          <Card>
            <SectionTitle title={t('reminders')} icon={AlertTriangle} />
            {reminders.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-3">
                {reminders.map((r, i) => {
                  const Icon = r.icon
                  // 未读论文：可点击论文列表
                  if (r.type === 'unreadPapers') {
                    return (
                      <div key={i}>
                        <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: r.color }}>
                          <Icon size={14} />
                          <span>{r.papers.length} {r.label}</span>
                        </div>
                        <div className="pl-4 space-y-1">
                          {r.papers.map((pp) => (
                            <button
                              key={pp.id}
                              onClick={() => navigate(`/papers?select=${pp.id}`)}
                              className="flex items-center gap-1.5 text-xs text-cream/80 hover:text-cream hover:bg-hover rounded px-1.5 py-0.5 transition-colors w-full text-left"
                            >
                              <BookOpen size={12} className="shrink-0" style={{ color: r.color }} />
                              <span className="truncate">{pp.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  // 项目类提醒：显示摘要 + 具体项目名列表（可点击跳转）
                  if (r.type === 'overdue' || r.type === 'upcoming') {
                    return (
                      <div key={i}>
                        <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: r.color }}>
                          <Icon size={14} />
                          <span>{r.projects.length} {r.label}</span>
                        </div>
                        <div className="pl-4 space-y-1">
                          {r.projects.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => navigate(`/projects?select=${p.id}`)}
                              className="flex items-center gap-1.5 text-xs text-cream/80 hover:text-cream hover:bg-hover rounded px-1.5 py-0.5 transition-colors w-full text-left"
                            >
                              <FolderKanban size={12} className="shrink-0" style={{ color: r.color }} />
                              <span className="truncate">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  // 其他提醒（待办）：保持一行
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: r.color }}>
                      <Icon size={14} />
                      <span>{r.text}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle title={t('recentActivity')} icon={Clock} />
            <RecentActivity data={data} />
          </Card>
        </div>
      </div>

      {/* 进行中项目选择弹窗 */}
      <Modal open={showOngoing} onClose={() => setShowOngoing(false)} title={t('statProjects')}>
        <div className="space-y-1.5">
          {ongoingProjects.length === 0 ? (
            <p className="text-xs text-muted/60 text-center py-3">—</p>
          ) : (
            ongoingProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setShowOngoing(false); navigate(`/projects?select=${p.id}`) }}
                className="flex items-center justify-between w-full text-left px-3 py-2 rounded-md hover:bg-hover transition-colors"
              >
                <span className="flex items-center gap-2 text-sm text-cream min-w-0">
                  <FolderKanban size={15} className="text-cinnabar shrink-0" />
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="text-xs text-muted shrink-0">{enumLabel(p.stage, lang)}</span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

// 概览统计卡片（可选 onClick，可点击时显示 hover 反馈；sub 为下方副文字）
function StatCard({ icon: Icon, label, value, sub, ratio, onClick, clickable = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`ink-card p-4 ${clickable ? 'cursor-pointer hover:border-gold/40 transition-colors' : ''}`}
    >
      <div className="flex items-center gap-2 text-muted text-xs">
        <Icon size={14} className="text-cinnabar" />
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span className="text-2xl font-bold text-cinnabar">{value}</span>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
      {/* 微光进度条（朱红→淡赭石渐变，流动） */}
      <div className="mt-2 h-1 rounded-full bg-hover overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cinnabar to-ochre animate-flow"
          style={{
            width: `${ratio > 0 ? Math.round(ratio * 100) : 8}%`,
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </motion.div>
  )
}

// 时间轴（水平直线 + 朱红节点）
function Timeline({ projects }) {
  const { t } = useLanguage()
  // 收集所有项目的阶段时间线，按开始日期排序，取最近 8 个节点
  const nodes = useMemo(() => {
    const all = []
    for (const p of projects) {
      all.push({ key: `${p.id}-start`, date: p.deadline, label: p.name, stage: p.stage })
    }
    return all.filter((n) => n.date).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 8)
  }, [projects])

  if (nodes.length === 0) return <Empty />

  return (
    <div className="relative pt-4">
      {/* 水平直线 */}
      <div className="absolute left-0 right-0 top-4 h-px bg-gold/30" />
      <div className="relative flex justify-between">
        {nodes.map((n, i) => (
          <div key={n.key} className="flex flex-col items-center" style={{ width: `${100 / nodes.length}%` }}>
            <span
              className={`w-3 h-3 rounded-full bg-cinnabar ${i === nodes.length - 1 ? 'ring-4 ring-cinnabar/30' : ''}`}
            />
            <p className="text-[10px] text-muted mt-2 text-center leading-tight px-1 truncate max-w-full">{n.label}</p>
            <p className="text-[9px] text-muted/60">{n.date}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// 最近活动
function RecentActivity({ data }) {
  const { t } = useLanguage()
  const activities = useMemo(() => {
    const list = [
      ...data.projects.map((x) => ({ ...x, type: 'project', time: x.created_at })),
      ...data.papers.map((x) => ({ ...x, type: 'paper', time: x.created_at })),
      ...data.experiments.map((x) => ({ ...x, type: 'exp', time: x.created_at })),
    ]
    return list.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)
  }, [data])

  if (activities.length === 0) return <Empty />

  const iconMap = {
    project: { icon: FolderKanban, label: (x) => x.name },
    paper: { icon: BookOpen, label: (x) => x.title },
    exp: { icon: FlaskConical, label: (x) => x.name },
  }

  // 格式化为「今天/昨天/MM-DD HH:mm」
  const fmtTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const dTime = d.getTime()
    const pad = (n) => String(n).padStart(2, '0')
    const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
    if (dTime >= startOfToday) return `今天 ${hm}`
    if (dTime >= startOfToday - 86400000) return `昨天 ${hm}`
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="space-y-2">
      {activities.map((a, i) => {
        const cfg = iconMap[a.type]
        const Icon = cfg.icon
        return (
          <div key={`${a.type}-${a.id}`} className="flex items-center gap-2 text-xs">
            <Icon size={13} className="text-cinnabar shrink-0" />
            <span className="text-cream/80 truncate flex-1">{cfg.label(a)}</span>
            <span className="text-muted text-[10px] shrink-0">{fmtTime(a.time)}</span>
            <Badge color="gray">{a.type === 'project' ? t('navProjects') : a.type === 'paper' ? t('navPapers') : t('navExperiments')}</Badge>
          </div>
        )
      })}
    </div>
  )
}
