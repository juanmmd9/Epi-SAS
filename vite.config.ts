import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // En GitHub Pages la app vive en /Epi-SAS/; en Vercel/local queda en /.
  base: process.env.GITHUB_PAGES === 'true' ? '/Epi-SAS/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5500,
    allowedHosts: true,
  },
})
