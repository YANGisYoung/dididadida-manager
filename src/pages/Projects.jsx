import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderKanban, Plus, Trash2, Save, Package, Link2, GanttChartSquare, ImagePlus, X, ChevronLeft, ChevronRight, Download, Pencil } from 'lucide-react'
import { supabase, uploadImage, deleteImage } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useImagePaste } from '../lib/useImagePaste'
import { STAGES, BOM_STATUS, enumLabel } from '../lib/enums'
import { Card, SectionTitle, Modal, Field, Spinner, Empty, Badge, ConfirmDialog, ImageLightbox } from '../components/ui'
import FolderSidebar from '../components/FolderSidebar'

export default function Projects() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [projects, setProjects] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  // 加载项目列表 + 文件夹
  const loadProjects = useCallback(async () => {
    const [p, f] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('project_folders').select('*').order('created_at'),
    ])
    const list = p.data || []
    setProjects(list)
    setFolders(f.data || [])
    setSelectedId((prev) => (prev && list.find((x) => x.id === prev) ? prev : list[0]?.id || null))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 首页快速入口：?new=1 打开新建弹窗；?select=<id> 选中某个项目
  useEffect(() => {
    const sel = searchParams.get('select')
    if (sel) {
      // 等列表加载后选中
      setTimeout(() => setSelectedId(sel), 0)
      setSearchParams({}, { replace: true })
      return
    }
    if (searchParams.get('new') === '1') {
      setShowNew(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const selected = projects.find((p) => p.id === selectedId) || null

  const createFolder = async (parentId, name) => {
    await supabase.from('project_folders').insert({ user_id: user.id, parent_id: parentId, name })
    loadProjects()
  }
  const renameFolder = async (folderId, name) => {
    await supabase.from('project_folders').update({ name }).eq('id', folderId)
    loadProjects()
  }
  const deleteFolder = async (folderId) => {
    await supabase.from('project_folders').delete().eq('id', folderId)
    showToast(t('deleteOk'))
    loadProjects()
  }

  return (
    <div className="flex gap-4 h-full">
      {/* 左侧：文件夹树 + 项目列表 */}
      <div className="w-72 shrink-0 flex flex-col">
        <Card className="flex-1 !p-0 overflow-hidden">
          <FolderSidebar
            title={t('navProjects')}
            folders={folders}
            items={projects}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            selectedItemId={selectedId}
            onSelectItem={setSelectedId}
            renderItem={(p) => (
              <div>
                <div className="text-sm text-cream break-words leading-snug">{p.name}</div>
                <div className="text-[11px] text-muted mt-0.5 flex items-center gap-2">
                  <span>{enumLabel(p.stage, lang)}</span>
                  {p.deadline && <span>· {p.deadline}</span>}
                </div>
              </div>
            )}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onNewItem={() => setShowNew(true)}
            rootLabel={t('root')}
            newFolderLabel={t('newFolder')}
            folderTitle={t('folder')}
            itemsTitle={t('navProjects')}
            newItemLabel={t('newProject')}
          />
        </Card>
      </div>

      {/* 右侧：项目详情 */}
      <div className="flex-1 overflow-y-auto pr-1">
        {selected ? (
          <ProjectDetail key={selected.id} project={selected} folders={folders} onDeleted={loadProjects} onChanged={loadProjects} />
        ) : (
          <Empty text={t('empty')} />
        )}
      </div>

      {/* 新建项目弹窗（默认归入当前选中文件夹） */}
      <NewProjectModal
        open={showNew}
        onClose={() => setShowNew(false)}
        folderId={selectedFolderId}
        onCreated={(id) => { loadProjects(); setSelectedId(id); }}
      />
    </div>
  )
}

// ============ 新建项目弹窗 ============
function NewProjectModal({ open, onClose, onCreated, folderId }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', source: '', start_date: '', deadline: '', stage: '方案' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setForm({ name: '', source: '', start_date: '', deadline: '', stage: '方案' }); setError('') } }, [open])

  const submit = async () => {
    if (!form.name.trim()) return
    setBusy(true)
    setError('')
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, folder_id: folderId, name: form.name, source: form.source, start_date: form.start_date || null, deadline: form.deadline || null, stage: form.stage })
      .select()
      .single()
    setBusy(false)
    if (error) { setError(error.message); return }
    if (data) { onCreated(data.id); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('newProject')} onSubmit={submit}>
      <Field label={t('projectName')}>
        <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label={t('source')}>
        <input className="field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('startDate')}>
          <input type="date" className="field" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label={t('deadline')}>
          <input type="date" className="field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Field>
        <Field label={t('stage')}>
          <select className="field" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            {STAGES.map((s) => <option key={s} value={s} className="bg-nav">{s}</option>)}
          </select>
        </Field>
      </div>
      {error && <p className="text-xs text-[#c96b5b] bg-[#8c3a30]/15 border border-[#8c3a30]/30 rounded px-3 py-2 mt-2">{error}</p>}
      <button type="submit" disabled={busy} className="btn-cinnabar w-full mt-2">
        {busy ? t('loading') : t('confirm')}
      </button>
    </Modal>
  )
}

// ============ 项目详情 ============
function ProjectDetail({ project, folders, onDeleted, onChanged }) {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const { showToast } = useToast()

  const [stage, setStage] = useState(project.stage)
  const [startDate, setStartDate] = useState(project.start_date || '')
  const [deadline, setDeadline] = useState(project.deadline || '')
  const [source, setSource] = useState(project.source || '')
  const [notes, setNotes] = useState(project.notes || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedTip, setSavedTip] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [moving, setMoving] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  // 基本信息保存
  const saveInfo = async () => {
    setSaving(true)
    setSaveError('')
    setSavedTip(false)
    const { error } = await supabase
      .from('projects')
      .update({ stage, start_date: startDate || null, deadline: deadline || null, source, notes })
      .eq('id', project.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setSavedTip(true)
    setTimeout(() => setSavedTip(false), 2000)
    // 重新加载列表与详情，确保切走切回后显示最新数据
    onChanged()
  }

  const deleteProject = async () => {
    setConfirmDel(false)
    await supabase.from('projects').delete().eq('id', project.id)
    showToast(t('deleteOk'))
    onDeleted()
  }

  const moveFolder = async (targetId) => {
    setMoving(true)
    await supabase.from('projects').update({ folder_id: targetId }).eq('id', project.id)
    setMoving(false)
    onChanged()
  }

  const folderOptions = buildProjectFolderOptions(folders || [])

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <Card>
        <SectionTitle title={project.name} icon={FolderKanban} />
        {/* 移动文件夹 */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="text-muted shrink-0">{t('folder')}:</span>
          <select
            className="field !py-1 !w-auto flex-1"
            value={project.folder_id || ''}
            onChange={(e) => moveFolder(e.target.value || null)}
            disabled={moving}
          >
            <option value="" className="bg-nav">{t('root')}</option>
            {folderOptions.map((f) => (
              <option key={f.id} value={f.id} className="bg-nav">{f.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label={t('stage')}>
            <select className="field" value={stage} onChange={(e) => setStage(e.target.value)}>
              {STAGES.map((s) => <option key={s} value={s} className="bg-nav">{enumLabel(s, lang)}</option>)}
            </select>
          </Field>
          <Field label={t('startDate')}>
            <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label={t('deadline')}>
            <input type="date" className="field" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label={t('source')}>
            <input className="field" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
        </div>
        <Field label={t('projectNotes')}>
          <textarea
            className="field"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="写下对这个项目的评价、备注…"
          />
        </Field>
        <div className="flex gap-2 mt-3 items-center">
          <button onClick={() => setShowEdit(true)} className="btn-ghost"><Pencil size={14} />{t('edit')}</button>
          <button onClick={saveInfo} disabled={saving} className="btn-cinnabar"><Save size={14} />{saving ? t('loading') : t('save')}</button>
          <button onClick={() => setConfirmDel(true)} className="btn-ghost text-[#c96b5b] border-[#8c3a30]/40"><Trash2 size={14} />{t('delete')}</button>
          {savedTip && <span className="text-xs text-gold">✓ {t('save')}</span>}
        </div>
        {saveError && <p className="text-xs text-[#c96b5b] bg-[#8c3a30]/15 border border-[#8c3a30]/30 rounded px-3 py-2 mt-2">{saveError}</p>}
        <ConfirmDialog
          open={confirmDel}
          message="删除后该项目及其 BOM、时间线、链接将一并删除，确定？"
          confirmText={t('delete')}
          cancelText={t('cancel')}
          onConfirm={deleteProject}
          onCancel={() => setConfirmDel(false)}
        />
        <EditProjectModal open={showEdit} onClose={() => setShowEdit(false)} project={project} onChanged={onChanged} />
      </Card>

      {/* 项目图片 */}
      <ProjectGallery projectId={project.id} />

      {/* BOM */}
      <BomEditor projectId={project.id} />

      {/* 甘特图 */}
      <TimelineEditor projectId={project.id} />

      {/* 文件链接 */}
      <LinksEditor projectId={project.id} />
    </div>
  )
}

// ============ 编辑项目（弹窗，可改名） ============
function EditProjectModal({ open, onClose, project, onChanged }) {
  const { t, lang } = useLanguage()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        name: project.name || '',
        source: project.source || '',
        start_date: project.start_date || '',
        deadline: project.deadline || '',
        stage: project.stage || '方案',
        notes: project.notes || '',
      })
      setError('')
    }
  }, [open, project])

  const save = async () => {
    if (!form.name.trim()) { setError('名称不能为空'); return }
    setSaving(true)
    const { error: err } = await supabase
      .from('projects')
      .update({
        name: form.name.trim(),
        source: form.source,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
        stage: form.stage,
        notes: form.notes,
      })
      .eq('id', project.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onClose(); onChanged()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('edit')} onSubmit={save}>
      <Field label={t('projectName')}>
        <input className="field" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label={t('source')}>
        <input className="field" value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('startDate')}>
          <input type="date" className="field" value={form.start_date || ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label={t('deadline')}>
          <input type="date" className="field" value={form.deadline || ''} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Field>
      </div>
      <Field label={t('stage')}>
        <select className="field" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
          {STAGES.map((s) => <option key={s} value={s} className="bg-nav">{enumLabel(s, lang)}</option>)}
        </select>
      </Field>
      <Field label={t('projectNotes')}>
        <textarea className="field" rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="写下对这个项目的评价、备注…" />
      </Field>
      {error && <p className="text-xs text-[#c96b5b] bg-[#8c3a30]/15 border border-[#8c3a30]/30 rounded px-3 py-2 mt-2">{error}</p>}
      <button type="submit" disabled={saving} className="btn-cinnabar w-full mt-2">{saving ? t('loading') : t('save')}</button>
    </Modal>
  )
}

// ============ 项目图片画廊（多图，可放大浏览/切换/下载） ============
function ProjectGallery({ projectId }) {
  const { t } = useLanguage()
  const [images, setImages] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null) // null = 关闭；数字 = 当前查看的图片下标

  const load = useCallback(async () => {
    const { data } = await supabase.from('project_images').select('*').eq('project_id', projectId).order('sort_order')
    setImages(data || [])
    setLoaded(true)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const handleUpload = useCallback(async (file) => {
    setBusy(true)
    try {
      const url = await uploadImage(file, 'projects')
      await supabase.from('project_images').insert({ project_id: projectId, image_url: url, sort_order: images.length })
      load()
    } finally { setBusy(false) }
  }, [projectId, images.length, load])

  // 粘贴图片上传
  useImagePaste(handleUpload)

  const removeImage = async (img) => {
    await deleteImage(img.image_url)
    await supabase.from('project_images').delete().eq('id', img.id)
    load()
  }

  // 拖拽上传
  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  // 查看器内的前后切换（限制在当前项目图片范围内）
  const prev = () => setViewerIndex((i) => (i > 0 ? i - 1 : i))
  const next = () => setViewerIndex((i) => (i < images.length - 1 ? i + 1 : i))

  if (!loaded) return <Spinner />

  return (
    <Card>
      <SectionTitle title={t('projectImages')} icon={ImagePlus} />
      {/* 拖拽上传区 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed p-3 transition-colors ${dragging ? 'border-cinnabar bg-cinnabar/10' : 'border-gold/20'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted">拖入图片或 Ctrl+V 粘贴</span>
          <label className="btn-ghost !py-1 text-xs cursor-pointer inline-flex">
            <ImagePlus size={13} />{busy ? t('loading') : t('add')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
          </label>
        </div>
        {images.length === 0 ? (
          <p className="text-[11px] text-muted/40 text-center py-3">—</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.image_url}
                  alt=""
                  onClick={() => setViewerIndex(idx)}
                  className="w-full h-28 object-cover rounded border border-gold/20 cursor-zoom-in"
                />
                <button
                  onClick={() => removeImage(img)}
                  className="absolute top-1 right-1 bg-black/60 rounded p-0.5 text-cream opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 全屏图片查看器（Lightbox，支持缩放/拖动） */}
      {viewerIndex !== null && images[viewerIndex] && (
        <ImageLightbox
          images={images}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </Card>
  )
}

// ============ 通用：可编辑数组（增删改 + 批量保存） ============
// 用于 BOM / 时间线 / 链接。核心思路：本地 state 编辑，点保存时对比原始数据做增删改。
async function saveArray(table, projectId, original, current) {
  const origMap = new Map(original.filter((r) => r.id).map((r) => [r.id, r]))
  const curIds = new Set(current.filter((r) => r.id).map((r) => r.id))

  // 删除：原始有、当前没有
  for (const [id] of origMap) {
    if (!curIds.has(id)) await supabase.from(table).delete().eq('id', id)
  }
  // 新增 / 更新
  for (const row of current) {
    const payload = { ...row }
    delete payload.id
    if (row.id) {
      await supabase.from(table).update(payload).eq('id', row.id)
    } else {
      await supabase.from(table).insert({ ...payload, project_id: projectId })
    }
  }
}

// ============ BOM 编辑器 ============
function BomEditor({ projectId }) {
  const { t, lang } = useLanguage()
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(false)
  const originalRef = useRef([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('bom_items').select('*').eq('project_id', projectId).order('created_at')
    const list = data || []
    originalRef.current = JSON.parse(JSON.stringify(list))
    setRows(list)
    setLoaded(true)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const updateRow = (i, field, value) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }
  const addRow = () => setRows((rs) => [...rs, { part_name: '', material: '', qty: 1, supplier: '', status: '待采购' }])
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i))
  const save = async () => { await saveArray('bom_items', projectId, originalRef.current, rows); load() }

  if (!loaded) return <Spinner />

  return (
    <Card>
      <SectionTitle title={t('bom')} icon={Package} />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-gold/20">
                <th className="py-2 pr-2">{t('partName')}</th>
                <th className="py-2 pr-2">{t('material')}</th>
                <th className="py-2 pr-2 w-20">{t('quantity')}</th>
                <th className="py-2 pr-2">{t('supplier')}</th>
                <th className="py-2 pr-2 w-28">{t('status')}</th>
                <th className="py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-divider">
                  <td className="py-1.5 pr-2"><input className="field !py-1" value={r.part_name} onChange={(e) => updateRow(i, 'part_name', e.target.value)} /></td>
                  <td className="py-1.5 pr-2"><input className="field !py-1" value={r.material || ''} onChange={(e) => updateRow(i, 'material', e.target.value)} /></td>
                  <td className="py-1.5 pr-2"><input type="number" className="field !py-1" value={r.qty} onChange={(e) => updateRow(i, 'qty', parseInt(e.target.value) || 0)} /></td>
                  <td className="py-1.5 pr-2"><input className="field !py-1" value={r.supplier || ''} onChange={(e) => updateRow(i, 'supplier', e.target.value)} /></td>
                  <td className="py-1.5 pr-2">
                    <select className="field !py-1" value={r.status} onChange={(e) => updateRow(i, 'status', e.target.value)}>
                      {BOM_STATUS.map((s) => <option key={s} value={s} className="bg-nav">{enumLabel(s, lang)}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5"><button onClick={() => removeRow(i)} className="text-muted hover:text-[#c96b5b]"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={addRow} className="btn-ghost text-xs"><Plus size={13} />{t('add')}</button>
        <button onClick={save} className="btn-cinnabar text-xs"><Save size={13} />{t('save')}</button>
      </div>
    </Card>
  )
}

// ============ 时间线（甘特图）编辑器 ============
function TimelineEditor({ projectId }) {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(false)
  const originalRef = useRef([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('timeline').select('*').eq('project_id', projectId).order('start_date')
    const list = data || []
    originalRef.current = JSON.parse(JSON.stringify(list))
    setRows(list)
    setLoaded(true)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const updateRow = (i, field, value) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  const addRow = () => setRows((rs) => [...rs, { phase_name: '', start_date: '', end_date: '' }])
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i))
  const save = async () => { await saveArray('timeline', projectId, originalRef.current, rows); load() }

  if (!loaded) return <Spinner />

  return (
    <Card>
      <SectionTitle title={t('gantt')} icon={GanttChartSquare} />
      {/* 甘特图预览 */}
      <GanttChart rows={rows} />

      {/* 编辑表格 */}
      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-gold/20">
                <th className="py-2 pr-2">{t('phaseName')}</th>
                <th className="py-2 pr-2 w-44">{t('startDate')}</th>
                <th className="py-2 pr-2 w-44">{t('endDate')}</th>
                <th className="py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-divider">
                  <td className="py-1.5 pr-2"><input className="field !py-1" value={r.phase_name} onChange={(e) => updateRow(i, 'phase_name', e.target.value)} placeholder={t('phaseName')} /></td>
                  <td className="py-1.5 pr-2"><input type="date" className="field !py-1" value={r.start_date || ''} onChange={(e) => updateRow(i, 'start_date', e.target.value)} /></td>
                  <td className="py-1.5 pr-2"><input type="date" className="field !py-1" value={r.end_date || ''} onChange={(e) => updateRow(i, 'end_date', e.target.value)} /></td>
                  <td className="py-1.5"><button onClick={() => removeRow(i)} className="text-muted hover:text-[#c96b5b]"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={addRow} className="btn-ghost text-xs"><Plus size={13} />{t('add')}</button>
        <button onClick={save} className="btn-cinnabar text-xs"><Save size={13} />{t('save')}</button>
      </div>
    </Card>
  )
}

// 甘特图：横向条形，按日期比例定位
function GanttChart({ rows }) {
  const valid = rows.filter((r) => r.start_date && r.end_date)
  if (valid.length === 0) return <p className="text-xs text-muted">——</p>

  const dates = valid.flatMap((r) => [+new Date(r.start_date), +new Date(r.end_date)])
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const total = (max - min) || 1
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`

  return (
    <div>
      <div className="flex items-center mb-1 text-[10px] text-muted">
        <div className="w-28 shrink-0" />
        <div className="flex-1 flex justify-between">
          <span>{fmt(new Date(min))}</span>
          <span>{fmt(new Date(max))}</span>
        </div>
      </div>
      {valid.map((r, i) => {
        const s = +new Date(r.start_date)
        const e = +new Date(r.end_date)
        const left = ((s - min) / total) * 100
        const width = Math.max(((e - s) / total) * 100, 2)
        return (
          <div key={i} className="flex items-center py-1">
            <div className="w-28 shrink-0 text-xs text-cream truncate pr-2">{r.phase_name}</div>
            <div className="flex-1 relative h-5">
              <div className="absolute inset-0 border-l border-r border-gold/10" />
              <div
                className="absolute h-4 rounded-sm bg-gradient-to-r from-cinnabar to-ochre top-0.5"
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============ 文件链接编辑器 ============
function LinksEditor({ projectId }) {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(false)
  const originalRef = useRef([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('project_links').select('*').eq('project_id', projectId).order('created_at')
    const list = data || []
    originalRef.current = JSON.parse(JSON.stringify(list))
    setRows(list)
    setLoaded(true)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const updateRow = (i, field, value) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  const addRow = () => setRows((rs) => [...rs, { title: '', url: '' }])
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i))
  const save = async () => { await saveArray('project_links', projectId, originalRef.current, rows); load() }

  if (!loaded) return <Spinner />

  return (
    <Card>
      <SectionTitle title={t('fileLinks')} icon={Link2} />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="field !py-1 w-48" value={r.title} onChange={(e) => updateRow(i, 'title', e.target.value)} placeholder={t('linkTitle')} />
              <input className="field !py-1 flex-1" value={r.url} onChange={(e) => updateRow(i, 'url', e.target.value)} placeholder={t('linkUrl')} />
              {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-cinnabar text-xs underline shrink-0">↗</a>}
              <button onClick={() => removeRow(i)} className="text-muted hover:text-[#c96b5b] shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={addRow} className="btn-ghost text-xs"><Plus size={13} />{t('add')}</button>
        <button onClick={save} className="btn-cinnabar text-xs"><Save size={13} />{t('save')}</button>
      </div>
    </Card>
  )
}

// 把项目文件夹列表转成带缩进的选项（用于移动文件夹下拉）
function buildProjectFolderOptions(folders) {
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
