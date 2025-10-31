import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
    'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
    'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
    'import.meta.env.HEYGEN_API_KEY': JSON.stringify(process.env.HEYGEN_API_KEY),
  },
})
