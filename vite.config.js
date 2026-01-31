import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['aos', 'swiper', 'bootstrap'],
          // Separate large training pages into their own chunks
          'training-dashboards': [
            './src/pages/Training/StudentDashboard',
            './src/pages/Training/TeacherDashboard'
          ],
          'training-courses': [
            './src/pages/Training/Catalog',
            './src/pages/Training/CourseDetail',
            './src/pages/Training/Checkout'
          ],
          'training-admin': [
            './src/pages/Training/CourseModeration',
            './src/pages/Training/UserManagement',
            './src/pages/Training/PaymentManagement'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (disable in production if needed)
    sourcemap: false,
    // Minify for production (using esbuild which is faster and built-in)
    minify: 'esbuild'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'aos']
  }
})

