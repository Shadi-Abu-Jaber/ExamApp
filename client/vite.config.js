import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from the domain root on Render (a static site). An absolute base
  // keeps asset URLs correct on deep client-side routes (e.g. /student/exams).
  base: '/',
})
