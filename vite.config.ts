import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Capacitor (APK) necesita rutas relativas; en GitHub Pages la app vive en /Epi-SAS/; local/Vercel usan /.
  base:
    process.env.CAPACITOR === "true"
      ? "./"
      : process.env.GITHUB_PAGES === "true"
        ? "/Epi-SAS/"
        : "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5500,
    allowedHosts: true,
  },
})
