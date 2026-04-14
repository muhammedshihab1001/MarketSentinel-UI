import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load ALL env vars (prefix '' = no filter).
  // VITE_* vars are also available here, but we intentionally use a
  // non-VITE_ prefixed variable for the proxy target so it is never
  // embedded in the client bundle.
  const env = loadEnv(mode, process.cwd(), '')

  // ── Dev proxy target ────────────────────────────────────────────────────
  // Read exclusively from .env — no hardcoded defaults, no fallbacks.
  // Fail hard at startup if not configured so misconfiguration is
  // immediately obvious rather than causing a silent network error.
  //
  // Why API_PROXY_TARGET (no VITE_ prefix)?
  //   - VITE_* variables are baked into the compiled JS bundle and are
  //     visible to anyone who opens DevTools → Sources.
  //   - Variables without VITE_ prefix are build-tool-only and are
  //     NEVER sent to the browser. Safe for internal config.
  //
  // This proxy only runs during `npm run dev`. In production (Vercel),
  // the proxy doesn't exist — api.ts uses VITE_API_BASE_URL directly.
  const proxyTarget = env.API_PROXY_TARGET
  if (!proxyTarget) {
    throw new Error(
      '\n[vite] Missing required env variable: API_PROXY_TARGET\n' +
      'Add it to your .env file:\n' +
      '  API_PROXY_TARGET=https://your-backend-url.com\n'
    )
  }

  console.info(`[vite] Dev proxy → ${proxyTarget}`)

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
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // Required for HTTPS targets and httpOnly cookie forwarding
          secure: true,
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
  }
})