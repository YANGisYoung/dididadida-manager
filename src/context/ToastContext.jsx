import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const ToastContext = createContext(null)

// 全局轻提示：showToast(message) 调起，右下角闪现后自动消失
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-lg bg-nav border border-gold/30 shadow-2xl px-4 py-2.5"
          >
            <CheckCircle2 size={16} className="text-cinnabar shrink-0" />
            <span className="text-sm text-cream">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast 必须在 ToastProvider 内使用')
  return ctx
}
