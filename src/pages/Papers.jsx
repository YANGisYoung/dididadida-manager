import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen, FolderPlus, Folder, ChevronRight, ChevronLeft, Trash2, Plus, Star,
  Home, Search, FileUp, ImagePlus, X, Download, Pencil, SlidersHorizontal,
} from 'lucide-react'
import { supabase, uploadImage, deleteImage } from '../lib/supabase'
import { extractPdfMetadata, renderPdfFirstPage } from '../lib/pdf'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useImagePaste } from '../lib/useImagePaste'
import { READ_STATUS } from '../lib/enums'
import { Card, SectionTitle, Modal, Field, Spinner, Empty, Badge, ConfirmDialog, ImageLightbox } from '../components/ui'
import FolderSidebar from '../components/FolderSidebar'

// 阅读状态：数据库存简体，论文界面固定英文显示
const READ_STATUS_EN = { '未读': 'Unread', '在读': 'Reading', '已读': 'Read' }

export default function Papers() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [folders, setFolders] = useState([])
  const [papers, setPapers] = useState([])
  const [selectedPaperId, setSelectedPaperId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  // 首页快速入口：?new=1 打开添加弹窗；?select=<id> 选中某篇论文
  useEffect(() => {
    const sel = searchParams.get('select')
    if (sel) {
      setTimeout(() => setSelectedPaperId(sel), 0)
      setSearchParams({}, { replace: true })
      return
    }
    if (searchParams.get('new') === '1') {
      setShowAdd(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // 筛选状态
  const [kw, setKw] = useState('')
  const [readFilter, setReadFilter] = useState('全部')
  const [onlyStar, setOnlyStar] = useState(false)
  const [tagFilter, setTagFilter] = useState('全部')
  const [sortYear, setSortYear] = useState('desc')

  const load = useCallback(async () => {
    const [f, p] = await Promise.all([
      supabase.from('paper_folders').select('*').order('created_at'),
      supabase.from('papers').select('*').order('created_at', { ascending: false }),
    ])
    setFolders(f.data || [])
    setPapers(p.data || [])
    setSelectedPaperId((prev) => {
      const list = p.data || []
      return prev && list.find((x) => x.id === prev) ? prev : list[0]?.id || null
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // 是否正在筛选（有筛选条件时全局搜索，跨文件夹）
  const searching = kw.trim() || readFilter !== '全部' || onlyStar || tagFilter !== '全部'

  const filtered = useMemo(() => {
    let list = searching ? papers : papers.filter((p) => p.folder_id === currentFolderId)
    if (kw.trim()) {
      const q = kw.trim().toLowerCase()
      list = list.filter((p) =>
        [p.title, p.first_author, p.corresp_author, p.journal].some((v) => (v || '').toLowerCase().includes(q)),
      )
    }
    if (readFilter !== '全部') list = list.filter((p) => p.read_status === readFilter)
    if (onlyStar) list = list.filter((p) => p.starred)
    if (tagFilter !== '全部') list = list.filter((p) => (p.tags || '').split(/[,，]/).map((x) => x.trim()).includes(tagFilter))
    list = [...list].sort((a, b) => {
      const ya = a.year || 0, yb = b.year || 0
      return sortYear === 'desc' ? yb - ya : ya - yb
    })
    return list
  }, [papers, currentFolderId, kw, readFilter, onlyStar, tagFilter, sortYear, searching])

  // 全部标签（用于筛选下拉）
  const allTags = useMemo(() => {
    const set = new Set()
    for (const p of papers) (p.tags || '').split(/[,，]/).forEach((x) => x.trim() && set.add(x.trim()))
    return [...set].sort()
  }, [papers])

  const createFolder = async (parentId, name) => {
    await supabase.from('paper_folders').insert({ user_id: user.id, parent_id: parentId, name })
    load()
  }
  const renameFolder = async (folderId, name) => {
    await supabase.from('paper_folders').update({ name }).eq('id', folderId)
    load()
  }
  const deleteFolder = async (folderId) => {
    await supabase.from('paper_folders').delete().eq('id', folderId)
    showToast('Deleted')
    load()
  }

  const selectedPaper = papers.find((p) => p.id === selectedPaperId) || null

  if (loading) return <Spinner />

  return (
    <div className="flex gap-4 h-full">
      {/* 左侧：筛选栏 + 文件夹树 + 论文列表 */}
      <div className="w-72 shrink-0 flex flex-col">
        <Card className="flex-1 !p-0 overflow-hidden flex flex-col">
          {/* 筛选栏（默认收起，点筛选图标展开） */}
          <div className="p-2 border-b border-gold/20 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input className="field !pl-7 !py-1 text-xs" placeholder="Search…" value={kw} onChange={(e) => setKw(e.target.value)} />
              </div>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={showFilter ? 'btn-cinnabar !py-1 !px-2 text-xs shrink-0' : 'btn-ghost !py-1 !px-2 text-xs shrink-0'}
                title="Filter"
              >
                <SlidersHorizontal size={13} />
              </button>
            </div>
            {/* 展开的筛选项 */}
            {showFilter && (
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <select className="field !py-1 text-xs" value={readFilter} onChange={(e) => setReadFilter(e.target.value)}>
                  <option value="全部" className="bg-nav">All</option>
                  {READ_STATUS.map((s) => <option key={s} value={s} className="bg-nav">{READ_STATUS_EN[s]}</option>)}
                </select>
                <select className="field !py-1 text-xs" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                  <option value="全部" className="bg-nav">Tags</option>
                  {allTags.map((tag) => <option key={tag} value={tag} className="bg-nav">{tag}</option>)}
                </select>
                <select className="field !py-1 text-xs" value={sortYear} onChange={(e) => setSortYear(e.target.value)}>
                  <option value="desc" className="bg-nav">Year ↓</option>
                  <option value="asc" className="bg-nav">Year ↑</option>
                </select>
                <button
                  onClick={() => setOnlyStar(!onlyStar)}
                  className={onlyStar ? 'btn-cinnabar !py-1 text-xs' : 'btn-ghost !py-1 text-xs'}
                >
                  <Star size={13} />Starred
                </button>
              </div>
            )}
          </div>

          {/* 文件夹树 + 论文列表 */}
          <div className="flex-1 min-h-0">
            <FolderSidebar
              title="Papers"
              folders={folders}
              items={searching ? filtered : papers}
              selectedFolderId={currentFolderId}
              onSelectFolder={setCurrentFolderId}
              selectedItemId={selectedPaperId}
              onSelectItem={setSelectedPaperId}
              renderItem={(p) => (
                <div>
                  <div className="text-sm text-cream break-words leading-snug flex items-start gap-1">
                    {p.starred && <Star size={13} className="text-gold fill-gold shrink-0 mt-0.5" />}
                    <span>{p.title}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {p.first_author}{p.year ? ` (${p.year})` : ''}
                  </div>
                  {p.tags && <TagList tags={p.tags} />}
                </div>
              )}
              onCreateFolder={createFolder}
              onRenameFolder={renameFolder}
              onDeleteFolder={deleteFolder}
              onNewItem={() => setShowAdd(true)}
              rootLabel="Root"
              newFolderLabel="New Folder"
              folderTitle="Folders"
              itemsTitle="Papers"
              newItemLabel="Add Paper"
            />
          </div>
        </Card>
      </div>

      {/* 右侧：论文详情 */}
      <div className="flex-1 overflow-y-auto pr-1">
        {selectedPaper ? (
          <PaperDetail key={selectedPaper.id} paper={selectedPaper} folders={folders} onChanged={load} />
        ) : (
          <Card><Empty text="No papers yet" /></Card>
        )}
      </div>

      {/* 添加论文弹窗（默认归入当前文件夹） */}
      <AddPaperButton open={showAdd} onClose={() => setShowAdd(false)} folderId={currentFolderId} onCreated={load} />
    </div>
  )
}

// ============ 添加论文（含 PDF 导入） ============
function AddPaperButton({ open, onClose, folderId, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', first_author: '', corresp_author: '', journal: '', year: '', doi_link: '', read_status: '未读', starred: false, tags: '', notes: '' })
  const [pdfBusy, setPdfBusy] = useState(false)
  const [firstPageBlob, setFirstPageBlob] = useState(null) // 第一页截图，保存后入库
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setForm({ title: '', first_author: '', corresp_author: '', journal: '', year: '', doi_link: '', read_status: '未读', starred: false, tags: '', notes: '' })
    setFirstPageBlob(null)
  }

  const handlePdf = async (file) => {
    setPdfBusy(true)
    // 并行：提取信息 + 渲染第一页截图
    const [meta, pageBlob] = await Promise.all([
      extractPdfMetadata(file),
      renderPdfFirstPage(file),
    ])
    setForm((f) => ({
      ...f,
      title: meta.title || f.title,
      first_author: meta.first_author || f.first_author,
      journal: meta.journal || f.journal,
      year: meta.year || f.year,
      doi_link: meta.doi ? `https://doi.org/${meta.doi}` : f.doi_link,
    }))
    if (pageBlob) setFirstPageBlob(pageBlob)
    setPdfBusy(false)
  }

  const submit = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    const { data, error } = await supabase.from('papers').insert({
      user_id: user.id, folder_id: folderId, title: form.title.trim(),
      first_author: form.first_author, corresp_author: form.corresp_author,
      journal: form.journal, year: form.year ? parseInt(form.year) : null,
      doi_link: form.doi_link, read_status: form.read_status,
      starred: form.starred, tags: form.tags, notes: form.notes,
    }).select().single()
    // 论文保存成功后，把第一页截图存为关键图片
    if (!error && data && firstPageBlob) {
      try {
        const file = new File([firstPageBlob], 'first-page.jpg', { type: 'image/jpeg' })
        const url = await uploadImage(file, 'papers')
        await supabase.from('paper_images').insert({ paper_id: data.id, image_url: url, sort_order: 0 })
      } catch (e) {
        console.warn('第一页截图入库失败：', e)
      }
    }
    setSubmitting(false)
    onCreated(); onClose(); reset()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Paper" width="max-w-2xl" onSubmit={submit}>
        {/* PDF 导入 */}
        <label className="btn-ghost text-xs cursor-pointer inline-flex mb-3 w-full justify-center !py-2">
          <FileUp size={14} />
          {pdfBusy ? 'Extracting…' : 'Import PDF'}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files[0] && handlePdf(e.target.files[0])} />
        </label>
        <p className="text-[11px] text-muted -mt-1 mb-3">Upload a PDF to auto-fill info via DOI / text parsing, and save the first page as an image</p>

        <Field label="Title"><input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Author"><input className="field" value={form.first_author} onChange={(e) => setForm({ ...form, first_author: e.target.value })} /></Field>
          <Field label="Corresponding Author"><input className="field" value={form.corresp_author} onChange={(e) => setForm({ ...form, corresp_author: e.target.value })} /></Field>
          <Field label="Journal"><input className="field" value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} /></Field>
          <Field label="Year"><input type="number" className="field" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
        </div>
        <Field label="DOI / Link"><input className="field" value={form.doi_link} onChange={(e) => setForm({ ...form, doi_link: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Read Status">
            <select className="field" value={form.read_status} onChange={(e) => setForm({ ...form, read_status: e.target.value })}>
              {READ_STATUS.map((s) => <option key={s} value={s} className="bg-nav">{READ_STATUS_EN[s]}</option>)}
            </select>
          </Field>
          <Field label="Tags / Keywords"><input className="field" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. FEM, tribology" /></Field>
        </div>
        <Field label="Notes"><textarea className="field" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm text-cream cursor-pointer mb-2">
          <input type="checkbox" checked={form.starred} onChange={(e) => setForm({ ...form, starred: e.target.checked })} className="accent-[#8c3a30]" />
          <Star size={14} className={form.starred ? 'text-gold fill-gold' : 'text-muted'} />Starred
        </label>
        <button type="submit" disabled={submitting} className="btn-cinnabar w-full">{submitting ? 'Saving…' : 'Confirm'}</button>
    </Modal>
  )
}

// 关键词标签列表：显示前 3 个，多余的收进「…」，点击展开/收起
function TagList({ tags }) {
  const [expanded, setExpanded] = useState(false)
  const list = (tags || '').split(/[,，]/).map((x) => x.trim()).filter(Boolean)
  if (list.length === 0) return null
  const shown = expanded ? list : list.slice(0, 3)
  const hasMore = list.length > 3
  return (
    <div className="flex flex-wrap gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
      {shown.map((t, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-ochre/15 text-ochre border border-ochre/30">{t}</span>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-1.5 py-0.5 rounded text-[10px] text-muted bg-hover hover:text-cream transition-colors"
        >
          {expanded ? '收起' : `+${list.length - 3}`}
        </button>
      )}
    </div>
  )
}

// 把扁平的文件夹列表转成树形，再展开为「带缩进前缀」的扁平选项
// 返回 [{ id, label }]，label 用「→」和缩进体现层级
function buildFolderOptions(folders) {
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

// ============ 论文详情（右侧） ============
function PaperDetail({ paper, folders, onChanged }) {
  const { showToast } = useToast()
  const [images, setImages] = useState([])
  const [moving, setMoving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const readColor = paper.read_status === '已读' ? 'gold' : paper.read_status === '在读' ? 'ochre' : 'cinnabar'

  useEffect(() => {
    supabase.from('paper_images').select('*').eq('paper_id', paper.id).order('sort_order').then(({ data }) => setImages(data || []))
  }, [paper.id])

  const toggleStar = async () => {
    await supabase.from('papers').update({ starred: !paper.starred }).eq('id', paper.id)
    onChanged()
  }
  const setRead = async (status) => {
    await supabase.from('papers').update({ read_status: status }).eq('id', paper.id)
    onChanged()
  }
  const del = async () => {
    setConfirmDel(false)
    await supabase.from('papers').delete().eq('id', paper.id)
    showToast('Deleted')
    onChanged()
  }

  const moveFolder = async (targetId) => {
    setMoving(true)
    await supabase.from('papers').update({ folder_id: targetId }).eq('id', paper.id)
    setMoving(false)
    onChanged()
  }

  const folderOptions = buildFolderOptions(folders)

  return (
    <div className="space-y-4">
      <Card>
        {/* 标题行 */}
        <div className="flex items-start gap-3">
          <button onClick={toggleStar} className="mt-0.5 shrink-0">
            <Star size={20} className={paper.starred ? 'text-gold fill-gold' : 'text-muted/40'} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-cream leading-snug">{paper.title}</h2>
            <p className="text-xs text-muted mt-1">
              {paper.first_author}{paper.corresp_author ? ` · ${paper.corresp_author}` : ''}{paper.journal ? ` · ${paper.journal}` : ''}{paper.year ? ` (${paper.year})` : ''}
            </p>
          </div>
          <Badge color={readColor}>{READ_STATUS_EN[paper.read_status]}</Badge>
        </div>

        <div className="brush-line my-3" />

        {/* 移动文件夹 */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="text-muted shrink-0">Move to folder:</span>
          <select
            className="field !py-1 !w-auto flex-1"
            value={paper.folder_id || ''}
            onChange={(e) => moveFolder(e.target.value || null)}
            disabled={moving}
          >
            <option value="" className="bg-nav">Root</option>
            {folderOptions.map((f) => (
              <option key={f.id} value={f.id} className="bg-nav">{f.label}</option>
            ))}
          </select>
        </div>

        {/* 元信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
          <div><span className="text-muted">First Author: </span>{paper.first_author || '—'}</div>
          <div><span className="text-muted">Corresponding Author: </span>{paper.corresp_author || '—'}</div>
          <div><span className="text-muted">Journal: </span>{paper.journal || '—'}</div>
          <div><span className="text-muted">Year: </span>{paper.year || '—'}</div>
        </div>

        {/* 标签 */}
        {paper.tags && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {paper.tags.split(/[,，]/).map((tag, i) => tag.trim() && <Badge key={i} color="ochre">{tag.trim()}</Badge>)}
          </div>
        )}

        {/* DOI 链接 */}
        {paper.doi_link && (
          <a href={paper.doi_link} target="_blank" rel="noreferrer" className="text-cinnabar text-xs underline mb-3 inline-block">DOI / Link ↗</a>
        )}

        {/* 笔记 */}
        {paper.notes && <p className="text-sm text-cream/80 whitespace-pre-wrap mb-3">{paper.notes}</p>}

        {/* 操作 */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={() => setShowEdit(true)} className="btn-ghost !py-1 text-xs"><Pencil size={13} />Edit</button>
          {READ_STATUS.map((s) => (
            <button key={s} onClick={() => setRead(s)} className={paper.read_status === s ? 'btn-cinnabar !py-1 text-xs' : 'btn-ghost !py-1 text-xs'}>
              {READ_STATUS_EN[s]}
            </button>
          ))}
          <button onClick={() => setConfirmDel(true)} className="btn-ghost !py-1 text-xs text-[#c96b5b] border-[#8c3a30]/40 ml-auto"><Trash2 size={13} />Delete</button>
        </div>

        {/* 图片画廊 */}
        <PaperGallery paper={paper} images={images} setImages={setImages} onChanged={onChanged} />
      </Card>

      <ConfirmDialog
        open={confirmDel}
        message="Delete this paper?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={del}
        onCancel={() => setConfirmDel(false)}
      />
      <EditPaperModal open={showEdit} onClose={() => setShowEdit(false)} paper={paper} onChanged={onChanged} />
    </div>
  )
}

// ============ 编辑论文（弹窗） ============
function EditPaperModal({ open, onClose, paper, onChanged }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        title: paper.title || '',
        first_author: paper.first_author || '',
        corresp_author: paper.corresp_author || '',
        journal: paper.journal || '',
        year: paper.year || '',
        doi_link: paper.doi_link || '',
        read_status: paper.read_status || '未读',
        starred: paper.starred || false,
        tags: paper.tags || '',
        notes: paper.notes || '',
      })
    }
  }, [open, paper])

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('papers').update({
      title: form.title.trim(),
      first_author: form.first_author,
      corresp_author: form.corresp_author,
      journal: form.journal,
      year: form.year ? parseInt(form.year) : null,
      doi_link: form.doi_link,
      read_status: form.read_status,
      starred: form.starred,
      tags: form.tags,
      notes: form.notes,
    }).eq('id', paper.id)
    setSaving(false)
    onClose(); onChanged()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Paper" width="max-w-2xl" onSubmit={save}>
      <Field label="Title"><input className="field" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Author"><input className="field" value={form.first_author || ''} onChange={(e) => setForm({ ...form, first_author: e.target.value })} /></Field>
        <Field label="Corresponding Author"><input className="field" value={form.corresp_author || ''} onChange={(e) => setForm({ ...form, corresp_author: e.target.value })} /></Field>
        <Field label="Journal"><input className="field" value={form.journal || ''} onChange={(e) => setForm({ ...form, journal: e.target.value })} /></Field>
        <Field label="Year"><input type="number" className="field" value={form.year || ''} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
      </div>
      <Field label="DOI / Link"><input className="field" value={form.doi_link || ''} onChange={(e) => setForm({ ...form, doi_link: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Read Status">
          <select className="field" value={form.read_status} onChange={(e) => setForm({ ...form, read_status: e.target.value })}>
            {READ_STATUS.map((s) => <option key={s} value={s} className="bg-nav">{READ_STATUS_EN[s]}</option>)}
          </select>
        </Field>
        <Field label="Tags / Keywords"><input className="field" value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. FEM, tribology" /></Field>
      </div>
      <Field label="Notes"><textarea className="field" rows={4} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm text-cream cursor-pointer mb-2">
        <input type="checkbox" checked={form.starred} onChange={(e) => setForm({ ...form, starred: e.target.checked })} className="accent-[#8c3a30]" />
        <Star size={14} className={form.starred ? 'text-gold fill-gold' : 'text-muted'} />Starred
      </label>
      <button type="submit" disabled={saving} className="btn-cinnabar w-full">{saving ? 'Saving…' : 'Save'}</button>
    </Modal>
  )
}

// ============ 图片画廊（多图，可放大浏览/切换/下载） ============
function PaperGallery({ paper, images, setImages, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)

  const handleUpload = useCallback(async (file) => {
    setBusy(true)
    try {
      const url = await uploadImage(file, 'papers')
      const { data } = await supabase.from('paper_images').insert({ paper_id: paper.id, image_url: url, sort_order: images.length }).select().single()
      setImages((im) => [...im, data])
      onChanged()
    } finally { setBusy(false) }
  }, [paper.id, images.length, setImages, onChanged])

  // 粘贴图片上传
  useImagePaste(handleUpload)

  const removeImage = async (img) => {
    await deleteImage(img.image_url)
    await supabase.from('paper_images').delete().eq('id', img.id)
    setImages((im) => im.filter((x) => x.id !== img.id))
    onChanged()
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const prev = () => setViewerIndex((i) => (i > 0 ? i - 1 : i))
  const next = () => setViewerIndex((i) => (i < images.length - 1 ? i + 1 : i))

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed p-2 transition-colors ${dragging ? 'border-cinnabar bg-cinnabar/10' : 'border-gold/20'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted">Key Images · 拖入图片或 Ctrl+V 粘贴</span>
          <label className="btn-ghost !py-1 text-xs cursor-pointer inline-flex">
            <ImagePlus size={13} />{busy ? 'Uploading…' : 'Add'}
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
                  className="w-full h-24 object-cover rounded border border-gold/20 cursor-zoom-in"
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
    </div>
  )
}
