// 通用小组件：卡片、模态框、字段封装、徽章等
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// 卡片容器（带入场动画）
export function Card({ children, className = '', delay = 0, floating = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay }}
      className={`ink-card p-4 ${floating ? 'animate-floaty' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

// 区段标题（细长横线 + 朱红圆点印章）
export function SectionTitle({ title, icon: Icon }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-cinnabar" strokeWidth={1.75} />}
        <h3 className="text-base font-semibold text-cream tracking-wide">{title}</h3>
        <span className="seal-dot ml-auto" />
      </div>
      <div className="brush-line mt-2" />
    </div>
  )
}

// 模态框：底部上滑 + 遮罩加深
// onSubmit（可选）：传入后，内容用 form 包裹，单行输入框按回车会触发 onSubmit
export function Modal({ open, onClose, title, children, width = 'max-w-md', onSubmit }) {
  const content = onSubmit ? (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="flex-1 min-h-0 flex flex-col">
      <div className="overflow-y-auto px-5 pb-5 flex-1">{children}</div>
    </form>
  ) : (
    <div className="overflow-y-auto px-5 pb-5">{children}</div>
  )
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${width} mx-3 sm:mx-0 rounded-lg bg-nav border border-gold/25 shadow-2xl flex flex-col max-h-[85vh]`}
          >
            <div className="flex items-center justify-between mb-4 px-5 pt-5 shrink-0">
              <h3 className="text-lg font-semibold text-cream">{title}</h3>
              <button type="button" onClick={onClose} className="text-muted hover:text-cream transition-colors">
                <X size={18} />
              </button>
            </div>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 表单字段封装：标签 + 输入框
export function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="lbl">{label}</label>
      {children}
    </div>
  )
}

// 状态徽章（采购状态 / 阅读状态 / 优先级等）
export function Badge({ children, color = 'ochre', dot = false, hollow = false }) {
  const colorMap = {
    cinnabar: 'text-[#c96b5b] border-[#8c3a30] bg-[#8c3a30]/15',
    ochre: 'text-ochre border-ochre/40 bg-ochre/10',
    gold: 'text-gold border-gold/40 bg-gold/10',
    gray: 'text-muted border-muted/30 bg-muted/10',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${colorMap[color]}`}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            hollow ? 'border border-current' : 'bg-current'
          }`}
          style={hollow ? {} : { background: 'currentColor' }}
        />
      )}
      {children}
    </span>
  )
}

// 加载中
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10 text-muted">
      <div className="w-6 h-6 border-2 border-cinnabar/30 border-t-cinnabar rounded-full animate-spin" />
    </div>
  )
}

// 空状态
export function Empty({ text }) {
  const { t } = useLanguage()
  return (
    <div className="text-center py-8 text-muted text-sm">
      {text || t('empty')}
    </div>
  )
}

// 风格统一的确认弹窗（替代浏览器原生 confirm）
// open: 是否显示；message: 提示文字；confirmText/cancelText: 按钮文案；onConfirm/onCancel: 回调
export function ConfirmDialog({ open, message, confirmText = '确定', cancelText = '取消', onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm mx-3 rounded-lg bg-nav border border-gold/25 shadow-2xl p-5"
          >
            <p className="text-sm text-cream leading-relaxed">{message}</p>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={onCancel} className="btn-ghost !py-1.5 text-sm">{cancelText}</button>
              <button onClick={onConfirm} className="btn-cinnabar !py-1.5 text-sm">{confirmText}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 全屏图片查看器（Lightbox）：支持滚轮缩放 + 鼠标拖动平移 + 前后切换 + 下载
// images: [{ image_url }]；index: 当前下标；onClose: 关闭；onPrev/onNext: 切换
export function ImageLightbox({ images, index, onClose, onPrev, onNext }) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null) // 拖动状态

  // 切换图片时重置缩放和位置
  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    dragRef.current = null
  }, [index])

  const img = images[index]
  if (!img) return null

  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  // 滚轮缩放（0.5x ~ 6x）
  const onWheel = (e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setScale((s) => Math.min(6, Math.max(0.5, s * factor)))
  }

  // 鼠标拖动平移
  const onMouseDown = (e) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y }
  }
  const onMouseMove = (e) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy })
  }
  const onMouseUp = () => { dragRef.current = null }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onClick={onClose}
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* 关闭 */}
      <button className="absolute top-4 right-4 text-cream hover:text-[#c96b5b] transition-colors z-10" onClick={onClose}>
        <X size={28} />
      </button>
      {/* 下载 */}
      <a
        href={img.image_url}
        download
        target="_blank"
        rel="noreferrer"
        className="absolute top-4 right-16 text-cream hover:text-gold transition-colors z-10"
        title="Download"
        onClick={(e) => e.stopPropagation()}
      >
        <Download size={26} />
      </a>
      {/* 上一张 */}
      {hasPrev && (
        <button className="absolute left-4 text-cream hover:text-gold transition-colors z-10" onClick={(e) => { e.stopPropagation(); onPrev() }}>
          <ChevronLeft size={40} />
        </button>
      )}
      {/* 下一张 */}
      {hasNext && (
        <button className="absolute right-4 text-cream hover:text-gold transition-colors z-10" onClick={(e) => { e.stopPropagation(); onNext() }}>
          <ChevronRight size={40} />
        </button>
      )}
      {/* 图片（缩放 + 平移） */}
      <img
        src={img.image_url}
        alt=""
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={onMouseDown}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: 'none',
        }}
      />
      {/* 计数 + 缩放提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cream/70 text-sm flex items-center gap-3">
        <span>{index + 1} / {images.length}</span>
        <span className="text-cream/40 text-xs">· {Math.round(scale * 100)}%</span>
      </div>
    </div>
  )
}
