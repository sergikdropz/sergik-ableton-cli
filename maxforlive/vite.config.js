import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'SERGIK_AI_Controller_Preview.html')
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: true,
    minify: 'esbuild' // Use esbuild (faster, built-in) instead of terser
  },
  server: {
    port: 8000,
    open: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'js')
    }
  },
  optimizeDeps: {
    include: []
  }
});

