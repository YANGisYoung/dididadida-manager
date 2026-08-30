import { createClient } from '@supabase/supabase-js'

// 从环境变量读取 Supabase 配置（Vite 用 import.meta.env，变量名需 VITE_ 开头）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ 未检测到 Supabase 环境变量，请检查 .env 文件（本地）或 Vercel 环境变量（云端）。')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 图片存储桶名称
export const IMAGES_BUCKET = 'images'

// 上传图片到 Supabase Storage，返回公开 URL
// folder: 文件夹名（如 'papers' / 'experiments' / 'projects'）
// 超过 1MB 的图片会自动压缩到 1MB 以内
export async function uploadImage(file, folder) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('未登录')
  // 大于 1MB 自动压缩
  let toUpload = file
  if (file.size > 1 * 1024 * 1024) {
    try {
      toUpload = await compressImage(file, 1 * 1024 * 1024)
    } catch (e) {
      console.warn('图片压缩失败，改用原图上传：', e)
      toUpload = file
    }
  }
  // 路径：{user_id}/{folder}/{时间戳}_{文件名}，符合 RLS 策略（第一层文件夹必须是 user_id）
  const ext = toUpload.name.split('.').pop() || 'png'
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${userId}/${folder}/${fileName}`
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, toUpload)
  if (error) throw error
  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// 用 Canvas 把图片压缩到指定字节数以内（默认不超过 1MB）
// 原理：先等比缩小尺寸，再逐步降低 JPEG 质量，直到体积达标
async function compressImage(file, maxBytes) {
  const img = await loadImage(file)

  // 1. 如果尺寸过大，先等比缩小（最长边限制 2000px，足以清晰查看）
  let { naturalWidth: w, naturalHeight: h } = img
  const MAX_DIM = 2000
  if (Math.max(w, h) > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)

  // 2. 从高质量逐步降低，直到小于目标体积
  let quality = 0.9
  while (quality >= 0.2) {
    const blob = await canvasToBlob(canvas, quality)
    if (blob && blob.size <= maxBytes) {
      return blobToFile(blob, file.name)
    }
    quality -= 0.1
  }
  // 3. 极端情况：压到最低质量仍超限，返回最低质量结果
  const blob = await canvasToBlob(canvas, 0.2)
  return blobToFile(blob, file.name)
}

// 把 File/Blob 加载成 Image 对象
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

// Canvas 转 Blob（JPEG，指定质量）
function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

// Blob 转 File（保留原文件名，但扩展名改为 .jpg）
function blobToFile(blob, originalName) {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

// 删除图片（传入完整公开 URL，反推出存储路径）
export async function deleteImage(publicUrl) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) return
  // 从完整 URL 中截取桶名之后的路径部分
  const idx = publicUrl.indexOf(`/storage/v1/object/public/${IMAGES_BUCKET}/`)
  if (idx === -1) return
  const path = publicUrl.slice(idx + `/storage/v1/object/public/${IMAGES_BUCKET}/`.length)
  await supabase.storage.from(IMAGES_BUCKET).remove([path])
}
