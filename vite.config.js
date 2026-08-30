import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置：开发端口、构建输出
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
  },
})
