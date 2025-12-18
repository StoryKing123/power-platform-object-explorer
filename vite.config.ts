import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server:{
    cors:true
  },
  build: {
    // 确保CSS不被代码分割，输出为单个文件
    cssCodeSplit: false,
    // 防止小文件被内联为base64
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // 不使用hash，使用固定的文件名
        entryFileNames: 'objectexplorer.js',
        chunkFileNames: 'objectexplorer.js',
        assetFileNames: 'objectexplorer.[ext]'
      }
    }
  }
})
