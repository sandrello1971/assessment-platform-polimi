import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// frontend/vite.config.ts
export default defineConfig({
  base: '/',
  plugins: [react()],
})
