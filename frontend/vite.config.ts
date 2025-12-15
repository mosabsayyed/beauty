import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Backend (FastAPI) API
      '/api/v1': 'http://localhost:8008',
      '/api/neo4j': 'http://localhost:3001',
      '/api/dashboard': 'http://localhost:3001',
      '/api/graph': 'http://localhost:3001',
      '/api/business-chain': 'http://localhost:3001',
      '/api/debug': 'http://localhost:3001'
    }
  },
})
