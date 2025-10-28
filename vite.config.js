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
    'import.meta.env.supabase_url': JSON.stringify(process.env.supabase_url),
    'import.meta.env.supabase_anon_key': JSON.stringify(process.env.supabase_anon_key),
    'import.meta.env.openai_api_key': JSON.stringify(process.env.openai_api_key),
  },
})
