import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/dashboard': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/suppliers': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/materials': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/products': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/purchase-orders': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/sales-orders': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/production': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/warehouses': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
