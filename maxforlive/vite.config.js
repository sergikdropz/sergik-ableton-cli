import { defineConfig } from 'vite';
import { resolve } from 'path';

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';
const isDev = !isProduction;

// Build performance tracking
const buildStartTime = Date.now();

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Environment-aware settings
    sourcemap: isDev, // Only in dev for faster builds
    minify: isProduction ? 'esbuild' : false, // Faster dev builds
    // Tree shaking for production
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'SERGIK_AI_Controller_Preview.html')
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Optimize chunk splitting
        manualChunks: isProduction ? {
          'vendor': ['path/to/vendor/modules'] // Add vendor modules if needed
        } : undefined
      },
      // Performance optimizations
      treeshake: isProduction ? {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      } : false
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Report build metrics
    reportCompressedSize: isProduction,
    // Faster builds in dev
    ...(isDev && {
      watch: {
        // Optimize watch mode
        include: ['js/**', '*.html'],
        exclude: ['node_modules/**', 'dist/**']
      }
    })
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';"
    },
    // HMR optimizations
    hmr: isDev ? {
      overlay: true
    } : false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'js')
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    include: [],
    // Faster dependency pre-bundling
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Log build completion
  plugins: [
    {
      name: 'build-metrics',
      buildEnd() {
        if (isProduction) {
          const buildDuration = Date.now() - buildStartTime;
          console.log(`\n✅ Build completed in ${buildDuration}ms`);
          console.log(`📦 Output: dist/`);
          console.log(`🌲 Tree-shaking: ${isProduction ? 'enabled' : 'disabled'}`);
          console.log(`🗜️  Minification: ${isProduction ? 'enabled' : 'disabled'}`);
        }
      }
    }
  ]
});

