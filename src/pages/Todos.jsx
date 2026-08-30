import { useEffect, useState, useCallback, useMemo } from 'react'
import { CheckSquare, Plus, Trash2, Circle, CircleDot, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { TODO_STATUS, PRIORITY, enumLabel } from '../lib/enums'
import { Card, SectionTitle, Modal, Field, Spinner, Empty, Badge, ConfirmDialog } from '../components/ui'

const STATUS_ICON = {
  '待办': Circle,
  '进行中': CircleDot,
  '已完成': CheckCircle2,
}
const PRIORITY_COLOR = {
  '高': '#8c3a30',
  '中': '#a67a6a',
  '低': '#8a7a6d',
}

export default function Todos() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [todos, setTodos] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const load = useCallback(async () => {
    const [td, p] = await Promise.all([
      supabase.from('todos').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('created_at'),
    ])
    setTodos(td.data || [])
    setProjects(p.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle title={t('navTodos')} icon={CheckSquare} />
        <button onClick={() => setShowNew(true)} className="btn-cinnabar text-xs">
          <Plus size={13} />{t('add')}
        </button>
      </div>

      {/* 三列看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TODO_STATUS.map((status) => {
          const items = todos.filter((td) => td.status === status)
          const dotColor = status === '待办' ? 'bg-cinnabar' : status === '进行中' ? 'bg-ochre' : 'bg-gold'
          return (
            <div key={status}>
              <div className="flex items-center gap-1.5 mb-2 text-xs text-muted">
                <span className={`w-2 h-2 rounded-sm ${dotColor}`} />
                <span className="font-medium">{enumLabel(status, lang)}</span>
                <span className="ml-auto">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="ink-card p-4"><Empty /></div>
                ) : (
                  items.map((td) => (
                    <TodoCard key={td.id} todo={td} projects={projects} onChanged={load} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <NewTodoModal open={showNew} onClose={() => setShowNew(false)} projects={projects} onCreated={load} />
    </div>
  )
}

// ============ 待办卡片 ============
function TodoCard({ todo, projects, onChanged }) {
  const { t, lang } = useLanguage()
  const { showToast } = useToast()
  const [confirmDel, setConfirmDel] = useState(false)
  const proj = projects.find((p) => p.id === todo.project_id)
  const statusIdx = TODO_STATUS.indexOf(todo.status)

  // 点击推进状态：待办 → 进行中 → 已完成 → 待办（循环）
  const cycle = async () => {
    const next = TODO_STATUS[(statusIdx + 1) % TODO_STATUS.length]
    await supabase.from('todos').update({ status: next }).eq('id', todo.id)
    onChanged()
  }

  const del = async () => {
    setConfirmDel(false)
    await supabase.from('todos').delete().eq('id', todo.id)
    showToast(t('deleteOk'))
    onChanged()
  }

  const overdue = todo.due_date && todo.status !== '已完成' && new Date(todo.due_date) < new Date()

  return (
    <div className="ink-card p-3 group animate-floaty" style={{ animationDelay: `${Math.random() * 0.5}s` }}>
      <div className="flex items-start gap-2.5">
        <button onClick={cycle} className="mt-0.5 shrink-0 text-cinnabar hover:scale-110 transition-transform" title={t('status')}>
          {(() => {
            const Icon = STATUS_ICON[todo.status]
            return <Icon size={17} />
          })()}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${todo.status === '已完成' ? 'text-muted line-through' : 'text-cream'}`}>{todo.content}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge color={todo.priority === '高' ? 'cinnabar' : todo.priority === '中' ? 'ochre' : 'gray'}>
              <span style={{ color: PRIORITY_COLOR[todo.priority] }}>■</span>{enumLabel(todo.priority, lang)}
            </Badge>
            {proj && <span className="text-[10px] text-muted">📁 {proj.name}</span>}
            {todo.due_date && (
              <span className={`text-[10px] ${overdue ? 'text-[#c96b5b]' : 'text-muted'}`}>
                {todo.due_date}{overdue ? ' · ⚠' : ''}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setConfirmDel(true)} className="text-muted opacity-0 group-hover:opacity-100 hover:text-[#c96b5b] transition-opacity shrink-0">
          <Trash2 size={14} />
        </button>
      </div>
      <ConfirmDialog
        open={confirmDel}
        message="删除该待办？"
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={del}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  )
}

// ============ 新建待办 ============
function NewTodoModal({ open, onClose, projects, onCreated }) {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [form, setForm] = useState({ content: '', priority: '中', status: '待办', due_date: '', project_id: '' })
  useEffect(() => { if (open) setForm({ content: '', priority: '中', status: '待办', due_date: '', project_id: '' }) }, [open])

  const submit = async () => {
    if (!form.content.trim()) return
    await supabase.from('todos').insert({
      user_id: user.id, content: form.content.trim(),
      priority: form.priority, status: form.status,
      due_date: form.due_date || null, project_id: form.project_id || null,
    })
    onCreated(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('add')}>
      <Field label={t('todoContent')}><textarea className="field" rows={2} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('priority')}>
          <select className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITY.map((p) => <option key={p} value={p} className="bg-nav">{enumLabel(p, lang)}</option>)}
          </select>
        </Field>
        <Field label={t('dueDate')}>
          <input type="date" className="field" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </Field>
      </div>
      <Field label={t('linkedProject')}>
        <select className="field" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
          <option value="" className="bg-nav">{t('noProject')}</option>
          {projects.map((p) => <option key={p.id} value={p.id} className="bg-nav">{p.name}</option>)}
        </select>
      </Field>
      <button onClick={submit} className="btn-cinnabar w-full">{t('confirm')}</button>
    </Modal>
  )
}
