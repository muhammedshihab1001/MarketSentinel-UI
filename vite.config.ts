import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path alias — @/ maps to src/
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Dev server proxy — /api/* → http://localhost:8000/*
  // This is what makes lib/api.ts (baseURL: '/api') work in development
  // All requests like /api/snapshot → http://localhost:8000/snapshot
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Required for httpOnly cookie auth to work cross-origin in dev
        secure: false,
      },
    },
  },

  // Build optimizations
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies into separate chunks for faster loading
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'motion-vendor': ['framer-motion'],
          'ui-vendor': ['lucide-react', 'sonner'],
        },
      },
    },
    // Warn if any chunk exceeds 500kb
    chunkSizeWarningLimit: 500,
  },

  // Optimise dev cold start
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'framer-motion',
      'recharts',
      'zustand',
      'sonner',
      'lucide-react',
    ],
  },
})