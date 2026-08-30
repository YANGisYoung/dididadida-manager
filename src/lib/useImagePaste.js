// 监听全局粘贴事件：当剪贴板里有图片时，取出文件并调用回调
// 用法：const handleUpload = useCallback((file) => {...}, [...]); useImagePaste(handleUpload)
import { useEffect } from 'react'

export function useImagePaste(uploadFn) {
  useEffect(() => {
    const handler = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            uploadFn(file)
            return
          }
        }
      }
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [uploadFn])
}
