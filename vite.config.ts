import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // visualizer({
    //   open: false,
    //   filename: 'stats.html',
    //   gzipSize: true,
    //   brotliSize: true,
    // })
  ],
  server: {
    strictPort: true,
  },
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge'],
          'ui-icons': ['lucide-react', '@remixicon/react'],
          'ui-components': ['sonner', 'notistack', 'framer-motion'],
          'charts': ['apexcharts', 'react-apexcharts', 'recharts'],
          'maps': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
