// 通用左侧栏：文件夹树（上，可折叠）+ 当前文件夹下的条目列表（下）
// 三个模块（项目/实验/论文）复用。所有文案通过 props 传入（论文模块用英文）。
import { useMemo, useState, useEffect } from 'react'
import { Folder, FolderOpen, ChevronRight, Plus, Pencil, Trash2, FolderPlus, Home } from 'lucide-react'
import { Modal, Field } from './ui'

export default function FolderSidebar({
  title,               // 侧栏标题
  folders,             // 全部文件夹 [{id, parent_id, name}]
  items,               // 全部条目 [{id, folder_id, ...}]
  selectedFolderId,    // 当前选中文件夹（null = 根目录）
  onSelectFolder,      // (folderId | null)
  selectedItemId,      // 当前选中条目
  onSelectItem,        // (itemId)
  renderItem,          // (item) => ReactNode  条目行渲染
  onCreateFolder,      // (parentId, name) => Promise
  onRenameFolder,      // (folderId, name) => Promise
  onDeleteFolder,      // (folderId) => Promise
  onNewItem,           // () => void  打开新建条目弹窗
  rootLabel = '根目录',
  newFolderLabel = '新建文件夹',
  folderTitle = '文件夹',
  itemsTitle = '条目',
  newItemLabel = '新建',
}) {
  const [expanded, setExpanded] = useState(() => new Set())
  const [renamingId, setRenamingId] = useState(null) // 正在重命名的文件夹
  const [renameText, setRenameText] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // 待删除的文件夹

  // 子文件夹映射：parent_id -> 子文件夹数组
  const childrenMap = useMemo(() => {
    const map = {}
    for (const f of folders) {
      const key = f.parent_id || 'root'
      if (!map[key]) map[key] = []
      map[key].push(f)
    }
    return map
  }, [folders])

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 当选中某个条目时（如从首页跳转/点击列表项），自动展开其所在文件夹链并定位到该文件夹
  useEffect(() => {
    if (!selectedItemId || selectedItemId === 'root') return
    const item = items.find((x) => x.id === selectedItemId)
    if (!item || !item.folder_id) return
    // 向上遍历父文件夹链，全部展开
    const toExpand = new Set()
    let cur = item.folder_id
    while (cur) {
      toExpand.add(cur)
      const folder = folders.find((f) => f.id === cur)
      cur = folder?.parent_id || null
    }
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const id of toExpand) next.add(id)
      return next
    })
    // 定位左侧列表到该条目所在文件夹
    if (selectedFolderId !== item.folder_id) {
      onSelectFolder(item.folder_id)
    }
  }, [selectedItemId])

  const startRename = (f) => {
    setRenamingId(f.id)
    setRenameText(f.name)
  }
  const commitRename = async () => {
    if (renameText.trim() && renamingId) {
      await onRenameFolder(renamingId, renameText.trim())
    }
    setRenamingId(null)
  }

  const submitNewFolder = async () => {
    if (newFolderName.trim()) {
      await onCreateFolder(selectedFolderId, newFolderName.trim())
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }

  // 递归渲染文件夹节点
  const renderFolder = (folder, depth) => {
    const children = childrenMap[folder.id] || []
    const isExpanded = expanded.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center gap-1 pr-2 py-1 cursor-pointer border-l-2 transition-colors ${
            isSelected ? 'bg-cinnabar/15 border-cinnabar' : 'border-transparent hover:bg-hover'
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          {children.length > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id) }} className="text-muted hover:text-cream shrink-0">
              <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <button onClick={() => onSelectFolder(folder.id)} className="flex items-center gap-1.5 text-sm text-cream flex-1 min-w-0 text-left">
            {isSelected ? <FolderOpen size={14} className="text-cinnabar shrink-0" /> : <Folder size={14} className="text-cinnabar shrink-0" />}
            {renamingId === folder.id ? (
              <input
                autoFocus
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename() }}
                onClick={(e) => e.stopPropagation()}
                className="field !py-0.5 !px-1 text-xs"
              />
            ) : (
              <span className="truncate">{folder.name}</span>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); startRename(folder) }}
            className="text-muted opacity-0 group-hover:opacity-100 hover:text-gold transition-opacity shrink-0"
            title="重命名"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(folder) }}
            className="text-muted opacity-0 group-hover:opacity-100 hover:text-[#c96b5b] transition-opacity shrink-0"
            title="删除"
          >
            <Trash2 size={12} />
          </button>
        </div>
        {isExpanded && children.map((c) => renderFolder(c, depth + 1))}
      </div>
    )
  }

  const rootFolders = childrenMap['root'] || []
  const layerItems = items.filter((it) => it.folder_id === selectedFolderId)

  return (
    <div className="flex flex-col h-full">
      {/* 顶部：标题 + 新建文件夹 */}
      <div className="px-3 py-3 border-b border-gold/20 flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-cream truncate">{title}</span>
        <button onClick={() => setShowNewFolder(true)} className="btn-cinnabar !px-2 !py-1 text-xs shrink-0">
          <FolderPlus size={13} />{newFolderLabel}
        </button>
      </div>

      {/* 文件夹树（上半） */}
      <div className="overflow-y-auto border-b border-divider shrink-0 max-h-[40%] py-1">
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer border-l-2 transition-colors ${
            selectedFolderId === null ? 'bg-cinnabar/15 border-cinnabar' : 'border-transparent hover:bg-hover'
          }`}
          onClick={() => onSelectFolder(null)}
        >
          <Home size={14} className="text-cinnabar" />
          <span className="text-sm text-cream">{rootLabel}</span>
        </div>
        {rootFolders.map((f) => renderFolder(f, 0))}
      </div>

      {/* 条目列表（下半） */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 border-b border-divider flex items-center justify-between sticky top-0 bg-nav z-10">
          <span className="text-xs text-muted">{folderTitle} · {itemsTitle}</span>
          <button onClick={onNewItem} className="btn-ghost !px-2 !py-1 text-xs shrink-0">
            <Plus size={13} />{newItemLabel}
          </button>
        </div>
        <div className="p-1">
          {layerItems.length === 0 ? (
            <p className="text-xs text-muted/50 text-center py-4">—</p>
          ) : (
            layerItems.map((it) => (
              <div
                key={it.id}
                onClick={() => onSelectItem(it.id)}
                className={`w-full text-left px-2 py-1.5 rounded border-l-2 transition-colors cursor-pointer ${
                  it.id === selectedItemId ? 'bg-cinnabar/15 border-cinnabar' : 'border-transparent hover:bg-hover'
                }`}
              >
                {renderItem(it)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 新建文件夹弹窗 */}
      <Modal open={showNewFolder} onClose={() => setShowNewFolder(false)} title={newFolderLabel} onSubmit={submitNewFolder}>
        <Field label={folderTitle}>
          <input className="field" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
        </Field>
        <button type="submit" className="btn-cinnabar w-full">OK</button>
      </Modal>

      {/* 删除文件夹确认 */}
      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title={deleteTarget.name}>
          <p className="text-sm text-cream mb-4">删除该文件夹？其中的内容会移到上层</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost">取消</button>
            <button onClick={async () => { await onDeleteFolder(deleteTarget.id); setDeleteTarget(null) }} className="btn-cinnabar">删除</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
