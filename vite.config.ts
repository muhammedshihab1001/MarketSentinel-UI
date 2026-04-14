import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(() => {
  return {
    plugins: [react()],

    // Path alias — @/ maps to src/
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // Required for HTTPS targets and httpOnly cookie forwarding
          secure: true,
        },
      },
    },

    // Build optimizations
    build: {
      outDir: 'dist',
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
  }
})