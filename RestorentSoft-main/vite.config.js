import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // required so Electron can load dist/index.html via file://
  plugins: [react()],
})
