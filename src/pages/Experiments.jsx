import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FlaskConical, FolderPlus, Folder, ChevronRight, Trash2, Plus,
  BarChart3, ImagePlus,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { supabase, uploadImage } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useImagePaste } from '../lib/useImagePaste'
import { EXP_STATUS, enumLabel } from '../lib/enums'
import { Card, SectionTitle, Modal, Field, Spinner, Empty, Badge, ConfirmDialog } from '../components/ui'
import FolderSidebar from '../components/FolderSidebar'

const PIE_COLORS = ['#8c3a30', '#a67a6a', '#b8a08a', '#6b5d4f', '#c96b5b']

export default function Experiments() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [currentFolderId, setCurrentFolderId] = useState(null) // null = 根目录
  const [folders, setFolders] = useState([])
  const [experiments, setExperiments] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedExpId, setSelectedExpId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('detail') // 'detail' | 'stats'
  const [showNewExp, setShowNewExp] = useState(false)

  // 首页快速入口跳转 ?new=1 时，自动打开新建实验弹窗
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowNewExp(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const load = useCallback(async () => {
    const [f, e, p] = await Promise.all([
      supabase.from('experiment_folders').select('*').order('created_at'),
      supabase.from('experiments').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('created_at'),
    ])
    setFolders(f.data || [])
    setExperiments(e.data || [])
    setProjects(p.data || [])
    setSelectedExpId((prev) => {
      const list = e.data || []
      return prev && list.find((x) => x.id === prev) ? prev : list[0]?.id || null
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createFolder = async (parentId, name) => {
    await supabase.from('experiment_folders').insert({ user_id: user.id, parent_id: parentId, name })
    load()
  }
  const renameFolder = async (folderId, name) => {
    await supabase.from('experiment_folders').update({ name }).eq('id', folderId)
    load()
  }
  const deleteFolder = async (folderId) => {
    await supabase.from('experiment_folders').delete().eq('id', folderId)
    showToast(t('deleteOk'))
    load()
  }

  const selectedExp = experiments.find((e) => e.id === selectedExpId) || null

  if (loading) return <Spinner />

  return (
    <div className="flex gap-4 h-full">
      {/* 左侧：文件夹树 + 实验列表 */}
      <div className="w-72 shrink-0 flex flex-col">
        <Card className="flex-1 !p-0 overflow-hidden">
          <FolderSidebar
            title={t('navExperiments')}
            folders={folders}
            items={experiments}
            selectedFolderId={currentFolderId}
            onSelectFolder={setCurrentFolderId}
            selectedItemId={selectedExpId}
            onSelectItem={setSelectedExpId}
            renderItem={(e) => (
              <div>
                <div className="text-sm text-cream break-words leading-snug">{e.name}</div>
                <div className="text-[11px] text-muted mt-0.5 flex items-center gap-2">
                  <span>{enumLabel(e.status, lang)}</span>
                  {e.exp_date && <span>· {e.exp_date}</span>}
                </div>
              </div>
            )}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onNewItem={() => setShowNewExp(true)}
            rootLabel={t('root')}
            newFolderLabel={t('newFolder')}
            folderTitle={t('folder')}
            itemsTitle={t('experimentRecords')}
            newItemLabel={t('newExperiment')}
          />
        </Card>
      </div>

      {/* 右侧：详情 / 统计 */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* 标签切换 */}
        <div className="flex gap-1 mb-3 p-1 bg-black/25 rounded-md w-fit">
          <button onClick={() => setTab('detail')} className={tab === 'detail' ? 'btn-cinnabar !py-1 text-xs' : 'btn-ghost !py-1 text-xs'}>
            {t('experimentRecords')}
          </button>
          <button onClick={() => setTab('stats')} className={tab === 'stats' ? 'btn-cinnabar !py-1 text-xs' : 'btn-ghost !py-1 text-xs'}>
            <BarChart3 size={13} />{t('statistics')}
          </button>
        </div>

        {tab === 'detail' ? (
          selectedExp ? (
            <ExpDetail exp={selectedExp} projects={projects} folders={folders} onChanged={load} />
          ) : (
            <Card><Empty /></Card>
          )
        ) : (
          <StatsView experiments={experiments} folders={folders} projects={projects} />
        )}
      </div>

      <NewExpModal open={showNewExp} onClose={() => setShowNewExp(false)} folderId={currentFolderId} projects={projects} onCreated={load} />
    </div>
  )
}

// ============ 实验详情（右侧） ============
function ExpDetail({ exp, projects, folders, onChanged }) {
  const { t, lang } = useLanguage()
  const { showToast } = useToast()
  const [confirmDel, setConfirmDel] = useState(false)
  const [moving, setMoving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [imgBusy, setImgBusy] = useState(false)
  const proj = projects.find((p) => p.id === exp.project_id)
  const statusColor = exp.status === '已完成' ? 'gold' : exp.status === '进行中' ? 'ochre' : 'cinnabar'

  const deleteExp = async () => {
    setConfirmDel(false)
    await supabase.from('experiments').delete().eq('id', exp.id)
    showToast(t('deleteOk'))
    onChanged()
  }

  // 上传实验图片（单图，覆盖）
  const handleImage = useCallback(async (file) => {
    setImgBusy(true)
    try {
      const url = await uploadImage(file, 'experiments')
      await supabase.from('experiments').update({ image_url: url }).eq('id', exp.id)
      onChanged()
    } finally { setImgBusy(false) }
  }, [exp.id, onChanged])

  // 粘贴图片上传
  useImagePaste(handleImage)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleImage(file)
  }

  const moveFolder = async (targetId) => {
    setMoving(true)
    await supabase.from('experiments').update({ folder_id: targetId }).eq('id', exp.id)
    setMoving(false)
    onChanged()
  }

  const folderOptions = buildExpFolderOptions(folders || [])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title={exp.name} icon={FlaskConical} />
        <div className="flex items-center gap-2 mb-3">
          <Badge color={statusColor}>{enumLabel(exp.status, lang)}</Badge>
          {exp.exp_date && <span className="text-xs text-muted">{exp.exp_date}</span>}
        </div>
        {/* 移动文件夹 */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="text-muted shrink-0">{t('folder')}:</span>
          <select
            className="field !py-1 !w-auto flex-1"
            value={exp.folder_id || ''}
            onChange={(e) => moveFolder(e.target.value || null)}
            disabled={moving}
          >
            <option value="" className="bg-nav">{t('root')}</option>
            {folderOptions.map((f) => (
              <option key={f.id} value={f.id} className="bg-nav">{f.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-muted">{t('equipment')}：</span>{exp.equipment || '—'}</div>
          <div><span className="text-muted">{t('sampleNo')}：</span>{exp.sample_no || '—'}</div>
          <div><span className="text-muted">{t('linkedProject')}：</span>{proj ? proj.name : t('noProject')}</div>
          {exp.data_link && <div><span className="text-muted">{t('dataLink')}：</span><a href={exp.data_link} target="_blank" rel="noreferrer" className="text-cinnabar underline">↗</a></div>}
        </div>
        {exp.conclusion && (
          <>
            <div className="brush-line my-3" />
            <p className="text-sm text-cream/80 whitespace-pre-wrap">{exp.conclusion}</p>
          </>
        )}
        {/* 实验图片（单图，支持拖拽/粘贴上传） */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-3 rounded-lg border border-dashed p-2 transition-colors ${dragging ? 'border-cinnabar bg-cinnabar/10' : 'border-gold/20'}`}
        >
          {exp.image_url ? (
            <img src={exp.image_url} alt="" className="max-h-64 rounded-md border border-gold/20 mx-auto" />
          ) : (
            <p className="text-[11px] text-muted/50 text-center py-4">拖入图片或 Ctrl+V 粘贴</p>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <ExpEditModal exp={exp} projects={projects} onChanged={onChanged} />
          <button onClick={() => setConfirmDel(true)} className="btn-ghost !py-1 text-xs text-[#c96b5b] border-[#8c3a30]/40"><Trash2 size={13} />{t('delete')}</button>
        </div>
      </Card>
      <ConfirmDialog
        open={confirmDel}
        message="删除该实验？"
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={deleteExp}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  )
}

// ============ 新建实验 ============
function NewExpModal({ open, onClose, folderId, projects, onCreated }) {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [form, setForm] = useState({ name: '', project_id: '', equipment: '', sample_no: '', exp_date: '', status: '计划中', data_link: '', conclusion: '' })
  useEffect(() => { if (open) setForm({ name: '', project_id: '', equipment: '', sample_no: '', exp_date: '', status: '计划中', data_link: '', conclusion: '' }) }, [open])

  const submit = async () => {
    if (!form.name.trim()) return
    await supabase.from('experiments').insert({
      user_id: user.id, folder_id: folderId,
      name: form.name, project_id: form.project_id || null,
      equipment: form.equipment, sample_no: form.sample_no,
      exp_date: form.exp_date || null, status: form.status,
      data_link: form.data_link, conclusion: form.conclusion,
    })
    onCreated(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('newExperiment')} onSubmit={submit}>
      <Field label={t('experimentName')}><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('linkedProject')}>
          <select className="field" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
            <option value="" className="bg-nav">{t('noProject')}</option>
            {projects.map((p) => <option key={p.id} value={p.id} className="bg-nav">{p.name}</option>)}
          </select>
        </Field>
        <Field label={t('status')}>
          <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {EXP_STATUS.map((s) => <option key={s} value={s} className="bg-nav">{enumLabel(s, lang)}</option>)}
          </select>
        </Field>
        <Field label={t('equipment')}><input className="field" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></Field>
        <Field label={t('sampleNo')}><input className="field" value={form.sample_no} onChange={(e) => setForm({ ...form, sample_no: e.target.value })} /></Field>
        <Field label={t('expDate')}><input type="date" className="field" value={form.exp_date} onChange={(e) => setForm({ ...form, exp_date: e.target.value })} /></Field>
        <Field label={t('dataLink')}><input className="field" value={form.data_link} onChange={(e) => setForm({ ...form, data_link: e.target.value })} /></Field>
      </div>
      <Field label={t('conclusion')}><textarea className="field" rows={3} value={form.conclusion} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} /></Field>
      <button type="submit" className="btn-cinnabar w-full">{t('confirm')}</button>
    </Modal>
  )
}

// ============ 编辑实验（含图片上传） ============
function ExpEditModal({ exp, projects, onChanged }) {
  const { t, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(exp)
  const [busy, setBusy] = useState(false)

  const openModal = () => {
    setForm({ ...exp, project_id: exp.project_id || '' })
    setOpen(true)
  }

  const save = async () => {
    setBusy(true)
    await supabase.from('experiments').update({
      name: form.name, project_id: form.project_id || null, equipment: form.equipment,
      sample_no: form.sample_no, exp_date: form.exp_date || null, status: form.status,
      data_link: form.data_link, conclusion: form.conclusion,
    }).eq('id', exp.id)
    setBusy(false); setOpen(false); onChanged()
  }

  const handleImage = async (file) => {
    setBusy(true)
    try {
      const url = await uploadImage(file, 'experiments')
      await supabase.from('experiments').update({ image_url: url }).eq('id', exp.id)
      onChanged(); setOpen(false)
    } finally { setBusy(false) }
  }

  return (
    <>
      <button onClick={openModal} className="btn-ghost !py-1 text-xs">{t('edit')}</button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('edit')} onSubmit={save}>
        <Field label={t('experimentName')}><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('linkedProject')}>
            <select className="field" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="" className="bg-nav">{t('noProject')}</option>
              {projects.map((p) => <option key={p.id} value={p.id} className="bg-nav">{p.name}</option>)}
            </select>
          </Field>
          <Field label={t('status')}>
            <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {EXP_STATUS.map((s) => <option key={s} value={s} className="bg-nav">{enumLabel(s, lang)}</option>)}
            </select>
          </Field>
          <Field label={t('equipment')}><input className="field" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></Field>
          <Field label={t('sampleNo')}><input className="field" value={form.sample_no} onChange={(e) => setForm({ ...form, sample_no: e.target.value })} /></Field>
          <Field label={t('expDate')}><input type="date" className="field" value={form.exp_date || ''} onChange={(e) => setForm({ ...form, exp_date: e.target.value })} /></Field>
          <Field label={t('dataLink')}><input className="field" value={form.data_link || ''} onChange={(e) => setForm({ ...form, data_link: e.target.value })} /></Field>
        </div>
        <Field label={t('conclusion')}><textarea className="field" rows={3} value={form.conclusion || ''} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} /></Field>
        <Field label="image">
          <label className="btn-ghost text-xs cursor-pointer inline-flex">
            <ImagePlus size={13} />{t('add')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleImage(e.target.files[0])} />
          </label>
          {exp.image_url && <img src={exp.image_url} alt="" className="mt-2 max-h-32 rounded" />}
        </Field>
        <button type="submit" disabled={busy} className="btn-cinnabar w-full">{busy ? t('loading') : t('save')}</button>
      </Modal>
    </>
  )
}

// ============ 统计视图 ============
function StatsView({ experiments, folders, projects }) {
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const chartAxis = theme === 'dark' ? '#8a7a6d' : '#6b5d4f'
  const chartGrid = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const chartTooltipBg = theme === 'dark' ? '#2a2421' : '#ffffff'
  const chartTooltipBorder = theme === 'dark' ? '#b8a08a40' : '#00000020'
  const tooltipStyle = { background: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: 6, color: chartAxis }

  const statusData = useMemo(() =>
    EXP_STATUS.map((s) => ({ name: enumLabel(s, lang), value: experiments.filter((e) => e.status === s).length })),
    [experiments, lang],
  )

  const trendData = useMemo(() => {
    const byMonth = {}
    for (const e of experiments) {
      const m = (e.exp_date || e.created_at || '').slice(0, 7)
      if (!m) continue
      byMonth[m] = (byMonth[m] || 0) + 1
    }
    return Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([m, n]) => ({ month: m, count: n }))
  }, [experiments])

  const categoryData = useMemo(() => {
    const countRec = (folderId) => {
      let n = experiments.filter((e) => e.folder_id === folderId).length
      for (const f of folders.filter((x) => x.parent_id === folderId)) n += countRec(f.id)
      return n
    }
    return folders.filter((f) => f.parent_id === null).map((f) => ({ name: f.name, value: countRec(f.id) }))
  }, [folders, experiments])

  const equipmentData = useMemo(() => {
    const map = {}
    for (const e of experiments) {
      if (!e.equipment) continue
      map[e.equipment] = (map[e.equipment] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [experiments])

  const projectData = useMemo(() =>
    projects.map((p) => ({ name: p.name, value: experiments.filter((e) => e.project_id === p.id).length })),
    [projects, experiments],
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title={t('statStatusDist')}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} stroke="none">
              {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: chartAxis }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('statTrend')}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
            <XAxis dataKey="month" stroke={chartAxis} fontSize={11} />
            <YAxis stroke={chartAxis} fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#8c3a30" strokeWidth={2} dot={{ fill: '#8c3a30' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('statCategory')}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
            <XAxis dataKey="name" stroke={chartAxis} fontSize={11} />
            <YAxis stroke={chartAxis} fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#8c3a30" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('statEquipment')}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={equipmentData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
            <XAxis type="number" stroke={chartAxis} fontSize={11} allowDecimals={false} />
            <YAxis type="category" dataKey="name" stroke={chartAxis} fontSize={11} width={90} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#a67a6a" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('statProjectLink')}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={projectData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
            <XAxis dataKey="name" stroke={chartAxis} fontSize={11} />
            <YAxis stroke={chartAxis} fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#b8a08a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <Card>
      <SectionTitle title={title} icon={BarChart3} />
      {children}
    </Card>
  )
}

// 把实验文件夹列表转成带缩进的选项（用于移动文件夹下拉）
function buildExpFolderOptions(folders) {
  const byParent = new Map()
  for (const f of folders) {
    const key = f.parent_id || 'root'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(f)
  }
  const result = []
  const walk = (parentId, depth) => {
    const children = byParent.get(parentId || 'root') || []
    for (const f of children) {
      result.push({ id: f.id, label: `${'　'.repeat(depth)}${depth > 0 ? '↳ ' : ''}${f.name}` })
      walk(f.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}
