import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          // recharts 及其 d3-* / victory-vendor 等图表依赖
          if (
            /[\\/]node_modules[\\/](recharts|victory-vendor|recharts-scale|react-smooth|react-is|eventemitter3|lodash|clsx|tiny-invariant|fast-equals|internmap)[\\/]/.test(
              id,
            ) ||
            /[\\/]node_modules[\\/]d3-[^\\/]+[\\/]/.test(id)
          ) {
            return 'charts'
          }
          // React 相关 vendor
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run[\\/]router|use-sync-external-store)[\\/]/.test(
              id,
            )
          ) {
            return 'react-vendor'
          }
          // 其余第三方库
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/static': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
